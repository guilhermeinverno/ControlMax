# 9. Arquitetura Proposta e Estratégia Offline

A partir dos requisitos, formalizamos a **Arquitetura Híbrida SPA + Backend For Frontend (BFF) Segura**.

## Desenho da Solução Online

1. **Frontend (React):** O cliente gerencia UI, valida preenchimento de campos e solicita contexto de navegação. A Autenticação emite o Token (JWT).
2. **BFF (Node.js/Express):** Valida a role e `tenantId` contidos exclusivamente no Token. Executa as transações financeiras garantindo integridade.
3. **Firestore:** Armazenamento. A `firestore.rules` barra qualquer requisição direta do frontend que tente pular o BFF para gravações financeiras. O frontend apenas lê dados otimistas via SDK.

Fluxo: `Frontend -> BFF -> Validação -> Operação Transacional no Firestore -> Gera Auditoria -> Resposta UI`.

## Estratégia Offline (Sincronização Assíncrona) `[PROPOSTA TÉCNICA]`

Como o BFF isolou o banco de dados, o "Offline Persistence" nativo do Firebase SDK não funcionará para gravações críticas. Para suportar áreas rurais (sem rede):

1. **Fila Local (IndexedDB/Service Worker):** Toda operação financeira criada offline (ex: Pagamento) é salva no armazenamento local do navegador (IndexedDB) via estado global (ex: Zustand com Persist).
2. **Propriedades da Operação Local:**
   - `idempotencyKey`: UUID gerado no momento do clique.
   - `status`: Inicialmente `PENDING`.
3. **UX Feedback:** A UI exibe o pagamento na tela (Otimista) e alerta: "Transações Pendentes de Sincronização". Não há confirmação de recibo oficial até a rede voltar.
4. **Sincronização (Sync Manager):**
   - Quando a internet retorna, o *Background Sync* varre a fila `PENDING` e dispara o `POST` para o BFF (com a `idempotencyKey`).
   - Se 200 OK: O status muda para `SYNCED` e some da fila.
   - Se 400/409 (Erro de negócio ou Duplicidade tratada pelo BFF via idempotência): O status muda para `FAILED` com a mensagem do backend para que o cobrador resolva ou descarte.
   - Se falha de rede: Mantém `PENDING` e aplica `RETRY`.
5. **Restrição Offline:** Uma operação de "Fechamento de Caixa" não pode ser executada se houverem transações `PENDING`. O caixa só fecha 100% sincronizado.
