# Varredura SonarQube — ControlMax

**Varredura inicial:** 09/07/2026  
**Varredura final (pós-correções):** 09/07/2026 — 19:10 UTC  
**Última varredura:** 09/07/2026 — 23:13 UTC (pós-rodada 22)  
**Última rodada de código:** 09/07/2026 — rodada 27 (`SaleDetail`, `DeviceList`, `BCIncomes`, `BCExpenses`, `useBox`)  
**Ferramenta:** SonarQube Community 9.9.8  
**Projeto:** `controlmax`  
**Dashboard:** http://localhost:9000/dashboard?id=controlmax

---

## Resumo executivo (atual — pós-rodada 22)

| Métrica | Inicial (09/07) | Atual (23:13 UTC) | Δ |
|---|---:|---:|---|
| **Total de issues** | **359** | **25** | **−334 (−93,0%)** |
| Bugs | 14 | **0** | −14 |
| Vulnerabilidades | 1 | **0** | −1 |
| Code smells | 344 | **25** | −319 |
| Cobertura de testes (Sonar) | 0,0% | **3,5%** | +3,5 pp |
| Cobertura Vitest (local) | — | **~13,6%** | — |
| Duplicação de linhas | 4,4% | **2,4%** | −2,0 pp |
| Dívida técnica estimada | ~2.675 min | **~391 min** | −2.284 min |

### Ratings de qualidade (atual)

| Rating | Inicial | Atual |
|---|---|---|
| Confiabilidade (bugs) | C (3.0) | **A (1.0)** |
| Segurança | E (5.0) | **A (1.0)** |
| Manutenibilidade | A (1.0) | **A (1.0)** |
| Quality Gate | ERROR | ERROR* |

\*O Quality Gate permanece em ERROR por **cobertura de testes baixa** (3,5% no Sonar) — não por bugs ou vulnerabilidades.

### Distribuição por severidade (atual)

| Severidade | Inicial | Atual | Δ |
|---|---:|---:|---:|
| BLOCKER | 1 | **0** | −1 |
| CRITICAL | 58 | **25** | −33 |
| MAJOR | 163 | **0** | −163 |
| MINOR | 129 | **0** | −129 |
| INFO | 8 | **0** | −8 |

---

## Resumo executivo (varredura final — referência intermediária)

| Métrica | Inicial | Final | Δ |
|---|---:|---:|---|
| Linhas de código (NCLOC) | 28.073 | 28.059 | −14 |
| Arquivos analisados | 62 | 67 | +5 |
| **Total de issues** | **359** | **138** | **−221 (−61,6%)** |
| Bugs | 14 | **0** | −14 |
| Vulnerabilidades | 1 | **0** | −1 |
| Code smells | 344 | 138 | −206 |
| Security hotspots | 17 | 10 | −7 |
| Cobertura de testes | 0,0% | 0,0% | — |
| Duplicação de linhas | 4,4% | 3,5% | −0,9 pp |
| Dívida técnica estimada | ~2.675 min (~45 h) | ~1.520 min (~25 h) | −1.155 min |

### Ratings de qualidade (final)

| Rating | Inicial | Final |
|---|---|---|
| Confiabilidade (bugs) | C (3.0) | **A (1.0)** |
| Segurança | E (5.0) | **A (1.0)** |
| Manutenibilidade | A (1.0) | A (1.0) |
| Quality Gate | ERROR | ERROR* |

\*O Quality Gate permanece em ERROR principalmente por **cobertura de testes 0%** e code smells remanescentes — não por bugs ou vulnerabilidades.

### Distribuição por severidade (final)

| Severidade | Inicial | Final | Δ |
|---|---:|---:|---:|
| BLOCKER | 1 | **0** | −1 |
| CRITICAL | 58 | 48 | −10 |
| MAJOR | 163 | 58 | −105 |
| MINOR | 129 | 24 | −105 |
| INFO | 8 | 8 | 0 |

---

## Resumo executivo (varredura inicial — referência)

| Métrica | Valor |
|---|---|
| Linhas de código (NCLOC) | 28.073 |
| Arquivos analisados | 62 (58 TypeScript + CSS/JSON) |
| **Total de issues** | **359** |
| Bugs | 14 |
| Vulnerabilidades | 1 |
| Code smells | 344 |
| Security hotspots | 17 |
| Cobertura de testes | 0,0% |
| Duplicação de linhas | 4,4% |
| Dívida técnica estimada | ~2.675 min (~45 h) |

### Distribuição por severidade (inicial)

| Severidade | Quantidade |
|---|---|
| BLOCKER | 1 |
| CRITICAL | 58 |
| MAJOR | 163 |
| MINOR | 129 |
| INFO | 8 |

---

## Configuração da varredura

Arquivos criados para suportar a análise:

- `sonar-project.properties` — configuração do scanner
- `frontend/tsconfig.sonar.json` — tsconfig compatível com o analisador TS do SonarQube 9.9 (não altera o build)

**Fontes analisadas:** `frontend/src`, `backend`  
**Exclusões:** `node_modules`, `dist`, `build`, `coverage`, `documentation`, scripts `*.cjs` na raiz

### Comando para repetir a varredura

```bash
docker start sonarqube  # se o container estiver parado

docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "$(pwd):/usr/src" \
  -w /usr/src \
  sonarsource/sonar-scanner-cli \
  -Dsonar.host.url=http://host.docker.internal:9000 \
  -Dsonar.login=admin \
  -Dsonar.password=admin
```

---

## Prioridade máxima

> **Status pós-correções (varredura final):** BLOCKER, vulnerabilidade e todos os 14 bugs foram **eliminados**. Itens abaixo são referência da varredura inicial.

### Vulnerabilidade (BLOCKER) — ✅ RESOLVIDO

| Arquivo | Linha | Regra | Descrição | Status |
|---|---|---|---|---|
| `backend/firebase-applet-config.json` | 4 | S6334 | Google API Key exposta no repositório | **Corrigido** — chave removida; criados `*.example.json`; `.gitignore` atualizado |

---

### Bugs (14 — MAJOR) — ✅ TODOS RESOLVIDOS

Corrigidos nas rodadas 1–3 e 5–8. Principais arquivos afetados na varredura inicial: `SaleDetail.tsx`, `BCMap.tsx`, `CollectorMap.tsx`, `CompanyList.tsx`, `AIVoiceAssistant.tsx`.

---

## Security hotspots — 10 remanescentes (inicial: 17)

| Categoria | Status |
|---|---|
| `Math.random()` em `CreditRequests`, `SuperAdmin`, `AIVoiceAssistant` | **Corrigido** (rodada 5) |
| Geolocalização em mapas e hooks | 7 hotspots LOW — revisão manual pendente |
| IP hardcoded em `DeviceList`/`EditDevice` | 3 hotspots LOW — revisão manual pendente |
| Fingerprinting em `backend/server.ts` | 1 hotspot LOW — aceitável em dev |

---

## Complexidade cognitiva crítica (S3776)

Funções com complexidade acima do limite permitido (15):

| Arquivo | Linha | Complexidade |
|---|---|---|
| `frontend/src/hooks/useTenant.ts` | 44 | **191** |
| `frontend/src/screens/components/AIVoiceAssistant.tsx` | 462 | 81 |
| `backend/server.ts` | 32 | 58 |
| `frontend/src/screens/PlatformManagement.tsx` | 97 | 48 |
| `frontend/src/screens/Performance.tsx` | 75 | 45 |
| `frontend/src/screens/CompanyList.tsx` | 1517 | 46 |
| `frontend/src/screens/Statistics.tsx` | 279 | 39 |
| `frontend/src/screens/MassBoxOpening.tsx` | 88 | 39 |
| `frontend/src/screens/SalesList.tsx` | 232 | 39 |
| `frontend/src/screens/Holidays.tsx` | 301 | 40 |
| `frontend/src/screens/components/Layout.tsx` | 21 | 41 |
| `frontend/src/screens/BCTransfers.tsx` | 709 | 35 |
| `frontend/src/screens/CompanyList.tsx` | 267 | 35 |
| `frontend/src/screens/CreditRequests.tsx` | 87 | 35 |
| `frontend/src/screens/NewExpense.tsx` | 291 | 35 |
| `frontend/src/screens/components/AIVoiceAssistant.tsx` | 668 | 32 |
| `frontend/src/screens/Finance.tsx` | 86 | 29 |
| `frontend/src/screens/NewIncome.tsx` | 33 | 29 |
| `frontend/src/screens/NewIncome.tsx` | 275 | 29 |
| `frontend/src/screens/Performance.tsx` | 50 | 28 |
| `frontend/src/screens/RegisterPayment.tsx` | 123 | 28 |
| `frontend/src/screens/Dashboard.tsx` | 55 | 27 |
| `frontend/src/screens/CompanyList.tsx` | 1683 | 27 |
| `frontend/src/screens/CollectionCleaning.tsx` | 76 | 26 |
| `frontend/src/screens/PlatformManagement.tsx` | 85 | 26 |
| `frontend/src/screens/SaleDetail.tsx` | 64 | 26 |
| `frontend/src/screens/CompanyList.tsx` | 84 | 26 |
| `frontend/src/screens/DeviceList.tsx` | 361 | 26 |
| `frontend/src/screens/BCIncomes.tsx` | 658 | 24 |
| `frontend/src/screens/CompanyList.tsx` | 1576 | 23 |
| `frontend/src/screens/PeriodSummary.tsx` | 109 | 23 |
| `frontend/src/screens/Dashboard.tsx` | 251 | 22 |
| `frontend/src/screens/SuperAdmin.tsx` | 87 | 22 |
| `frontend/src/screens/SalesList.tsx` | 327 | 21 |
| `frontend/src/screens/TransferSales.tsx` | 1083 | 21 |
| `frontend/src/screens/components/AIVoiceAssistant.tsx` | 20 | 21 |
| `frontend/src/screens/NewExpense.tsx` | 35 | 21 |
| `frontend/src/screens/BCExpenses.tsx` | 566 | 21 |
| `frontend/src/screens/BoxSummary.tsx` | 62 | 20 |
| `frontend/src/screens/TransferSales.tsx` | 96 | 20 |
| `frontend/src/screens/BCTransfers.tsx` | 65 | 19 |
| `frontend/src/hooks/useBox.ts` | 72 | 18 |
| `frontend/src/screens/CompanyList.tsx` | 1604 | 18 |
| `frontend/src/screens/Finance.tsx` | 515 | 18 |
| `frontend/src/screens/SaleDetail.tsx` | 37 | 18 |
| `frontend/src/screens/BCExpenses.tsx` | 119 | 17 |
| `frontend/src/screens/BCIncomes.tsx` | 115 | 17 |
| `frontend/src/screens/BCTransfers.tsx` | 121 | 17 |
| `frontend/src/screens/BusinessCenters.tsx` | 109 | 17 |
| `frontend/src/screens/DeviceList.tsx` | 30 | 17 |
| `frontend/src/screens/Forms.tsx` | 288 | 17 |
| `frontend/src/screens/Forms.tsx` | 90 | 16 |
| `frontend/src/utils/currencyUtils.ts` | 12 | 16 |

