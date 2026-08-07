# 2. Requisitos Funcionais

Este documento detalha os requisitos funcionais essenciais (RF) para o Piloto do ControlMax.

### MODELO FINANCEIRO DO PILOTO
**O PILOTO SUPORTA:**
- Saldo devedor único (`balanceCents`).
- Registro de venda/crédito.
- Registro de pagamento (abatimento direto do saldo).
- Controle de caixa, fechamento e confirmação.
- Auditoria.

**O PILOTO NÃO DEFINE:**
- Motor completo de juros, mora e multas.
- Amortização complexa ou regras avançadas de parcelamento. (Implementação futura).

---

## RF01: Contexto de Navegação e Hierarquia
- **Objetivo:** Operações limitadas à Unidade selecionada.
- **Processamento:** O usuário escolhe no seletor global uma das unidades às quais foi atribuído (ver `assignedUnits`). `[FONTE: TRYCONTROLLER]`

## RF02: Abertura e Fechamento de Caixa
- **Objetivo:** Iniciar e encerrar o turno financeiro de um cobrador.
- **Atores:** Collector.
- **Efeitos Financeiros:** Congela totais de `collections` e `sales`.
- **Restrição:** É proibida a alteração manual do saldo inicial de um caixa por terceiros (Admins) para corrigir falhas. Toda correção exige trânsito contábil (Ingreso/Egreso justificado). `[DECISÃO ARQUITETURAL]`

## RF03: Registro de Venda/Crédito
- **Pré-condições:** Caixa `open`. Cliente não está na Lista Negra.
- **Efeitos Financeiros:** Cria o saldo devedor (`balanceCents`) e subtrai dinheiro físico do caixa (`salesCents`). `[FONTE: CONTROLMAX]`

## RF04: Registro de Pagamento (Coleção)
- **Pré-condições:** Caixa `open`. Dívida existente.
- **Efeitos Financeiros:** Abate o saldo devedor (`balanceCents`) e soma ao caixa físico (`collectionsCents`). `[FONTE: CONTROLMAX]`

## RF05: Confirmação de Caixa
- **Objetivo:** Supervisor audita e sela o turno.
- **Atores:** Supervisor, Admin.
- **Processamento:** Altera o status de `closed` para `confirmed` via chamada à API protegida. Congela todas as operações vinculadas.
