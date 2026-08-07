# 12. UX e Navegação

O novo ControlMax utilizará React e Tailwind CSS v4 para uma experiência rica de SPA, mas a taxonomia e navegação herdam fortemente a familiaridade do TryController.

## Navegação Global (Shell)
- **Header (Cabeçalho Global):**
  - Exibe o Seletor de Contexto (`Centro de Negócios > Unidade`). `[FONTE: TRYCONTROLLER]`
  - Módulos Principais exibidos no Menu (horizontal ou dropdown dependendo do device): Início, Vendas, Centros de Negócios, Administração, Relatórios. `[FONTE: TRYCONTROLLER]`
- **Preservação de Contexto:** Ao trocar de aba/rota, a Unidade selecionada no Header deve ser preservada em `sessionStorage` para evitar a perda de contexto.

## Componentes de Dados e Listagens
- **Tabelas de Ação:** Componente central que deve replicar a utilidade do "DataTables" legado (Busca global, paginação e Botão de Ação por linha).
- **Estados Vazios (Empty States):** Como o sistema exige a seleção de uma Unidade para funcionar, o dashboard principal iniciará num "Estado Vazio" instruindo explicitamente: *"Selecione uma Unidade e Caixa acima para começar."* `[FONTE: TRYCONTROLLER]`

## Tratamento de Erros e Offline
- **Feedback (Toasts):** Substituindo as falhas silenciosas do ControlMax antigo, toda ação de formulário deve retornar um Toast (Sucesso/Erro).
- **Offline UI:** Uma barra discreta amarela/vermelha no topo indica "Conexão Instável" mantendo a lógica atual do ControlMax, permitindo operações não-críticas e barrando a confirmação de caixas.

## Mobile First (Cobrador) e Desktop First (Admin)
- Módulos sob `Administração`, `Centros de Negócios` e `Relatórios` priorizam layouts Desktop (supervisores/gestores).
- Módulos sob `Vendas` e `Minhas Rotas` priorizam layouts Mobile-first (cobradores na rua).
