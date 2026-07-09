# ControlMax — Guia de Configuração de Índices do Cloud Firestore

Este documento descreve e orienta a criação dos **índices compostos** necessários no Cloud Firestore para garantir a performance de consultas críticas e evitar erros de indexação em produção na plataforma **ControlMax**.

---

## 🔗 Link Direto para o Console Firebase

Para o projeto atual do usuário (`ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d`), o link direto para gerenciar os índices é:
👉 **[Firebase Console — Firestore Indexes](https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes)**

---

## 🛠️ Índices Compostos Requeridos (1 ao 16)

### 1. Coleção: `boxes` (Resumo do Dia)
*   **Campos**:
    *   `tenantId` ──> **Crescente** (Ascending)
    *   `openedAt` ──> **Crescente** (Ascending)
*   **Motivo**: Utilizado na query do card **"Resumo do Dia"** do Dashboard para buscar caixas do tenant atual iniciadas a partir do início do dia corrente.
*   **Link de criação direta**: 
    👉 [Criar Índice 1](https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes/v2/create?collectionGroup=boxes&queryScope=COLLECTION&fields=tenantId:ASCENDING,openedAt:ASCENDING)

---

### 2. Coleção: `boxes` (Tabela Principal)
*   **Campos**:
    *   `tenantId` ──> **Crescente** (Ascending)
    *   `openedAt` ──> **Decrescente** (Descending)
*   **Motivo**: Utilizado na query da **Tabela Principal** do Dashboard para listar em tempo real e de forma ordenada as caixas mais recentes do inquilino.
*   **Link de criação direta**: 
    👉 [Criar Índice 2](https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes/v2/create?collectionGroup=boxes&queryScope=COLLECTION&fields=tenantId:ASCENDING,openedAt:DESCENDING)

---

### 3. Coleção: `boxes` (Busca de Caixa Ativo)
*   **Campos**:
    *   `tenantId` ──> **Crescente** (Ascending)
    *   `userId` ──> **Crescente** (Ascending)
    *   `status` ──> **Crescente** (Ascending)
*   **Motivo**: Utilizado pelo hook global `useBox` para identificar instantaneamente se o cobrador autenticado possui um caixa ativo (`status == 'open'`) sob seu inquilino.
*   **Link de criação direta**: 
    👉 [Criar Índice 3](https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes/v2/create?collectionGroup=boxes&queryScope=COLLECTION&fields=tenantId:ASCENDING,userId:ASCENDING,status:ASCENDING)

---

### 4. Coleção: `incomes` (Agregação de Entradas)
*   **Campos**:
    *   `tenantId` ──> **Crescente** (Ascending)
    *   `boxId` ──> **Crescente** (Ascending)
*   **Motivo**: Utilizado no processo de auditoria e consolidação financeira do fechamento de caixas (`closeBox`) para agrupar e somar as entradas do caixa específico.
*   **Link de criação direta**: 
    👉 [Criar Índice 4](https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes/v2/create?collectionGroup=incomes&queryScope=COLLECTION&fields=tenantId:ASCENDING,boxId:ASCENDING)

---

### 5. Coleção: `expenses` (Agregação de Gastos)
*   **Campos**:
    *   `tenantId` ──> **Crescente** (Ascending)
    *   `boxId` ──> **Crescente** (Ascending)
*   **Motivo**: Utilizado no processo de auditoria e consolidação financeira do fechamento de caixas (`closeBox`) para agrupar e subtrair as despesas do caixa específico.
*   **Link de criação direta**: 
    👉 [Criar Índice 5](https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes/v2/create?collectionGroup=expenses&queryScope=COLLECTION&fields=tenantId:ASCENDING,boxId:ASCENDING)

---

### 6. Coleção: `transfers` (Consolidação de Transferências)
*   **Campos**:
    *   `tenantId` ──> **Crescente** (Ascending)
    *   `boxId` ──> **Crescente** (Ascending)
*   **Motivo**: Utilizado para buscar e somar as transferências de dinheiro realizadas dentro de um caixa específico durante a sua consolidação financeira.
*   **Link de criação direta**: 
    👉 [Criar Índice 6](https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes/v2/create?collectionGroup=transfers&queryScope=COLLECTION&fields=tenantId:ASCENDING,boxId:ASCENDING)

---

### 7. Coleção: `sales` (Consolidação de Vendas)
*   **Campos**:
    *   `tenantId` ──> **Crescente** (Ascending)
    *   `boxId` ──> **Crescente** (Ascending)
*   **Motivo**: Utilizado para buscar e auditar as vendas registradas vinculadas a uma caixa de cobrança específica.
*   **Link de criação direta**: 
    👉 [Criar Índice 7](https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes/v2/create?collectionGroup=sales&queryScope=COLLECTION&fields=tenantId:ASCENDING,boxId:ASCENDING)

---

### 8. Coleção: `credit_requests` (Solicitações de Crédito Ordenadas)
*   **Campos**:
    *   `tenantId` ──> **Crescente** (Ascending)
    *   `createdAt` ──> **Decrescente** (Descending)
*   **Motivo**: Utilizado para buscar solicitações de crédito do inquilino de maneira ordenada e cronológica na tela de gerenciamento de solicitações de crédito.
*   **Link de criação direta**: 
    👉 [Criar Índice 8](https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes/v2/create?collectionGroup=credit_requests&queryScope=COLLECTION&fields=tenantId:ASCENDING,createdAt:DESCENDING)

---

### 9. Coleção: `credit_requests` (Desempenho de Solicitações do Cobrador)
*   **Campos**:
    *   `tenantId` ──> **Crescente** (Ascending)
    *   `requestedById` ──> **Crescente** (Ascending)
    *   `createdAt` ──> **Crescente** (Ascending)
