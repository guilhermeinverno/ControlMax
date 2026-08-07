# 1. Visão Geral do Sistema

## Propósito
O novo **ControlMax** é uma evolução do modelo legado de controle e auditoria financeira (inspirado no TryController), desenvolvido como uma SPA moderna (React), escalável e multi-tenant (SaaS). 

## Objetivos Arquiteturais
- **Migração Transparente:** A interface e os fluxos de trabalho devem manter familiaridade estrutural com o sistema anterior para reduzir a curva de aprendizagem dos mais de 200 operadores de campo.
- **Isolamento Absoluto:** Todo dado trafegado, lido e gravado deve pertencer inquestionavelmente ao contexto hierárquico validado no servidor (`Sociedade → Centro de Negócios → Unidade`).
- **Precisão Centesimal:** A matemática do sistema não tolera perdas por flutuação. Todos os montantes são transacionados em inteiros (centavos).

## Escopo
A plataforma atende à cadeia de microcrédito e cobrança local:
1. Um Cobrador inicia seu dia, **Abre seu Caixa** associado à sua Unidade.
2. Vai a campo, cadastra clientes, concede novos créditos (Vendas) e recolhe parcelas (Coleções/Pagamentos).
3. Ao fim do dia, retorna à base, realiza conciliação e **Fecha o Caixa**.
4. A gerência audita o numerário, confere o relatório, realiza a **Confirmação de Caixa** e eventualmente **Transfere** saldos aos cofres centrais.
