# AUDITORIA DE CÓDIGO — CONTROLMAX V1

## 1. Resumo Executivo
A auditoria técnica revela que o código atual do ControlMax possui uma excelente fundação visual (UI/UX) e uma integração inicial funcional com o ecossistema Firebase. No entanto, do ponto de vista arquitetural e de segurança, **o sistema diverge criticamente da Especificação Oficial**. 
Atualmente, o ControlMax atua quase integralmente como um "Fat Client" (Frontend gravando transações financeiras diretamente no Firestore), enquanto a especificação exige operações exclusivamente via Backend/BFF para garantir segurança, auditoria, proteção multi-tenant e idempotência. O projeto **NÃO** está pronto para o piloto sem antes passar por um plano rigoroso de adequações arquiteturais.

## 2. Estado Atual
- **Frontend (React 19 + Vite)**: Possui estrutura robusta de roteamento e componentes. As telas estão bem desenvolvidas, mas abrigam regras de negócio e de banco de dados que deveriam estar no Backend.
- **Backend (Express)**: Funciona essencialmente como um servidor de proxy estático e hospeda apenas duas lógicas (`/api/gemini/assistant` e `/api/boxes/confirm`). 
- **Banco de Dados (Firestore)**: Permissivo. Confia no cliente (`frontend`) para definir valores como `tenantId` e saldos financeiros, o que contraria as boas práticas de segurança em aplicativos financeiros.

## 3. Compatibilidade com a Especificação
- 🟢 **IMPLEMENTADO**: UI/UX Básica, Mapas, Login Firebase Auth, Integração Gemini AI.
- 🟡 **PARCIALMENTE IMPLEMENTADO**: Isolamento Multi-Tenant (depende de regras imperfeitas e bypasses).
- 🔴 **AUSENTE**: Motor Offline (Sync Manager), Backend Forçado (BFF) para Vendas/Pagamentos, Idempotência Financeira.
- ⚠️ **IMPLEMENTADO COM RISCO**: `firestore.rules`, Controle de Caixa, Validação de Permissões (RBAC).

## 4. Fluxo Financeiro
O fluxo atual de cobrança e venda ocorre através da comunicação **Frontend → Firestore** via Firebase SDK (ex: `runTransaction` no arquivo `frontend/src/utils/registerPaymentTransaction.ts`).
- **Onde começa**: `RegisterPayment.tsx`
- **Passa pelo Backend?**: NÃO.
- **Transação**: Utiliza `runTransaction` nativo do Firestore no browser.
- **Idempotência**: 🔴 Ausente. Pode ser duplicada acidentalmente em oscilações de rede (race conditions no commit).
- **Risco de Manipulação**: ALTO. Um usuário mal-intencionado com conhecimento técnico pode invocar o SDK no console do navegador e abater dívidas alterando os centavos.
- **Funciona Offline?**: NÃO. Transações nativas do Firestore (`runTransaction`) falham imediatamente sem internet.

## 5. Caixa
- **Abertura/Fechamento**: Executados diretamente pelo Frontend no Firestore.
- **Confirmação**: Executada pelo Backend (`/api/boxes/confirm`).
- **Problema Crítico de Segurança**: As `firestore.rules` atuais permitem que um Administrador ou Supervisor **edite** um caixa `open` através de update direto. Isso viola a RN02 da especificação oficial, que proíbe alterações arbitrárias e exige que ajustes ocorram via lançamentos de ingresso/egresso.

## 6. Multi-Tenant
A implementação do `tenantId` está ⚠️ **Vulnerável**:
- **Regras do Firestore**: Dependem de checagem do `userTenantId()`.
- **Validação Cruzada**: As regras possuem falhas graves, utilizando "bypasses" hardcoded como `brasiloficina40@gmail.com` ou `legnotebooks@gmail.com` para conceder acessos administrativos absolutos e definir tenant.
- **Payload**: O Frontend monta objetos contendo `tenantId: string` e envia para salvar, em vez do Backend inferir estritamente a partir da assinatura do JWT do usuário (Token Seguro).

