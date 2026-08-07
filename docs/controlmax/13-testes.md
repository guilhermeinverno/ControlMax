# 13. Estratégia de Testes e Critérios de Aceite (BDD)

## 1. Operação Offline, Sync e Retry
- **Given** um Collector sem conexão de internet (Offline)
- **When** ele executa um pagamento e clica em Salvar
- **Then** a UI exibe toast de sucesso local e move a operação para uma Fila Local com status `PENDING`.
- **When** a internet retorna
- **Then** o background job dispara o POST com a `idempotencyKey` e atualiza a UI para `SYNCED`.

## 2. Idempotência e Conflito
- **Given** um pagamento PENDING na fila local com `idempotencyKey=123`
- **When** a rede oscila e o frontend envia o POST duas vezes simultâneas
- **Then** o BFF processa o primeiro, e retorna 201 para o segundo sem deduzir o saldo duas vezes.

## 3. Correção de Caixa (Ajuste Financeiro)
- **Given** um Admin autenticado
- **When** ele tenta forçar um `updateDoc` no `initialAmountCents` do caixa de um Collector via client SDK
- **Then** as `firestore.rules` rejeitam.
- **When** ele aciona o endpoint `/api/transactions/adjustment` justificando "+ 50 centavos faltantes"
- **Then** o saldo do caixa é ajustado contabilisticamente via Ingresso e gera trilha de auditoria.

## 4. Estorno e Tentativa Duplicada
- **Given** um pagamento incorreto registrado no caixa
- **When** o Supervisor dispara o `/api/transactions/reversal`
- **Then** o pagamento é marcado como `reversed`, o dinheiro volta ao saldo devedor, e a auditoria é gravada.
- **When** o Supervisor tenta estornar o mesmo ID novamente
- **Then** o BFF rejeita com erro HTTP 409 Conflict.

## 5. Tentativa de manipular Initial Amount
- **Given** um hacker capturando o POST de `/api/boxes/open`
- **When** ele injeta `initialAmountCents: 900000` (R$ 9.000)
- **Then** o BFF rejeita ou ignora a injeção, abrindo o caixa apenas com o saldo matemático transportado validado no banco de dados.

## 6. Isolamentos Multi-tenant (Tenant, Sociedade, CN, Unidade)
- **Given** um usuário restrito à Unidade A (`assignedUnits: ["unit_A"]`)
- **When** ele injeta `unitId="unit_B"` no POST de venda
- **Then** o BFF lê sua Claim, percebe a falta de permissão e bloqueia com HTTP 403.
- **When** um usuário da Sociedade X consulta a API
- **Then** o BFF força `where("tenantId", "==", X)` impedindo vazamento da Sociedade Y.
