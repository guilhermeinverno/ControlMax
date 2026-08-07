# AUDITORIA DE CONSISTÊNCIA — CONTROLMAX V1

## 1. Resultado geral

Classificação:
**REPROVADO**

A especificação contém avanços massivos em regras de negócio e bloqueios contábeis, mas falha em um aspecto arquitetural crítico: há uma contradição insustentável entre o uso de **Backend For Frontend (APIs REST Node.js)** para segurança transacional e a dependência do **Firestore SDK Offline Persistence** no frontend. Além disso, a ausência da chave de isolamento (`orgId`/`tenantId`) nas coleções filhas quebra o multi-tenant NoSQL.

---

## 2. Contradições encontradas

| ID | Documento | Problema | Severidade | Prioridade | Recomendação |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `03-requisitos-nao-funcionais.md` vs `09-arquitetura.md` | **Paradoxo Offline/REST:** O RNF02 diz que a leitura e gravação otimista será gerida pelo Firebase SDK em cache. Porém, a Arquitetura (BFF) move as gravações de Vendas/Coleções para rotas `/api/...` via Node.js. O SDK do Firestore não faz fila offline para requisições HTTP REST (`fetch`). | **CRÍTICO** | **[P0]** | Definir se usaremos *Service Workers/IndexedDB* para enfileirar as chamadas REST offline, ou se as Vendas serão gravadas direto no Firestore SDK com *Cloud Functions* (Triggers) atuando como backend validador assíncrono. |
| **02** | `08-modelo-de-dados.md` vs `11-seguranca.md` | **Ausência de Chave Multi-tenant:** O modelo de dados definiu `orgId` (tenant) apenas no `business_centers`. As coleções operacionais (`boxes`, `sales`, `collections`) não possuem `orgId`. Em um NoSQL (Firestore), consultas e `firestore.rules` globais falharão ao tentar isolar dados se o documento não possuir a chave explícita do tenant. | **CRÍTICO** | **[P0]** | Adicionar o campo `orgId` obrigatório em todas as coleções. O backend deve preenchê-lo lendo a claim JWT, nunca confiando no frontend. |
| **03** | `10-api.md` vs `07-usuarios-e-permissoes.md` | **APIs de Correção de Caixa Faltantes:** A permissão veta a edição manual do caixa e obriga o uso de Egresos/Ingresos para corrigir saldos. Contudo, os contratos de `/api/transactions/expense` e `income` não foram definidos detalhadamente. | **ALTO** | **[P0]** | Detalhar os contratos exatos de `expense` e `income` no `10-api.md`, pois tornaram-se o único meio contábil de ajuste para Admins. |
| **04** | `10-api.md` | **Risco de Spoofing no Saldo Inicial:** O contrato `/api/boxes/open` recebe o `initialAmountCents` do frontend. O backend confia cegamente neste valor para abrir o caixa? | **ALTO** | **[P0]** | O backend deve rejeitar ou auditar severamente o `initialAmountCents` se ele divergir do Saldo Final do último caixa confirmado daquele cobrador. |
| **05** | `10-api.md` vs `08-modelo-de-dados.md` | **Rollback / Cancelamento Inexistente:** As regras dizem que pagamentos abatem saldo devedor. Mas não há rota API documentada nem estado no banco para cancelar/estornar um pagamento lançado errado. | **MÉDIO** | **[P1]** | Criar rota `/api/transactions/cancel` e status `cancelled` na coleção de coleções. |

---

## 3. Falhas de segurança encontradas
- **Backend Confiando em Payload de Contexto:** Como detalhado na Tabela (ID 04), a API permite que o front injete o saldo inicial na abertura de caixa. O backend deveria, preferencialmente, calcular o transporte do saldo do dia anterior.
- **Fuga de Isolamento:** Se a coleção `sales` não tiver `orgId`, a `firestore.rules` baseada em tenant não pode proteger a leitura direta no client-side via SDK. (Ver ID 02).

