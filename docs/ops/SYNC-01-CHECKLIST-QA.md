# SYNC-01 — Homologação SyncManager (dispositivo real)

**Status:** checklist pronto para QA de campo  
**Data:** 27/08/2026  
**Gate:** executar **depois** do deploy ([`DEPLOY-FIRESTORE-GATE.md`](./DEPLOY-FIRESTORE-GATE.md)) e em paralelo/após o regressivo online ([`GATE-PILOTO-QA.md`](./GATE-PILOTO-QA.md)).

**Pré-requisitos:** app build da branch atual (`merged-dev-fabio`), usuário collector com caixa aberta, rede controlável (modo avião), BFF acessível quando online.

## Roteiro

### A. Pagamento offline → online
1. [ ] Abrir caixa e ir a uma venda ativa.
2. [ ] Ativar **modo avião**.
3. [ ] Registrar pagamento (valor > 0).
4. [ ] Confirmar toast de **enfileirado** / badge Sync com item pendente.
5. [ ] Desligar modo avião.
6. [ ] Aguardar badge processar (ou pulsar sync).
7. [ ] Validar no Firestore: doc em `collections` + saldo da venda atualizado + totais do caixa.

### B. Visita sem pagamento (amount = 0)
1. [ ] Modo avião → registrar visita “sem pagamento”.
2. [ ] Voltar online → fila processa.
3. [ ] Validar collection com `amount: 0` e comentário da visita.

### C. Venda mobile offline
1. [ ] Em `vendedor-mobile`, modo avião → nova venda.
2. [ ] Confirmar enfileiramento (`sale` no IndexedDB / badge).
3. [ ] Online → venda criada via BFF; caixa `totalSales` coerente.

### D. Idempotência / duplo enqueue
1. [ ] Offline: registrar o **mesmo** pagamento duas vezes rapidamente (se a UI permitir) **ou** reenviar item da fila.
2. [ ] Online: no máximo **um** efeito financeiro (saldo/caixa); segunda chamada retorna cache de idempotência ou não duplica.

### E. Falha de rede parcial (5xx)
1. [ ] Com proxy/devtools, forçar 503 em `/api/transactions/collection`.
2. [ ] Confirmar enqueue + retry bem-sucedido quando API voltar.

## Critérios de aceite (DoD)
- [ ] Nenhum write client direto em `collections` / `sales` / `boxes` durante o roteiro.
- [ ] Sem perda silenciosa de operações da fila.
- [ ] Bugs críticos (perda de dinheiro, duplicata de saldo) corrigidos ou registrados com severidade.

## Resultado do teste

| Campo | Valor |
|-------|--------|
| Testador | |
| Dispositivo / browser | |
| Data | |
| Build / commit | |
| Ambiente | homolog / prod |
| Resultado | PASS / FAIL |
| Notas | |

Assinatura QA: ______________________