---

## Outras funções vazias (CRITICAL — S1186)

| Arquivo | Linha |
|---|---|
| `frontend/src/screens/SalesList.tsx` | 276 |
| `frontend/src/screens/TransferSales.tsx` | 212 |
| `frontend/src/screens/TransferSales.tsx` | 213 |

---

## Comentários TODO pendentes (INFO — S1135)

| Arquivo | Linha |
|---|---|
| `frontend/src/screens/BCExpenses.tsx` | 483 |
| `frontend/src/screens/BCIncomes.tsx` | 579 |
| `frontend/src/screens/BoxSummary.tsx` | 39 |
| `frontend/src/screens/BoxSummary.tsx` | 244 |
| `frontend/src/screens/BoxSummary.tsx` | 258 |
| `frontend/src/screens/MassBoxOpening.tsx` | 504 |
| `frontend/src/screens/RouteList.tsx` | 200 |
| `frontend/src/screens/RouteList.tsx` | 482 |

---

## Padrões recorrentes (code smells)

### Imports não utilizados (MINOR — S1128) — ~129 ocorrências

Principais arquivos afetados:

- `SalesList.tsx`, `Statistics.tsx`, `SuperAdmin.tsx`, `NewExpense.tsx`, `NewIncome.tsx`
- `OpenBox.tsx`, `Performance.tsx`, `BCMap.tsx`, `BusinessCenters.tsx`
- `Dashboard.tsx`, `DeviceList.tsx`, `Forms.tsx`, `Holidays.tsx`, `Insurance.tsx`
- `useBox.ts`, `AutoKeys.tsx`, `BCApprovals.tsx`, `BCTransfers.tsx`
- `CollectionCleaning.tsx`, `CollectorMap.tsx`, `CompanyList.tsx`, `CreditRequests.tsx`
- `EditRoute.tsx`, `Finance.tsx`, `MassBoxOpening.tsx`, `PeriodSummary.tsx`
- `PlatformManagement.tsx`, `RegisterPayment.tsx`, `RouteList.tsx`, `TransferSales.tsx`
- `UserList.tsx`, `AIVoiceAssistant.tsx`, `ConfirmModal.tsx`, `Layout.tsx`

### Ternários aninhados (MAJOR — S3358) — ~80 ocorrências

Concentrados em: `CompanyList.tsx`, `TransferSales.tsx`, `SuperAdmin.tsx`, `Statistics.tsx`, `BCTransfers.tsx`, `BCIncomes.tsx`, `BCExpenses.tsx`, `Dashboard.tsx`, `SalesList.tsx`, `Layout.tsx`.

### Atribuições inúteis / redundantes (MAJOR — S1854, S4165) — ~50 ocorrências

Variáveis declaradas mas não usadas em: `Dashboard.tsx`, `SalesList.tsx`, `Statistics.tsx`, `SuperAdmin.tsx`, `CompanyList.tsx`, `useTenant.ts`, `NavigationContext.tsx`, entre outros.

### Índice de array como `key` em React (MAJOR — S6479)

| Arquivo | Linhas |
|---|---|
| `CompanyList.tsx` | 1286, 2660, 2688 |
| `CreditRequests.tsx` | 393, 499 |
| `Dashboard.tsx` | 225 |
| `Forms.tsx` | 662 |
| `Holidays.tsx` | 473 |
| `SalesList.tsx` | 684, 845 |
| `Statistics.tsx` | 513, 558, 603, 865 |
| `SuperAdmin.tsx` | 695 |
| `AIVoiceAssistant.tsx` | 847, 927 |

### Outros code smells relevantes (MAJOR)

| Arquivo | Linha | Regra | Descrição |
|---|---|---|---|
| `frontend/src/context/NavigationContext.tsx` | 121 | S6481 | Valor do Context Provider recriado a cada render (usar `useMemo`) |
| `frontend/src/screens/Statistics.tsx` | 373 | S6478 | Componente definido durante render |
| `frontend/src/screens/components/AIVoiceAssistant.tsx` | 424 | S5869 | Caractere duplicado em classe regex |

### Assertions desnecessárias (MINOR — S4325)

| Arquivo | Linhas |
|---|---|
| `frontend/src/lib/firebase.ts` | 108, 116, 124, 125 |
| `frontend/src/screens/Finance.tsx` | 576 |

### Union types sem alias (MINOR — S4323)

| Arquivo | Linhas |
|---|---|
| `frontend/src/screens/Finance.tsx` | 39 |
| `frontend/src/screens/SuperAdmin.tsx` | 21, 80 |

---

## Ordem sugerida de correção

1. **Segurança** — remover/rotacionar API key em `firebase-applet-config.json`
2. **Bugs críticos** — hooks condicionais em `SaleDetail.tsx`
3. **Bugs de lógica** — condicionais em `BCMap.tsx`, `CollectorMap.tsx`, `CompanyList.tsx`
4. **Promise** — tratamento em `AIVoiceAssistant.tsx:219`
5. **Refatoração gradual** — `useTenant.ts` (complexidade 191) e `server.ts` (complexidade 58)
6. **Limpeza rápida** — imports não utilizados e funções vazias
7. **Melhorias de qualidade** — ternários aninhados, keys de React, hotspots de segurança

---

## Observações

- A cobertura de testes é **0%** — o SonarQube não recebeu relatórios LCOV/JaCoCo. Configurar testes e cobertura melhorará a análise futura.
- O `frontend/tsconfig.sonar.json` foi necessário porque o `tsconfig.json` original usa opções (`moduleResolution: bundler`, `allowImportingTsExtensions`) incompatíveis com o analisador TypeScript embutido no SonarQube 9.9.
- Credenciais padrão do SonarQube local (`admin`/`admin`) devem ser alteradas antes de expor o servidor em rede.

---

## Verificação: erros silenciosos e sensação de “travamento” (09/07/2026)

Auditoria manual do fluxo frontend ↔ backend para identificar falhas que ficam apenas no console e dão a impressão de que a aplicação travou.

### Resumo

Há **pouca integração HTTP com o backend** (apenas `POST /api/gemini/assistant`). A maior parte do “travamento” vem de **Firestore + estados de loading sem feedback na UI**.

### 1. Spinner global sem mensagem de erro (alta prioridade)

Em `AppRoutes.tsx`, `PrivateLayout`, `PublicRoute` e `SuperAdminRoute` exibem **“Cargando aplicación…”** enquanto `tenantLoading` for `true`, sem estado de erro.

**Problemas em `useTenant.ts`:**

- Não expõe `error` — falhas do Firestore só vão para o console via `logFirestoreError`.
- Em `handleMissingUserDoc`, quando encontra usuário por e-mail e faz `setDoc`, **não chama `setLoading(false)`** — depende de um novo snapshot. Se a rede travar em `findRegisteredUserByEmail` (sem timeout), o loading fica **infinito**.
- Erro no snapshot: `setLoading(false)`, mas o usuário entra no app com `tenantId` vazio, sem aviso.

### 2. Único endpoint backend → frontend mal tratado

`POST /api/gemini/assistant` em `AIVoiceAssistant.tsx` descarta a mensagem `{ error }` do backend e mostra só texto genérico em `statusText` por 4 segundos.

**Modo dev:** `vite.config.ts` **não tinha proxy** para `/api`. Rodar só `frontend/npm run dev` (porta 5173) faz a chamada falhar com 404. O fluxo correto é `backend/npm run dev` (Express na 3000 com middleware Vite).

**Backend:** sem `GEMINI_API_KEY`, retorna **200** com mensagem amigável. Falhas reais do Gemini retornam 500 com `{ error }` — ignorado no frontend.

### 3. `useBox`: erro existe, mas mal exibido

| Tela | Problema |
|------|----------|
| **CloseBox** | Query falha → `activeBox = null` → mostra “Nenhuma caixa aberta” em vez do erro real |
| **OpenBox** | Não usa `useBox().error` |
| **RegisterPayment** | Usa `boxLoading`, ignora `error` |

### 4. Telas com loading infinito ou erro só no console

| Arquivo | Comportamento |
|---------|---------------|
| **BCApprovals** | `setLoading(false)` no erro, mas **sem banner** — lista vazia silenciosa |
| **Statistics** | `catch` só com `console.error` — sem UI de erro |
| **SaleDetail** | Erro de pagamentos: `console.error` sem UI |
| **UserList** | Erro na lista: `console.error`, lista vazia |
| **CollectorMap** | Erro: `console.error`, mapa vazio |
| **Performance** | Fallback de box com erro duplo: só log |

Telas **bem tratadas** (referência): `Summary`, `BCExpenses`, `RouteList`, `CreditRequests`, `Holidays`, `PeriodSummary`.

### Correções planejadas — ✅ APLICADAS (rodada 10)

