# Pendências de Desenvolvimento — ControlMax (atualizado)

**Data da análise:** 27/08/2026  
**Branch ativa:** `Dev-Improvments-Fabio`  
**Fontes cruzadas:**
- [`guia-controlmax.md`](./guia-controlmax.md) — evolução enterprise
- [`ARQUITETURA-SSOT.md`](../arquitetura/ARQUITETURA-SSOT.md) — SSOT arquitetural
- [`backlog-piloto.md`](../comparativo/backlog-piloto.md)
- [`14-roadmap.md`](../controlmax/14-roadmap.md)
- [`PLANO-DESENVOLVIMENTO.md`](./PLANO-DESENVOLVIMENTO.md)

> **Piloto (código):** Fases 0–5 + P1/P2 entregues.  
> **Enterprise (código):** ENT-01…09 + UX residual entregues nesta branch.  
> **Gate GO:** ainda depende de ops/QA (outro time).

---

## 1. Resumo executivo

| Faixa | Implementado (código) | Aberto |
|-------|----------------------:|--------|
| **Piloto P0–P2 + CLEAN** | Tudo | 0 feature |
| **Gate (ops/QA)** | Checklists prontos | Emulator rules + Deploy + SYNC-01 + QA regressivo |
| **Enterprise (guia)** | ENT-01…09 ✅ | Gate ops/QA |

---

## 2. Gate Piloto — ainda aberto (outro desenvolvedor / ops-QA)

| # | Item | Doc |
|---|------|-----|
| 0 | **Suite `firestore.rules` + integração BFF no Emulator** (JDK 21 + `firebase-tools`) | [`DEPLOY-FIRESTORE-GATE.md`](../ops/DEPLOY-FIRESTORE-GATE.md) §1.1 / CI `test-backend` |
| 1 | Deploy `firestore.rules` + `firestore.indexes.json` | [`DEPLOY-FIRESTORE-GATE.md`](../ops/DEPLOY-FIRESTORE-GATE.md) |
| 2 | Homologação SyncManager em dispositivo | [`SYNC-01-CHECKLIST-QA.md`](../ops/SYNC-01-CHECKLIST-QA.md) |
| 3 | QA regressivo (caixa, sale, collection, multi-tenant) | [`GATE-PILOTO-QA.md`](../ops/GATE-PILOTO-QA.md) |

**Como rodar o item 0 (bloqueante antes do deploy se CI local falhar):**

```bash
# Pré: Java 21 + firebase-tools (ver workflow .github/workflows/tests.yml)
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export LOCAL_DEV=true
npx firebase emulators:exec --only firestore \
  "npm test -w backend && npm test -w frontend -- src/tests/firestore.rules.test.ts"
```

**Ops residual (opcional pós-deploy):** executar `npm run backfill:claims` nos usuários legados.

### 2.1 Varredura de saúde (27/08/2026) — relatório para o time de Gate

Executada na branch `Dev-Improvments-Fabio` pós ENT-06…09 + limpeza/refatoração.

| Checagem | Resultado |
|----------|-----------|
| `frontend` `npm run lint` (`tsc --noEmit`) | ✅ após 6 correções |
| `frontend` `npm run build` | ✅ |
| `backend` `npm run build` (esbuild) | ✅ |
| `frontend` unitários (excl. rules) | ✅ 117/117 |
| `backend` unitários (excl. `auditoriaIntegracao`) | ✅ 77/77 |
| `firestore.rules.test.ts` + `auditoriaIntegracao` | ⛔ **pendente Gate** — exige Emulator (item 0) |
| Grep bypass emails no código app | ✅ 0 hits (só docs de arquivo) |
| Writes client em `sales`/`collections`/`boxes`/`security_logs` | ✅ só `salesSeed.ts` órfão (sem import no app) |
| Endpoints `/api/*` hooks/sync ↔ Express | ✅ sem dead-ends |

**Correções TypeScript aplicadas nesta varredura (6):**

1. `CompanyList.tsx` — import `AlertCircle`  
2. `UserUnitsChecklist.tsx` — path `useTenantUnits` (`../../../hooks/…`)  
3. `RoleManagement.tsx` + `permissionMatrix.ts` — cast via `unknown`  
4. `VendedorMobile.tsx` — `amountCents` → `amount`  
5. Narrowing `ResolveOperationalUnitResult` (`ok === false`)  
6. `syncExecutor.test.ts` — tipagem do mock `execute`  

**Nota:** `backend` não tem script `lint`; CI de produção de build usa esbuild.

---

## 3. Piloto — matriz (código ✅)

| Prioridade | Itens | Status |
|------------|-------|--------|
| **P0** | SEC, FIN, CTX, AUTH, AUD, Sync (código), caixas, centavos, idempotência | ✅ |
| **P1** | Lista negra, transfers BFF, hub reports, devices | ✅ |
| **P2** | Aprovações, mass open/close, forms/feriados, reports async, SaaS billing | ✅ |
| **CLEAN** | fmtCents, resolvePendingCents, docs | ✅ |

Adiados de propósito: CRUD multi-sociedade; locales pontuais; `formatToBRL` (unidade major).

---

## 4. Evolução Enterprise — pendências de código (guia §5–§6)

Ordenadas por risco / sequenciamento do guia:

