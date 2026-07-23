# Divergências — Comparação `controlmax.old` × versão atual

Documento gerado em **10/07/2026** após varredura comparativa entre a versão funcional em `./controlmax.old` e o monorepo atual (`frontend/` + `backend/`). Objetivo: registrar o que foi perdido, o que foi apenas reorganizado e o que precisa de correção de deploy.

---

## 1. Resumo executivo

| Categoria | Resultado |
|-----------|-----------|
| Rotas (`AppRoutes.tsx`) | **Paridade** — 40 rotas idênticas em ambas as versões |
| Campos de formulários (cadastros) | **Paridade funcional** — lógica migrada para hooks/componentes |
| Navegação (Layout) | **Forms e Feriados inacessíveis pela UI** — rotas existem, links não (igual na `.old`) |
| Deploy Vercel | **Problemas reais** — monorepo, SPA rewrites, env Firebase, API do assistente |
| Validação Zod/Yup | **Nunca existiu** — validação manual em ambas as versões |

**Conclusão:** a sensação de “features sumidas” decorre principalmente de (a) refatoração que espalhou código em hooks/componentes, (b) rotas órfãs sem link no menu e (c) falhas de deploy na Vercel — não de remoção massiva de campos.

---

## 2. Estrutura do repositório

| Aspecto | `controlmax.old` | Versão atual |
|---------|------------------|--------------|
| Arquitetura | Monolito AI Studio (`src/` + `server.ts`) | Monorepo (`frontend/` + `backend/`) |
| Build | `vite build` + bundle Express | `frontend`: `vite build`; `backend`: `esbuild` |
| Proxy `/api` | Express no mesmo processo (`npm run dev`) | Vite proxy só em dev (`vite.config.ts` → `:3000`) |
| `vercel.json` | Ausente | Ausente (corrigido nesta rodada) |

---

## 3. Telas de cadastro — análise por módulo

### 3.1 CompanyList (Gestão de Clientes)

**Antes:** ~2.724 linhas em um único arquivo.  
**Agora:** `CompanyList.tsx` + `screens/components/companyList/*` + `customerModal/*` + hooks.

| Item | Status |
|------|--------|
| Filtros CN / Unidades | ✅ `CompanyListHeader.tsx` |
| Criação (abas basic, locations, references, photos) | ✅ `useCustomerCreateForm` + tabs |
| Modal edição (5 abas) | ✅ `customerModal/*` |
| Payload Firestore (`businessCenterId`, endereços, refs, fotos) | ✅ `utils/customerCreate.ts` |
| Handlers `handleAddAddress`, `handleSaveBasic`, etc. | ✅ Movidos para `customerModal/*` (não removidos) |

**Sem divergência funcional identificada.**

### 3.2 Forms (Formulários dinâmicos)

| Item | Status |
|------|--------|
| Abas forms / responses / builder | ✅ |
| CRUD em `forms` e `form_responses` | ✅ `useFormsData`, `useFormsActions` |
| Modal de preenchimento | ✅ `FormsFillingModal` |
| Link no menu Layout | ❌ **Ausente em ambas as versões** — rota `/forms` só via URL direta |

### 3.3 Holidays (Feriados)

| Item | Status |
|------|--------|
| Listagem por mês + painel próximos | ✅ `HolidaysCalendarList`, `HolidaysUpcomingPanel` |
| CRUD em `holidays` | ✅ `useHolidaysData` |
| Link no menu Layout | ❌ **Ausente em ambas as versões** — rota `/holidays` só via URL direta |

### 3.4 PlatformManagement

| Item | Status |
|------|--------|
| 20 campos em `PlatformSettings` | ✅ `types/platformSettings.ts` |
| Abas General / Financial / Modules / Security | ✅ `screens/components/platform/*` |
| Placeholders de exemplo | ✅ Preservados nas tabs extraídas |

### 3.5 NewIncome / NewExpense