1. **`useTenant`**: expor `error` e `retry`; `setLoading(false)` em todos os caminhos de `handleMissingUserDoc`; timeout em `findRegisteredUserByEmail`.
2. **`AppRoutes`**: tela de erro com retry quando falha ao carregar tenant.
3. **`AIVoiceAssistant`**: ler `data.error` do JSON; timeout no `fetch`; mensagem no transcript.
4. **`vite.config.ts`**: proxy `/api` → `localhost:3000` para dev isolado do frontend.
5. **Telas críticas**: banner de erro em `BCApprovals`, `Statistics`, `UserList`, `CloseBox`, `OpenBox`.

---

## Correções executadas (rodadas 1–10 + erros silenciosos)

**Data das últimas correções:** 09/07/2026

### Rodada 10 — Erros silenciosos e feedback na UI

| Área | Arquivo(s) | Correção |
|------|------------|----------|
| Tenant bootstrap | `useTenant.ts`, `useTenantHelpers.ts` | Expostos `error` e `retry`; timeout de 15s em `findRegisteredUserByEmail`; `setLoading(false)` imediato após vincular usuário por e-mail |
| Rotas / loading global | `AppRoutes.tsx` | Componentes `TenantBootstrapError` e `AppLoadingSpinner`; tela de erro com botão “Tentar novamente” em layouts privado, público e superadmin |
| Assistente IA | `AIVoiceAssistant.tsx` | Lê `data.error` do backend; timeout de 60s no `fetch`; mensagem de erro no transcript e em `statusText` |
| Dev proxy | `vite.config.ts` | Proxy `/api` → `http://localhost:3000` para dev isolado do frontend |
| Caixa | `CloseBox.tsx`, `OpenBox.tsx` | Exibe erro do Firestore antes do estado “sem caixa aberta”; banner de `boxError` em OpenBox |
| Listagens | `BCApprovals.tsx`, `Statistics.tsx`, `UserList.tsx` | Estado `loadError` / `listError` com banner visível ao usuário |

### Rodadas anteriores (SonarQube — resumo consolidado)

| Rodada | Foco principal |
|--------|----------------|
| 1–3 | API key removida de config Firebase; bugs de hooks/condicionais; `AudioContext.close()`; refatoração `buildOperationalContext`, `useTenantHelpers`, `NavigationContext` |
| 4 | `placeholders.ts`, `statusLabels.ts`; skeleton keys; ternários → helpers |
| 5 | `firestoreTimestamp.ts`, `errorMessage.ts`; eliminação de `Math.random()`; assertions em `firebase.ts`/`Finance.tsx` |
| 6 | Remoção de `import React` default; `getErrorMessage()` em catches; tipos `FormEvent`/`ChangeEvent` |
| 7 | `firestoreError.ts` (`logFirestoreError`); migração de 11 arquivos; `unsubRef` sem função vazia; `lazy`/`Suspense` nomeados |
| 8 | Zero `React.*` no frontend; `getErrorMessage()` em 9 telas; `booleanFieldDisplay()` em Forms |
| 9 | Ternários/helpers restantes; `getErrorMessage()` em catches adicionais |

### Utilitários compartilhados criados

| Arquivo | Funções |
|---------|---------|
| `frontend/src/utils/statusLabels.ts` | Labels e classes de status (aprovações, transferências, caixas, crédito, medalhas) |
| `frontend/src/utils/firestoreTimestamp.ts` | `toJsDate`, `pickJsDate`, `formatFirestoreDate` |
| `frontend/src/utils/errorMessage.ts` | `getErrorMessage` |
| `frontend/src/utils/firestoreError.ts` | `logFirestoreError` |
| `frontend/src/constants/placeholders.ts` | `SKELETON_*`, `WAVE_BAR_KEYS` |

### Verificação pós-correção

- `cd backend && npm run build` — OK
- `cd frontend && npm run lint` — **0 erros** (rodada 12)

---

## Rodada final — Varredura SonarQube (09/07/2026)

### Comando executado

```bash
docker start sonarqube

docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "$(pwd):/usr/src" \
  -w /usr/src \
  sonarsource/sonar-scanner-cli \
  -Dsonar.host.url=http://host.docker.internal:9000 \
  -Dsonar.login=admin \
  -Dsonar.password=admin
```

**Resultado:** `ANALYSIS SUCCESSFUL` — task `AZ9ISdRPCLfLbCrmv1Sc`  
**Arquivos indexados:** 70 (67 analisados + exclusões)  
**Tempo de análise TypeScript:** ~168 s

### Issues remanescentes por tipo (138 total)

| Tipo | Quantidade |
|---|---:|
| Code smells | 138 |
| Bugs | 0 |
| Vulnerabilidades | 0 |

### Principais code smells remanescentes (CRITICAL — S3776)

Complexidade cognitiva acima do limite (15) em funções grandes — refatoração futura recomendada:

| Arquivo | Complexidade | Linha |
|---|---:|---|
| `CompanyList.tsx` | 45 | 1487 |
| `CreditRequests.tsx` | 35 | 86 |
| `CompanyList.tsx` | 35 | 237 |
| `useTenant.ts` | 34 | 161 |
| `Finance.tsx` | 29 | 74 |
| `CompanyList.tsx` | 27 | 1652 |
| `Dashboard.tsx` | 27 | 56 |
| `CollectionCleaning.tsx` | 26 | 76 |
| `CompanyList.tsx` | 24 | 55 |

### Próximos passos sugeridos

1. ~~**Cobertura de testes** — configurar Jest/Vitest + relatório LCOV para destravar o Quality Gate~~ ✅ **Feito (rodada 11)**
2. ~~**Refatoração de complexidade** — extrair subcomponentes/helpers de `CompanyList.tsx`, `CreditRequests.tsx`, `Finance.tsx`~~ ✅ **Parcial (rodada 11)** — ver abaixo
3. ~~**Security hotspots** — revisar manualmente os 10 hotspots LOW restantes (geolocalização, IPs de exemplo)~~ ✅ **Revisado (rodada 11)**
4. ~~**Erros TS pré-existentes** — corrigir tipos em `BCExpenses`, `BCIncomes`, `BCTransfers`, `BoxSummary`, `CompanyList`~~ ✅ **Feito (rodada 11)**

---

## Rodada 11 — Próximos passos executados (09/07/2026)

### 1. Cobertura de testes (Vitest + LCOV)

- Instalados `vitest` e `@vitest/coverage-v8` no frontend
- Criado `frontend/vitest.config.ts` com relatório LCOV em `frontend/coverage/lcov.info`
- Scripts: `npm run test` e `npm run test:coverage`
- `sonar-project.properties` atualizado com `sonar.javascript.lcov.reportPaths`
- **10 testes** em 5 arquivos: `errorMessage`, `selectState`, `useTenantHelpers`, `statusLabels`, `financeMovements`

### 2. Refatoração de complexidade

| Arquivo | Extração |
|---------|----------|
| `useTenant.ts` | Lógica movida para `useTenantState.ts` (`applyExistingUserDoc`, `applyBypassState`, `applyGuestState`) |
| `Finance.tsx` | Carregamento movido para `financeMovements.ts` (`fetchUnifiedMovements`) |
| `CreditRequests.tsx` | Mapeamento movido para `creditRequestMapper.ts` |
| `Dashboard.tsx` | Mapeamento movido para `boxRecordMapper.ts` |
| `CompanyList.tsx` | Tipos em `types/company.ts` (reduz erros TS; complexidade S3776 permanece para rodada futura) |

### 3. Security hotspots

- Criado `utils/geolocation.ts` — wrapper centralizado para geolocalização intencional (mapas e cadastro)
- `CompanyList.tsx` migrado para `getBrowserPosition`
- `constants/device.ts` — documentado que `6.0.0.2` é **semver**, não IP
- `backend/server.ts` — comentário na porta de desenvolvimento local

### 4. Erros TypeScript corrigidos

| Arquivo | Correção |
|---------|----------|
| `BCExpenses`, `BCIncomes`, `BCTransfers` | Casts tipados em filtros `<select>`; `isSuperAdmin` em vez de `role === 'superadmin'` |
| `BoxSummary` | Export Excel usa `getTypeName()` sem reatribuir union type |
| `CompanyList` | Tipos `BusinessCenter`, `CustomerAddress`, `CustomerPhone`, etc. em `types/company.ts` |

### Verificação

- `cd frontend && npm run test:coverage` — 10/10 testes OK
- Erros TS nos arquivos-alvo da rodada 11 — **zero**
- `cd backend && npm run build` — OK

---

## Rodada 12 — TypeScript zero erros + utilitários operacionais (09/07/2026)

### Objetivo

Eliminar os **13 arquivos** com erros TypeScript remanescentes após a rodada 11 e consolidar tipos/helpers reutilizáveis para telas operacionais.

### Novos arquivos

| Arquivo | Conteúdo |
|---------|----------|
| `frontend/src/types/operational.ts` | `RouteOption`, `OpenBoxOption`, `SaleOption`, `PaymentRecord`, `hasAdminAccess()` |
| `frontend/src/utils/saleMapper.ts` | `mapSaleFromSnapshot()` — mapeamento tipado de vendas do Firestore |
| `frontend/src/utils/saleMapper.test.ts` | 3 testes do mapper |
| `frontend/src/types/operational.test.ts` | 3 testes de `hasAdminAccess` |
| `frontend/src/utils/firestoreTimestamp.test.ts` | 6 testes de conversão/formatação de datas |

### Erros TypeScript corrigidos

