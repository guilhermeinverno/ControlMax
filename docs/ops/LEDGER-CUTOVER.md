# ENT-09 — Cutover double-entry (ledger)

## Pré-requisitos

1. Sombra estável em homolog: `GET /api/transactions/ledger/reconcile/:boxId` → `deltaCents === 0`.
2. Periodo **dual** recomendado: `LEDGER_MODE=dual` (grava shadow + canonical).
3. Após cutover amostral OK: `LEDGER_MODE=canonical` (novos writes sem sombra).

## Endpoints

| Método | Rota | Quem |
|--------|------|------|
| GET | `/api/transactions/ledger/reconcile/:boxId` | gestores |
| GET | `/api/transactions/ledger/balance/:boxId` | gestores |
| POST | `/api/transactions/ledger/cutover/:boxId` | admin/gerente/director |

### Cutover body

```json
{ "dryRun": true }
{ "dryRun": false }
{ "force": true }
```

- `dryRun`: valida elegibilidade sem gravar.
- Sem `force`: **409** se `deltaCents !== 0`.
- Sucesso: `boxes/{id}` ganha `balanceSource: "ledger"`, `ledgerCutoverAt`, alinha `finalAmount` ao net do ledger.

## Env

```bash
LEDGER_MODE=shadow      # default ENT-02
LEDGER_MODE=dual        # homolog cutover
LEDGER_MODE=canonical   # sombra off (novos lançamentos)
```

## Notas

- Coleção continua `ledger_shadow` (nome histórico); campo `mode` = `shadow` \| `canonical`.
- Mutações financeiras ainda atualizam documentos `boxes`/`sales` (híbrido seguro). Cutover marca a **fonte de verdade do saldo** do caixa.
- Client write em `ledger_shadow` permanece **deny**.
