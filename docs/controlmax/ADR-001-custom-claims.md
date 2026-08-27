# ADR-001 — Custom Claims para role e tenantId (AUTH-01)

- **Status:** Aceito
- **Data:** 27/08/2026
- **Opção:** **A** (recomendada no plano)

## Contexto

O middleware BFF lia `role` e `tenantId` apenas do documento Firestore `users/{uid}`. Um cliente autenticado com permissão de `update` parcial no próprio perfil (ou bug futuro) poderia tentar elevar `role` no client SDK. As rules já restringem escalate, mas a fonte de verdade do BFF precisa ser o token.

## Decisão

1. Ao criar/atualizar usuário via `POST /api/admin/users`, o backend chama `setCustomUserClaims({ role, tenantId, isSuperAdmin })`.
2. `authMiddleware` resolve o perfil com **Custom Claims primeiro**; Firestore só como fallback para usuários legados sem claims.
3. Nome de exibição continua vindo do Firestore (não precisa estar nas claims).

## Consequências

- Após provisionar/atualizar usuário, o client deve forçar refresh do ID token (`getIdToken(true)`) no próximo login ou após admin salvar o usuário.
- Usuários criados só pelo fallback client (já bloqueado por rules `users` create:false) não recebem claims — o caminho suportado é a API admin.
- Teste unitário `customClaims.test.ts` cobre “Firestore diz admin, claims dizem collector → collector”.

## Alternativa rejeitada (Opção B)

“Role só no Firestore” com cache no middleware — mais frágil e contradiz o isolamento do BFF.