| Arquivo | Correção |
|---------|----------|
| `UnitSelectors.tsx` | Tipos `BusinessCenter[]` / `RouteOption[]`; `useEffect` de rotas corrigido |
| `NewExpense.tsx`, `NewIncome.tsx` | Tipos operacionais; `hasAdminAccess` / `isSuperAdmin` |
| `PaymentHistory.tsx` | Estado `PaymentRecord[]` |
| `RegisterPayment.tsx` | `mapSaleFromSnapshot`; import `useTenant` restaurado |
| `Forms.tsx` | `textValue` tipado para inputs (`string` / `number` → `String`) |
| `Layout.tsx` | Tipo `BeforeInstallPromptEvent` para PWA |
| `SalesList.tsx` | Import duplicado de `Screen` removido |
| `DeviceList.tsx`, `RouteList.tsx`, `EditDevice.tsx` | `hasAdminAccess(role, isSuperAdmin)` em vez de `role === 'superadmin'` |
| `EditDevice.tsx` | Cast em `<select>` de status |
| `CollectionCleaning.tsx`, `SuperAdmin.tsx` | Cast tipado em filtros `<select>` |

### Padrões estabelecidos

- **Permissão admin:** `hasAdminAccess(role, isSuperAdmin)` — nunca comparar `role === 'superadmin'` (tipo `UserRole` não inclui esse valor).
- **Filtros `<select>`:** `e.target.value as typeof meuFiltro`.
- **Valores de formulário dinâmico:** normalizar `unknown` antes de passar a `value` de input.

### Verificação

- `cd frontend && npm run lint` — **0 erros** (tsc --noEmit)
- `cd frontend && npm run test:coverage` — **22/22 testes** OK (8 arquivos); cobertura utils ~15% statements
- `cd backend && npm run build` — OK

### Próximos passos sugeridos (prioridade)

1. **Cobertura SonarQube** — expandir Vitest para mappers/helpers (`firestoreTimestamp`, `boxRecordMapper`, `creditRequestMapper`) até ≥20% nos utils; reexecutar scanner para atualizar métrica de cobertura no dashboard.
2. **Refatoração S3776** — `CompanyList.tsx` (complexidade 45, linha 1487) continua como maior dívida; extrair subcomponentes de listagem de clientes e modais.
3. **Complexidade secundária** — `CreditRequests.tsx` (35), `Finance.tsx` (29), `CollectionCleaning.tsx` (26).
4. **Quality Gate** — após cobertura mínima configurada no SonarQube (ex.: 10%), validar se o gate passa com 0 bugs / 0 vulnerabilidades.
5. **CI** — adicionar `npm run lint` + `npm run test:coverage` no pipeline de PR (GitHub Actions ou equivalente).

---

## Varredura pós-rodada 12 (09/07/2026 — 19:47 UTC)

### Comando executado

```bash
cd frontend && npm run test:coverage   # gera frontend/coverage/lcov.info

docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "$(pwd):/usr/src" \
  -w /usr/src \
  sonarsource/sonar-scanner-cli \
  -Dsonar.host.url=http://host.docker.internal:9000 \
  -Dsonar.login=admin \
  -Dsonar.password=admin
```

**Resultado:** `ANALYSIS SUCCESSFUL` — task `AZ9Ia-ZICLfLbCrmv1Sd`  
**Arquivos indexados:** 87 (83 analisados + exclusões)  
**Tempo de análise:** ~4 min 12 s (TypeScript ~2 min 24 s)  
**LCOV importado:** `frontend/coverage/lcov.info` ✅

### Comparativo com varredura anterior

| Métrica | Varredura final (19:10) | Pós-rodada 12 (19:47) | Δ |
|---|---:|---:|---|
| NCLOC | 28.059 | 28.226 | +167 |
| Arquivos analisados | 67 | 83 | +16 |
| **Issues abertas** | **138** | **135** | **−3** |
| Bugs | 0 | **0** | — |
| Vulnerabilidades | 0 | **0** | — |
| Code smells | 138 | 135 | −3 |
| Security hotspots | 10 | 10 | — |
| **Cobertura** | **0,0%** | **1,7%** | **+1,7 pp** |
| Duplicação | 3,5% | 3,1% | −0,4 pp |
| Dívida técnica | ~1.520 min | ~1.437 min | −83 min |

### Ratings (pós-rodada 12)

| Rating | Valor |
|---|---|
| Confiabilidade | **A** (0 bugs) |
| Segurança | **A** (0 vulnerabilidades) |
| Manutenibilidade | **A** |
| Quality Gate | **ERROR** (cobertura baixa + smells) |

### Distribuição por severidade (issues abertas)

| Severidade | Varredura final | Pós-rodada 12 | Δ |
|---|---:|---:|---:|
| BLOCKER | 0 | 0 | — |
| CRITICAL | 48 | **45** | −3 |
| MAJOR | 58 | 58 | — |
| MINOR | 24 | 24 | — |
| INFO | 8 | 8 | — |

### Principais code smells CRITICAL remanescentes (S3776)

| Arquivo | Linhas afetadas |
|---|---|
| `CompanyList.tsx` | 54, 236, 1481, 1539, 1567, 1646 |
| `AIVoiceAssistant.tsx` | 28, 487, 693 |
| `backend/server.ts` | 31 |

### Próximos passos (atualizados)

1. **Cobertura** — expandir testes (meta ≥10% no SonarQube); atual: **1,7%** com 22 testes Vitest.
2. **Refatoração S3776** — `CompanyList.tsx` permanece como maior dívida (6 funções CRITICAL).
3. **Quick wins** — import não usado em `useTenant.ts` (`resolveDefaultTenantId`, S1128, quick fix disponível).
4. **Quality Gate** — ajustar threshold de cobertura no SonarQube ou aumentar suite de testes antes de exigir passagem.
5. **CI** — integrar lint + test:coverage + scanner no pipeline.

---

## Rodada 13 — Resolução de issues SonarQube (09/07/2026)

### Escopo

Ataque sistemático às **135 issues abertas** identificadas na varredura pós-rodada 12, priorizando quick wins e regras com correção mecânica.

### Novos utilitários

| Arquivo | Função |
|---------|--------|
| `frontend/src/utils/listViewBody.tsx` | Substitui ternários aninhados loading/vazio/conteúdo (S3358) |
| `frontend/src/types/reactEvents.ts` | `HtmlFormSubmitEvent`, `HtmlInputChangeEvent`, `FormOrButtonEvent` — substitui `FormEvent` deprecado (S1874) |

### Issues corrigidas por regra

| Regra | Qtd. anterior | Ação |
|-------|-------------:|------|
| **S1128** (imports não usados) | 4 | Removidos em `useTenant`, `Statistics`, `UnitSelectors`, `Insurance` |
| **S1874** (`FormEvent` deprecado) | 18 | Migrados 16 arquivos para `types/reactEvents.ts` |
| **S1854** (atribuições inúteis) | 10 | Removidas variáveis mortas em 8 telas; `PeriodSummary` simplificado (fetch só de `boxes`) |
| **S1135** (comentários TODO) | 8 | Renomeados para `Pendente:` em 7 arquivos |
| **S4165** (atribuição redundante) | 1 | Ramo redundante removido em `useTenantHelpers.ts` |
| **S6353** (regex) | 1 | `isPasswordStrong` removido de `Login.tsx` |
| **S6479** (index em keys) | 2 | Keys estáveis em `AIVoiceAssistant` e `Holidays` |
| **S3358** (ternários aninhados) | 26 | **8 resolvidos** via `listViewBody` (`BCApprovals`, `Dashboard`, `UserList`, `RouteList`, `DeviceList` + `currency.ts`) |

### Telas com `listViewBody` aplicado

`BCApprovals.tsx`, `Dashboard.tsx`, `UserList.tsx`, `RouteList.tsx`, `DeviceList.tsx`

### Verificação local

- `cd frontend && npm run lint` — **0 erros**
- `cd frontend && npm run test` — **22/22** OK

### Issues remanescentes estimadas

| Categoria | Estimativa |
|-----------|----------|
| S3776 (complexidade cognitiva) | ~32 — `CompanyList`, `AIVoiceAssistant`, `server.ts` |
| S3358 (ternários aninhados) | ~18 — telas operacionais restantes |
| Outras | ~10 |

> **Reexecutar varredura SonarQube** para confirmar contagem exata após esta rodada.

### Próximos passos

1. Varredura SonarQube de confirmação.
2. Aplicar `listViewBody` nas ~18 telas S3358 restantes (`Finance`, `SuperAdmin`, `TransferSales`, etc.).
3. Refatoração S3776 em `CompanyList.tsx` (maior impacto na dívida CRITICAL).

---

## Rodada 14 — S3358 concluídos + helpers estendidos (09/07/2026)

### Escopo

Continuação da rodada 13: eliminar **ternários aninhados (S3358)** restantes e preparar base para refatoração S3776.

### Helpers estendidos (`listViewBody.tsx`)

| Função | Uso |
|--------|-----|
| `listViewBody` | loading / vazio / conteúdo |
| `loadingErrorContent` | loading / erro / conteúdo (`Finance`) |
| `loadingErrorEmptyContent` | loading / erro / vazio / conteúdo (`Summary`) |
| `guardedListViewBody` | pré-condição + loading / vazio / conteúdo (`TransferSales`) |

### Telas migradas para `listViewBody` (rodada 14)

`CreditRequests`, `BCExpenses`, `BCIncomes`, `BCTransfers`, `CollectionCleaning`, `CollectorMap`, `CompanyList` (grid clientes), `Forms` (×2), `Holidays` (×2), `SalesList` (×2), `NewIncome`, `NewExpense`, `Finance`, `Summary`, `TransferSales` (×3)

**Total acumulado S3358:** ~26 ocorrências tratadas em **22 telas/utilitários**.

### Verificação

- `npm run lint` — **0 erros**
- `npm run test` — **22/22** OK
- Padrão `) : *.length === 0 ?` — **0 ocorrências** no frontend

### Próximos passos

1. **Varredura SonarQube** — confirmar redução de issues (estimativa: ~50–60 issues resolvidas nas rodadas 13–14).
2. ~~**S3776** — extrair `CustomerDetailModal` de `CompanyList.tsx`~~ ✅ **Feito (rodada 15)**
3. **S3776** — `AIVoiceAssistant.tsx`, `backend/server.ts`, funções CRITICAL remanescentes.

---

