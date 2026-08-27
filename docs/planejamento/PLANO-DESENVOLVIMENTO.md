# Plano de Desenvolvimento — ControlMax

**Versão:** 1.1  
**Data:** 27/08/2026  
**Base:** [`PENDENCIAS-DESENVOLVIMENTO.md`](./PENDENCIAS-DESENVOLVIMENTO.md) · [`guia-controlmax.md`](./guia-controlmax.md) · [`ARQUITETURA-SSOT.md`](../arquitetura/ARQUITETURA-SSOT.md)  
**Objetivo:** (A) fechar **Gate Piloto** (ops/QA); (B) executar evolução **Enterprise** do guia (§5–§6).

---

## 0. Como usar este plano

| Campo | Significado |
|-------|-------------|
| **ID** | Identificador estável da entrega |
| **Esforço** | S ≤ 1d · M 2–3d · L 4–5d · XL > 1 semana |
| **Depende** | Precisa estar pronto antes |
| **DoD** | Definition of Done |

**Regra de ouro:** integridade financeira e BFF+Sync > limpeza Sonar. Conflito → `// PILOT-REGRESSION`.

**Fontes:** [`14-roadmap.md`](../controlmax/14-roadmap.md) · [`backlog-piloto.md`](../comparativo/backlog-piloto.md) · [`guia-controlmax.md`](./guia-controlmax.md)

---

## 1. Visão das fases

```
Fases 0–5   Piloto (SEC/FIN/CTX/AUTH/AUD/P1/CLEAN)     ✅ código
Gate        Deploy rules + SYNC-01 + QA regressivo     🟡 ops/QA
Fase 6      Enterprise (Zod ✅ Ledger ✅ RL ✅)           ✅
Fase 7+     Claims ✅ / Sync testes ✅ / audit BI        🟡 ENT-08 próximo
Fase 8      Terraform / RAG / cutover ledger           ⬜
```

| Fase | Meta | Status |
|------|------|--------|
| **0–5** | Piloto seguro + P1/P2 + limpeza | ✅ código |
| **Gate** | Go/No-go produção piloto | 🟡 checklists prontos; execução externa |
| **6** | Zod + ledger sombra + rate limit | ✅ |
| **7** | Revogação claims, Sync conflict tests, audit dashboards | 🟡 `ENT-04`/`ENT-05` ✅ · `ENT-08` ⬜ |
| **8** | Terraform, RAG condicional, cutover double-entry | ⬜ |

---

## 2. Gate Piloto — checklist Go / No-go

```
[x] SEC-01 … SEC-03
[x] FIN-01 (código) … FIN-04
[x] CTX-01 … CTX-03
[x] AUTH-01 · AUD-01
[x] P1-01 … P1-05 · CLEAN-01 … CLEAN-03
[ ] Deploy firestore.rules + indexes — DEPLOY-FIRESTORE-GATE.md
[ ] SYNC-01 — SYNC-01-CHECKLIST-QA.md
[ ] QA regressivo — GATE-PILOTO-QA.md
```

---

## 3. Fase 6 — Enterprise hardening (pós-gate / homolog)

Fonte: `guia-controlmax.md` §5–§6. Não bloqueia o Go do piloto; pode iniciar em homolog em paralelo ao QA.

### 3.1 Zod nos DTOs do BFF
| | |
|--|--|
| **ID** | `ENT-01` |
| **Status** | ✅ (27/08/2026) |
| **Esforço** | M |
| **Arquivos** | `schemas/*`, `middleware/validateBody.ts`, `transactionRoutes`, `boxRoutes`, `adminRoutes` |
| **DoD** | Rotas P0 rejeitam body inválido sem tocar Firestore; happy paths intactos. |

### 3.2 Ledger append-only (modo sombra)
| | |
|--|--|
| **ID** | `ENT-02` |
| **Status** | ✅ (27/08/2026) |
| **Esforço** | L–XL |
| **Depende** | `ENT-01` |
| **Arquivos** | `services/ledgerService.ts`, `transactionRoutes`, `boxRoutes`, `firestore.rules`, `firestore.indexes.json` |
| **DoD** | 100% das ops financeiras geram evento; reconcile `deltaCents===0` em amostra de homolog. |

