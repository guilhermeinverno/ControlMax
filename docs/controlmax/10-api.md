# 10. APIs e Serviços Backend (Contratos de API)

> **Regra Mestra:** Nenhuma rota confia cegamente no `tenantId` ou `role` enviado no corpo do payload para autorização. O backend valida os acessos utilizando o token decodificado do Firebase Auth (extraindo `request.user.tenantId` e `request.user.role`).
> 
> **Padrão Monetário:** Todos os valores numéricos referentes a dinheiro são trafegados e calculados obrigatoriamente como inteiros representativos de **centavos** (`cents` / `number`). Por exemplo, R$ 1,50 é representado por `150`.
> 
> **Cabeçalhos de Idempotência e Multi-tenant:** Para garantir a integridade em cenários offline-first e de concorrência multi-aba, todos os endpoints transacionais exigem:
> - `X-Tenant-ID`: Identificador mestre da empresa (`tenantId`).
> - `X-Idempotency-Key`: UUID único da transação gerada na fila offline (`id`).

---

## 10.1 Abertura de Caixa
Registra o início do turno de trabalho do operador (collector).

- **URL:** `/api/boxes/open`
- **Método:** `POST`
- **Cabeçalhos:**
  - `Content-Type: application/json`
  - `X-Tenant-ID: <tenantId>`
  - `X-Idempotency-Key: <id>`
- **Payload Request (`OpenBoxPayload`):**
  ```typescript
  interface OpenBoxPayload {
    id: string; // Identificador da transação (usado como idempotencyKey)
    tenantId: string;
    boxId: string;
    collectorId: string;
    initialBalanceCents: number; // Saldo inicial transportado em centavos
    openedAt: string; // ISO Timestamp (ex: "2026-08-04T12:00:00.000Z")
  }
  ```
- **Responses:**
  - `200 OK` ou `201 Created` (`OpenBoxResponse`):
    ```typescript
    interface OpenBoxResponse {
      success: boolean;
      boxId: string;
      openedAt: string;
      status: string; // ex: "open"
    }
    ```
  - `400 Bad Request`: Payload malformado ou validação falhou (ex: `initialBalanceCents < 0` ou IDs em branco).
  - `401 Unauthorized`: Token Firebase ausente ou inválido.
  - `403 Forbidden`: Usuário logado não pertence ao tenant ou não tem permissão para a unidade informada.

---

## 10.2 Fechamento de Caixa
Encerra o turno de trabalho do operador e bloqueia novos lançamentos de vendas ou cobranças associadas ao caixa fechado.

- **URL:** `/api/boxes/close`
- **Método:** `POST`
- **Cabeçalhos:**
  - `Content-Type: application/json`
  - `X-Tenant-ID: <tenantId>`
  - `X-Idempotency-Key: <id>`
- **Payload Request (`CloseBoxPayload`):**
  ```typescript
  interface CloseBoxPayload {
    id: string; // Identificador da transação (usado como idempotencyKey)
    tenantId: string;
    boxId: string;
    collectorId: string;
    finalBalanceCents: number; // Saldo final em centavos apurado pelo operador
    notes?: string; // Observações do fechamento (opcional)
    closedAt: string; // ISO Timestamp (ex: "2026-08-04T18:00:00.000Z")
  }
  ```
- **Responses:**
  - `200 OK` (`CloseBoxResponse`):
    ```typescript
    interface CloseBoxResponse {
      success: boolean;
      boxId: string;
      closedAt: string;
      totalTransactions: number; // Contagem de vendas e pagamentos processados no caixa
      status: string; // ex: "closed"
    }
    ```
  - `400 Bad Request`: Payload malformado ou validação falhou (ex: `finalBalanceCents < 0`).
  - `401 Unauthorized`: Token Firebase ausente ou inválido.
  - `403 Forbidden`: Sem permissão sobre o caixa especificado.

---

## 10.3 Venda / Concessão de Crédito
Registra uma nova venda de produto/crédito na rota do cobrador, afetando o saldo devedor do cliente e reduzindo o saldo físico do caixa do operador.

- **URL:** `/api/sales`
- **Método:** `POST`
- **Cabeçalhos:**
  - `Content-Type: application/json`
  - `X-Tenant-ID: <tenantId>`
  - `X-Idempotency-Key: <id>`