*   **Motivo**: Utilizado na tela de desempenho (`Performance.tsx`) para obter e auditar as solicitações enviadas por um cobrador específico durante o dia.
*   **Link de criação direta**: 
    👉 [Criar Índice 9](https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes/v2/create?collectionGroup=credit_requests&queryScope=COLLECTION&fields=tenantId:ASCENDING,requestedById:ASCENDING,createdAt:ASCENDING)

---

### 10. Coleção: `collections` (Rendimentos diários do Cobrador)
*   **Campos**:
    *   `tenantId` ──> **Crescente** (Ascending)
    *   `userId` ──> **Crescente** (Ascending)
    *   `createdAt` ──> **Crescente** (Ascending)
*   **Motivo**: Utilizado para buscar cobranças realizadas por um cobrador específico no dia atual para consolidar suas estatísticas de progresso diário.
*   **Link de criação direta**: 
    👉 [Criar Índice 10](https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes/v2/create?collectionGroup=collections&queryScope=COLLECTION&fields=tenantId:ASCENDING,userId:ASCENDING,createdAt:ASCENDING)

---

### 11. Coleção: `collections` (Histórico Global de Cobranças)
*   **Campos**:
    *   `tenantId` ──> **Crescente** (Ascending)
    *   `createdAt` ──> **Decrescente** (Descending)
*   **Motivo**: Utilizado na tela de histórico global de pagamentos para obter as cobranças mais recentes do inquilino ordenadas por data de criação.
*   **Link de criação direta**: 
    👉 [Criar Índice 11](https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes/v2/create?collectionGroup=collections&queryScope=COLLECTION&fields=tenantId:ASCENDING,createdAt:DESCENDING)

---

### 12. Coleção: `collections` (Histórico de Cobrança por Venda)
*   **Campos**:
    *   `tenantId` ──> **Crescente** (Ascending)
    *   `saleId` ──> **Crescente** (Ascending)
    *   `createdAt` ──> **Decrescente** (Descending)
*   **Motivo**: Utilizado na tela de detalhe de venda para buscar de forma rápida e ordenada todos os pagamentos/recolhimentos associados a um financiamento.
*   **Link de criação direta**: 
    👉 [Criar Índice 12](https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes/v2/create?collectionGroup=collections&queryScope=COLLECTION&fields=tenantId:ASCENDING,saleId:ASCENDING,createdAt:DESCENDING)

---

### 13. Coleção: `boxes` (Filtragem por Cobrador e Período)
*   **Campos**:
    *   `tenantId` ──> **Crescente** (Ascending)
    *   `userId` ──> **Crescente** (Ascending)
    *   `openedAt` ──> **Crescente** (Ascending)
*   **Motivo**: Utilizado na sincronização do estado de caixa no início do dia e telas analíticas para saber o estado do caixa para um determinado cobrador em uma data.
*   **Link de criação direta**: 
    👉 [Criar Índice 13](https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes/v2/create?collectionGroup=boxes&queryScope=COLLECTION&fields=tenantId:ASCENDING,userId:ASCENDING,openedAt:ASCENDING)

---

### 14. Coleção: `incomes` (Visualização Cronológica de Entradas)
*   **Campos**:
    *   `tenantId` ──> **Crescente** (Ascending)
    *   `createdAt` ──> **Decrescente** (Descending)
*   **Motivo**: Utilizado na listagem de receitas para exibir os lançamentos adicionais mais recentes do inquilino organizados cronologicamente.
*   **Link de criação direta**: 
    👉 [Criar Índice 14](https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes/v2/create?collectionGroup=incomes&queryScope=COLLECTION&fields=tenantId:ASCENDING,createdAt:DESCENDING)

---

### 15. Coleção: `expenses` (Visualização Cronológica de Despesas)
*   **Campos**:
    *   `tenantId` ──> **Crescente** (Ascending)
    *   `createdAt` ──> **Decrescente** (Descending)
*   **Motivo**: Utilizado na listagem de despesas gerais e fluxos de aprovação de despesas para exibir as saídas de caixa de forma ordenada.
*   **Link de criação direta**: 
    👉 [Criar Índice 15](https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes/v2/create?collectionGroup=expenses&queryScope=COLLECTION&fields=tenantId:ASCENDING,createdAt:DESCENDING)

---

### 16. Coleção: `insurance_applications` (Candidatos de Seguro Recentes)
*   **Campos**:
    *   `tenantId` ──> **Crescente** (Ascending)
    *   `createdAt` ──> **Decrescente** (Descending)
*   **Motivo**: Utilizado no painel de seguros (`Insurance.tsx`) para listar as propostas de apólice e acompanhamentos ordenados de forma descendente.
*   **Link de criação direta**: 
    👉 [Criar Índice 16](https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes/v2/create?collectionGroup=insurance_applications&queryScope=COLLECTION&fields=tenantId:ASCENDING,createdAt:DESCENDING)

---

## 🤖 Deploy Automatizado via Firebase CLI (Infraestrutura como Código)

Caso queira automatizar a criação usando o seu terminal, salve o conteúdo abaixo no arquivo `firestore.indexes.json` na raiz do seu projeto:

```json
{
  "indexes": [
    {
      "collectionGroup": "boxes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "openedAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "boxes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "openedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "boxes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "incomes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "boxId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "boxId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "transfers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "boxId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "sales",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "boxId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "credit_requests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "credit_requests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "requestedById", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "collections",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "collections",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "collections",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "saleId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "boxes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "openedAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "incomes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "insurance_applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### Comando para Deploy:
Com o arquivo salvo, execute no seu terminal:
```bash
firebase deploy --only firestore:indexes
```
Após o envio, o Firebase começará a construir os índices em segundo plano. O status poderá ser acompanhado diretamente pelo console da ferramenta.
