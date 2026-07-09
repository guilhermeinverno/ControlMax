# ControlMax — Manual de Arquitetura Técnica e Plano de Garantia de Qualidade (QA)

Este documento descreve a infraestrutura de engenharia, os padrões de consistência de dados e o plano de testes sistemáticos da plataforma **ControlMax**. Ele serve como guia oficial de homologação para engenheiros de QA e revisores técnicos de segurança.

---

## 1. Visão Geral e Arquitetura do Sistema

O ControlMax foi projetado sob os mais estritos princípios de escalabilidade e confiabilidade financeira, assegurando a gestão de volumes elevados de transações diárias.

### 1.1 Stack de Engenharia
- **Frontend**: React 19 + TypeScript (Strict Mode) + Vite + Tailwind CSS v4.
- **Backend / Banco de Dados**: Firebase 12 (Cloud Firestore) com persistência offline e reatividade em tempo real.
- **Isolamento de Estado**: Sincronização assíncrona orientada a eventos através de Snapshots do Firestore.

### 1.2 Isolamento Multi-Tenant (Segurança de Dados)
O sistema opera em um modelo multi-inquilino rígido (*Multi-tenant*). Cada empresa ou franquia cadastrada possui um `tenantId` único e imutável.
- **Garantia de Isolamento**: Toda consulta de leitura ou gravação no Firestore inclui obrigatoriamente a cláusula `where('tenantId', '==', tenantId)`.
- **Regras de Segurança (Firestore Rules)**: Bloqueios em nível de servidor impedem que um usuário autenticado leia ou escreva em documentos contendo um `tenantId` diferente daquele associado ao seu perfil no nó `/users`.

---

## 2. Modelagem de Dados e Ciclo de Vida do Caixa

O núcleo funcional do sistema baseia-se no controle rígido de caixas gerenciados por cobradores locais.

### 2.1 Estrutura de Dados do Caixa (`Box`)
No Firestore, os caixas são mapeados na coleção `/boxes` seguindo o esquema tipado abaixo:

```typescript
interface Box {
  id: string;               // UUID gerado pelo Firestore
  tenantId: string;         // Identificador do inquilino (isolamento)
  unitId: string;           // Identificador da rota/unidade de cobrança
  unitName: string;         // Nome amigável da rota
  cnId: string;             // Identificador do Centro de Negócios (CN)
  cnName: string;           // Nome amigável do Centro de Negócios
  userId: string;           // ID do cobrador responsável
  userName: string;         // Nome do cobrador responsável
  status: 'open' | 'closed' | 'confirmed';
  openedAt: Timestamp;      // Carimbo de data/hora de abertura
  closedAt?: Timestamp;     // Carimbo de data/hora de fechamento
  confirmedAt?: Timestamp;  // Carimbo de data/hora de auditoria/confirmação
  
  // Valores expressos estritamente em centavos (Inteiro)
  initialAmount: number;    // Saldo inicial de abertura
  totalIncomes: number;     // Entradas manuais
  totalExpenses: number;    // Saídas/despesas operacionais
  totalSales: number;       // Vendas de produtos/serviços
  totalCollections: number; // Cobranças/recaudos executados
  totalTransfers: number;   // Transferências de valores
  finalAmount: number;      // Saldo final real consolidado
}
```

### 2.2 Ciclo de Estados
```
  [ Aberto / open ] ──> [ Fechado / closed ] ──> [ Confirmado / confirmed ]
   (Cobrador opera)      (Cobrador encerra)       (Auditoria/Supervisor)
```
1. **Aberto (`open`)**: O caixa recebe transações operacionais instantâneas. O saldo é calculado de forma incremental:
   $$\text{finalAmount} = \text{initialAmount} + \text{totalIncomes} - \text{totalExpenses} + \text{totalCollections} - \text{totalTransfers}$$
2. **Fechado (`closed`)**: O cobrador finaliza o turno de trabalho. O caixa fica bloqueado para novas alterações operacionais diretas.
3. **Confirmado (`confirmed`)**: O Supervisor ou Administrador valida o fechamento físico e aprova o saldo para consolidação bancária.

---

## 3. Precisão Financeira Estrita (Manejo de Centavos)

Para mitigar imprecisões de arredondamento inerentes a números de ponto flutuante em JavaScript/TypeScript (padrão IEEE 754), o ControlMax implementa **armazenamento estrito de valores monetários em números inteiros (centavos)**.

- **Regra Geral**: $R\$\ 1,00 = 100\text{ centavos}$.
- **Cálculos**: Multiplicações, somas e subtrações de caixa são processadas nativamente em inteiros absolutos.
- **Formatação de Exibição**: A conversão ocorre apenas no momento da renderização visual através da função utilitária `fmt`:

```typescript
export const fmt = (cents: number): string => {
  return (cents / 100).toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};
```

