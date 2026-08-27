# Pendências de Desenvolvimento — ControlMax (atualizado)

**Data da análise:** 27/08/2026  
**Branch ativa:** `merged-dev-fabio`  
**Fontes cruzadas:**
- [`docs/comparativo/backlog-piloto.md`](../docs/comparativo/backlog-piloto.md)
- [`docs/controlmax/14-roadmap.md`](../docs/controlmax/14-roadmap.md)
- [`PLANO-DESENVOLVIMENTO.md`](./PLANO-DESENVOLVIMENTO.md)

> Código do piloto (Fases 0–5 + residual UI/CTX) na branch.  
> **Deploy rules/indexes e QA de campo** ficam com outro desenvolvedor / ops.

---

## 1. Resumo executivo

| Prioridade | Implementado (código) | Parcial / ops (outro time) | Ausente código |
|------------|----------------------:|---------------------------:|---------------:|
| **P0** (piloto) | 10 | 2 (deploy + SYNC/QA) | 0 |
| **P1** | 5 | 0 | 0 |
| **P2** | 5 | 0 | 0 |
| **CLEAN** | 3 | 0 | 0 |

**Veredito código:** pronto para Gate. **Go/No-go** depende de deploy + assinaturas QA (fora desta lane).

---

## 2. Matriz P0 — obrigatório para piloto

| # | Item | Status | Pendência restante |
|---|------|--------|--------------------|
| 1 | Remover bypasses auth | ✅ | — |
| 2 | Auth + RBAC BFF + Claims | ✅ | Script backfill: `backend/scripts/backfillCustomClaims.ts` |
| 3 | Hierarquia Sociedade→CN→Unidade | ✅ piloto | CRUD multi-sociedade adiado |
| 4 | Seletor global header | ✅ | Mais telas ligadas ao GlobalContext |
| 5 | API caixa open/close/confirm | ✅ | — |
| 6 | Vendas/cobranças BFF + centavos | ✅ | Deploy rules (ops) |
| 7 | Idempotência | ✅ | — |
| 8 | Sync Manager | ✅ | Homologação campo (QA) |
| 9 | Auditoria UI | ✅ | Deploy índices (ops) |
| 10 | Cadastro + lista negra + unidades | ✅ | — |

### Critérios Gate (ops / QA — outro desenvolvedor)

- [ ] Deploy `firestore.rules` + indexes — [`DEPLOY-FIRESTORE-GATE.md`](./DEPLOY-FIRESTORE-GATE.md)
- [ ] SYNC-01 — [`SYNC-01-CHECKLIST-QA.md`](./SYNC-01-CHECKLIST-QA.md)
- [ ] QA regressivo — [`GATE-PILOTO-QA.md`](./GATE-PILOTO-QA.md)

---

## 3. Matriz P1 — importante

| # | Item | Status |
|---|------|--------|
| 1 | Lista negra | ✅ |
| 2 | Transfers BFF | ✅ |
| 3 | Hub relatórios | ✅ (async → P2) |
| 4 | Devices sync/log | ✅ |

---

## 4. Matriz P2 — desejável (próximo código)

| # | Item | Status |
|---|------|--------|
| 1 | Aprovações transfers | ✅ |
| 2 | SaaS billing / seguros | ✅ cobrança direta + faturas `saas_invoices`; seguros OK |
| 3 | Mass open/close | ✅ |
| 4 | Forms / feriados | ✅ |
| 5 | Fila assíncrona de relatórios | ✅ BFF `/api/reports/jobs` + UI no `ReportsHub` |

---

## 5. Fase 5 — limpeza

| ID | Status | Notas |
|----|--------|-------|
| CLEAN-01 | ✅ | `fmtCents` em `currency.ts` |
| CLEAN-02 | ✅ | `resolvePendingCents` |
| CLEAN-03 | ✅ | docs oficiais |

---

## 6. Dívidas técnicas

| Tema | Status |
|------|--------|
| Locales especiais (`es-CO` / `en-US` pontuais) | Mantidos de propósito |
| `formatToBRL` (unidade major) | Fora do `fmtCents` |
| Hardcoded stats Layout collector | ✅ removidos (zeros reais) |
| Demo stub `getDemoUser()` | Retorna `null` (modo demo off) |
| Seletor global em telas órfãs | ✅ BoxSummary, Summary, CloseBox, DeviceList, RouteList, EditDevice |
| Fila assíncrona de relatórios | P2 — próximo |

---

## 7. Ordem recomendada

**Esta lane (código):**
1. ~~P2-05 fila reports~~ ✅ · ~~P2-02 SaaS billing direto~~ ✅
2. Commit/PR no fim da sessão quando solicitado.

**Outro desenvolvedor:**
1. Deploy Firestore ([`DEPLOY-FIRESTORE-GATE.md`](./DEPLOY-FIRESTORE-GATE.md)).
2. QA Gate + SYNC-01.

---

## 8. Notas de execução

| Data | Nota |
|------|------|
| 27/08/2026 | Fases 0–5 + RBAC + audit parity + `usuario_unidades` UI. |
| 27/08/2026 | Pacote Gate docs (deploy/QA) — execução ops em outra lane. |
| 27/08/2026 | Dívidas: Layout stats + CTX gradual + script `backfillCustomClaims`. |
| 27/08/2026 | P2 fila reports: `reportRoutes` + `ReportsHub` async + rules/index `report_jobs`. |
| 27/08/2026 | P2 SaaS billing: `saas_invoices` + BFF mark-paid + MRR contratado no SuperAdmin. |

---

## 9. Checklist rápido

```
[x] SEC / FIN / CTX / AUTH / AUD / P1 (código)
[x] CLEAN-01/02/03
[x] UserList: usuario_unidades
[x] Layout stats sem fallbacks mágicos
[x] GlobalContext em telas-chave (BoxSummary, Summary, CloseBox, devices, routes)
[x] Script backfill claims
[x] P2 fila assíncrona de relatórios
[x] P2 SaaS billing (faturas manuais + MRR)
[ ] Deploy / SYNC-01 / QA Gate → outro desenvolvedor
```
