# Regras Diferentes (Divergências)

Documentação de regras e comportamentos que divergem entre o modelo TryController e a implementação atual do ControlMax.

## Autorização e Segurança
- **TryController:** A autorização é baseada no servidor (ASP.NET). A sessão e o escopo de atuação (`Sociedade → CN → Unidade`) são garantidos antes de carregar a tela parcial.
- **ControlMax:** A autorização baseia-se em claims no Firebase Auth e RBAC parcial no frontend (`hasPermission`). Há falta de centralização no backend e uso de Firebase Client SDK que delega a segurança quase exclusivamente às regras do Firestore.

## Tratamento Financeiro
- **TryController:** [NÃO DOCUMENTADO] detalhadamente na engenharia passiva, mas inferido que utiliza padrões de contabilidade dupla ou transações de banco relacional para cálculos precisos.
- **ControlMax:** Utiliza conversão obrigatória para *centavos* (inteiros) para mitigar falhas de precisão do JS. A lógica de totais é armazenada no documento da caixa, não sendo sempre um recálculo dinâmico.

## Gestão de Erros e Navegação
- **TryController:** Componentes server-rendered com estados vazios ("selecione uma unidade") e erros validados na submissão ao backend.
- **ControlMax:** Componentes React falhando silenciosamente ou gerando erros brutos no `<ErrorBoundary>` quando o `tenantId` está nulo ou a permissão falha via SDK do cliente.

## Confirmação de Caixa
- **TryController:** Fluxo claro em 3 etapas visíveis e operáveis (Abrir, Fechar, Confirmar).
- **ControlMax:** O backend tem a rota `/api/boxes/confirm`, mas a interface não guia o fluxo em 3 passos com a mesma clareza, permitindo edição por roles não devidamente isolados (admin altera caixas abertas de collectors).