## 7. Autenticação e RBAC
- **Autenticação**: O Firebase Auth funciona perfeitamente (Login seguro).
- **Autorização (RBAC)**: Totalmente focada no Frontend (`hasPermission`, `<ProtectedRoute>`). 
- **Problema**: Proteção de rotas React (`AppRoutes.tsx`) é apenas "segurança cosmética". Sem validação de permissões equivalente nos endpoints do BFF ou com regras falhas no Firestore, um `collector` com conhecimentos técnicos poderia acessar recursos de `admin` via requisição direta. Bypasses visuais (`isSuperByEmail`) existem soltos no código Frontend.

## 8. Backend / BFF
- 🔴 O BFF de Vendas, Recebimentos e Estornos é **inexistente**.
- A comunicação ocorre quase 100% Client-to-Database.
- Não existem endpoints estruturados como `/api/transactions/payment` ou `/api/transactions/adjustment`.

## 9. Segurança
| Ameaça | Classificação | Impacto / Descrição |
|---|---|---|
| Bypasses Hardcoded | **CRÍTICO** | E-mails chumbados no frontend e nas `firestore.rules` (`maildojg@gmail.com`, etc.) garantem privilégio de SuperAdmin e bypassam o isolamento tenant. |
| Writes Diretos de Finanças | **CRÍTICO** | Usuários escrevem seu próprio pagamento. Risco de spoofing e manipulação de saldos devedores (alterar payload antes do send). |
| Falta de Idempotência | **ALTO** | Duplo clique ou oscilação de rede podem processar pagamentos duplos, destruindo a confiança do caixa do cliente. |
| Tenant Escape | **ALTO** | A permissividade em alguns nós da Firestore Rules pode permitir leitura cruzada de dados por admins caso forjem o body. |

## 10. Navegação / UX
**Bug relatado: "Cliquei em uma tela e abriu outra."**
- **Causa raiz diagnosticada:** Em arquivos como `RegisterPayment.tsx` (linha 73), validações de segurança da UI rodam assincronamente dentro de hooks `useEffect`. Quando o documento de venda carrega e verifica se o cobrador não tem a `unitId` designada, ele executa um violento `onNavigate('dashboard')` redirecionando o usuário sem mensagem clara que fique fixa na tela (apenas um toast efêmero).
- **Outra causa:** Uso excessivo de roteamento imperativo (`useNavigation` context state) acoplado com o React Router (`HashRouter`). Os estados URL e Contexto desincronizam no recarregamento da página ou uso de botão "Voltar".

## 11. Compatibilidade TryController
- 🟢 **Visual e UX**: Surpreendentemente próxima, limpa e adequada.
- 🔴 **Motor**: O TryController usa C#/ASP.NET autoritário. O ControlMax atual usa React autoritário. Precisamos igualar a autoridade do backend para os cobradores não fraudarem a empresa.

## 12. Offline / Sync Manager
- 🔴 **Não implementado**.
- Existe apenas o `<OfflineBanner>` estético em `App.tsx`.
- Devido à dependência do `runTransaction` no Firebase SDK, se a internet cair, o cobrador não conseguirá salvar uma baixa na dívida no meio de uma rota rural. Isso trava a operação, bloqueando o piloto.

## 13. Performance
- O Frontend é performático devido ao uso agressivo de `lazy()` imports em `AppRoutes.tsx`.
- Gargalos futuros previstos se listeners (`onSnapshot`) de tabelas imensas (como `sales` ou `collections`) não forem paginados (uso intensivo de banda de rede e travamentos no mobile).

## 14. Testes
- Existe apenas `firestore.rules.test.ts`. 
- 🔴 **Falta cobertura:** Unitários para lógica de centavos, testes de integração BFF, testes do fluxo idempotente.

