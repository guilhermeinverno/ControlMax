# Guia de Funcionalidades e Evolução Arquitetural — ControlMax

Documento consolidado com o ecossistema de funcionalidades já entregues no ControlMax e o plano de evolução para maturidade SaaS Enterprise.

**Fontes cruzadas:** [`ARQUITETURA-SSOT.md`](../arquitetura/ARQUITETURA-SSOT.md) · [`PENDENCIAS-DESENVOLVIMENTO.md`](./PENDENCIAS-DESENVOLVIMENTO.md) · [`PLANO-DESENVOLVIMENTO.md`](./PLANO-DESENVOLVIMENTO.md)

---

## 1. Mapeamento de Funcionalidades Existentes

### 1.1 Núcleo Operacional e Financeiro
* **Gestão de Caixas (BFF + Sync):** Abertura, fechamento, confirmação e resumos. Fluxo controlado pelo servidor (`/api/boxes/*`) com SyncManager offline.
* **Motor de Vendas e Cobranças:** Vendas, pagamentos, visitas *no-payment* e estornos via `/api/transactions/*`.
* **Garantia de Centavos:** Inteiros em todo o pipeline; exibição via `fmtCents` / `currency.ts`.
* **Idempotência:** `X-Idempotency-Key` + body em mutações financeiras.

### 1.2 Resiliência e Operação Offline
* **Sync Manager (IndexedDB):** Fila `openBox` / `closeBox` / `sale` / `payment` / … → executors → BFF.
* **Indicadores:** `SyncStatusBadge` na UI.

### 1.3 Entidades e Administração
* **Multi-tenant:** `tenantId` + `firestore.rules`.
* **Hierarquia:** CN / unidades; `usuario_unidades` (UI no UserList).
* **Clientes, formulários, feriados:** cadastro, builder, calendário operacional.
* **RBAC dinâmico:** `tenant_roles` + PermissionMatrix + `RoleManagement`.
* **Auditoria:** `audit_logs` + `logAuditEvent` + tela `AuditLogs`.
* **Lista negra, transfers BFF, mass open/close, hub reports + jobs async, SaaS billing** (`saas_invoices`).

### 1.4 Assistente IA
* **Voz/texto:** `POST /api/gemini/assistant` com contexto operacional do tenant.

---

## 2. Matriz do Ecossistema Atual vs. Evolução Enterprise

| Módulo | Estado Atual | Evolução Enterprise |
| :--- | :--- | :--- |
| **Segurança & RBAC** | ✅ Matriz + claims + **revogação de sessão** (`ENT-04`) | — |
| **Auditoria** | ✅ `audit_logs` + diff + UI | Dashboards analíticos / detecção de anomalias |
| **Arquitetura financeira** | ✅ Ledger sombra (`ledger_shadow`) paralelo | Cutover double-entry (`ENT-09`) |
| **Validação** | ✅ **Zod** nos DTOs P0 do BFF (`ENT-01`) | Expandir schemas às demais rotas |
| **Infra** | Vercel front + Node/Functions back + **rate limit in-memory** (`ENT-03`) | Terraform + Redis se multi-instância |
| **IA** | Contexto bruto → Gemini | Medir custo/latência → RAG só se necessário (§5.6) |
| **Sync offline** | ✅ Fila + idempotência + **retry 5xx** + auto-sync online (`ENT-05`) | — |

---

## 3. Referência de estruturas já em produção

### 3.1 RBAC (`tenant_roles`) — implementado
Ver `frontend/src/types/rbac.ts` / `backend/permissionMatrix.ts` e SSOT §3.1.  
Hooks: `useHasPermission`, `useTenantRoles`. BFF: `/api/admin/roles`.

### 3.2 Auditoria (`audit_logs`) — implementado
Ver `frontend/src/types/audit.ts` / `backend/auditLog.ts` / `services/auditService.ts`.  
`reason` obrigatório em estorno/override.

### 3.3 Ledger sombra (`ledger_shadow`) — ENT-02

Append-only paralelo ao estado por documento. **Não** substitui `boxes`/`sales` até cutover (`ENT-09`).

```
LedgerShadowEntry {
  tenantId, transactionId, debitAccount, creditAccount, amountCents,
  source, boxId?, saleId?, mode: "shadow", timestamp
}
```

Serviço: `backend/services/ledgerService.ts` (`setLedgerShadowInTransaction`, `reconcileBoxShadow`).  
Reconcile: `GET /api/transactions/ledger/reconcile/:boxId`.  
Client write = **deny** (igual `audit_logs`).

Rollout: sombra → homologar delta=0 → `ENT-09` cutover.
---

## 4. Diretrizes UX & Resilience (becos sem saída)

1. Erros BFF **não** fecham modais; preservar estado digitado.
2. Listagens vazias/erro com ação clara (“Tentar novamente”, “Criar”, “Limpar filtros”).
3. `ErrorBoundary` local em rotas críticas.
4. Mutações destrutivas / estorno com `reason` → auditoria.

*(Parcialmente aplicado em RegisterPayment, CompanyList, PlatformManagement, etc.)*

---

## 5. Riscos priorizados (produção)

| ID | Risco | Prioridade |
|----|--------|------------|
| 5.1 | Sem ledger; race em caixas concorrentes | ✅ mitigado com sombra (`ENT-02`); cutover = `ENT-09` |
| 5.2 | DTOs sem Zod | ✅ mitigado nos P0 (`ENT-01`); expandir demais rotas |
| 5.3 | Sem rate limit em `/api/gemini/*` e finanças | ✅ mitigado in-memory (`ENT-03`); Redis se multi-instância |
| 5.4 | Claims em cache no token até refresh | ✅ mitigado (`ENT-04`: revoke + checkRevoked + force refresh) |
| 5.5 | Poucos testes de conflito SyncManager | ✅ mitigado (`ENT-05`: suite + retry 5xx/429 + online auto) |
| 5.6 | Contexto Gemini bruto pode escalar custo | Média (medir antes de RAG) |

---

## 6. Roadmap de evolução (pós Gate Piloto)

Ordem sugerida (alinhada a `PLANO-DESENVOLVIMENTO.md` Fase 6+):

1. ~~**ENT-01** Validação Zod nos DTOs do BFF~~ ✅  
2. ~~**ENT-02** Ledger append-only em modo sombra~~ ✅  
3. ~~**ENT-03** Rate limiting (financeiro + assistente)~~ ✅  
4. ~~**ENT-04** Claims: force refresh / revogação de sessão~~ ✅  
5. ~~**ENT-05** Testes de conflito SyncManager~~ ✅  
6. **ENT-06** Terraform / IaC (ops)  
7. **ENT-07** RAG no assistente (só se métricas de 5.6 exigirem)

**Pré-requisito externo:** deploy rules/indexes + SYNC-01 + QA Gate (outro time).