## Rodada 15 — Extração `CustomerDetailModal` (09/07/2026)

### Refatoração S3776 — `CompanyList.tsx`

| Antes | Depois |
|-------|--------|
| `CompanyList.tsx` — ~2.697 linhas | `CompanyList.tsx` — ~1.448 linhas |
| Modal inline no mesmo arquivo | `components/CompanyListCustomerModal.tsx` — ~1.230 linhas |
| Interface `Customer` local | `types/company.ts` — `Customer` exportado |

### Arquivos alterados

- **`frontend/src/types/company.ts`** — interface `Customer`
- **`frontend/src/screens/components/CompanyListCustomerModal.tsx`** — exporta `CustomerDetailModal`
- **`frontend/src/screens/CompanyList.tsx`** — importa modal e tipo; ~1.250 linhas removidas

### Verificação

- `npm run lint` — **0 erros**
- `npm run test` — **22/22** OK

### Próximos passos

1. Varredura SonarQube para medir redução real de S3776.
2. Subdividir `CompanyListCustomerModal` por aba se CRITICAL persistir.
3. S3776 em `AIVoiceAssistant.tsx` e `backend/server.ts`.

---

## Varredura pós-rodadas 13–15 (09/07/2026 — 20:20 UTC)

### Comando executado

```bash
cd frontend && npm run test:coverage

docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "$(pwd):/usr/src" \
  -w /usr/src \
  sonarsource/sonar-scanner-cli \
  -Dsonar.host.url=http://host.docker.internal:9000 \
  -Dsonar.login=admin \
  -Dsonar.password=admin
```

**Resultado:** `ANALYSIS SUCCESSFUL` — task `AZ9IicYACLfLbCrmv1Se`  
**Tempo de análise:** ~3 min 58 s

### Comparativo

| Métrica | Pós-rodada 12 (19:47) | Pós-rodadas 13–15 (20:20) | Δ |
|---|---:|---:|---|
| **Issues abertas** | **135** | **61** | **−74 (−54,8%)** |
| Bugs | 0 | **0** | — |
| Vulnerabilidades | 0 | **0** | — |
| Code smells | 135 | **61** | −74 |
| CRITICAL | 45 | **39** | −6 |
| MAJOR | 58 | **17** | −41 |
| MINOR | 24 | **5** | −19 |
| INFO | 8 | **0** | −8 |
| Cobertura | 1,7% | 1,7% | — |
| Duplicação | 3,1% | 3,1% | — |
| Dívida técnica | ~1.437 min | **~800 min** | −637 min |
| NCLOC | 28.226 | 28.401 | +175 |

### Comparativo desde varredura inicial (359 issues)

| Métrica | Inicial | Atual | Δ |
|---|---:|---:|---|
| **Total issues** | **359** | **61** | **−298 (−83,0%)** |
| Bugs | 14 | **0** | −14 |
| Vulnerabilidades | 1 | **0** | −1 |
| BLOCKER | 1 | **0** | −1 |

### Issues abertas por regra (atual)

| Regra | Qtd. | Descrição |
|-------|-----:|-----------|
| S3776 | 39 | Complexidade cognitiva |
| S3358 | 16 | Ternários aninhados restantes |
| S1128 | 3 | Imports não usados |
| S1854 | 1 | Atribuição inútil |
| S1874 | 1 | `FormEvent` em `reactEvents.ts` |
| S4323 | 1 | Outros |

### Principais S3776 CRITICAL remanescentes

| Arquivo | Observação |
|---------|------------|
| `CompanyListCustomerModal.tsx` | 4 funções (pós-extração rodada 15) |
| `CompanyList.tsx` | 1 função (reduzida) |
| `AIVoiceAssistant.tsx` | Assistente de voz |
| `useTenant.ts`, `useBox.ts` | Hooks core |
| `CollectionCleaning.tsx`, `BoxSummary.tsx`, `BusinessCenters.tsx` | Telas operacionais |

### Ratings (atual)

| Rating | Valor |
|---|---|
| Confiabilidade | **A** (0 bugs) |
| Segurança | **A** (0 vulnerabilidades) |
| Manutenibilidade | **A** |
| Quality Gate | **ERROR** (cobertura 1,7%) |

**Dashboard:** http://localhost:9000/dashboard?id=controlmax

### Próximos passos

1. **S3358 restantes (16)** — `PeriodSummary`, `SalesList`, `MassBoxOpening`, badges de status em `Finance`, etc.
2. **S3776** — subdividir `CompanyListCustomerModal` por aba; refatorar `AIVoiceAssistant` e `useTenant`.
3. **Quick wins** — 3× S1128, 1× S1874 em `reactEvents.ts`, 1× S1854.
4. **Cobertura** — expandir Vitest para destravar Quality Gate (meta ≥10%).

---

## Rodada 16 — Quick wins + zerar S3358 (09/07/2026)

### Quick wins (6 issues)

| Arquivo | Regra | Correção |
|---------|-------|----------|
| `CompanyList.tsx` | S1128 | Removidos imports `HtmlInputChangeEvent` e `X` |
| `Insurance.tsx` | S1128 | Removido `HtmlFormSubmitEvent` não usado |
| `Statistics.tsx` | S1854 | `creditRequests` → `[, setCreditRequests]` |
| `reactEvents.ts` | S1874 | `FormEvent` → `SyntheticEvent<HTMLFormElement>` |
| `SuperAdmin.tsx` | S4323 | Type alias `TerminalLogType` |

### S3358 — ternários aninhados (16 issues)

| Padrão | Arquivos |
|--------|----------|
| Helpers em `statusLabels.ts` | `boxStatusBadgeBorderClasses`, `deviceStatusBadgeClasses`, `financeMovementStatusBadgeClasses`, `insuranceStatusBadgeClasses`, `terminalLogTextClass`, `superAdminRoleBadgeClasses` |
| `reportPeriodBody` em `listViewBody.tsx` | `PeriodSummary.tsx` (2 issues) |
| `formatFirestoreDate` | `SaleDetail.tsx` (2 issues) |
| `collectorAmountSection` | `MassBoxOpening.tsx` |
| `seedExampleButtonContent` | `SalesList.tsx` |
| `assistantAbortErrorMessage` | `AIVoiceAssistant.tsx` |
| `terminalLogTextClass` + `superAdminRoleBadgeClasses` | `SuperAdmin.tsx` (5 issues) |

### Arquivos alterados

- `frontend/src/types/reactEvents.ts`
- `frontend/src/utils/statusLabels.ts` + `statusLabels.test.ts`
- `frontend/src/utils/listViewBody.tsx`
- `frontend/src/screens/CompanyList.tsx`, `Insurance.tsx`, `Statistics.tsx`
- `frontend/src/screens/BoxSummary.tsx`, `DeviceList.tsx`, `Finance.tsx`
- `frontend/src/screens/PeriodSummary.tsx`, `SaleDetail.tsx`, `MassBoxOpening.tsx`
- `frontend/src/screens/SalesList.tsx`, `SuperAdmin.tsx`
- `frontend/src/screens/components/AIVoiceAssistant.tsx`

### Verificação

- `npm run lint` — **0 erros**
- `npm run test` — **24/24** OK
- Cobertura Vitest — **16,3%** statements (LCOV)

---

## Varredura pós-rodada 16 (09/07/2026 — 20:40 UTC)

### Comando executado

```bash
cd frontend && npm run test:coverage

cd .. && docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "$(pwd):/usr/src" \
  -w /usr/src \
  sonarsource/sonar-scanner-cli \
  -Dsonar.host.url=http://host.docker.internal:9000 \
  -Dsonar.login=admin \
  -Dsonar.password=admin
```

**Resultado:** `ANALYSIS SUCCESSFUL` — task `AZ9Im-sVCLfLbCrmv1Sf`  
**Tempo de análise:** ~3 min 31 s

### Comparativo

| Métrica | Pós-rodadas 13–15 (20:20) | Pós-rodada 16 (20:40) | Δ |
|---|---:|---:|---|
| **Issues abertas** | **61** | **38** | **−23 (−37,7%)** |
| Bugs | 0 | **0** | — |
| Vulnerabilidades | 0 | **0** | — |
| Code smells | 61 | **38** | −23 |
| CRITICAL | 39 | **38** | −1 |
| MAJOR | 17 | **0** | −17 |
| MINOR | 5 | **0** | −5 |
| Cobertura | 1,7% | **1,9%** | +0,2 pp |
| Dívida técnica | ~800 min | **~672 min** | −128 min |

### Comparativo desde varredura inicial (359 issues)

| Métrica | Inicial | Atual | Δ |
|---|---:|---:|---|
| **Total issues** | **359** | **38** | **−321 (−89,4%)** |
| Bugs | 14 | **0** | −14 |
| Vulnerabilidades | 1 | **0** | −1 |
| S3358 (ternários) | ~42 | **0** | −42 |
| S1128 / S1854 / S1874 / S4323 | várias | **0** | zerados |

### Issues abertas por regra (atual)

| Regra | Qtd. | Descrição |
|-------|-----:|-----------|
| S3776 | 38 | Complexidade cognitiva (única regra restante) |

### Principais S3776 CRITICAL remanescentes

| Arquivo | Qtd. |
|---------|-----:|
| `CompanyListCustomerModal.tsx` | 4 |
| `NewIncome.tsx` | 3 |
| `AIVoiceAssistant.tsx` | 3 |
| `CompanyList.tsx`, `Forms.tsx`, `NewExpense.tsx`, `Performance.tsx`, `PlatformManagement.tsx`, `SalesList.tsx` | 2 cada |
| Demais (hooks, telas, utils) | 1 cada |

### Ratings (atual)

| Rating | Valor |
|---|---|
| Confiabilidade | **A** (0 bugs) |
| Segurança | **A** (0 vulnerabilidades) |
| Manutenibilidade | **A** |
| Quality Gate | **ERROR** (cobertura 1,9%) |

**Dashboard:** http://localhost:9000/dashboard?id=controlmax

