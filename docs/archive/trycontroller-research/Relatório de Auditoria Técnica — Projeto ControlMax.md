# Relatório de Auditoria Técnica — Projeto ControlMax

Este documento apresenta uma análise detalhada da arquitetura, segurança e prontidão operacional do sistema **ControlMax**. A auditoria foi realizada com foco na identificação de vulnerabilidades críticas, bugs de lógica financeira e avaliação da viabilidade para o lançamento de um piloto com usuários reais.

## 1. Avaliação de Segurança e Autenticação

A análise de segurança revelou vulnerabilidades críticas que comprometem a integridade do sistema. Foram identificados múltiplos mecanismos de "bypass" que permitem o acesso à plataforma sem a devida autenticação ou autorização, conforme detalhado na tabela abaixo.

| Vulnerabilidade | Descrição Técnica | Impacto |
| :--- | :--- | :--- |
| **Bypass de Login (Modo Demo)** | O arquivo `Login.tsx` permite acesso funcional completo através do e-mail `demo@controlmax.dev` ou falhas de rede, operando em modo offline simulado. | **Crítico**: Permite acesso à interface e funções sem credenciais válidas. |
| **Backdoor de Superadmin** | Botão visível na UI de login concede acesso total via e-mail `controlmaxia@gmail.com` sem verificação de senha. | **Crítico**: Exposição total de dados de todos os inquilinos (tenants). |
| **Autorização Hardcoded** | O hook `useTenantHelpers.ts` define papéis administrativos baseados em uma lista estática de e-mails no código-fonte. | **Alto**: Facilita ataques de impersonação e dificulta a gestão dinâmica de usuários. |
| **Impersonação de Tenant** | A troca de contexto de empresa (tenant) é baseada em valores manipuláveis no `localStorage` do navegador. | **Alto**: Risco de vazamento de dados entre diferentes empresas clientes. |

> **Observação Crítica:** A presença de botões de bypass de segurança diretamente na interface de login indica que o sistema ainda possui ferramentas de desenvolvimento expostas, o que é inaceitável para um ambiente de produção ou piloto.

## 2. Integridade de Dados e Confiabilidade Financeira

O sistema apresenta inconsistências na forma como manipula e armazena valores monetários, além de falhas nos mecanismos de auditoria que deveriam garantir a rastreabilidade das operações.

### 2.1 Gestão de Valores Monetários
Embora o projeto esteja migrando para um modelo de armazenamento em centavos (inteiros), foi detectada uma dualidade perigosa. O campo `saldoPendienteCents` coexiste com o legado `saldoPendiente` (float/string). Esta redundância aumenta a probabilidade de erros de arredondamento e dessincronização de saldos durante as transações. No cálculo do saldo final de caixa (`registerPaymentHelpers.ts`), a reconstrução do valor depende da integridade de múltiplos totalizadores; uma falha em qualquer um deles corrompe o saldo permanentemente.

### 2.2 Falhas no Log de Auditoria
Identificamos um bug silencioso na rota de backend `boxConfirmRoute.ts`. O sistema tenta registrar logs de segurança para ações críticas, mas omite o campo `tenantId`. Como as regras do Firestore (`firestore.rules`) exigem este campo para permitir a gravação, **nenhum log de segurança está sendo efetivamente salvo no banco de dados**, deixando o sistema sem rastro de auditoria para ações administrativas.

## 3. Maturidade do Código e UX Técnica

A qualidade geral do código reflete um estágio de desenvolvimento intermediário, com dependências que podem afetar a estabilidade do piloto.

*   **Tratamento de Erros:** Diversos hooks capturam exceções críticas (erros de rede ou permissão) e apenas emitem um log no console, sem notificar o usuário. Isso pode levar a situações onde o usuário acredita que uma venda foi registrada, quando na verdade a operação falhou silenciosamente.
*   **Arquitetura de Backend:** O uso do SDK de cliente dentro de rotas de servidor Express para operações críticas (como a confirmação de caixa) é uma prática que fragiliza o modelo de segurança, idealmente centralizado no Firebase Admin SDK.

## 4. Parecer Técnico e Recomendação Final

Após uma revisão exaustiva do código-fonte e da documentação disponível, apresento minha opinião sincera sobre o estado atual do projeto.

### Veredito: **NÃO RECOMENDADO PARA LANÇAMENTO (GO/NO-GO: NO-GO)**

O projeto **ControlMax** possui uma base funcional promissora, mas **não está em condições de suportar um piloto com usuários reais**. Os riscos de segurança (bypasses expostos) e os riscos financeiros (dualidade de dados e falha nos logs) são elevados demais para uma operação que lida com movimentação de dinheiro.

### Notas e Recomendações de Curto Prazo
Para atingir o estado de "Pronto para Piloto", as seguintes ações são obrigatórias:
1.  **Remover todos os bypasses** e modos demo do código de produção.
2.  **Unificar o armazenamento monetário**, eliminando campos legados em float/string.
3.  **Corrigir os logs de segurança** no backend para incluir o `tenantId` e validar a gravação.
4.  **Implementar Toasts/Notificações** globais para que falhas de rede não sejam silenciosas para o usuário.
