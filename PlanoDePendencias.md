# Plano de Pendências — ControlMax

Documento vivo de acompanhamento. Atualize o status (`[ ]` / `[~]` / `[x]`) conforme cada item for concluído.

**Última atualização:** 10/07/2026  
**Contexto:** SonarQube pausado no Docker (0 issues na última varredura; Quality Gate em ERROR por cobertura ~3,1%). Recuperação funcional comparada com `controlmax.old` concluída. Próximo responsável: colaborador de deploy após `git pull`.

---

## Fase 0 — Versionamento (esta entrega)

Objetivo: deixar o repositório pronto para o colaborador fazer pull e deploy.

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 0.1 | Criar este plano (`PlanoDePendencias.md`) | Agente | [x] |
| 0.2 | Excluir `controlmax.old/` do versionamento (referência local) | Agente | [x] |
| 0.3 | Commit de refatoração SonarQube (rodada 30), recuperação e docs | Agente | [ ] |
| 0.4 | Push para `origin/main` | Agente | [ ] |
| 0.5 | Colaborador faz `git pull` | Deploy | [ ] |

**Arquivos entregues nesta rodada:**
- `documentation/ARQUITETURA.md` — arquitetura, componentes críticos, deploy
- `documentation/Divergências.md` — análise comparativa com versão antiga
- `Configuração vercel.txt` — roadmap rápido para Vercel
- `frontend/vercel.json` + `vercel.json` — rewrites SPA
- Correções Firebase (`@firebase-config`), `VITE_API_URL`, navegação Forms/Feriados

---

## Fase 1 — Deploy (colaborador)

Referência principal: [`Configuração vercel.txt`](Configuração%20vercel.txt) e [`documentation/ARQUITETURA.md`](documentation/ARQUITETURA.md).

| # | Tarefa | Status |
|---|--------|--------|
| 1.1 | Configurar projeto Vercel com **Root Directory = `frontend`** | [ ] |
| 1.2 | Definir variáveis `VITE_FIREBASE_*` no painel Vercel | [ ] |
| 1.3 | Definir `VITE_FIRESTORE_DATABASE_ID` | [ ] |
| 1.4 | Deploy do `backend/` (Express + Gemini) em serviço separado | [ ] |
| 1.5 | Definir `VITE_API_URL` apontando para o backend em produção | [ ] |
| 1.6 | Validar preview: login com tenant real | [ ] |
| 1.7 | Validar recarga de rota profunda (ex.: `/sales`) — sem 404 | [ ] |
| 1.8 | Validar Assistente IA em produção | [ ] |

---

## Fase 2 — Teste regressivo manual

Checklist derivado de [`documentation/Divergências.md`](documentation/Divergências.md).

| # | Tela / fluxo | Status |
|---|--------------|--------|
| 2.1 | `/company-list` — criar cliente (abas basic, locations, references, photos) | [ ] |
| 2.2 | `/company-list` — editar cliente no modal (salvar básico, endereço, foto) | [ ] |
| 2.3 | `/forms` — criar formulário, preencher, ver respostas | [ ] |
| 2.4 | `/holidays` — adicionar e excluir feriado | [ ] |
| 2.5 | `/platform-management` — salvar configurações | [ ] |
| 2.6 | `NewIncome` / `NewExpense` — upload e remoção de anexo | [ ] |
| 2.7 | Menu **Administración** — links Formularios e Feriados visíveis (admin/supervisor) | [ ] |
| 2.8 | Modo claro e escuro nas telas alteradas | [ ] |

---

## Fase 3 — Qualidade e SonarQube

SonarQube Docker **pausado** até deploy estável.

| # | Tarefa | Status |
|---|--------|--------|
| 3.1 | Anotar em `Varredura.md`: data da pausa e motivo (foco em deploy) | [ ] |
| 3.2 | Religar SonarQube apenas para validar que nenhuma issue regressou | [ ] |
| 3.3 | Aumentar cobertura nos módulos críticos (meta inicial: 15–20%) | [ ] |
| 3.4 | Testes prioritários: `customerCreate`, `formsHelpers`, `platformSettings`, `assistantApi` | [ ] |
| 3.5 | Quality Gate verde ou plano de exceção documentado para cobertura | [ ] |

**Módulos críticos (não simplificar sem teste):** ver seção 3 em `ARQUITETURA.md`.

---

## Fase 4 — Limpeza pós-deploy

| # | Tarefa | Status |
|---|--------|--------|
| 4.1 | Confirmar deploy estável em produção | [ ] |
| 4.2 | Manter ou remover pasta local `controlmax.old/` (referência; não versionada) | [ ] |
| 4.3 | Revisar se `PlanoDePendencias.md` pode arquivar itens concluídos | [ ] |

---

## Ordem de execução resumida

```
Fase 0  →  commit + push (esta entrega)
Fase 1  →  deploy Vercel + backend (colaborador)
Fase 2  →  QA manual nas telas de cadastro
Fase 3  →  SonarQube + cobertura (quando deploy OK)
Fase 4  →  limpeza final
```

---

## Notas e decisões

| Data | Nota |
|------|------|
| 10/07/2026 | Comparação com `controlmax.old`: campos de cadastro preservados; lógica migrada para hooks. Forms/Feriados estavam sem link no menu — corrigido. |
| 10/07/2026 | SonarQube parado no Docker; última varredura com 0 issues, gate bloqueado só por cobertura. |
| | _Adicionar notas abaixo conforme o trabalho avançar_ |

---

## Comandos úteis

```bash
# Validação local antes de deploy
cd frontend && npm run lint && npm run test && npm run build
cd ../backend && npm run build

# Pull para o colaborador
git pull origin main
```
