# 11. Segurança e Prevenção de Riscos

A segurança transacional da versão V2 do ControlMax exige validação absoluta no Backend (BFF).

## Diretrizes Fundamentais Confirmadas
1. **Frontend NUNCA é autoridade final:** Qualquer JSON enviado via React/Aplicativo é tratado como solicitação.
2. **Tenant/Contexto não é confiado cegamente:** O Frontend não envia o `tenantId` no body. O Backend o extrai da verificação de chave assimétrica do Token (JWT Claim).
3. **Role/Cargo não vem do Body:** A permissão vem exclusivamente da Claim JWT (definida na nuvem pelo Superadmin, impedindo injeção de `role="admin"` por requisição adulterada via Postman).
4. **Valores Financeiros não são confiados cegamente:**
   - O saldo inicial de abertura do Caixa (`initialAmountCents`) é calculado/validado no banco consultando transportes prévios.
   - O limite de pagamento não pode superar o saldo devedor verificado ativamente no banco.
5. **Operações são Idempotentes:** O Backend exige o campo `idempotencyKey`. Um cache distribuído ou validação no banco (transação atômica que checa existência prévia da chave) impede que o double-click ou os retrys do modo Offline cobrem o cliente duas vezes.
6. **Auditoria é Imutável:** Só o BFF insere em `audit_logs`. `firestore.rules` proíbe o frontend de escrever ou deletar nesta coleção.
