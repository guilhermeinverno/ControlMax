# Análise Comparativa: TryController vs ControlMax Atual

Este documento consolida a análise entre as funcionalidades mapeadas no TryController e o estado atual do projeto ControlMax.

## Classificação
- 🟢 EXISTENTE E COMPATÍVEL
- 🟡 EXISTENTE, MAS PRECISA CORREÇÃO
- 🟠 EXISTENTE, MAS PRECISA REESTRUTURAÇÃO
- 🔴 AUSENTE / PRECISA SER CRIADO

## Prioridades
- **P0** — obrigatório para o piloto
- **P1** — importante para a operação
- **P2** — pode ser implementado depois
- **P3** — evolução futura

## Módulos e Funcionalidades

| Módulo / Funcionalidade | TryController | ControlMax Atual | Status | Prioridade |
| :--- | :--- | :--- | :--- | :--- |
| **Arquitetura Base** | ASP.NET MVC / jQuery | React SPA / Node.js / Firestore | 🟠 EXISTENTE, MAS PRECISA REESTRUTURAÇÃO | P0 |
| **Hierarquia (Sociedade → CN → Unidade)** | Existente e mandatória | Apenas Tenant, Unit e User | 🔴 AUSENTE / PRECISA SER CRIADO | P0 |
| **Gestão de Caixas (Abertura/Fechamento)** | Sim | Sim | 🟡 EXISTENTE, MAS PRECISA CORREÇÃO | P0 |
| **Confirmação de Caixas** | Sim (Fluxo 3 estados) | Parcial (Rota backend existe) | 🟠 EXISTENTE, MAS PRECISA REESTRUTURAÇÃO | P0 |
| **Transferências entre Caixas/Centros** | Sim | Sim, básico | 🟡 EXISTENTE, MAS PRECISA CORREÇÃO | P1 |
| **Vendas e Créditos** | Sim | Sim | 🟡 EXISTENTE, MAS PRECISA CORREÇÃO | P0 |
| **Clientes (Lista Negra, Atividade Econômica)** | Sim | Cadastro básico apenas | 🔴 AUSENTE / PRECISA SER CRIADO | P1 |
| **Gestão de Trabalhadores / Perfis** | Sim | Usuários básicos (RBAC hardcoded) | 🟠 EXISTENTE, MAS PRECISA REESTRUTURAÇÃO | P0 |
| **Catálogo de Relatórios e Exportação Excel** | Extenso e exportável | Listas simples na UI | 🔴 AUSENTE / PRECISA SER CRIADO | P1 |
| **Trilha de Auditoria (Logs)** | Sim | Log falhando por tenantId | 🟡 EXISTENTE, MAS PRECISA CORREÇÃO | P0 |
| **Contexto Global de Navegação** | Seletor de CN e Unidade no cabeçalho | Ausente/Implícito | 🔴 AUSENTE / PRECISA SER CRIADO | P0 |
| **Aprovações de Movimentações** | Sim | Inexistente/Mapeado parcialmente | 🔴 AUSENTE / PRECISA SER CRIADO | P1 |
| **Gestão de Dispositivos e Sincronização** | Sim | Mapeamento inicial `devices` | 🟡 EXISTENTE, MAS PRECISA CORREÇÃO | P1 |
| **Faturamento e Seguros** | Sim | Rotas vazias / Mockadas | 🔴 AUSENTE / PRECISA SER CRIADO | P2 |
| **Assistente de IA (Voicebot)** | Não | Sim (Gemini) | 🟢 EXISTENTE E COMPATÍVEL | P3 |
