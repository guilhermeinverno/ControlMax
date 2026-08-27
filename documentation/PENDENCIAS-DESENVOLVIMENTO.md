# Pendências de Desenvolvimento — ControlMax (atualizado)

**Data da análise:** 27/08/2026  
**Base de código:** `main` @ `fcb1b0d` (após pull de 27 commits)  
**Fontes cruzadas:**
- [`docs/comparativo/backlog-piloto.md`](../docs/comparativo/backlog-piloto.md)
- [`docs/controlmax/14-roadmap.md`](../docs/controlmax/14-roadmap.md)
- [`docs/comparativo/funcionalidades-faltantes.md`](../docs/comparativo/funcionalidades-faltantes.md)
- [`docs/controlmax/AUDITORIA-CODIGO-V1.md`](../docs/controlmax/AUDITORIA-CODIGO-V1.md)
- [`docs/controlmax/RELATORIO-SYNC-INFRA-FASE1.5.md`](../docs/controlmax/RELATORIO-SYNC-INFRA-FASE1.5.md)

> Este documento **substitui a leitura literal** do `PlanoDePendencias.md` (jul/2026 — foco em deploy/Sonar) e da auditoria V1 (pré-BFF). Use-o como fonte atual de priorização.

---

## 1. Resumo executivo

| Prioridade | Implementado | Parcial | Ausente / aberto |
|------------|-------------:|--------:|-----------------:|
| **P0** (piloto) | 3 | 6 | 1 |
| **P1** | 2 | 2 | 1 |
| **P2** | 2 | 2 | 0 |

**Veredito:** o projeto avançou **muito** desde a auditoria V1 (BFF, Sync Manager, `sales`/`boxes` bloqueados no client). Ainda **não está pronto para piloto**: fallbacks client-side, Custom Claims ausentes, seletor global órfão e resíduos de bypass no frontend.

---

## 2. Matriz P0 — obrigatório para piloto

| # | Item (backlog / roadmap) | Status | Evidência | Pendência restante |
|---|--------------------------|--------|-----------|--------------------|
| 1 | Remover bypasses hardcoded de auth | 🟡 **PARCIAL** | Sem `ADMIN_BYPASS_EMAILS` clássicos; rules sem e-mails | Resíduos: `coletor.teste@controlmax.com` em `useTenantHelpers`; impersonação `gringoeletronica`/`controlmaxia` em `useTenantLink`; **auto-provision** no `Login.tsx` se Auth falhar; stub demo no Layout |
| 2 | Autenticação + RBAC no backend | 🟡 **PARCIAL** | `authMiddleware` valida JWT e lê `tenantId`/`role` do **Firestore** | **Custom Claims ausentes** (`setCustomUserClaims` não existe); RBAC só frontend (`rbac.ts`) + checks inline nas rotas |
| 3 | Hierarquia Sociedade → CN → Unidade | 🟡 **PARCIAL** | CN/Unidades OK; Sociedade = tenantId (CTX-03) | CRUD multi-sociedade adiado; menu Sociedades desabilitado |
| 4 | Seletor global de contexto (header) | ✅ **IMPLEMENTADO** | `GlobalContextSelector` + persistência sessionStorage; Dashboard/OpenBox | Gradual em demais telas |
| 5 | API caixa Abrir / Fechar / Confirmar | ✅ **IMPLEMENTADO** | `boxRoutes` open/close/confirm; testes integração | `boxLifecycle` open/close definidos mas **não usados** pela UI (fluxo via SyncManager) |
| 6 | Vendas e cobranças via BFF + centavos | ✅ **IMPLEMENTADO** (código) | BFF + Sync; rules `collections` create=false (`FIN-01`…`04`) | Deploy `firestore.rules` em homologação/produção |
| 7 | Idempotência financeira | ✅ **IMPLEMENTADO** | `requireIdempotencyKey` (FIN-04); body ou header; clients enviam ambos | — |
| 8 | Sync Manager / Offline | ✅ **IMPLEMENTADO** | IndexedDB, executors, `useOfflineSync`, badge, testes | Homologar em campo |
| 9 | Auditoria imutável (logs) | 🟡 **PARCIAL** | Backend grava `security_logs`/`audit_logs`; rules deny create client (`FIN-01`) | `securityLogger.ts` é stub UI; tela admin ainda com logs simulados (`AUD-01`) |
| 10 | Cadastro seguro + vínculo Unidade | 🟡 **PARCIAL** | CompanyList + customerCreate; `usuario_unidades` no BFF de boxes | Sem lista negra; VendedorMobile usa defaults `unit-demo`/`bc-demo` |