| ID | Item | Prioridade | Origem guia | Status |
|----|------|------------|-------------|--------|
| `ENT-01` | Validação **Zod** nos DTOs do BFF (transactions, boxes, admin) | P0 pós-gate | §5.2 / §6.1 | ✅ |
| `ENT-02` | **Ledger** append-only em **modo sombra** (paralelo ao estado por documento) | P0 financeiro | §5.1 / §3.3 / §6.2 | ✅ |
| `ENT-03` | **Rate limiting** em `/api/transactions/*`, `/api/boxes/*`, `/api/gemini/assistant` | P0 segurança | §5.3 / §6.3 | ✅ |
| `ENT-04` | Claims: **force refresh / revogação** de sessão após mudança de role | P1 | §5.4 | ✅ |
| `ENT-05` | Testes automatizados de **conflito SyncManager** (duplo enqueue, edição concorrente) | P1 | §5.5 | ✅ |
| `ENT-06` | Infra como Código (**Terraform**) | P2 ops | §6.5 | ✅ |
| `ENT-07` | **RAG** no assistente (após medir custo/latência do contexto bruto) | P2 IA | §5.6 / §6.6 | ✅ |
| `ENT-08` | Dashboards analíticos sobre `audit_logs` | P2 | §2 Auditoria | ✅ |
| `ENT-09` | Double-entry **cutover** (só após sombra estável) | P2 | §3.3 | ✅ |

### UX residual (guia §4)

| Item | Status |
|------|--------|
| Erro BFF sem fechar modal (amostras críticas) | ✅ parcial (RegisterPayment, clientes, platform) |
| ErrorBoundary local por módulo crítico | ✅ `RouteErrorBoundary` em todas as rotas via `ScreenWrapper` |
| Empty states + retry em listagens | ✅ ampliado (Company/Route/Device/Blacklist/User/Audit/Holidays/Credit/Cleaning/Sales collections) |

---

## 5. Dívidas técnicas remanescentes

| Tema | Status |
|------|--------|
| Locales `es-CO` / `en-US` pontuais | Mantidos de propósito |
| `formatToBRL` (não cents) | Fora do `fmtCents` |
| `getDemoUser()` → null | OK (demo off) |
| GlobalContext em 100% das telas | Gradual (já: BoxSummary, Summary, CloseBox, devices, routes, OpenBox, Dashboard) |
| Docs satélite vs SSOT | SSOT canônico; `ARQUITETURA.md` = ponte |

---

## 6. Ordem recomendada

1. **Ops/QA:** Emulator rules + BFF integração (item 0) → deploy rules/indexes (incl. `ledger_shadow`) → Gate QA → SYNC-01.  
2. **Ops ledger:** homologar `delta=0` → `LEDGER_MODE=dual` → cutover caixas → `canonical` ([`LEDGER-CUTOVER.md`](../ops/LEDGER-CUTOVER.md)).  
3. Dívidas UX menores (Sales grid, BC lists) — gradual.

---

## 7. Notas de execução

| Data | Nota |
|------|------|
| 27/08/2026 | Piloto código fechado (Fases 0–5, P1/P2, RBAC, audit, SaaS, reports async). |
| 27/08/2026 | SSOT `ARQUITETURA-SSOT.md`. |
| 27/08/2026 | `guia-controlmax.md` alinhado: RBAC/Audit = feitos; roadmap ENT-01…09 + Gate ops. |
| 27/08/2026 | **ENT-01** Zod nos DTOs P0 (`sale`/`collection`/`reversal`/`open`/`close`/`users`) + Sync open/close alinhado ao BFF. |
| 27/08/2026 | **ENT-02** `ledger_shadow` append-only nas mutações financeiras + reconcile + rules/indexes. |
| 27/08/2026 | **ENT-03** rate limit in-memory (gemini 10/min, financial 120/min) + 429 tipado. |
| 27/08/2026 | **ENT-04** revokeRefreshTokens + verifyIdToken(checkRevoked) + getIdToken(true)/retry CLAIMS_STALE. |
| 27/08/2026 | **ENT-05** suite Sync conflito + retry 5xx/429 + auto `processAll` no evento online. |
| 27/08/2026 | **ENT-08** Analytics em `/audit-logs` (agregações + export XLSX client-side). |
| 27/08/2026 | **ENT-06** Terraform staging (Cloud Run + AR + secrets) — [`docs/ops/TERRAFORM.md`](../ops/TERRAFORM.md). |
| 27/08/2026 | UX residual: `RouteErrorBoundary` + `ListFeedback` (retry/empty) em rotas críticas / listagens-chave. |
| 27/08/2026 | UX: 2ª onda `ListFeedback` — UserList, AuditLogs, Holidays, CreditRequests, CollectionCleaning, Sales collections. |
| 27/08/2026 | **ENT-07** RAG leve no assistente (`assistantRag` + chunks; `ASSISTANT_RAG_ENABLED` / `ASSISTANT_RAG_DEBUG`). |
| 27/08/2026 | **ENT-09** cutover ledger (`LEDGER_MODE`, balance/cutover APIs) — [`LEDGER-CUTOVER.md`](../ops/LEDGER-CUTOVER.md). |
| 27/08/2026 | Varredura saúde: build FE/BE OK; 6 fixes TS; unitários OK; **rules/integração Emulator** → Gate item 0. |

---

## 8. Checklist rápido

```
[x] Piloto P0–P2 + CLEAN (código)
[x] SSOT arquitetura
[ ] Gate: Emulator firestore.rules + BFF integração
[ ] Gate: deploy rules/indexes
[ ] Gate: SYNC-01 assinado
[ ] Gate: QA regressivo
[x] ENT-01 Zod DTOs BFF
[x] ENT-02 Ledger sombra
[x] ENT-03 Rate limiting
[x] ENT-04 Revogação claims / force refresh
[x] ENT-05 Testes conflito Sync
[x] ENT-06 Terraform
[x] ENT-07 RAG (condicional → entregue leve)
[x] ENT-08 Audit analytics
[x] ENT-09 Ledger cutover
[x] Varredura saúde pós-refatoração (build + unitários + greps)
```
