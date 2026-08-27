# Backlog do Piloto

Baseado na classificação de prioridades (P0), este é o backlog técnico e funcional que o novo ControlMax deve obrigatoriamente possuir para permitir a operação em produção da primeira filial piloto.

> Atualizado em 27/08/2026 — status alinhado a `documentation/PLANO-DESENVOLVIMENTO.md`.

## Módulo de Identidade e Acesso
- [x] Implementar hierarquia organizacional estrita (`Sociedade → CN → Unidade`) — piloto: Sociedade ≡ `tenantId` (CTX-03); CN/Unidade OK.
- [x] Refatorar autenticação para remover hardcoded bypasses (`gringoeletronica`, modos demo) — SEC-01/02.
- [x] Garantir seletor global de contexto de navegação na UI superior — CTX-01.
- [x] Custom Claims no Auth + middleware BFF — AUTH-01 / ADR-001.
- [x] UI de edição de `usuario_unidades` no UserList (API admin já persiste).
- [ ] Deploy `firestore.rules` + indexes em homologação/produção.
- [ ] Homologação Sync Manager offline em dispositivo (SYNC-01) + QA regressivo.

## Módulo Financeiro e Caixas
- [x] Implementar abertura de caixa vinculada estritamente à Unidade e Usuário — BFF `/api/boxes/open` + CTX-02.
- [x] Implementar fechamento de caixa (cálculo de saldo final baseado nas transações do dia) — BFF `/close`.
- [x] Desenvolver rota protegida de backend e UI de bloqueio para o passo de **Confirmação de Caixa** por supervisores — BFF `/confirm`.
- [x] Transferência de saldos (básica) entre caixas/CN — `bc-transfer` BFF (P1-02).
- [x] Abertura/fechamento massivo via BFF — `open-batch` / `close-batch` (P1-04).

## Vendas e Créditos
- [x] Cadastro seguro de novos clientes e vinculação à Unidade.
- [x] Emissão de novas Vendas (Créditos) debitando do Caixa aberto — BFF `/sale` + Sync.
- [x] Registro de Pagamentos (Coleções) creditando o Caixa aberto — BFF `/collection` + Sync.
- [x] Lista negra de clientes com bloqueio na venda — P1-01.

## Segurança e Auditoria
- [x] Sub-sistema de `Audit Logs` imutável (Admin SDK) + tela `AuditLogs` (AUD-01).
- [x] Writes financeiros bloqueados no client (`sales`/`boxes`/`collections`/`security_logs`) — FIN-01 (código; deploy pendente).
- [x] Idempotência financeira obrigatória — FIN-04.