---

## 4. Plano de Testes Detalhado para o QA

O engenheiro de QA deve realizar os seguintes testes de homologação antes do deploy de produção de cada versão.

### Grupo 1: Isolamento de Dados e Tenant (Segurança)

#### **CT-01.1: Validação de Fronteira Multi-Tenant**
- **Objetivo**: Garantir que um usuário de uma empresa parceira A jamais consiga ver registros da empresa parceira B.
- **Procedimento**:
  1. Efetue login com o perfil associado ao inquilino `Tenant-Alpha`.
  2. Abra uma aba de depuração no navegador e monitore a aba *Network*.
  3. Verifique se os dados apresentados no Dashboard trazem exclusivamente dados deste `tenantId`.
  4. Force a alteração manual do `tenantId` via console de desenvolvimento para `Tenant-Beta`.
  5. **Resultado Esperado**: O Firestore deve bloquear imediatamente a consulta retornando erro de permissão negada (`Missing or insufficient permissions`), provando a integridade das Regras de Segurança.

#### **CT-01.2: Restrição de Roles e Telas**
- **Objetivo**: Validar se perfis de Cobradores (`collector`) não acessam ações exclusivas de Supervisores ou Administradores.
- **Procedimento**:
  1. Autentique-se com um usuário que tenha `role = 'collector'`.
  2. Verifique se o Dashboard oculta ou bloqueia a edição de chaves automáticas e parametrizações críticas.
  3. Tente acessar rotas administrativas.
  4. **Resultado Esperado**: O sistema impede acessos não autorizados e redireciona o usuário para telas condizentes com o perfil de Cobrador.

---

### Grupo 2: Fluxo do Caixa e Sincronização em Tempo Real

#### **CT-02.1: Sincronização Simultânea no Dashboard**
- **Objetivo**: Validar a atualização do painel administrativo por meio de ouvintes ativos (`onSnapshot`) em tempo real.
- **Procedimento**:
  1. Abra a tela de **Dashboard** do ControlMax em dois monitores distintos.
  2. No primeiro monitor, simule uma operação de abertura, fechamento ou lançamento de caixa.
  3. No segundo monitor, apenas observe o comportamento da tabela principal e dos cards de resumo diário.
  4. **Resultado Esperado**: Sem qualquer necessidade de recarregar a página (F5), a tabela principal do segundo monitor e os agregados do **Resumo do Dia** devem atualizar os valores monetários em menos de 1 segundo de forma fluida.

#### **CT-02.2: Sincronização e Fallback do Resumo Diário**
- **Objetivo**: Testar se a query agregadora de caixas do dia funciona perfeitamente, mesmo se o índice composto no Firestore ainda estiver em processo de criação.
- **Procedimento**:
  1. Monitore o console de desenvolvimento ao acessar o Dashboard pela primeira vez em um ambiente virgem.
  2. Caso ocorra erro de indexação composto devido às ordens de filtro de tempo, verifique se a lógica secundária entra em ação (Fallback sem ordenação manual).
  3. **Resultado Esperado**: O sistema captura o erro graciosamente, aciona a query secundária em segundo plano e apresenta os totais consolidados de Caixas Abertas, Fechadas e Confirmadas perfeitamente.

---

### Grupo 3: Precisão Financeira e Validação Matemática

#### **CT-03.1: Validação de Acúmulos de Caixa**
- **Objetivo**: Comprovar que transações fracionadas não geram resíduos numéricos decimais.
- **Procedimento**:
  1. Registre um saldo inicial de caixa de $R\$\ 100,00$ ($10000$ centavos).
  2. Execute 10 lançamentos de despesas consecutivas de $R\$\ 10,01$ ($1001$ centavos cada).
  3. **Resultado Esperado**:
     - O valor acumulado de gastos deve somar exatamente $R\$\ 100,10$ ($10010$ centavos).
     - O saldo atualizado deve ser exibido como negativo de $-R\$\ 0,10$.
     - Em nenhum momento o saldo deve exibir valores flutuantes como `-0.09999999999` no console ou tela.

---

## 5. Diretrizes de Diagnóstico para o QA

Caso um bug seja detectado durante o ciclo de testes, o QA deve anexar o seguinte checklist no ticket de correção:

1. **Estado de Conectividade**: O erro ocorre em modo offline ou com oscilação de rede? (O Firestore possui persistência local habilitada nativamente).
2. **Contexto de Inquilino**: Qual o `tenantId` e `role` do usuário de teste?
3. **Log de Console**: Captura de tela do console de desenvolvimento para verificação de mensagens de erro emitidas pelo SDK do Firebase.
4. **ID do Documento**: O ID do caixa envolvido (Caja ID) para permitir auditoria rápida no console administrativo do Firebase Console.
