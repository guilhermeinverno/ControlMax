# Notas de Auditoria Técnica — ControlMax

## 1. Segurança e Autenticação (Risco Crítico)

### 1.1 Backdoors e Bypasses de Autenticação
- **Login Demo/Offline:** O arquivo `Login.tsx` contém lógica explícita para ignorar a autenticação real do Firebase. Se o e-mail for `demo@controlmax.dev` ou se houver qualquer erro de configuração/rede no Firebase, o sistema entra em "Modo Demo Local Offline".
- **Bypass de Superadmin:** Existe um botão visível e funcional para `SuperAdmin Offline Bypass` que concede acesso total ao sistema usando o e-mail `controlmaxia@gmail.com` sem verificar senha ou token.
- **Provisionamento Automático:** O hook `useTenantHelpers.ts` contém uma lista de e-mails (`ADMIN_BYPASS_EMAILS`) que, ao fazerem login (mesmo que anonimamente ou via bypass), têm seus documentos de `tenant` e `user` criados/atualizados automaticamente com permissões de `admin` ou `superadmin`.

### 1.2 Falhas de Autorização (Trust Boundaries)
- **Impersonação de Tenant:** O sistema permite que superadmins troquem de tenant apenas alterando uma chave no `localStorage` (`controlmax_impersonated_tenant`). Embora as regras do Firestore tentem validar isso, a lógica de "bypass" no frontend pode induzir a erros de segurança se as regras não forem 100% estritas.
- **Lógica de Role no Cliente:** Grande parte da lógica de decisão de permissões (RBAC) está hardcoded no frontend (ex: `useTenantHelpers.ts` mapeando roles por string de e-mail), o que é vulnerável a manipulação via console do navegador.

## 2. Integridade de Dados e Bugs de Lógica

### 2.1 Consistência Financeira (Dualidade de Dados)
- **Dualidade Centavos/Float:** O sistema está em transição para centavos, mas ainda mantém campos duplicados como `saldoPendienteCents` (inteiro) e `saldoPendiente` (string/float). Isso gera risco de dessincronização.
- **Cálculo de Saldo de Caixa:** No arquivo `registerPaymentHelpers.ts`, o cálculo do `newFinalAmount` reconstrói o saldo somando e subtraindo totais. Se houver falha em um dos totalizadores (ex: `totalSales`), o saldo final do caixa será corrompido permanentemente.

### 2.2 Bugs de Auditoria
- **Logs de Segurança Inconsistentes:** A rota `boxConfirmRoute.ts` no backend tenta gravar logs em `security_logs`, mas omite o campo `tenantId`. As regras do Firestore (`firestore.rules`) exigem explicitamente que o `tenantId` esteja presente para permitir a criação do log. Resultado: **os logs de segurança falham silenciosamente e não são gravados.**

## 3. Qualidade de Código e Prontidão para Piloto

### 3.1 Maturidade Técnica
- **Engolimento de Erros:** Vários hooks (ex: `useFormsData`, `useFinanceData`) capturam erros de rede/permissão e apenas fazem `console.log`, deixando o usuário sem feedback de que a operação falhou.
- **Acoplamento com Firebase Client no Backend:** O backend utiliza o SDK de cliente do Firebase em rotas críticas (como confirmação de caixa), o que é uma prática incomum e potencialmente menos segura que o uso exclusivo do Admin SDK para operações de servidor.

### 3.2 Opção Sincera sobre Lançamento
- **Veredito:** **NÃO RECOMENDADO PARA PILOTO.**
- **Motivo:** A presença de botões de bypass de segurança na tela de login e a dependência de hardcoded e-mails para autorização tornam o sistema vulnerável a acessos indevidos. Além disso, a falha silenciosa nos logs de auditoria e a dualidade nos dados financeiros representam riscos de integridade que podem causar prejuízos financeiros reais durante um piloto.