| Item | Status |
|------|--------|
| Upload de anexo (base64) | ✅ Inline em `NewIncome.tsx` / `NewExpense.tsx` |
| `handleCnChange`, `handleUnitChange` | ✅ `useNewIncomeData`, `useNewExpenseData` |
| Remoção de arquivo | ✅ `onRemoveFile` inline (antes `handleRemoveFile`) |

### 3.6 UserList, Insurance, CreditRequests, BusinessCenters, SuperAdmin

Lógica migrada para hooks (`useUserListData`, `useInsuranceData`, etc.). Handlers que “sumiram” nas telas são **falsos positivos** de busca textual — a implementação está nos hooks correspondentes.

---

## 4. Correções SonarQube preservadas (não reverter)

As refatorações da rodada 30 do SonarQube devem ser mantidas:

- Extração de componentes grandes (Forms, CompanyList, PlatformManagement, Layout)
- Hooks dedicados para dados e ações
- Redução de complexidade cognitiva e duplicação
- Utilitários tipados (`customerCreate.ts`, `formsHelpers.ts`, etc.)

**Nenhuma correção SonarQube foi identificada como causa direta de perda de campo ou layout quebrado.**

---

## 5. Divergências reais que exigem ação

### 5.1 Deploy Vercel

| Problema | Impacto | Correção aplicada |
|----------|---------|-------------------|
| Monorepo sem `Root Directory` = `frontend` | Build na raiz falha | `vercel.json` + documentação |
| SPA sem rewrite para `index.html` | 404 ao recarregar rotas | Rewrite em `vercel.json` |
| `firebase-applet-config.json` no `.gitignore` | Build quebra sem env vars | Alias Vite → `.example.json` + `VITE_FIREBASE_*` |
| `firestoreDatabaseId` só no JSON local | Firestore aponta para DB errado | `VITE_FIRESTORE_DATABASE_ID` |
| `fetch('/api/gemini/assistant')` sem proxy em prod | Assistente IA falha na Vercel | `VITE_API_URL` em `assistantApi.ts` |

### 5.2 Navegação — Forms e Feriados

Rotas registradas em `NavigationContext` e `AppRoutes`, mas **sem entrada no Layout** (desktop e mobile). Na `.old` o comportamento era idêntico; para recuperar acesso pelo usuário final, links foram adicionados ao dropdown **Administración**.

### 5.3 Cosmético (sem impacto funcional)

- Alguns placeholders e classes Tailwind foram renomeados na refatoração
- Telas “menores” em linhas porque JSX foi extraído — não indica perda de feature

---

## 6. Checklist de validação manual pós-correção

- [ ] Login com tenant real na Vercel (Firebase env configurado)
- [ ] `/company-list` — criar cliente com todas as abas
- [ ] `/company-list` — editar cliente no modal (salvar básico, endereço, foto)
- [ ] `/forms` — criar formulário, preencher, ver respostas
- [ ] `/holidays` — adicionar e excluir feriado
- [ ] `/platform-management` — salvar configurações
- [ ] Assistente IA com `VITE_API_URL` apontando para backend em produção
- [ ] Recarregar página em rota profunda (ex.: `/sales`) — sem 404

---

## 7. Referência de arquivos críticos

| Área | Versão antiga | Versão atual |
|------|---------------|--------------|
| Clientes | `controlmax.old/src/screens/CompanyList.tsx` | `frontend/src/screens/CompanyList.tsx` + `components/companyList/` |
| Formulários | `controlmax.old/src/screens/Forms.tsx` | `frontend/src/screens/Forms.tsx` + `hooks/useForms*.ts` |
| Feriados | `controlmax.old/src/screens/Holidays.tsx` | `frontend/src/screens/Holidays.tsx` + `hooks/useHolidaysData.ts` |
| Plataforma | `controlmax.old/src/screens/PlatformManagement.tsx` | `frontend/src/screens/PlatformManagement.tsx` + `components/platform/` |
| Firebase | `controlmax.old/src/lib/firebase.ts` | `frontend/src/lib/firebase.ts` |
| Rotas | `controlmax.old/src/routes/AppRoutes.tsx` | `frontend/src/routes/AppRoutes.tsx` |