## 15. Bugs Encontrados
- Redirecionamentos assíncronos não tratados na UI.
- `installmentsCount` perde consistência se customAmount for modificado durante o toggle de slider.
- Permissão `userRole() == 'admin'` em open boxes contrariando regras de negócios.

## 16. Vulnerabilidades Encontradas
- Hardcoded SuperAdmins no Frontend e Backend.
- Client-side trust data (Confiança em dados fornecidos pelo cliente sem sanitarização em transações atômicas).

## 17. Matriz P0/P1/P2/P3

| Área | Estado | Prioridade | Arquivos | Problema | Ação futura |
|---|---|---|---|---|---|
| **Arquitetura** | 🔴 Ausente | **P0** | `server.ts`, `AppRoutes.tsx` | Falta de BFF financeiro | Migrar lógica financeira (RegisterPayment) para o Node.js. |
| **Segurança** | 🔴 Crítico | **P0** | `firestore.rules`, `AppRoutes.tsx` | E-mails hardcoded | Remover bypasses; usar Custom Claims (Firebase Auth). |
| **Offline** | 🔴 Ausente | **P0** | UI inteira | Firestore falha sem rede | Implementar IndexedDB local (Sync Manager). |
| **UX/Nav** | 🟠 Diferente | **P1** | `RegisterPayment.tsx` | Redirecionamento forçado | Substituir `onNavigate` imperativo em `useEffect` por Render Condicional de Erro. |
| **Idempotência** | 🔴 Ausente | **P1** | Todo transacional | Duplicação de pagamento | Gerar UUID no app, enviar ao BFF, validar no banco. |

## 18. Arquivos que Precisam de Alteração
### Segurança
- `firestore.rules`: Remover todos os e-mails hardcoded; remover permissão de escrita em `sales`/`boxes` para clients (deixar só leitura).
- `frontend/src/utils/rbac.ts`: Centralizar permissões.
### Backend
- `backend/server.ts`: Incluir novas rotas REST.
- `backend/src/routes/transactions.ts` (a criar): Mover lógica de centavos para cá.
### Frontend
- `frontend/src/utils/registerPaymentTransaction.ts`: Deve ser transformado numa chamada Axios (`POST /api/transactions/payment`).
- `frontend/src/screens/RegisterPayment.tsx`: Ajustar tratamento de exceções (não ejetar usuário para dashboard sem contexto).
- `frontend/src/context/NavigationContext.tsx`: Simplificar e sincronizar estado com React Router nativo.
### Testes
- Necessário criar suíte Jest para as novas rotas Node.js simulando transações concorrentes.

## 19. Ordem Recomendada de Correção
1. **(P0) Limpeza de Segurança:** Remover hardcodes das Firestore Rules (travar writes perigosos).
2. **(P0) Migração BFF:** Transferir o motor financeiro (Abertura/Fechamento, Recebimento, Estorno) para o Express.
3. **(P0) Sync Manager:** Construir fila IndexedDB local no Frontend para pagamentos offline, despachando para o BFF quando online.
4. **(P1) UX Estabilização:** Consertar os hooks `useEffect` que redirecionam telas, mostrando componentes de `Acesso Negado` ou `Venda Inválida` ao invés de jogar o usuário no `/dashboard`.
5. **(P2) Auditoria Visual:** Ajustes menores de Tailwind para igualar à Especificação.

## 20. Critério para Liberação do Piloto
O ControlMax **só poderá entrar em operação real (piloto)** quando:
- Nenhuma operação financeira for realizada pelo client-side via Firebase SDK (exceto fallback IndexedDB pendente).
- As `firestore.rules` proibirem expressamente a criação e deleção (Estorno) de recebimentos via SDK de front.
- A idempotência estiver validada por testes automatizados (evitando duplicação de pagamentos via lag 3G de cobradores nas ruas).
- O funcionamento em modo Avião for comprovado até a fila sincronizar.
