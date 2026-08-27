# 8. Modelo de Dados Base e Identificadores

Para garantir a coerência hierárquica e o isolamento (multi-tenant) sem redundância, adotaremos uma tabela padronizada de identificadores.

## 8.1 Identificadores e Hierarquia

Não criaremos `orgId` separadamente, assumiremos que **`tenantId`** é o identificador mestre (Sociedade/Tenant).

| Conceito | Identificador | Obrigatório | Finalidade |
| :--- | :--- | :--- | :--- |
| **Sociedade/Empresa** | `tenantId` | SIM (em tudo) | Garantir isolamento absoluto via Firestore Rules e JWT. |
| **Centro de Negócio** | `bcId` | SIM | Agrupar unidades regionais para relatórios gerenciais. |
| **Unidade/Rota** | `unitId` | SIM | Determinar o escopo diário de atuação do cobrador e caixa. |

> **Regra de Ouro:** Todas as coleções transacionais (`boxes`, `sales`, `collections`, `audit_logs`) deverão ter obrigatoriamente a assinatura do `tenantId`, `bcId` e `unitId` no momento da criação pelo Backend. O Backend preenche o `tenantId` extraindo do token, NUNCA confiando no client.

---

## 8.2 Coleções Organizacionais e de Acesso

### Coleção: `organizations`
- `id`: string (`tenantId`)
- `name`: string
- `status`: string

### Coleção: `business_centers`
- `id`: string (`bcId`)
- `tenantId`: reference
- `name`: string

### Coleção: `units`
- `id`: string (`unitId`)
- `tenantId`: reference
- `bcId`: reference
- `name`: string

### Coleção: `users`
- `id`: string (uid do auth)
- `tenantId`: reference
- `role`: string (admin, supervisor, collector)
- `usuario_unidades`: array of strings (`unitId`s permitidos) — **fonte de verdade no piloto (CTX-02)**.
- `usuarioUnidades`: alias camelCase aceito na leitura (frontend/BFF).
- `assignedUnits`: **sinônimo de especificação** (= `usuario_unidades`). Não migrar no piloto; novos writes usam `usuario_unidades`.
- `assignedBc`: array of strings (`bcId`s permitidos) — opcional / futuro.

> **Decisão CTX-02 (27/08/2026):** manter `usuario_unidades` como campo canônico. BFF `POST /api/boxes/open` e `confirm` rejeitam unidade fora da lista (gestores sem lista: acesso amplo no piloto).

---

## 8.3 O Modelo Financeiro do Piloto
### O PILOTO SUPORTA
- Saldo devedor único (`balanceCents`).
- Registro de venda/crédito, pagamentos, correção financeira e estornos auditáveis.
### O PILOTO NÃO DEFINE
- Motor completo de juros, mora e multas, ou amortização complexa.

---

## 8.4 Coleções Financeiras (Piloto)

### Coleção: `boxes` (caixas diários)
- `id`: string
- `tenantId`: reference **(OBRIGATÓRIO)**
- `bcId`: reference **(OBRIGATÓRIO)**
- `unitId`: reference **(OBRIGATÓRIO)**
- `userId`: reference
- `status`: enum (open, closed, confirmed)
- `initialAmountCents`: integer
- `incomesCents`: integer
- `expensesCents`: integer
- `salesCents`: integer
- `collectionsCents`: integer

### Coleção: `sales` (vendas)
- `id`: string
- `tenantId`: reference **(OBRIGATÓRIO)**
- `unitId`: reference
- `customerId`: reference
- `totalAmountCents`: integer
- `balanceCents`: integer

### Coleção: `collections` (recebimentos e transações)
- `id`: string
- `tenantId`: reference **(OBRIGATÓRIO)**
- `unitId`: reference
- `saleId`: reference (se for pagamento)
- `boxId`: reference
- `type`: string (`payment`, `expense`, `income`, `reversal`)
- `amountCents`: integer
- `idempotencyKey`: string
- `status`: string (`active`, `reversed`)
- `createdAt`: timestamp

### Coleção: `audit_logs`
- `id`, `tenantId`, `action`, `userId`, `context`.
