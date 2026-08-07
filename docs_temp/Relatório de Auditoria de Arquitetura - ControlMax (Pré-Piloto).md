# Relatório de Auditoria de Arquitetura - ControlMax (Pré-Piloto)

## 1. Manipulação de Valores Monetários (Regra dos Centavos)
**Status: ✅ Em Conformidade (com ressalvas menores)**

A auditoria verificou o código do projeto, especialmente as funções de transformação (`frontend/src/utils/currency.ts`) e o fluxo transacional (ex: `incomeSave.ts`, `expenseSave.ts`, `registerPaymentTransaction.ts`). 

- **Pontos Positivos:** O sistema está convertendo corretamente as entradas (inputs mascarados) em números inteiros, aplicando `Math.round(parseCurrencyBRLToFloat(valor) * 100)` antes de realizar gravações no Cloud Firestore.
- **Ressalva (Dupla Escrita de Legado):** No fluxo de registro de pagamentos (`registerPaymentTransaction.ts`), a base ainda está mantendo dualidade de dados:
  ```typescript
  transaction.update(saleRef, {
    saldoPendienteCents: computedNewBalance, // Certo (Inteiro)
    saldoPendiente: (computedNewBalance / 100).toFixed(2), // Legado (Float String)
  });
  ```
  **Recomendação de Otimização:** O campo `saldoPendiente` deve ser abandonado no backend. A formatação deve ser responsabilidade exclusiva do client-side usando `fmtCents`, fortalecendo o Single Source of Truth em centavos. Além disso, recomenda-se que os componentes consumam diretamente `parseCurrencyBRLToCents(valor)` em vez de repetirem o uso de `Math.round`.

## 2. Feedback Visual nas Telas (Loading e Tratamento de Erros)
**Status: ⚠️ Parcialmente em Conformidade (Requer Ajustes Globais)**

Foi realizada uma análise abrangente no ciclo de vida das páginas (`RouteList`, `OpenBox`, `SaleDetail`, `Dashboard`, `CreditRequests`).

- **Pontos Positivos (Loading):** O uso de feedback de "loading" é constante e consistente. Há esqueletos visuais no `Dashboard` gerenciados inteligentemente via `listViewBody.tsx`, e spinners informativos em modais de carregamento (ex: `Loader2` no `SaleDetail` e o anel customizado roxo no `OpenBox`).
- **Pontos Positivos (Erro Explicito):** Em telas com interações críticas, como a abertura de caixa ou pagamentos, mensagens claras informam o usuário quando um valor é inválido (ex: `setSubmitError` alimentando a UI).
- **Ressalvas (Falhas Silenciosas):** Encontramos alguns hooks engolindo erros sem notificar a interface ou bloqueando ações essenciais:
  - Hooks como `useFormsData.ts` (linhas 42, 67), `useFormsActions.ts` (linha 42) e `useFinanceData.ts` (linha 35) possuem blocos `try-catch` que terminam num `// logged`, o que é invisível para um cobrador na rua se houver erro de rede.
  - No `useTenantLink.ts`, erros de autorização acionam silenciosamente um estado de "Guest/Sem Permissão" sem informar adequadamente se foi uma queda de rede ou falta real de permissões, potencialmente causando confusão (tela em branco de acesso restrito).

  **Recomendação de Otimização:** 
  1. Implementar um sistema global de "Toasts" (ex: `react-hot-toast` ou o próprio Shadcn Toast se estivesse no stack, porém, dado a estrutura autoral atual, um provider simples serve) para erros assíncronos não capturados localmente, evitando que ações em lote falhem silenciosamente.
  2. Nunca usar blocos vazios ou `// logged` para requisições Firestore. Erros devem mudar o estado da UI para refletir que os dados podem estar desatualizados.

## 3. Resumo de Otimizações Necessárias para Lançamento do Piloto

1. **Limpeza do Legado Monetário:** Atualizar as Queries e Transactions no Firestore para parar de usar os valores que terminam sem "Cents". Todo calculo tem que ser inteiro.
2. **Robustez Offline:** Avaliar se os _Catch Blocks_ que apenas mostram um console log podem impactar a visão do usuário numa oscilação de internet. Em caso afirmativo, exibir um banner laranja discreto: "Você está operando offline" ou "Falha de comunicação".
3. **Padrão de Exibição Local:** Otimizar `fmtCents` e derivados para garantir suporte pleno a internacionalização caso um tenant esteja no idioma ES (atualmente chumbado em `pt-BR` localestring em vários pontos) caso a meta seja a interface bi-língue ser uniforme.
