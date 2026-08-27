# Engenharia reversa observável — TryController

## Escopo e limites

A análise é **não destrutiva** e limitada à interface, aos fluxos e aos comportamentos disponíveis na conta autorizada. Nenhuma credencial foi registrada neste arquivo.

## Autenticação

- URL inicial: `https://trycontroller.co/`
- Rota após autenticação: `/Application/Index`
- Formulário de login com campos de e-mail e senha, opção de recuperação e botão de acesso.
- Autenticação concluída com sucesso.

## Estrutura inicial autenticada

A navegação superior expõe os módulos principais **Inicio**, **Estadísticas**, **Ventas**, **Centros de negocios**, **Administración**, **Reportes** e **Novedades**. Há ainda um menu de perfil identificado pelo nome de exibição **Nick**.

A tela inicial mostra uma seleção hierárquica de unidades: **Todas las unidades (1) > Brazil (1) > Distrito Federal (1) > 3 - RT 03**. Existe a opção **Ver todas las unidades**, incluindo indicação de unidades inativas.

Na parte inferior aparecem atalhos para **Resumen**, **Pregastos** e **Transferencias**. Também há uma barra lateral rápida com as abas **Contactos** e **Grupos**, além de controle para exibir a árvore de parceiros/unidades.

## Observações técnicas preliminares

- A aplicação usa rotas com padrão semelhante a ASP.NET MVC, como `/Application/Index`.
- Recursos estáticos observados incluem caminhos sob `/Images/` e `/images/`.
- O conteúdo principal da tela inicial parece depender de carregamento dinâmico após a autenticação.

## Painel de estatísticas / acompanhamento operacional

A visualização de acompanhamento apresenta filtros por centro de negócios, unidade e estado da caixa. Os estados disponíveis observados são **Todos**, **Sin cajas**, **Abierta**, **Cerrada** e **Confirmada**. A grade contém as colunas **Score**, **Unidad**, **CN**, **Ubicación**, **Estado**, **Caja**, **Fecha de la Caja**, **Caja Inicial**, **Caja Final**, **Progreso**, **Ultima Sincronización** e **PIN / Versión App**.

Para a unidade visível, a tela mostra uma caixa confirmada, percentual de progresso e dados de sincronização do aplicativo. Esses valores são dados operacionais da conta e serão tratados apenas como exemplos de estrutura, não como conteúdo para reprodução.

## Menu Vendas

O menu **Ventas** contém os seguintes destinos observáveis: **Ingresos / Complementarios**, **Gastos**, **Ventas**, **Gestión de caja: Abrir y cerrar**, **Resumen**, **Crear llave**, **Limpieza de cobro**, **Resumen por periodo**, **Apertura masiva de cajas** e **Transferencia masiva de ventas**.

Também foram observados dois elementos de engajamento: uma pesquisa NPS de escala 1 a 5 com opção de lembrar mais tarde e um carrossel informativo/promocional em modal. A pesquisa foi fechada sem envio; o carrossel foi fechado apenas localmente para liberar a navegação.

## Menu Centros de negócios

O menu **Centros de negocios** expõe **Ingresos**, **Egresos**, **Transferencia de dinero**, **Aprobar transferencias**, **Gestión de caja: Abrir y cerrar**, **Resumen**, **Mapa**, **Facturación**, **Aprobaciones**, **Resumen por periodo**, **Cierre masivo de cajas**, **Traslado de unidades**, **Seguros** e **Finance**.

## Menu Administração

O menu **Administración** está dividido em **Gestión de Plataforma**, **Gestión de Usuarios** e **Gestión de Clientes**. A organização sugere uma separação entre configuração estrutural, identidade/permissões e entidades de clientes.

## Menu Relatórios

O menu **Reportes** inclui **Ventas**, **Plataforma**, **Procesos encolados**, **Log de Acciones**, **Log Móvil**, **Reportes Personalizados**, **Ubicar Mis Trabajadores**, **Reportes Rápidos**, **Reporte Dispositivos Vinculados** e **Histórico de alertas de pánico**.

## Padrão da tela de relatórios de vendas

A tela **Reportes Ventas** usa um seletor de relatório e oferece as ações **Generar reporte** e **Exportar Excel**. O catálogo observado inclui relatórios de caixas sem movimento, créditos por cliente, carteira, clientes ativos, comportamento de créditos, créditos diários, desempenho, gastos e retiradas, folha de vida do cliente, ingressos por unidade, margens, movimentos por centro de negócios, notas de débito/crédito, novas vendas e renovações, gestão de vendas, acompanhamento de trabalhadores e pagamentos, além de unidades de serviços.

