# Funcionalidades Faltantes (Gaps)

Com base na engenharia reversa do TryController, identificamos as seguintes funcionalidades ausentes no ControlMax atual que precisam ser criadas para atingir paridade:

## 1. Contexto Organizacional Estrito
- **Faltante:** Estrutura completa de `Sociedade → Centro de Negócios → Unidade → Caixa`.
- **Faltante:** Seletor global no cabeçalho persistente que define o contexto da sessão do usuário.

## 2. Catálogo de Relatórios Dinâmicos
- **Faltante:** Central de relatórios assíncronos (Vendas, Plataforma, Alertas, Localização).
- **Faltante:** Filtros avançados e geração de exportações em Excel (`SheetJS/XLSX`).

## 3. Fluxos Administrativos Avançados
- **Faltante:** Módulo de aprovações (transferências financeiras que requerem validação de nível superior).
- **Faltante:** Lista negra de clientes e mapeamento de atividade econômica.
- **Faltante:** Faturamento de serviços SaaS para os tenants e gestão de apólices de seguros.
- **Faltante:** Abertura e Fechamento massivo de caixas por centro de negócios.

## 4. Auditoria Imutável
- **Faltante:** Visualização estruturada de Logs de Ações e Logs Móveis na interface administrativa (atualmente há apenas uma coleção `security_logs` com bugs).