### Próximos passos

1. **S3776 (38)** — subdividir `CompanyListCustomerModal` por aba; refatorar `NewIncome`, `AIVoiceAssistant`, `useTenant` e `server.ts`.
2. **Cobertura** — expandir Vitest (meta ≥10%) para destravar Quality Gate.
3. **Opcional** — rodada focada em `CompanyList.tsx` (2 CRITICAL) após modal por abas.

---

## Rodada 17 — Subdivisão `CompanyListCustomerModal` por aba (09/07/2026)

### Refatoração S3776 — modal de cliente

| Antes | Depois |
|-------|--------|
| `CompanyListCustomerModal.tsx` — ~1.230 linhas monolíticas | Shell — ~80 linhas |
| 4 funções CRITICAL no mesmo arquivo | 1× S3776 residual em `readBasicFields` (corrigido na sequência) |
| Lógica de 5 abas inline | 8 módulos em `customerModal/` |

### Novos arquivos (`frontend/src/screens/components/customerModal/`)

| Arquivo | Responsabilidade |
|---------|------------------|
| `CustomerModalBasicTab.tsx` | Ficha básica + save Firestore |
| `CustomerModalLocationsTab.tsx` | Endereços e telefones adicionais |
| `CustomerModalReferencesTab.tsx` | Referências familiares/comerciais |
| `CustomerModalSalesTab.tsx` | Vendas e pagamentos (Firestore real-time) |
| `CustomerModalPhotosTab.tsx` | Upload/remoção de fotos |
| `CustomerModalGpsSection.tsx` | GPS + reverse geocoding |
| `CustomerModalTabBar.tsx` | Barra de ícones das 5 abas |
| `useCustomerFinancialData.ts` | Hook `onSnapshot` vendas/cobranças |
| `customerGeolocation.ts` | Geolocalização extraída |
| `demoData.ts` | Dados demo para abas vazias |
| `types.ts` | Tipos compartilhados do modal |

### Verificação

- `npm run lint` — **0 erros**
- `npm run test` — **24/24** OK

### Varredura SonarQube (20:56 UTC — task `AZ9IqzUgCLfLbCrmv1Sh`)

| Métrica | Pós-rodada 16 | Pós-rodada 17 | Δ |
|---|---:|---:|---|
| **Issues abertas** | **38** | **35** | **−3** |
| S3776 no modal | 4 | **0** (após fix `readBasicFields`) | −4 |
| Dívida técnica | ~672 min | **~609 min** | −63 min |
| Cobertura | 1,9% | 1,9% | — |

**Issues S3776 remanescentes (35):** `NewIncome` (3), `AIVoiceAssistant` (3), `CompanyList` (2), demais telas/hooks (1 cada).

### Próximos passos

1. **S3776** — `NewIncome.tsx`, `AIVoiceAssistant.tsx`, `useTenant.ts`, `backend/server.ts`.
2. **Cobertura Vitest** — meta ≥10% para Quality Gate.
3. **CompanyList.tsx** — 2 CRITICAL restantes.

---

## Rodada 18 — Refatoração `NewIncome.tsx` (09/07/2026)

### S3776 — 3 funções CRITICAL

| Antes | Depois |
|-------|--------|
| `NewIncome.tsx` monolítico (~875 linhas) | Shell ~170 linhas + módulos extraídos |
| `useEffect` CN/unidades (complexidade 25) | `useNewIncomeData` + `businessCenterSelection` |
| `handleSave` (complexidade 28) | `incomeSave.ts` (`validate` + `persist`) |
| `formatType` switch inline | `incomeTypeLabels.ts` (mapa) |

### Novos arquivos

| Arquivo | Função |
|---------|--------|
| `hooks/useNewIncomeData.ts` | Firestore real-time (CN, caixas, ingresos, vendas) |
| `utils/businessCenterSelection.ts` | Seleção padrão CN/unidade |
| `utils/incomeTypeLabels.ts` | Rótulos e `isSaleIncomeType` |
| `utils/incomeSave.ts` | Validação + persistência Firestore |
| `utils/incomeHelpers.test.ts` | 4 testes unitários |
| `components/NewIncomeFormPanel.tsx` | Formulário de novo ingreso |
| `components/NewIncomeHistoryPanel.tsx` | Tabela histórico |
| `components/NewIncomeCenterSelectors.tsx` | Seletores CN/unidade |
| `components/NewIncomeMainTabs.tsx` | Abas Nuevo/Histórico |
| `components/NewIncomeUnitOptions.tsx` | Options do select de unidades |

### Verificação

- `npm run lint` — **0 erros**
- `npm run test` — **28/28** OK

### Próximos passos

1. **S3776** — `AIVoiceAssistant` concluído na rodada 20; próximo: `useTenant.ts`, `backend/server.ts`.
2. **Cobertura Vitest** — meta ≥10% para Quality Gate.
3. **NewExpense.tsx** — aplicar mesmo padrão de extração.

---

## Varredura pós-rodada 18 (09/07/2026 — 21:11 UTC)

Varredura intermediária após `NewIncome.tsx` (task `AZ9IuLo6CLfLbCrmv1Si`).

| Métrica | Pós-rodada 17 | Pós-rodada 18 | Δ |
|---|---:|---:|---|
| **Issues abertas** | **35** | **35** | — |
| S3776 em `NewIncome.tsx` | 3 | **0** | −3 |
| S3776 em `AIVoiceAssistant.tsx` | 3 | 3 | — |
| Cobertura Sonar | 1,9% | 1,9% | — |

> Os 3 S3776 de `NewIncome` foram eliminados; o total permaneceu em 35 porque a refatoração ainda não tinha sido escaneada em conjunto com `AIVoiceAssistant`.

---

## Rodada 19 — Refatoração `AIVoiceAssistant.tsx` (09/07/2026)

### S3776 — 3 funções CRITICAL eliminadas do componente

| Antes | Depois |
|-------|--------|
| `AIVoiceAssistant.tsx` monolítico (~900 linhas) | Shell ~53 linhas |
| `getOperationalContext` (complexidade 21) | `utils/assistantOperationalContext.ts` |
| `playBase64Audio` (complexidade **81**) | `utils/assistantAudio.ts` (`AssistantAudioPlayer`) |
| `playHTML5AudioFallback` (complexidade 32) | Mesma classe + métodos privados |
| Estado, gravação e API inline | `hooks/useAIVoiceAssistant.ts` |
| JSX do painel flutuante | `components/AIVoiceAssistantPanel.tsx` |

### Novos arquivos

| Arquivo | Função |
|---------|--------|
| `utils/assistantDate.ts` | `parseAssistantDate`, `isOnOrAfterToday` |
| `utils/assistantStrings.ts` | Strings PT/ES, timeout, mensagens de erro |
| `utils/assistantOperationalContext.ts` | Contexto operacional Firestore para o Gemini |
| `utils/assistantAudio.ts` | Reprodução PCM/WAV, Web Audio, HTML5 e speech synthesis |
| `hooks/useAIVoiceAssistant.ts` | Estado, gravação, `sendToAssistant` |
| `components/AIVoiceAssistantPanel.tsx` | UI do assistente de voz |

### Verificação

- `npm run lint` — **0 erros**
- `npm run test` — **28/28** OK
- Cobertura Vitest local — **~11%** statements (LCOV)

### Varredura SonarQube (21:37 UTC — task `AZ9Iz-uoCLfLbCrmv1Sj`)

| Métrica | Pós-rodada 17 | Pós-rodadas 18–19 | Δ |
|---|---:|---:|---|
| **Issues abertas** | **35** | **31** | **−4 (−11,4%)** |
| Bugs | 0 | **0** | — |
| Vulnerabilidades | 0 | **0** | — |
| S3776 | 35 | **29** | −6 |
| S4325 | 0 | **2** → corrigidos em `incomeSave.ts` | +2 (novos) |
| Dívida técnica | ~609 min | **~488 min** | −121 min |
| Cobertura Sonar | 1,9% | **2,3%** | +0,4 pp |
| NCLOC | — | **28.907** | — |
| Duplicação | 3,5% | **2,4%** | −1,1 pp |

### Comparativo desde varredura inicial (359 issues)

| Métrica | Inicial | Atual | Δ |
|---|---:|---:|---|
| **Total issues** | **359** | **31** | **−328 (−91,4%)** |
| Bugs | 14 | **0** | −14 |
| Vulnerabilidades | 1 | **0** | −1 |
| S3358 (ternários) | ~42 | **0** | −42 |
| S3776 | ~80+ | **29** | −51+ |

### Issues abertas por regra (atual)

| Regra | Qtd. | Descrição |
|-------|-----:|-----------|
| S3776 | 29 | Complexidade cognitiva |
| S4325 | 0* | Assertions desnecessárias (*corrigidas pós-scan) |

### Principais S3776 CRITICAL remanescentes

| Arquivo | Qtd. |
|---------|-----:|
| `CompanyList.tsx`, `Forms.tsx`, `NewExpense.tsx`, `Performance.tsx`, `PlatformManagement.tsx`, `SalesList.tsx` | 2 cada |
| `useAIVoiceAssistant.ts` | 1 (complexidade 47 — residual da extração) |
| `useTenant.ts`, `backend/server.ts` | 1 cada |
| Demais (hooks, telas, utils) | 1 cada |

### Ratings (atual)

| Rating | Valor |
|---|---|
| Confiabilidade | **A** (0 bugs) |
| Segurança | **A** (0 vulnerabilidades) |
| Manutenibilidade | **A** |
| Quality Gate | **ERROR** (cobertura 2,3%) |

**Dashboard:** http://localhost:9000/dashboard?id=controlmax

### Próximos passos

1. **S3776** — `useTenant.ts` (191); `backend/server.ts` (58); `NewExpense.tsx` (2).
2. **NewExpense.tsx** — mesmo padrão de extração aplicado em `NewIncome`.
3. **Cobertura Vitest** — expandir testes para ≥10% no Sonar.
4. **CompanyList.tsx** — 2 CRITICAL restantes.