- **Payload Request (`SalePayload`):**
  ```typescript
  interface ItemSalePayload {
    productId: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }

  interface SalePayload {
    id: string; // Identificador da transação (usado como idempotencyKey)
    tenantId: string;
    boxId: string;
    customerId: string;
    items: ItemSalePayload[];
    totalCents: number; // Valor total da venda em centavos
    paymentMethod: string; // ex: "cash", "credit_card"
    createdAt: string; // ISO Timestamp
  }
  ```
- **Responses:**
  - `200 OK` ou `201 Created` (`SaleResponse`):
    ```typescript
    interface SaleResponse {
      success: boolean;
      saleId: string;
      syncedAt: string; // ISO Timestamp da sincronização com o BFF
    }
    ```
  - `400 Bad Request`: Validação de itens/IDs falhou (ex: lista de itens vazia, ids obrigatórios vazios).
  - `401 Unauthorized`: Token Firebase ausente ou inválido.
  - `403 Forbidden`: Sem acesso ao caixa do operador ou ao cliente do tenant correspondente.
  - `409 Conflict`: Transação com a mesma `X-Idempotency-Key` já processada anteriormente.

---

## 10.4 Cobrança / Recebimento (Pagamento)
Registra o pagamento ou baixa de cobrança de um cliente. Isso reduz o saldo pendente do cliente (`saldoPendienteCents`) e aumenta o montante no caixa aberto.

- **URL:** `/api/transactions/payment`
- **Método:** `POST`
- **Cabeçalhos:**
  - `Content-Type: application/json`
  - `X-Tenant-ID: <tenantId>`
  - `X-Idempotency-Key: <id>`
- **Payload Request (`PaymentPayload`):**
  ```typescript
  interface PaymentPayload {
    id: string; // Identificador da transação (usado como idempotencyKey)
    tenantId: string;
    boxId: string;
    customerId: string;
    amountCents: number; // Montante pago em centavos
    paymentMethod: string; // ex: "cash", "transfer"
    referenceSaleId?: string; // Venda associada ao pagamento (opcional)
    createdAt: string; // ISO Timestamp
  }
  ```
- **Responses:**
  - `200 OK` ou `201 Created` (`PaymentResponse`):
    ```typescript
    interface PaymentResponse {
      success: boolean;
      transactionId: string;
      newBalanceCents: number; // Novo saldo devedor do cliente após o pagamento
      syncedAt: string; // ISO Timestamp da sincronização
    }
    ```
  - `400 Bad Request`: Payload malformado ou validação falhou (ex: `amountCents <= 0`).
  - `401 Unauthorized`: Token Firebase ausente ou inválido.
  - `403 Forbidden`: Sem acesso ao cliente ou caixa.
  - `409 Conflict`: Transação com a mesma `X-Idempotency-Key` já processada anteriormente.

---

## 10.5 Correção Financeira de Caixa (Ingresso/Egreso)
Permite a correção manual justificada de montantes pelo supervisor ou admin sobre caixas em andamento.

- **URL:** `/api/transactions/adjustment`
- **Método:** `POST`
- **Cabeçalhos:**
  - `Content-Type: application/json`
  - `X-Tenant-ID: <tenantId>`
  - `X-Idempotency-Key: <idempotencyKey>`
- **Request:**
  ```json
  {
    "boxId": "string",
    "type": "income | expense",
    "amountCents": "integer",
    "reason": "string (Obrigatória)",
    "idempotencyKey": "string"
  }
  ```
- **Response:** `201 Created`.
- **Efeito Financeiro:** O valor soma/subtrai nos totais (`incomesCents` ou `expensesCents`) do caixa alvo. Cria registro na collection `collections` e log na auditoria.

---

## 10.6 Estorno (Rollback/Cancelamento)
Anula um pagamento ou recebimento registrado erroneamente. Deleção física é estritamente proibida.

- **URL:** `/api/transactions/reversal`
- **Método:** `POST`
- **Cabeçalhos:**
  - `Content-Type: application/json`
  - `X-Tenant-ID: <tenantId>`
  - `X-Idempotency-Key: <idempotencyKey>`
- **Request:**
  ```json
  {
    "originalTransactionId": "string",
    "reason": "string (Obrigatória)",
    "idempotencyKey": "string"
  }
  ```
- **Response:** `201 Created`.
- **Efeito Financeiro:** Devolve o valor ao saldo devedor (`balanceCents`) do cliente e deduz o numerário do caixa associado. Altera o status da transação original para `reversed`.
