# Backlog do Piloto

Baseado na classificação de prioridades (P0), este é o backlog técnico e funcional que o novo ControlMax deve obrigatoriamente possuir para permitir a operação em produção da primeira filial piloto.

## Módulo de Identidade e Acesso
- [ ] Implementar hierarquia organizacional estrita (`Sociedade → CN → Unidade`).
- [ ] Refatorar autenticação para remover hardcoded bypasses (`gringoeletronica`, modos demo).
- [ ] Garantir seletor global de contexto de navegação na UI superior.

## Módulo Financeiro e Caixas
- [ ] Implementar abertura de caixa vinculada estritamente à Unidade e Usuário.
- [ ] Implementar fechamento de caixa (cálculo de saldo final baseado nas transações do dia).
- [ ] Desenvolver rota protegida de backend e UI de bloqueio para o passo de **Confirmação de Caixa** por supervisores.
- [ ] Transferência de saldos (básica) entre caixas do mesmo CN.

## Vendas e Créditos
- [ ] Cadastro seguro de novos clientes e vinculação à Unidade.
- [ ] Emissão de novas Vendas (Créditos) debitando do Caixa aberto.
- [ ] Registro de Pagamentos (Coleções) creditando o Caixa aberto.

## Segurança e Auditoria
- [ ] Sub-sistema de `Audit Logs` imutável, gravando via backend todas as aberturas, fechamentos e pagamentos, devidamente assinados com o `tenantId` e `userId`.