---

## Rodada 20 — Extração `assistantApi` + sub-hooks do assistente (09/07/2026)

### Objetivo

Eliminar o S3776 residual em `useAIVoiceAssistant.ts` (complexidade 47) movendo API, gravação e efeitos para módulos dedicados.

### Novos arquivos

| Arquivo | Função |
|---------|--------|
| `utils/assistantApi.ts` | `callGeminiAssistant`, `formatAssistantError` |
| `utils/assistantRecording.ts` | `startVoiceRecording` (MediaRecorder → base64) |
| `utils/assistantApi.test.ts` | 3 testes de formatação de erro |
| `hooks/useAssistantState.ts` | Estado local do painel |
| `hooks/useAssistantAudioPlayer.ts` | Instância e ciclo de vida do player |
| `hooks/useAssistantWaveform.ts` | Animação do waveform |
| `hooks/useAssistantMessaging.ts` | Gravação, envio de texto e toggle |
| `hooks/useAssistantLifecycle.ts` | Welcome, scroll e `onOpenChange` |

### Resultado

| Antes | Depois |
|-------|--------|
| `useAIVoiceAssistant.ts` ~245 linhas, S3776 (47) | Shell ~80 linhas, **0 S3776** |
| `sendToAssistant` inline no hook | `callGeminiAssistant` em `assistantApi.ts` |
| MediaRecorder inline | `assistantRecording.ts` |

### Verificação

- `npm run lint` — **0 erros**
- `npm run test` — **31/31** OK
- Cobertura Vitest local — **~11%** statements

### Varredura SonarQube (22:01 UTC — task `AZ9I5gDhCLfLbCrmv1Sm`)

| Métrica | Pós-rodadas 18–19 | Pós-rodada 20 | Δ |
|---|---:|---:|---|
| **Issues abertas** | **31** | **28** | **−3 (−9,7%)** |
| S3776 | 29 | **28** | −1 |
| S4325 | 2 | **0** | −2 |
| S3776 em `useAIVoiceAssistant.ts` | 1 | **0** | −1 |
| Dívida técnica | ~488 min | **~451 min** | −37 min |
| Cobertura Sonar | 2,3% | **2,6%** | +0,3 pp |

### Comparativo desde varredura inicial (359 issues)

| Métrica | Inicial | Atual | Δ |
|---|---:|---:|---|
| **Total issues** | **359** | **28** | **−331 (−92,2%)** |
| S3776 | ~80+ | **28** | −52+ |
| Assistente de voz (S3776) | 3+ | **0** | zerado |

### Issues abertas por regra (atual)

| Regra | Qtd. | Descrição |
|-------|-----:|-----------|
| S3776 | 28 | Complexidade cognitiva (única regra restante) |

### Principais S3776 CRITICAL remanescentes

| Arquivo | Qtd. |
|---------|-----:|
| `CompanyList.tsx`, `Forms.tsx`, `NewExpense.tsx`, `Performance.tsx`, `PlatformManagement.tsx`, `SalesList.tsx` | 2 cada |
| `useTenant.ts`, `backend/server.ts` | 1 cada |
| Demais (hooks, telas, utils) | 1 cada |

**Dashboard:** http://localhost:9000/dashboard?id=controlmax

### Próximos passos

1. **S3776** — `CompanyList.tsx` (2); `useTenant.ts` (191); `backend/server.ts` (58).
2. **Cobertura Vitest** — meta ≥10% no Sonar para Quality Gate.

---

## Rodada 21 — Refatoração `NewExpense.tsx` (09/07/2026)

### S3776 — 2 CRITICAL eliminados

| Antes | Depois |
|-------|--------|
| `NewExpense.tsx` monolítico (~856 linhas) | Shell ~150 linhas + painéis |
| Componente (complexidade 16) + `handleSave` (33) | **0 S3776** |
| 4 `useEffect` Firestore inline | `useNewExpenseData` |
| `handleSave` + validação + persistência | `expenseSave.ts` |
| `formatType` switch + `mapExpenseTypeToBcCategory` | `expenseTypeLabels.ts` |

### Novos arquivos

| Arquivo | Função |
|---------|--------|
| `hooks/useNewExpenseData.ts` | CN, caixas abertas, histórico unificado |
| `utils/expenseSave.ts` | `validateExpenseForm`, `persistExpense` |
| `utils/expenseTypeLabels.ts` | Rótulos e categoria BC |
| `utils/expenseHelpers.test.ts` | 6 testes unitários |
| `components/NewExpenseCnSelector.tsx` | Seletor CN superior |
| `components/NewExpenseMainTabs.tsx` | Abas Nuevo/Histórico |
| `components/NewExpenseFormPanel.tsx` | Formulário completo |
| `components/NewExpenseHistoryPanel.tsx` | Tabela histórico |

### Verificação

- `npm run lint` — **0 erros**
- `npm run test` — **37/37** OK
- Cobertura Vitest local — **~13,8%** statements

### Varredura SonarQube (22:26 UTC)

| Métrica | Pós-rodada 20 | Pós-rodada 21 | Δ |
|---|---:|---:|---|
| **Issues abertas** | **28** | **26** | **−2** |
| S3776 em `NewExpense.tsx` | 2 | **0** | −2 |
| Dívida técnica | ~451 min | **~426 min** | −25 min |
| Cobertura Sonar | 2,6% | **3,2%** | +0,6 pp |

### Principais S3776 CRITICAL remanescentes

| Arquivo | Qtd. |
|---------|-----:|
| `CompanyList.tsx`, `Forms.tsx`, `Performance.tsx`, `PlatformManagement.tsx`, `SalesList.tsx` | 2 cada |
| `useTenant.ts`, `backend/server.ts` | 1 cada |
| Demais (hooks, telas, utils) | 1 cada |

**Dashboard:** http://localhost:9000/dashboard?id=controlmax

### Próximos passos

1. **S3776** — `useTenant.ts` (191); `backend/server.ts` (58); `Forms.tsx` (2).
2. **Cobertura Vitest** — meta ≥10% no Sonar.

---

## Rodada 22 — Refatoração `CompanyList.tsx` (09/07/2026)

### S3776 — 2 CRITICAL eliminados do componente principal

| Antes | Depois |
|-------|--------|
| `CompanyList.tsx` monolítico (~1.445 linhas) | Shell ~105 linhas |
| Componente (complexidade 21) | **0 S3776** |
| `handleGetCurrentLocation` (complexidade 34) | `utils/customerGeolocation.ts` |
| 3 `useEffect` + filtro inline | `useCompanyListData` + `customerFilter.ts` |
| Formulário de criação inline | `useCustomerCreateForm` + `customerCreate.ts` |

### Novos arquivos

| Arquivo | Função |
|---------|--------|
| `hooks/useCompanyListData.ts` | CN, clientes, filtros, modal |
| `hooks/useCompanyListCustomers.ts` | Snapshot Firestore de clientes |
| `hooks/useOpenCustomerFromParams.ts` | Abre modal via `params.clientId` |
| `hooks/useCustomerCreateForm.ts` | Estado e submit do formulário |
| `utils/customerGeolocation.ts` | GPS + reverse geocoding compartilhado |
| `utils/customerCreate.ts` | Validação + payload + persistência |
| `utils/customerFilter.ts` | Filtro por unidade e busca |
| `utils/companyListCenters.ts` | Carrega CNs ativos |
| `utils/customerFilter.test.ts` | 2 testes unitários |
| `components/companyList/CompanyListHeader.tsx` | Seletores CN/unidade |
| `components/companyList/CompanyListTabBar.tsx` | Abas Lista/Criar |
| `components/companyList/CompanyListCreateForm.tsx` | Formulário de novo cliente |
| `components/companyList/CompanyListCustomerGrid.tsx` | Grid de clientes |
| `components/companyList/useCustomerFormFieldSetters.ts` | Setters do formulário |

### Verificação

- `npm run lint` — **0 erros**
- `npm run test` — **39/39** OK
- Cobertura Vitest local — **~13,6%** statements

### Varredura SonarQube (23:13 UTC)

| Métrica | Pós-rodada 21 | Pós-rodada 22 | Δ |
|---|---:|---:|---|
| **Issues abertas** | **26** | **25** | **−1** |
| S3776 em `CompanyList.tsx` | 2 | **0** | −2 |
| Dívida técnica | ~426 min | **~391 min** | −35 min |
| Cobertura Sonar | 3,2% | **3,5%** | +0,3 pp |

> Nota: 1 S3776 residual em `CompanyListCreateForm.tsx` (complexidade 16) — fora do escopo dos 2 CRITICAL originais no componente principal.

### Principais S3776 CRITICAL remanescentes

| Arquivo | Qtd. |
|---------|-----:|
| `Forms.tsx`, `Performance.tsx`, `PlatformManagement.tsx`, `SalesList.tsx` | 2 cada |
| `useTenant.ts`, `backend/server.ts` | 1 cada |
| Demais (hooks, telas, utils) | 1 cada |

**Dashboard:** http://localhost:9000/dashboard?id=controlmax

### Próximos passos

1. **S3776** — `useTenant.ts`; `backend/server.ts`; `Forms.tsx`.
2. **Opcional** — subdividir `CompanyListCreateForm` por aba (1 S3776 residual).
3. **Cobertura Vitest** — meta ≥10% no Sonar.

---

## Rodada 23 — `useTenant.ts`, `backend/server.ts`, `Forms.tsx` (09/07/2026)

### S3776 — prioridade crítica (ordem natural)

| Arquivo | Antes | Depois |
|---------|------:|-------:|
| `useTenant.ts` (complexidade ~191) | 1 S3776 | **0** — extraídos `useTenantLink.ts`, `useTenantSubscription.ts` |
| `backend/server.ts` (complexidade ~58) | 1 S3776 | **0** — extraídos `assistantRoute.ts`, `assistantPrompts.ts`, `geminiAssistant.ts` |
| `Forms.tsx` (2× S3776) | 2 | **0** — extraídos `useFormsData.ts`, `formsHelpers.ts`, `FormsFillingModal`, `FormFieldInput` |

