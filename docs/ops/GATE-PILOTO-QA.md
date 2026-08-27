# Gate Piloto — Roteiro QA regressivo

**Status:** pronto para execução (após deploy rules/indexes)  
**Data:** 27/08/2026  
**Branch:** `merged-dev-fabio`  
**Ordem oficial:**

1. [`DEPLOY-FIRESTORE-GATE.md`](./DEPLOY-FIRESTORE-GATE.md) — rules + indexes  
2. Este roteiro — regressivo funcional  
3. [`SYNC-01-CHECKLIST-QA.md`](./SYNC-01-CHECKLIST-QA.md) — offline SyncManager  

---

## Contas / dados mínimos

| Papel | Precisa |
|-------|---------|
| Collector | `usuario_unidades` com ≥1 unidade; pode abrir caixa |
| Supervisor/Admin | confirmar caixa; ver AuditLogs; editar usuários |
| Tenant B (opcional) | segundo tenant para teste de isolamento |

Build: commit/hash anotado no resultado. Ambiente: homolog preferencial.

---

## 0. Pré-Gate (bloqueante)

- [ ] Suite Emulator: `firestore.rules.test.ts` + testes BFF/idempotência (`DEPLOY-FIRESTORE-GATE.md` §1.1)
- [ ] Deploy rules + indexes concluído (tabela em `DEPLOY-FIRESTORE-GATE.md`)
- [ ] BFF `/api` acessível (local ou Cloud Run)
- [ ] Login **sem** auto-provision (email inexistente → erro, sem criar user)
- [ ] Conferir relatório de saúde / fixes TS em [`PENDENCIAS-DESENVOLVIMENTO.md`](../planejamento/PENDENCIAS-DESENVOLVIMENTO.md) §2.1

---

## 1. Contexto e escopo (CTX)

1. [ ] Header: seletor CN / Unidade aparece e persiste (reload).
2. [ ] Collector com 1 unidade: não consegue selecionar unidade fora de `usuario_unidades`.
3. [ ] UserList → **Editar unidades** → salvar → novo login (ou refresh token) reflete o escopo.
4. [ ] Tentativa de abrir caixa em unidade não atribuída → BFF **403** / mensagem clara (sem dead-end).

---

## 2. Caixa — open / close / confirm

1. [ ] **Open:** `POST` BFF; doc `boxes` com `status: open`, `unitId`, centavos iniciais.
2. [ ] Movimentar (pelo menos 1 collection ou income/expense via UI).
3. [ ] **Close:** totais coerentes (`finalAmount` / campos em centavos).
4. [ ] **Confirm** (supervisor): caixa `confirmed`; collector não confirma.
5. [ ] Pós-confirm: ajuste/estorno negado se regra vigente exigir.

---

## 3. Venda + cobrança + visita

### 3.1 Venda (online)
1. [ ] Cliente ativo, não blacklist → venda via BFF.
2. [ ] Caixa `totalSales` / saldo cliente atualizados em **centavos**.
3. [ ] Cliente em lista negra → bloqueio na venda.

### 3.2 Pagamento (online)
1. [ ] RegisterPayment → confirmação → sucesso.
2. [ ] Erro BFF: modal **não** fecha; toast/erro legível; Cancelar/Voltar disponíveis.
3. [ ] `collections` criado só via BFF; saldo pendente da venda ↓.

### 3.3 Visita sem pagamento
1. [ ] Modo no-payment → collection `amount`/`amountCents` = 0 + motivo.
2. [ ] Sem alteração indevida de saldo (ou conforme regra de visita).

---

## 4. Multi-tenant

1. [ ] User tenant A **não** lista/edita customers/sales/boxes de tenant B.
2. [ ] AuditLogs filtrado só pelo `tenantId` da sessão.
3. [ ] Platform settings de A não alteram B.

---

## 5. Auditoria e RBAC

1. [ ] Editar cliente → entrada `audit_logs` action `UPDATE` entity `customers`.
2. [ ] Estorno com `reason` → `REVERSAL`.
3. [ ] Alterar role/user/units → log `users`/`roles`.
4. [ ] Sem permissão: botão desabilitado + tooltip *“Você não possui permissão…”* (ou 403 do BFF sem fechar modal).

---

## 6. Transfers / mass (smoke P1)

1. [ ] BC transfer via BFF (se usado no piloto).
2. [ ] Mass open ou mass close: lote OK ou erro parcial legível (sem tela travada).

---

## 7. Critérios Go / No-go

| Critério | Go |
|----------|-----|
| Sem write client em `collections`/`sales`/`boxes` | obrigatório |
| Open/close/confirm OK | obrigatório |
| Sale + payment + no-payment OK | obrigatório |
| Isolamento tenant OK | obrigatório |
| AuditLogs com eventos reais | obrigatório |
| SYNC-01 assinado | obrigatório |
| Bugs P0 abertos | **No-go** |

---

## Resultado

| Campo | Valor |
|-------|--------|
| Testador | |
| Ambiente | homolog / prod |
| Data | |
| Build / commit | |
| Deploy rules/indexes | SIM / NÃO |
| Resultado Gate | **GO** / **NO-GO** |
| Notas / bugs | |

Assinatura QA: ______________________

---

## Encadeamento SYNC-01

Após §1–§5 online OK, executar e assinar o checklist offline em [`SYNC-01-CHECKLIST-QA.md`](./SYNC-01-CHECKLIST-QA.md).  
Gate só fecha com **este arquivo + SYNC-01** assinados.