### 3.3 Rate limiting
| | |
|--|--|
| **ID** | `ENT-03` |
| **Status** | ✅ (27/08/2026) |
| **Esforço** | M |
| **Arquivos** | `middleware/rateLimit.ts`, `server.ts`, `assistantRoute.ts` |
| **DoD** | 429 tipado (`RATE_LIMIT_EXCEEDED` + `Retry-After`); smoke assistente + collection. |
| **Notas** | In-memory por instância. Env: `RATE_LIMIT_GEMINI`, `RATE_LIMIT_FINANCIAL`, `RATE_LIMIT_DISABLED`. Redis = follow-up multi-instância. |

---

## 4. Fase 7 — Segurança de sessão & Sync & Audit BI

| ID | Entrega | Esforço | Trabalho / DoD |
|----|---------|---------|----------------|
| `ENT-04` | Revogação claims / force refresh | M | ✅ `revokeRefreshTokens` + `verifyIdToken(..., true)` + FE `getIdToken(true)` / retry `CLAIMS_STALE` |
| `ENT-05` | Testes conflito SyncManager | M | ✅ suite + retry 5xx/429 + auto-sync online; 409 → FAILED |
| `ENT-08` | Dashboards `audit_logs` | L | Agregações por usuário/período/ação; export. |

---

## 5. Fase 8 — Escala

| ID | Entrega | Esforço | Depende | DoD |
|----|---------|---------|---------|-----|
| `ENT-06` | Terraform / IaC | XL | Gate estável | Staging aplicável via IaC |
| `ENT-07` | RAG assistente | XL | Métricas custo/latência contexto bruto | Só se KPI exigir |
| `ENT-09` | Cutover double-entry | XL | `ENT-02` estável | Saldos do ledger; sombra off |

---

## 6. Board rápido

**Piloto**
- [x] SEC / FIN / CTX / AUTH / AUD / P1 / CLEAN (código)
- [ ] Deploy rules/indexes
- [ ] SYNC-01 assinado
- [ ] QA Gate

**Enterprise**
- [x] `ENT-01` Zod
- [x] `ENT-02` Ledger sombra
- [x] `ENT-03` Rate limit
- [x] `ENT-04` Revogação claims
- [x] `ENT-05` Testes Sync conflito
- [ ] `ENT-08` Audit analytics
- [ ] `ENT-06` Terraform
- [ ] `ENT-07` RAG (condicional)
- [ ] `ENT-09` Ledger cutover

---

## 7. Próximo passo imediato

1. **Ops/QA:** Gate (deploy rules/indexes incl. `ledger_shadow` → QA → SYNC-01).  
2. **Dev:** `ENT-08` dashboards `audit_logs` (ou ops `ENT-06`).

---

## 8. Critérios de qualidade por PR (ENT-* e residual)

1. `frontend`: `npm run lint` + `npm test`  
2. `backend`: `npm test` / `npm run build`  
3. Sem write financeiro client; sem bypass auth  
4. Atualizar este plano + `PENDENCIAS-DESENVOLVIMENTO.md`  
5. Notas de teste manual no PR  

---

## Apêndice — Fases 0–5 (histórico, código ✅)

| ID | Entrega | Status |
|----|---------|--------|
| `SEC-01`…`03` | Login, hardcodes, demo mobile | ✅ |
| `FIN-01`…`04` | Rules deny + BFF/Sync + idempotência | ✅ código (deploy rules 🟡) |
| `CTX-01`…`03` | Seletor, usuario_unidades, Sociedade | ✅ |
| `AUTH-01` | Claims + ADR-001 | ✅ |
| `AUD-01` | AuditLogs UI | ✅ |
| `SYNC-01` | Homologação offline | 🟡 checklist / QA |
| `P1-01`…`05` | Blacklist, transfers, menus, mass close, reports hub | ✅ |
| `CLEAN-01`…`03` | fmtCents, resolvePendingCents, docs | ✅ |