## Gestão de Plataforma

O submenu de **Gestión de Plataforma** expõe as entidades **Sociedades**, **Centros de negocios**, **Unidades**, **Trabajadores**, **Tipos de movimientos**, **Dispositivos** e **Liquidación del trabajador**.

A listagem de **Sociedades** segue um padrão de CRUD: título, botão de criação, campo de busca por nome ou código, tabela paginada e ação de consulta/edição por registro. As colunas observadas são **Consultar**, **Código**, **Nombre** e **Descripción**. Nenhuma ação de criação ou edição foi executada.

## Resumo operacional de vendas

A tela **Resumen** depende da seleção hierárquica de uma unidade e, em seguida, da seleção de uma caixa. Ela possui as abas **Resumen** e **Detalles**. Antes da seleção, a interface apresenta uma mensagem de estado vazio instruindo o usuário a escolher uma unidade. O seletor global organiza o contexto em uma árvore **todas as unidades → país → estado/região → unidade**, indicando que filtros organizacionais são compartilhados entre os módulos.

## Padrões de experiência observados

A aplicação utiliza um cabeçalho global persistente com menus por domínio, seletores de centro de negócios e unidade, área de perfil, novidades e acesso a suporte via WhatsApp. As páginas são carregadas dentro da mesma rota visível, com estados de carregamento intermediário, sugerindo navegação parcial/dinâmica. Listagens usam busca, paginação e ações por linha; relatórios usam seleção de tipo, geração e exportação; telas operacionais dependem de contexto hierárquico e frequentemente apresentam estados vazios orientativos.

## Arquitetura técnica observável

A inspeção passiva dos recursos carregados confirmou **jQuery**, **Bootstrap** e **Select2**, sem sinais globais de React, Vue ou Angular. A interface também carrega componentes de **DataTables**, FullCalendar, SweetAlert2, Google Charts, SheetJS/XLSX, Lottie e fontes do tema Metronic. Há telemetria do Microsoft Clarity e Datadog RUM.

O servidor respondeu com os cabeçalhos `Server: Microsoft-IIS/10.0` e `X-Powered-By: ASP.NET` a uma solicitação `HEAD` não suportada (`405`), confirmando hospedagem em IIS/ASP.NET. A nomenclatura das rotas segue padrão controlador/ação, por exemplo `/Summary/vwSummary`, `/CreateSocieties/vwCreateSocieties` e `/LoansReports/vwLoansReports`.

A navegação principal não troca a URL visível. Os itens de menu invocam `CargarBody(ControllerAction)`, que insere um estado de carregamento, executa verificações de redirecionamento e usa `$("#bodyForms").load(ControllerAction)` para substituir dinamicamente a área de conteúdo por HTML retornado pelo servidor. Portanto, a aplicação se comporta como uma **shell server-rendered com carregamento AJAX de views parciais**, e não como uma SPA moderna baseada em framework cliente.

O contexto organizacional é mantido parcialmente no navegador. Foram observadas chaves de `sessionStorage` relacionadas à unidade, centro de negócios, último acesso, seleção de relatório e notificações; `localStorage` contém um sinal de habilitação da árvore de parceiros. Nenhum valor de sessão ou credencial foi coletado.

Os recursos indicam integração com Azure: imagens promocionais vêm de Azure Blob Storage, e há chamadas a um backend hospedado em `azurewebsites.net`. O painel e os módulos usam endpoints XHR para carregar views, scripts específicos de cada tela, árvores de unidades, relatórios, avisos e pesquisas.

A extração passiva do HTML autenticado identificou **51 rotas dinâmicas** de menu, sem chamadas adicionais aos endpoints. O inventário completo foi salvo em `rotas_observadas.md` e `rotas_observadas.csv`.

## Limites da análise

Não foram executados varredores de vulnerabilidades, enumeração de diretórios, fuzzing, testes de autorização, manipulação de parâmetros, força bruta ou qualquer tentativa de contornar controles. As conclusões técnicas são exclusivamente derivadas de HTML, JavaScript, recursos e cabeçalhos entregues normalmente ao navegador autenticado.