### Critérios de liberação do piloto (ainda abertos)

- [x] Motor financeiro principal no BFF (sale/collection/open/close/confirm)
- [x] Writes de `sales` / `boxes` / `collections` / `security_logs` bloqueados no client (`firestore.rules` no repo)
- [x] Sync Manager genérico + testes BFF/integração
- [x] Remover bypasses residuais (Login auto-provision, emails em `useTenantLink`, `coletor.teste`) — SEC
- [ ] Custom Claims (hoje role vem do doc Firestore no middleware)
- [x] Eliminar fallbacks client financeiros (payment / VendedorMobile / expenseSave) — FIN-02/03
- [x] Restringir `security_logs` create só ao Admin SDK — FIN-01 (deploy pendente)
- [x] Seletor global CN/Unidade no header — CTX-01
- [x] Sociedade = tenantId (menu desabilitado) — CTX-03
- [ ] Sociedade completa + `usuario_unidades` UI de edição em UserList (API já persiste)
- [ ] UI de auditoria real (não logs simulados do SuperAdmin)
- [ ] Deploy `firestore.rules` (FIN-01) em homologação/produção

---

## 3. Matriz P1 — importante

| # | Item | Status | Evidência | Notas |
|---|------|--------|-----------|-------|
| 1 | Lista negra de clientes | ❌ **AUSENTE** | Só chave `admin:lista_negra` em `Profiles.tsx` | Sem tela, rota ou coleção |
| 2 | Transferências financeiras básicas | ✅ **IMPLEMENTADO** | `BCTransfers.tsx` cria `bc_transfers` (pending), histórico, confirma/rejeita | Persistência ainda client→Firestore (rules `bc_transfers` write=false no client — **verificar inconsistência**) |
| 3 | Relatórios / Excel | 🟡 **PARCIAL** | Export **síncrono** XLSX em Dashboard, BoxSummary, PeriodSummary, financeMetrics | Menu “procesos encolados” aponta para `sales`; sem fila/catálogo assíncrono |
| 4 | Sync/log de dispositivos | ✅ **IMPLEMENTADO** | `DeviceList.tsx`, `useDeviceListData`, `lastSync` + `deviceTimeAgo` | Sem Excel dedicado de dispositivos |

---

## 4. Matriz P2 — desejável

| # | Item | Status | Evidência / nuance |
|---|------|--------|---------------------|
| 1 | Aprovações de transferências superiores | ✅ **IMPLEMENTADO** (em BCTransfers) | Aprovação de `bc_transfers` pending está **dentro de** `BCTransfers`. `BCApprovals` trata **gastos** + caixas fechadas — **naming desalinhado** no menu (“Aprobar transferencias” → `bc-approvals`) |
| 2 | Faturamento SaaS / seguros | 🟡 **PARCIAL** | Seguros: `Insurance.tsx` operacional. SaaS: SuperAdmin tem `billingStatus`/`plan` e aba plans com **simulador** (sem cobrança automática) |
| 3 | Abertura/fechamento massivo | 🟡 **PARCIAL** | `MassBoxOpening` + `openBoxesBatch` = **só abertura**. Menu “Cierre masivo” aponta para a **mesma** rota — fechamento massivo ausente |
| 4 | Formulários dinâmicos e feriados | ✅ **IMPLEMENTADO** | `Forms.tsx`, `Holidays.tsx`, rotas e menu |

