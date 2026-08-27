```markdown
# Guia de Funcionalidades e Evolução Arquitetural — ControlMax

Documento consolidado com o ecossistema de funcionalidades já entregues no ControlMax e o plano de evolução para maturidade SaaS Enterprise.

---

## 1. Mapeamento de Funcionalidades Existentes

### 1.1 Núcleo Operacional e Financeiro
* **Gestão de Caixas (BFF + Sync):** Abertura, fechamento, confirmação e resumos operacionais. Fluxo controlado pelo servidor com suporte a transações e regras estritas de conciliação.
* **Motor de Vendas e Cobranças:** Registro de vendas, pagamentos de parcelas, visitas sem pagamento (*no-payment*) e estornos. Operações tratadas via endpoints dedicados do BFF.
* **Garantia de Centavos:** Armazenamento rigoroso de valores monetários como números inteiros em centavos em todo o pipeline e banco de dados, convertendo para moeda legível apenas no front-end.
* **Mecanismo de Idempotência:** Prevenção contra cobranças e registros duplicados utilizando chaves de idempotência (`x-idempotency-key`) no cabeçalho e corpo das requisições financeiras.

### 1.2 Resiliência e Operação Offline
* **Sync Manager (IndexedDB):** Executores locais que capturam transações quando o dispositivo perde conectividade, mantendo uma fila resiliável que sincroniza com o BFF assim que a rede é restabelecida.
* **Indicadores Visuais de Conectividade:** Status de fila de sincronização com badges na interface em tempo real.

### 1.3 Entidades do Sistema e Administração
* **Gestão Multi-tenant:** Isolamento lógico de dados com a obrigatoriedade da propriedade `tenantId` em todas as consultas e escritas, reforçado por `firestore.rules`.
* **Hierarquia Organizacional:** Estruturação de centros de negócio (*Business Centers*) e vínculo de usuários por unidades operacionais (`usuario_unidades`).
* **Clientes e Formulários Dinâmicos:** Cadastro completo com anexos/referências, formulários configuráveis via builder e modal de preenchimento dinâmico.
* **Calendário Operacional:** Módulo de feriados para bloqueio e ajuste de vencimentos operacionais.

### 1.4 Assistente IA (Gemini Integration)
* **Assistente de Voz e Texto:** Rota `/api/gemini/assistant` no Express com envio de contexto operacional do tenant e processamento de linguagem natural.

---

## 2. Matriz do Ecossistema Atual vs. Sugestões de Evolução

| Módulo | Estado Atual (Implementado) | Sugestão de Evolução (Enterprise) |
| :--- | :--- | :--- |
| **Segurança & RBAC** | Controle de acesso por roles estáticas e validação no Firestore | Matriz Dinâmica de Permissões (`tenant_roles`) + Custom User Claims nativas |
| **Auditoria** | Registros de logs pontuais no backend (`security_logs`) | Audit Log Unificado e Imutável (`audit_logs`) com diff automático de edições |
| **Arquitetura Financeira** | Estado atualizado em tempo real por documento | Double-Entry Ledger (Escrituração por Partida Dobrada) e imutabilidade |
| **Validação de Dados** | Mappers locais e regras de frontend | Validação estrita de esquemas no servidor via Zod nos DTOs do BFF |
| **Infraestrutura** | Deploy Vercel (Front) e Hosting Node (Back) | Infraestrutura como Código (Terraform) + Rate Limiting via Redis |
| **Inteligência (IA)** | Envio de contexto bruto para o Gemini API | Arquitetura RAG (Retrieval-Augmented Generation) com busca semântica |

---

## 3. Guia de Funcionalidades Recomendadas para Implementação

### 3.1 Controle de Acesso Dinâmico (RBAC por Matriz)

**Objetivo:** Permitir que o administrador crie e customize perfis de acesso (ex: Vendedor, Cobrador, Secretária) atrelando permissões granulares por módulo.

* **Estrutura de Dados (`tenant_roles`):**
  ```typescript
  export interface TenantRole {
    id: string;
    tenantId: string;
    name: string;
    permissions: {
      sales: { read: boolean; create: boolean; cancel: boolean };
      collections: { read: boolean; create: boolean; confirm: boolean };
      boxes: { open: boolean; close: boolean; viewSummary: boolean };
      customers: { read: boolean; create: boolean; edit: boolean; delete: boolean };
      platform: { manageSettings: boolean; manageUsers: boolean; manageRoles: boolean };
    };
  }

```

* **Hook Frontend (`useHasPermission`):**
```typescript
export function useHasPermission() {
  const { userPermissions } = useAuth();
  return {
    can: (module: string, action: string) => !!userPermissions?.[module]?.[action]
  };
}

```



### 3.2 Motor de Auditoria Unificado (`audit_logs`)

**Objetivo:** Rastrear todas as alterações executadas em registros do sistema, garantindo que não existam edições invisíveis ou edições sem autoria.

* **Payload do Log de Auditoria:**
```typescript
export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  action: 'UPDATE' | 'DELETE' | 'REVERSAL';
  entity: 'sales' | 'customers' | 'boxes' | 'platform_settings';
  entityId: string;
  changes: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }>;
  reason?: string;
  timestamp: string;
}

```



### 3.3 Motor de Escrituração Financeira (Double-Entry Ledger)

**Objetivo:** Garantir a imutabilidade do saldo financeiro e eliminar concorrência de escritas (*race conditions*) em caixas simultâneos.

```
┌─────────────────────────┐
│ Movimentação Financeira │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│  Entrada de Débito (+)  │ ──► │  Entrada de Crédito (-) │
│  Ex: Caixa Unidade 01   │     │  Ex: Conta Recebíveis   │
└─────────────────────────┘     └─────────────────────────┘

```

* **Estrutura do Registro do Ledger:**
```typescript
export interface LedgerEntry {
  id: string;
  tenantId: string;
  transactionId: string;
  debitAccount: string;  // Conta que recebe o valor
  creditAccount: string; // Conta de onde sai o valor
  amountCents: number;   // Valor em centavos
  timestamp: string;
}

```



---

## 4. Diretrizes para Eliminação de Becos Sem Saída (UX & Resilience)

Para manter a aplicação sem telas estáticas ou com comportamentos bloqueantes durante exceções:

1. **Garantia de Fallback de Interface:**
* Qualquer erro `4xx` ou `5xx` no BFF não deve fechar modais de formulário ativamente; o erro deve ser sinalizado visualmente preservando o estado digitado pelo usuário.
* Telas de listagem vazias devem exibir estados com ilustrações informativas e ações claras (ex: *"Criar Novo Registro"* ou *"Limpar Filtros"*).


2. **Proteção Contra Erros Globais:**
* Envolver rotas críticas em componentes de `ErrorBoundary` locais, permitindo recarregar o módulo isoladamente sem derrubar toda a Single Page Application (SPA).


3. **Mutações Sempre Reversíveis com Justificativa:**
* Ações destrutivas ou de estorno exigem um campo obrigatório de motivo (*reason*), alimentando o módulo de auditoria automaticamente.



```

```