# 6. Regras de Negócio

## O Modelo Financeiro do Piloto
### O PILOTO SUPORTA
- Registro de vendas, pagamentos e estornos atuando de forma simples sobre um saldo devedor global em centavos.
- O fechamento do caixa e confirmação consolida o valor recebido e abate do saldo.
- Auditoria irrefutável.

### O PILOTO NÃO DEFINE
- Motor completo de juros, mora e multas.

---

## RN01: O Paradigma dos Centavos
Toda regra que envolve valor monetário DEVE ser processada e persistida em inteiros (`Cents`).

## RN02: Máquina de Estado do Caixa e Imutabilidade
- Progressão rígida: `open` ➔ `closed` ➔ `confirmed`.
- **Alteração Indevida:** Um administrador NÃO poderá alterar arbitrariamente valores financeiros de um caixa via update de banco. Correções deverão ser executadas através de `/api/transactions/adjustment` (Egreso/Ingreso com justificativa). `[DECISÃO ARQUITETURAL]`

## RN03: Proibição de Exclusão (Estorno)
- Nenhum registro financeiro (Venda, Pagamento, Ingresso, Egresso) pode ser fisicamente deletado do banco de dados (DELETE).
- Casos de erros operacionais são resolvidos unicamente por **Estorno** (`/api/transactions/reversal`), o qual gera uma transação de anulação, reverte os saldos e marca o status original como `reversed`. Não é possível estornar duas vezes a mesma operação.

## RN04: Restrição Hierárquica Multitenant
- Isolamento absoluto: Usuários não enxergam dados fora de sua Sociedade/Tenant. O `tenantId` é chave obrigatória em TODAS as coleções e lido do token Auth do usuário.

## RN05: Concorrência e Idempotência
- Toda requisição financeira exige `idempotencyKey` única.
- Transações com a mesma chave em intervalo curto são ignoradas com sucesso pelo BFF.