---

## 5. Gaps TryController (comparativo)

| Gap | Status atual |
|-----|--------------|
| Seletor CN/Unidade no header | **Ausente** (GlobalContext órfão) |
| Central de relatórios assíncronos | **Ausente** (dropdown reusa `sales`/`statistics`/`performance`) |
| Lista negra / atividade econômica | **Ausente** |
| Logs de ações na UI admin | **Parcial** — `SuperAdminLogsTab` usa logs **simulados** (`createSimulatedTerminalLog`); menu “Log de Acciones” → `statistics` |
| Aprovações superiores | Implementado em `BCTransfers`; menu aponta para tela errada (`BCApprovals`) |

Detalhes: [`docs/comparativo/funcionalidades-faltantes.md`](../docs/comparativo/funcionalidades-faltantes.md).

---

## 6. Dívidas técnicas remanescentes

| Tema | Status | Arquivos |
|------|--------|----------|
| Dualidade `saldoPendiente` (string) + `saldoPendienteCents` | Ainda nos tipos/UI/seed; BFF de payment atualiza **só** cents | `types.ts`, `saleMapper.ts`, `seedDemoData.ts`, `transactionRoutes.ts` |
| `currency.ts` / `fmtCents` não unificados | Núcleo existe, mas há formatters locais paralelos | `fmt` em BCTransfers, `fmtFinanceValue`, `fmtTransferSales`, `formatToBRL`, `fmtCents` local em RegisterPayment |
| Fallback API → Firestore em cobranças | Risco de inconsistência / bypass de BFF | `registerPaymentTransaction.ts` |
| `collections` allow create no client | Exceção pós-fix “no-payment”, enfraquece P0 | `firestore.rules` |
| Demo mode stub | `getDemoUser()` → `null`, handler demo permanece | `Layout.tsx`, `firebase.ts` |
| Hardcoded stats no Layout collector | Fallbacks mágicos (`65`, `1007951`) | `Layout.tsx` |
| Naming menu aprovações | “Aprobar transferencias” → `bc-approvals` (gastos), não transfers | `LayoutDesktopNav.tsx` |

---

## 7. Ordem recomendada de trabalho (próximos sprints)

### Sprint A — fechar P0 restante (bloqueadores)
1. Remover auto-provision do Login e emails residuais de impersonação/bypass.
2. Fechar writes client: `collections` + `security_logs` create só via Admin SDK; remover fallbacks em `registerPaymentTransaction` / `VendedorMobile` / `expenseSave`.
3. Implementar UI do seletor global CN/Unidade no header (`GlobalContext`).
4. Adotar Custom Claims (ou documentar decisão de manter role no Firestore doc).
5. Alinhar `usuario_unidades` ↔ spec `assignedUnits` + camada Sociedade.
6. Expor tela admin de logs reais (`security_logs` / `audit_logs`).

### Sprint B — P1 piloto sustentável
1. Lista negra de clientes.
2. Centralizar exports (relatórios) além dos XLSX pontuais.
3. Migrar BCTransfers para BFF + corrigir naming do menu vs `BCApprovals`.
4. Fechamento massivo de caixas (hoje só abertura).

### Sprint C — limpeza e paridade
1. Eliminar campos monetários legados sem `Cents` e unificar `fmtCents`.
2. Remover código demo/impersonação e defaults `unit-demo`/`bc-demo`.
3. Atualizar `backlog-piloto.md` e `14-roadmap.md` marcando itens concluídos.

---

## 8. O que a auditoria V1 já não se aplica

