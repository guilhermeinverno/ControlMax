# 14. Roadmap de Execução

## P0: OBRIGATÓRIO (Bloqueadores para Piloto)
O sistema deve iniciar a operação mínima garantindo segurança e fluxo de capital da rua para o cofre.
1. Desenvolver a **Hierarquia Multi-Tenant Completa** (Sociedade → CN → Unidade).
2. Refatorar a **Autenticação** e remover bypasses (modo demo, admin spoofing).
3. Implementar **API NodeJS** para gestão rígida da máquina de estados do Caixa (Abrir/Fechar/Confirmar).
4. Implementar UI do **Seletor Global de Contexto** (Header).
5. Fluxo de **Vendas (Crédito) e Cobranças (Pagamento)** com lógica em centavos via Backend.
6. Implementar **Auditoria Imutável** para Abertura e Fechamento.

## P1: IMPORTANTE (Piloto ou Produção Inicial)
Necessário para a expansão operacional sustentável.
1. Cadastros Avançados: **Lista Negra de Clientes**.
2. **Transferências Financeiras Básicas** entre caixas de uma filial.
3. Sub-sistema inicial de **Relatórios** (Geração Assíncrona e extração de planilhas).
4. Sincronização/Log Básico de **Dispositivos**.

## P2: DESEJÁVEL (Pós-Piloto)
Traz eficiência e controles extras.
1. Módulo de **Aprovações** de Transferências Superiores (Supervisor autorizando caixas).
2. **Faturamento SaaS** e Gestão de Seguros.
3. Abertura/Fechamento **Massivo** por Centro de Negócios.
4. Módulo robusto de Formulários Dinâmicos e Feriados.

## P3: EVOLUÇÃO (Diferenciais)
Características modernas de diferenciação mercadológica.
1. Interface do **Assistente IA (Voicebot Gemini)** atuando sobre a base de dados blindada.
2. Dashboards de Performance Avançados.
3. Alertas de Pânico geolocalizados do App.
