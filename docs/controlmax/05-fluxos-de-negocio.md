# 5. Fluxos de Negócio e Financeiros

Este documento descreve detalhadamente o fluxo financeiro principal. As regras seguem a marcação estabelecida: `[FONTE: TRYCONTROLLER]`, `[FONTE: CONTROLMAX]`, `[INFERÊNCIA]` e `[NÃO DOCUMENTADO]`.

## 5.1 Fluxo Macro Financeiro: Do Cliente ao Fechamento

### Etapa 1: Cliente e Venda/Crédito
- **Cadastro:** O trabalhador cria o cadastro de um novo cliente, vinculando atividade econômica e validando que o mesmo não está na lista negra. `[FONTE: TRYCONTROLLER]`
- **Concessão:** O trabalhador, possuindo um caixa com status `Aberto`, registra uma nova Venda/Crédito. 
- **Efeito Financeiro:** O valor concedido subtrai o montante físico atual do caixa ativo do operador. O cliente ganha um passivo (`saldoPendiente`). `[INFERÊNCIA baseada em fluxo padrão]` / `[FONTE: CONTROLMAX - uso de saldoPendienteCents]`

### Etapa 2: Cobrança e Pagamento (Coleção)
- **Ato de Cobrança:** Diariamente, o trabalhador consulta sua rota e registra os pagamentos dos clientes. `[FONTE: TRYCONTROLLER]`
- **Registro:** Um `Payment`/`Collection` é gerado vinculado ao `Sale` e ao `Box` ativo.
- **Efeito Financeiro:** O valor recebido em dinheiro é somado fisicamente ao caixa do cobrador, e subtraído da dívida do cliente (`saldoPendienteCents`). `[FONTE: CONTROLMAX]`

### Etapa 3: Gestão e Estado do Caixa
A entidade Caixa dita se a operação pode ocorrer.
- **Sem Caixa / Estado Fechado:** Não é possível registrar pagamentos ou vendas. `[FONTE: TRYCONTROLLER]`
- **Abertura (`open`):** O caixa nasce com um saldo inicial transportado ou designado. O status vai para `Abierta`. `[FONTE: TRYCONTROLLER]` e `[FONTE: CONTROLMAX]`
- **Fechamento (`closed`):** Ao encerrar as visitas, o operador submete o fechamento. O sistema calcula o *Caja Final* (Saldo Inicial + Coleções - Vendas/Concessões - Gastos). O status muda para `Cerrada`. O operador perde permissão de editar os valores de movimentação. `[FONTE: TRYCONTROLLER]`
- **Confirmação (`confirmed`):** Um supervisor valida o numerário físico e as notas. Ele "Aprova" o caixa. O status vai para `Confirmada`. Isso sela o balanço para faturamento. `[FONTE: TRYCONTROLLER]` e `[FONTE: CONTROLMAX - via endpoint protegido]`

### Etapa 4: Transferências e Liquidações
- **Centros de Negócios:** Os saldos confirmados nas unidades operacionais formam o balanço consolidado.
- **Movimentos (Egresos/Ingresos):** Valores saem da unidade (ex: pagamento de combustível) ou entram no CN. A transferência requer aprovação se cruzar hierarquias. `[FONTE: TRYCONTROLLER]`

## 5.2 Resumo das Regras Identificadas no Fluxo
- Um usuário só visualiza seus clientes e dados de sua unidade de contexto, escolhida globalmente no cabeçalho. `[FONTE: TRYCONTROLLER]`
- O saldo é mantido em centavos para evitar discrepâncias nas parcelas arredondadas. `[FONTE: CONTROLMAX]`
- Relatórios dependem de cálculos em fila quando o volume excede a janela operacional (relatórios assíncronos gerados sob demanda e notificados). `[FONTE: TRYCONTROLLER]`
- A limpeza de cobrança e abertura massiva de caixas operam em lote iterando pelas unidades do Centro de Negócios selecionado. `[FONTE: TRYCONTROLLER]`