| Afirmação antiga (AUDITORIA-CODIGO-V1) | Situação em 27/08/2026 |
|----------------------------------------|-------------------------|
| “BFF de vendas/recebimentos inexistente” | ❌ Obsoleto — `transactionRoutes.ts` existe |
| “Sync Manager não implementado” | ❌ Obsoleto — FASE 1.5 entregue |
| “E-mails hardcoded nas rules” | ❌ Obsoleto nas rules — **ainda há resíduos** no frontend (`useTenantLink`, Login auto-provision) |
| “Writes de sales/boxes pelo client” | ❌ Obsoleto nas rules — **collections e security_logs ainda permitem create** |
| “Sem idempotência” | ❌ Obsoleto — `idempotency_keys` + testes |
| “Só proxy Gemini + confirm box no backend” | ❌ Obsoleto — boxes + transactions + admin |
| “Sem testes BFF” | ❌ Obsoleto — `bff.test.ts` + `auditoriaIntegracao.test.ts` |

---

## 9. Relação com outros documentos

| Documento | Papel |
|-----------|-------|
| Este arquivo | Diagnóstico atual das pendências pós-pull |
| [`PLANO-DESENVOLVIMENTO.md`](./PLANO-DESENVOLVIMENTO.md) | **Plano executável** (fases, IDs, DoD, timeline) |
| `PlanoDePendencias.md` | Histórico jul/2026 (deploy/QA) — não usar como backlog de produto |
| `docs/controlmax/14-roadmap.md` | Priorização oficial P0–P3 (atualizar checkboxes) |
| `docs/comparativo/backlog-piloto.md` | Checklist piloto — marcar itens concluídos na próxima revisão |

### Notas de execução

| Data | Nota |
|------|------|
| 27/08/2026 | Fase 0 completa: `SEC-01` + `SEC-02` + `SEC-03`. Próximo: `FIN-02`. |
| 27/08/2026 | `FIN-02` concluído: sem write client em `collections` no fluxo de pagamento; visita `amount=0` no BFF; SyncManager no offline. Próximo: `FIN-03`/`FIN-04`. |
| 27/08/2026 | `FIN-03` concluído: BFF expense/income/approval; UI de egreso/ingresso/aprovações e venda mobile sem writes financeiros client. Próximo: `FIN-04` → `FIN-01`. |
| 27/08/2026 | `FIN-04` concluído: idempotencyKey obrigatória em boxes + transactions; testes BFF sem chave → 400. Próximo: `FIN-01`. |
| 27/08/2026 | `FIN-01` concluído no repo: rules deny create/update/delete em `collections` e `security_logs`; testes rules atualizados. **Próximo: deploy rules + Fase 2 (`CTX-01`).** |
| 27/08/2026 | Fase 2 concluída: CTX-01 seletor global; CTX-02 `usuario_unidades` + BFF open; CTX-03 Sociedade=tenant. Ver `DECISOES-FASE2-CONTEXTO.md`. Próximo: branch commit + Fase 3. |

---

## 10. Checklist rápido para o time

```
[x] Remover auto-provision Login + emails residuais (useTenantLink / coletor.teste) — SEC-01/02
[x] Remover fallback payment → BFF + Sync only — FIN-02
[x] Remover fallbacks financeiros restantes (VendedorMobile / expenseSave / income / BC) — FIN-03
[x] Idempotência obrigatória no BFF e clients — FIN-04
[x] Bloquear create client em collections e security_logs (rules no repo) — FIN-01
[x] Seletor CN/Unidade no header — CTX-01
[x] Escopo unidade no BFF (`usuario_unidades`) — CTX-02
[x] Decisão Sociedade = tenantId — CTX-03
[ ] Deploy firestore.rules em homologação/produção
[ ] Custom Claims (ou decisão formal Firestore-role)
[ ] usuario_unidades: UI de edição na UserList
[ ] Tela de logs de auditoria reais
[ ] Lista negra (P1)
[ ] Fechamento massivo de caixas
[ ] Homologação offline SyncManager em dispositivo real
[ ] Atualizar backlog-piloto.md com status ✅
```