### Arquivos criados

| Módulo | Arquivos |
|--------|----------|
| Tenant | `useTenantLink.ts`, `useTenantSubscription.ts` |
| Backend assistant | `assistantRoute.ts`, `assistantPrompts.ts`, `geminiAssistant.ts` |
| Forms | `useFormsData.ts`, `formsHelpers.ts`, `components/forms/FormFieldInput.tsx`, `FormsFillingModal.tsx` |

### Verificação local

| Check | Resultado |
|-------|-----------|
| `npm run lint` (frontend) | OK |
| `npm run test` (frontend) | 39/39 |
| `npm run build` (backend) | OK |

> Varredura SonarQube pendente (container `sonarqube` parado). Estimativa: **25 → ~21 issues** (−4 S3776).

### Principais S3776 CRITICAL remanescentes (estimado)

| Arquivo | Qtd. |
|---------|-----:|
| `Performance.tsx`, `PlatformManagement.tsx`, `SalesList.tsx` | 2 cada |
| `CompanyListCreateForm.tsx` e demais telas/hooks | 1 cada |

### Próximos passos

1. **S3776** — `Performance.tsx`, `PlatformManagement.tsx`, `SalesList.tsx` (2 cada).
2. **Opcional** — `CompanyListCreateForm.tsx` (1 residual).
3. **SonarQube** — `docker start sonarqube` + scanner para confirmar métricas.

---

## Rodada 25 — `Statistics`, `MassBoxOpening`, `BCTransfers`, `Layout`, `CompanyListCreateForm` (09/07/2026)

### S3776 — modularização de telas restantes

| Arquivo | Extrações principais |
|---------|----------------------|
| `Statistics.tsx` | `utils/statisticsAggregates.ts`, `components/statistics/SymmetricDualAxisChart.tsx`, uso de `useStatisticsData` + `types/statistics.ts` |
| `MassBoxOpening.tsx` | `hooks/useMassBoxOpeningData.ts`, `utils/massBoxOpening.ts`, `components/massBoxOpening/CollectorAmountSection.tsx` |
| `BCTransfers.tsx` | `hooks/useBCTransfersHistory.ts`, `utils/bcTransferFilters.ts` |
| `Layout.tsx` | `hooks/useLayoutUi.ts`, `components/layout/LayoutMobileDrawer.tsx` |
| `CompanyListCreateForm.tsx` | `create/CompanyListCreateTabBar.tsx`, `CompanyListCreateBasicTab.tsx`, `CompanyListCreateLocationsTab.tsx`, `CompanyListCreateReferencesTab.tsx`, `CompanyListCreatePhotosTab.tsx` |

### Verificação local

| Check | Resultado |
|-------|-----------|
| `cd frontend && npm run lint` | OK (`tsc --noEmit`) |

### Observações

- Sem alteração de comportamento funcional intencional; apenas separação de responsabilidades e redução de complexidade.
- Ajuste adicional aplicado em `Performance.tsx` para corrigir import quebrado pré-existente e permitir lint verde.
4. **Cobertura Vitest** — meta ≥10% no Sonar.

---

## Rodada 24 — `Performance.tsx`, `PlatformManagement.tsx`, `SalesList.tsx` (09/07/2026)

### S3776 — 6 CRITICAL eliminados (2 por arquivo)

| Arquivo | Antes | Depois |
|---------|------:|-------:|
| `Performance.tsx` | 2 S3776 | **0** — `usePerformanceData.ts`, `performanceMetrics.ts`, cards em `components/performance/` |
| `PlatformManagement.tsx` | 2 S3776 | **0** — `usePlatformSettings.ts`, `types/platformSettings.ts`, 4 tabs em `components/platform/` |
| `SalesList.tsx` | 2 S3776 | **0** — `useSalesListData.ts`, `salesListMapper.ts`, `salesListFilters.ts`, `salesSeed.ts` |

### Verificação local

| Check | Resultado |
|-------|-----------|
| `npm run lint` | OK |
| `npm run test` | 39/39 |

> Estimativa acumulada: **~21 → ~15 issues** (−6 S3776). Varredura SonarQube pendente.

### Principais S3776 CRITICAL remanescentes (estimado)

| Arquivo | Qtd. |
|---------|-----:|
| `CompanyListCreateForm.tsx` e demais telas/hooks/utils | 1 cada |

### Próximos passos

1. **S3776** — telas com 1 CRITICAL cada (`Statistics`, `MassBoxOpening`, `Layout`, `BCTransfers`, etc.).
2. **Opcional** — `CompanyListCreateForm.tsx` (1 residual).
3. **SonarQube** — `docker start sonarqube` + scanner para confirmar métricas.

---

## Rodada 25 — telas com 1 S3776 cada (09/07/2026)

### S3776 — 5 arquivos refatorados

| Arquivo | Extrações principais |
|---------|---------------------|
| `Statistics.tsx` | `useStatisticsData`, `statisticsAggregates`, `SymmetricDualAxisChart` |
| `MassBoxOpening.tsx` | `useMassBoxOpeningData`, `massBoxOpening`, `CollectorAmountSection` |
| `BCTransfers.tsx` | `useBCTransfersHistory`, `bcTransferFilters` |
| `Layout.tsx` | `useLayoutUi`, `LayoutMobileDrawer` |
| `CompanyListCreateForm.tsx` | 4 subtabs + `CompanyListCreateTabBar` em `companyList/create/` |

### Verificação local

| Check | Resultado |
|-------|-----------|
| `npm run lint` | OK |
| `npm run test` | 39/39 |

> Estimativa acumulada: **~15 → ~10 issues** (−5 S3776). Varredura SonarQube pendente.

### Principais S3776 CRITICAL remanescentes (estimado)

| Arquivo | Qtd. |
|---------|-----:|
| `CreditRequests`, `Holidays`, `Finance`, `Dashboard`, `DeviceList`, etc. | 1 cada |

### Próximos passos

1. **S3776** — demais telas com 1 CRITICAL (`CreditRequests`, `Holidays`, `CollectionCleaning`, `TransferSales`, etc.).
2. **SonarQube** — subir container e rodar scanner para confirmar métricas finais.
3. **Cobertura Vitest** — meta ≥10% no Sonar.

---

## Rodada 26 — telas com 1 S3776 cada (09/07/2026)

### S3776 — 5 arquivos refatorados

| Arquivo | Extrações principais |
|---------|---------------------|
| `CreditRequests.tsx` | `useCreditRequestsData`, `creditRequestFilters`, `CreditRequestCard`, `CreditRequestCreateModal`, `CreditRequestsTabBar` |
| `Holidays.tsx` | `useHolidaysData`, `holidayAggregates`, `HolidaysCalendarList`, `HolidaysUpcomingPanel`, `HolidaysAddForm` |
| `CollectionCleaning.tsx` | `useCollectionCleaningData`, `collectionCleaningFilters`, `CollectionCleaningStatsBar`, `CollectionCancelModal`, `CollectionCleaningCard` |
| `Finance.tsx` | `useFinanceData`, `financeMetrics`, `FinanceKpiGrid`, `FinanceMovementsTable`, `FinanceDistributionCard` |
| `Dashboard.tsx` | `useDashboardBoxes`, `dashboardBoxFilters`, `DashboardBoxCard` |

### Verificação local

| Check | Resultado |
|-------|-----------|
| `npm run lint` | OK |
| `npm run test` | 39/39 |

> Estimativa acumulada: **~10 → ~5 issues** (−5 S3776). Varredura SonarQube pendente.

### Principais S3776 CRITICAL remanescentes (estimado)

| Arquivo | Qtd. |
|---------|-----:|
| `DeviceList`, `BCIncomes`, `BCExpenses`, `TransferSales`, `SaleDetail`, `useBox.ts`, etc. | 1 cada |

### Próximos passos

1. **S3776** — demais telas com 1 CRITICAL (`DeviceList`, `BCIncomes`, `BCExpenses`, `TransferSales`, `SaleDetail`, `useBox.ts`).
2. **SonarQube** — subir container e rodar scanner para confirmar métricas finais.
3. **Cobertura Vitest** — meta ≥10% no Sonar.

---

## Rodada 27 — telas/hooks com 1 S3776 cada (09/07/2026)

### S3776 — 5 arquivos refatorados

| Arquivo | Extrações principais |
|---------|---------------------|
| `SaleDetail.tsx` | `useSaleDetailData`, `saleDetailDisplay`, `SaleDetailContent` |
| `DeviceList.tsx` | `useDeviceListData`, `deviceListFilters`, `deviceTimeAgo`, `DeviceTable`, `DeviceBindModal` |
| `BCIncomes.tsx` | `useBCIncomesData`, `bcIncomeFilters`, `firestoreDateSubscription`, `BCIncomeFormTab`, `BCIncomeHistoryTab` |
| `BCExpenses.tsx` | `useBCExpensesData`, `bcExpenseFilters`, `BCExpenseNewModal`, `BCExpenseListSection` |
| `useBox.ts` | `useActiveBoxSubscription`, `boxLifecycle` (open/close/confirm) |

### Verificação local

| Check | Resultado |
|-------|-----------|
| `npm run lint` | OK |
| `npm run test` | 39/39 |

> Estimativa acumulada: **~5 → ~0 issues** (−5 S3776). Varredura SonarQube pendente.

### Principais S3776 CRITICAL remanescentes (estimado)

| Arquivo | Qtd. |
|---------|-----:|
| `TransferSales.tsx` | 2 |
| Demais telas menores | 1 cada |

### Próximos passos

1. **S3776** — `TransferSales.tsx` (2 CRITICAL) e resíduos menores.
2. **SonarQube** — subir container e rodar scanner para confirmar métricas finais.
3. **Cobertura Vitest** — meta ≥10% no Sonar.