## 4. Falhas de API
- Os endpoints transacionais de suporte que viabilizam a Regra de Negócio (Egresos e Ingressos corretivos) não possuem seus contratos (Request/Response) elaborados na especificação.

## 5. Falhas financeiras
- Não há definição de Rollback / Estorno. O que ocorre se o cobrador digitar que recebeu R$ 1000,00 por engano em vez de R$ 10,00? Como ele cancela? O saldo devedor volta? O caixa abate? `[NÃO DOCUMENTADO]`

## 6. Falhas de RBAC
- A matriz no `07-usuarios-e-permissoes.md` está coesa. O Admin não consegue editar o saldo de caixa aberto (vetado pela API e UX). No entanto, como ele aprovará as transferências? Se não há contratos na API para a "Aprovação", ela está solta.

## 7. Falhas de isolamento multi-tenant
- Faltam os vínculos diretos da chave `orgId` em cada documento gerado. Sem desnormalizar o `orgId` em `sales`, `collections` e `boxes`, as consultas cross-tenant serão um risco massivo e ineficientes em Firestore (exigiria joins).

## 8. Falhas no fluxo de caixa
- A máquina de estados `OPEN -> CLOSED -> CONFIRMED` é perfeita. Mas a transição depende do cobrador submeter o Fechamento. O que acontece se o cobrador sofrer um acidente ou não submeter o fechamento? O Supervisor/Admin consegue forçar o `CLOSE` de um caixa `OPEN` pertencente a outrem no caso de fim de expediente? `[NÃO DOCUMENTADO]`

## 9. Lacunas de documentação
- Comportamento de fila offline para o novo BFF REST.
- Regra de estorno (Cancelamento de Venda / Pagamento).
- Forçar fechamento de caixa por inatividade.

## 10. Pontos que precisam de decisão
- **Offline x BFF:** Para as áreas rurais (sem rede), o cobrador usará o app. Se migramos as escritas críticas para API REST (Express), precisamos construir um Sync Manager em React (IndexedDB). Aprovam esta mudança pesada de frontend, ou devemos recuar a arquitetura para Firebase Client-Side (com Firestore Functions Triggers garantindo a auditoria em background)?
- **Spoofing de Saldo Inicial:** O sistema acatará o valor digitado pelo operador ou o backend forçará o saldo herdado do dia anterior?

## 11. Pontos que podem ser resolvidos tecnicamente
- Adição da string `orgId` a todos os schemas de banco na documentação.
- Formalização da estrutura JSON para Egresos e Ingressos corretivos na API.
- Adição da API de Estorno/Cancelamento com lock transacional no banco.

## 12. Checklist para início da implementação
- [ ] Resolver a contradição entre Offline SDK vs REST API.
- [ ] Atualizar `08-modelo-de-dados.md` com `orgId` universal.
- [ ] Atualizar `10-api.md` com rotas de Estorno e Egresos/Ingresos corretivos.
- [ ] Atualizar `10-api.md` com validação rígida de Saldo Inicial Transportado.

---

**ESTA ESPECIFICAÇÃO ESTÁ PRONTA PARA INICIAR A IMPLEMENTAÇÃO?**

**NÃO. A ESPECIFICAÇÃO AINDA NÃO ESTÁ PRONTA.**

O motivo principal é o **Paradoxo Arquitetural Offline vs API REST (ID 01)**. Ao proteger e selar o caixa isolando as transações no Express (BFF), o aplicativo React perde a mágica do Firebase Offline Persistence para gravar Vendas e Cobranças no interior/zonas sem sinal. Iniciar a implementação agora resultará num sistema que não funciona offline ou exigirá criar um sincronizador manual do zero. O proprietário do produto precisa decidir a abordagem técnica para operações offline antes que o código comece. Além disso, o esquecimento da chave `orgId` nos modelos operacionais quebra a premissa de multi-tenant seguro e precisa ser corrigido nos documentos.
