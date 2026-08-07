# 3. Requisitos Não Funcionais

## RNF01: Desempenho
- A carga da shell inicial (aplicação React) deve ocorrer em menos de 2 segundos.
- As consultas ao Firestore para listagens devem ser paginadas e limitadas a 50-100 registros por query, utilizando cursores (`startAfter`) para evitar travamentos. `[FONTE: CONTROLMAX]`

## RNF02: Disponibilidade e Offline
- O sistema deve exibir banner nativo alertando perda de conexão (Modo Offline). `[FONTE: CONTROLMAX]`
- Leitura de dados (em cache) e gravação otimista (queue) devem ser geridas pelo próprio Firebase Client SDK, mas **operações de fechamento/confirmação** exigem conexão online, pois batem em endpoints de backend. `[INFERÊNCIA]`

## RNF03: Precisão Matemática (Crítico)
- Todo o sistema (front, back, bd) DEVE utilizar números inteiros (`Cents`) para representar dinheiro. Proibido uso de `float` ou `double` para cálculos financeiros nativos sem biblioteca de precisão. `[FONTE: CONTROLMAX]`

## RNF04: Segurança
- O tráfego deve ser exclusivamente HTTPS.
- Toda regra de negócio sensível (ex: fechamento de caixa, mudança de `tenantId`, exclusão) deve ser validada no servidor (via Node.js/Express ou Firestore Rules rígidas), não confiando no payload do cliente. `[FONTE: CONTROLMAX - Auditoria]`
