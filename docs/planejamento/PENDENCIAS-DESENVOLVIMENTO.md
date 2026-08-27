# Pendências de Desenvolvimento — ControlMax (atualizado)

**Data da análise:** 27/08/2026  
**Branch ativa:** `merged-dev-fabio`  
**Fontes cruzadas:**
- [`guia-controlmax.md`](./guia-controlmax.md) — evolução enterprise
- [`ARQUITETURA-SSOT.md`](../arquitetura/ARQUITETURA-SSOT.md) — SSOT arquitetural
- [`backlog-piloto.md`](../comparativo/backlog-piloto.md)
- [`14-roadmap.md`](../controlmax/14-roadmap.md)
- [`PLANO-DESENVOLVIMENTO.md`](./PLANO-DESENVOLVIMENTO.md)

> **Piloto (código):** Fases 0–5 + P1/P2 entregues.  
> **Gate GO:** ainda depende de ops/QA.  
> **Próximo ciclo de código:** evolução enterprise do guia (§6).

---

## 1. Resumo executivo

| Faixa | Implementado (código) | Aberto |
|-------|----------------------:|--------|
| **Piloto P0–P2 + CLEAN** | Tudo | 0 feature |
| **Gate (ops/QA)** | Checklists prontos | Deploy + SYNC-01 + QA regressivo |
| **Enterprise (guia)** | Fase 6–7 (até ENT-05) | Audit BI / Terraform → … |

---

## 2. Gate Piloto — ainda aberto (outro desenvolvedor)

| # | Item | Doc |
|---|------|-----|
| 1 | Deploy `firestore.rules` + `firestore.indexes.json` | [`DEPLOY-FIRESTORE-GATE.md`](../ops/DEPLOY-FIRESTORE-GATE.md) |
| 2 | Homologação SyncManager em dispositivo | [`SYNC-01-CHECKLIST-QA.md`](../ops/SYNC-01-CHECKLIST-QA.md) |
| 3 | QA regressivo (caixa, sale, collection, multi-tenant) | [`GATE-PILOTO-QA.md`](../ops/GATE-PILOTO-QA.md) |

**Ops residual (opcional pós-deploy):** executar `npm run backfill:claims` nos usuários legados.

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
| `ENT-06` | Infra como Código (**Terraform**) | P2 ops | §6.5 | ⬜ |
| `ENT-07` | **RAG** no assistente (após medir custo/latência do contexto bruto) | P2 IA | §5.6 / §6.6 | ⬜ |
| `ENT-08` | Dashboards analíticos sobre `audit_logs` | P2 | §2 Auditoria | ⬜ |
| `ENT-09` | Double-entry **cutover** (só após sombra estável) | P2 | §3.3 | ⬜ |

### UX residual (guia §4)

| Item | Status |
|------|--------|
| Erro BFF sem fechar modal (amostras críticas) | ✅ parcial (RegisterPayment, clientes, platform) |
| ErrorBoundary local por módulo crítico | ⬜ mapear e completar |
| Empty states + retry em todas as listagens | ⬜ gradual |

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

1. **Ops/QA:** deploy rules/indexes (incl. `ledger_shadow`) → Gate QA → SYNC-01.  
2. **Código:** `ENT-08` dashboards `audit_logs` (ou `ENT-06` Terraform ops).  
3. Depois: `ENT-07` RAG se métricas pedirem → `ENT-09` cutover ledger.

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

---

## 8. Checklist rápido

```
[x] Piloto P0–P2 + CLEAN (código)
[x] SSOT arquitetura
[ ] Gate: deploy rules/indexes
[ ] Gate: SYNC-01 assinado
[ ] Gate: QA regressivo
[x] ENT-01 Zod DTOs BFF
[x] ENT-02 Ledger sombra
[x] ENT-03 Rate limiting
[x] ENT-04 Revogação claims / force refresh
[x] ENT-05 Testes conflito Sync
[ ] ENT-06 Terraform
[ ] ENT-07 RAG (condicional)
[ ] ENT-08 Audit analytics
[ ] ENT-09 Ledger cutover
```
