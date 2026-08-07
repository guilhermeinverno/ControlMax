# 4. Módulos do Sistema

Detalhamento dos módulos identificados na documentação do TryController e presentes/ausentes no ControlMax.

## Empresas/Tenants (Sociedade)
- **Status:** 🔴 AUSENTE (ControlMax possui Tenant básico).
- **TryController:** A "Sociedade" é a raiz, possuindo centros de negócios. Tem CRUD completo.

## Centros de Negócios (CN)
- **Status:** 🔴 AUSENTE / Parcial.
- **TryController:** Consolidação regional. Concentra ingresos, egresos, transferências, mapas e aprovações.

## Unidades (Rotas)
- **Status:** 🟡 EXISTENTE (Como Rotas no ControlMax).
- **TryController:** Pertencem ao CN. Operam os caixas. O Trabalhador é alocado à Unidade.

## Usuários e Perfis (RBAC)
- **Status:** 🟠 EXISTENTE, MAS PRECISA REESTRUTURAÇÃO.
- **TryController:** Gestão de usuários, atribuição granular de perfis e escopos (a quais unidades o usuário tem acesso).
- **ControlMax:** Hardcoded `superadmin`, `admin`, `supervisor`, `collector`.

## Trabalhadores
- **Status:** 🔴 AUSENTE / Mapeado com Usuário.
- **TryController:** Gestão separada do usuário de sistema. O trabalhador possui localização, função, e liquidação.

## Clientes e Lista Negra
- **Status:** 🟡 EXISTENTE (Cadastro básico). 🔴 AUSENTE (Lista Negra).
- **TryController:** Bloqueio de clientes (Lista negra) e Atividade Econômica.

## Vendas, Cobranças e Pagamentos
- **Status:** 🟡 EXISTENTE, MAS PRECISA CORREÇÃO.
- **TryController:** Gestão de "Loans/Créditos". Permite Limpeza de cobrança, Transferência massiva de vendas.

## Caixas (Abertura, Fechamento, Confirmação)
- **Status:** 🟠 EXISTENTE, MAS PRECISA REESTRUTURAÇÃO.
- **TryController:** 3 estados rígidos.
- **Conflito:** No ControlMax atual, Admin consegue editar dados de caixa aberto de outro usuário, burlando a trilha. Isso será removido.

## Movimentos (Gastos, Receitas, Transferências)
- **Status:** 🟡 EXISTENTE.
- **TryController:** Permite transferências entre centros (`/MoneyTranfererHistory/`). Aprovações são obrigatórias para valores altos ou entre contas diferentes. `[NÃO DOCUMENTADO o limite de valor]`

## Aprovações
- **Status:** 🔴 AUSENTE.
- **TryController:** Módulo para supervisor/gerente aprovar transferências pendentes.

## Localização e Mapas
- **Status:** 🟢 EXISTENTE E COMPATÍVEL (Collector Map via Leaflet).
- **TryController:** "Ubicar Mis Trabajadores".

## Dispositivos
- **Status:** 🟡 EXISTENTE.
- **TryController:** Vincular dispositivos, relatório de vinculados, sincronização.

## Seguros e Formulários
- **Status:** 🔴 AUSENTE (No ControlMax tem rotas, mas vazias/básicas).
- **TryController:** Visualização de seguros e rotinas de faturamento. `[NÃO DOCUMENTADO]` fluxo completo.

## Relatórios e Auditoria
- **Status:** 🔴 AUSENTE (Telas completas e geração assíncrona).
- **TryController:** Relatórios exportáveis (Excel). Log de Ações e Log Móvel para trilha irrefutável.

## Alertas/Pânico
- **Status:** 🔴 AUSENTE.
- **TryController:** Histórico de alertas de pânico do app móvel.

## Assistente IA
- **Status:** 🟢 EXISTENTE (Gemini).
- **TryController:** 🔴 AUSENTE. (Diferencial competitivo do ControlMax).
