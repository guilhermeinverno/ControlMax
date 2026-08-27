# Plano de Desenvolvimento — Pendências ControlMax

**Versão:** 1.0  
**Data:** 27/08/2026  
**Base:** [`PENDENCIAS-DESENVOLVIMENTO.md`](./PENDENCIAS-DESENVOLVIMENTO.md) @ `main` / `fcb1b0d`  
**Objetivo:** fechar bloqueadores P0 para liberar o **piloto**, depois P1 sustentável e limpeza.

---

## 0. Como usar este plano

| Campo | Significado |
|-------|-------------|
| **ID** | Identificador estável da entrega |
| **Esforço** | Estimativa relativa (S ≤ 1d · M 2–3d · L 4–5d · XL > 1 semana) |
| **Depende** | Precisa estar pronto antes |
| **DoD** | Definition of Done (aceite) |

**Regra de ouro:** não simplificar regras financeiras “para limpar código”. Preferir BFF + SyncManager; se houver conflito entre limpeza Sonar e funcionalidade, manter funcionalidade e marcar `// PILOT-REGRESSION`.

**Fontes oficiais de produto:** [`14-roadmap.md`](../docs/controlmax/14-roadmap.md) · [`backlog-piloto.md`](../docs/comparativo/backlog-piloto.md)

---

## 1. Visão das fases

```
Fase 0  Segurança residual     ──┐
Fase 1  Fecha writes client    ──┼──► Gate Piloto (P0)
Fase 2  Contexto + hierarquia  ──┤
Fase 3  Auditoria UI + claims  ──┘
         │
Fase 4  P1 (lista negra, BFF transfers, reports, mass close)
         │
Fase 5  Limpeza (cents, formatters, docs)
```

| Fase | Meta | Critério de saída |
|------|------|-------------------|
| **0** | Sem bypasses / auto-provision | Login só com usuário pré-cadastrado; nenhum email hardcode de privilégio |
| **1** | Finanças só via BFF/Sync | Rules negam create client em `collections` e `security_logs`; zero fallback `setDoc`/`addDoc` financeiro |
| **2** | Contexto operacional | Header com seletor CN/Unidade; escopo `usuario_unidades` enforçado |
| **3** | Auth + auditoria | Decisão Claims documentada + tela de logs reais |
| **Gate Piloto** | Go / No-go | Checklist §7 todos `[x]` |
| **4** | P1 | Lista negra + transfers BFF + mass close + menu reports coerente |
| **5** | Dívida técnica | Um formatter monetário; docs de backlog atualizados |

---

## 2. Fase 0 — Segurança residual (P0)

**Meta:** eliminar caminhos que concedem acesso ou tenant sem cadastro real.

### 0.1 Remover auto-provision no Login
| | |
|--|--|
| **ID** | `SEC-01` |
| **Esforço** | S |
| **Arquivos** | `frontend/src/screens/Login.tsx` |
| **Trabalho** | Remover criação automática de usuário Auth + doc Firestore quando login falha (`user-not-found` / `invalid-credential`). Exibir erro claro: “Usuário não cadastrado — contate o administrador.” |
| **DoD** | Tentativa com email inexistente **não** cria Auth user nem documento em `users`. Teste manual + (opcional) teste unitário do fluxo de erro. |

### 0.2 Limpar hardcodes de privilégio / tenant
| | |
|--|--|
| **ID** | `SEC-02` |
| **Esforço** | S |
| **Arquivos** | `useTenantHelpers.ts`, `useTenantLink.ts`, `Layout.tsx`, `firebase.ts` |
| **Trabalho** | Remover `coletor.teste@…` → tenant fixo; emails `gringoeletronica` / `controlmaxia` de impersonação; código morto `handleDemoRoleChange` / `getDemoUser` se não houver modo demo oficial. Impersonação SuperAdmin, se necessária, deve vir de **role no Firestore** + flag explícita (não lista de emails). |
| **DoD** | `rg -i 'gringoeletronica\|controlmaxia\|coletor\.teste\|controlmax_demo'` sem hits de privilégio. Impersonação (se mantida) só para `role === 'superadmin'`. |

### 0.3 Defaults demo no VendedorMobile
| | |
|--|--|
| **ID** | `SEC-03` |
| **Esforço** | S |
| **Arquivos** | `frontend/src/screens/VendedorMobile.tsx` |
| **Trabalho** | Remover `unit-demo` / `bc-demo` / tenants hardcoded. Exigir CN/Unidade do contexto global ou do perfil (`usuario_unidades`). Bloquear venda se contexto ausente. |
| **DoD** | Sem strings `*-demo` no fluxo de venda; UI mostra erro se unidade não selecionada. |

**Saída Fase 0:** segurança de identidade alinhada ao backlog-piloto (“remover bypasses”).

---

## 3. Fase 1 — Fecha o perímetro financeiro (P0)

**Meta:** nenhuma escrita financeira crítica pelo SDK client; fila offline → BFF.

### 1.1 Rules: bloquear create client
| | |
|--|--|
| **ID** | `FIN-01` |
| **Esforço** | S |
| **Arquivos** | `firestore.rules`, testes `frontend/src/tests/firestore.rules.test.ts` |
| **Trabalho** | `collections`: `allow create: if false` (igual `sales`/`boxes`). `security_logs`: `allow create: if false`. Deploy rules. |
| **Depende** | `FIN-02` e `FIN-03` prontos **antes** do deploy em produção (senão quebra visita/no-payment e logs). Em homologação pode deployar junto. |
| **DoD** | Testes de rules cobrindo deny create; piloto só sobe rules após fallbacks removidos. |
| **Status** | ✅ **feito 27/08/2026** (código): `collections` e `security_logs` com `create/update/delete: if false`. **Deploy rules** ainda pendente em produção/homologação. |

### 1.2 Remover fallbacks de cobrança / visita
| | |
|--|--|
| **ID** | `FIN-02` |
| **Esforço** | M |
| **Arquivos** | `registerPaymentTransaction.ts`, executors `paymentExecutor`, SyncManager |
| **Trabalho** | Remover `setDoc` direto em `collections`. Fluxo: online → `POST /api/transactions/collection`; offline/erro de rede → `SyncManager.enqueue('payment')` **apenas**. Tratar amount `0` (no-payment) no BFF (já há histórico de fix). Nunca gravar saldo no client. |
| **DoD** | Grep sem `setDoc`/`addDoc` em collections no frontend de pagamento; teste unitário/integration do caminho Sync; QA manual: pagamento + visita sem pagamento online e offline. |
| **Status** | ✅ **feito 27/08/2026** — BFF aceita `amountCents >= 0`; client só BFF + SyncManager; `PaymentExecutor` alinhado ao contrato BFF. |

### 1.3 Remover writes diretos restantes
| | |
|--|--|
| **ID** | `FIN-03` |
| **Esforço** | M |
| **Arquivos** | `VendedorMobile.tsx`, `expenseSave.ts`, `incomeSave.ts` (e similares), `transactionRoutes` / novas rotas se faltar income/expense |
| **Trabalho** | Venda mobile só via `/api/transactions/sale` ou SyncManager. Despesas/receitas: criar endpoints BFF se ainda não existirem **ou** enfileirar + Admin SDK; remover `addDoc` que as rules já negam (código morto perigoso). |
| **DoD** | Nenhum caminho de UI chama `addDoc`/`setDoc` em `sales`, `expenses`, `incomes`, `collections`, `boxes`. |
| **Status** | ✅ **feito 27/08/2026** — BFF `expense`/`income`/`approval`; `expenseSave`/`incomeSave`/`BCApprovals`/hooks BC via BFF; venda mobile → BFF + SyncManager offline; `SaleExecutor` alinhado a `/api/transactions/sale`. |

### 1.4 Idempotência obrigatória nos clients
| | |
|--|--|
| **ID** | `FIN-04` |
| **Esforço** | S |
| **Arquivos** | executors sync, `boxLifecycle`, `RegisterPayment`, `VendedorMobile` |
| **Trabalho** | Garantir que **toda** chamada financeira envia `idempotencyKey` (body + header). Backend: rejeitar `400` se chave ausente em rotas P0. |
| **DoD** | Teste BFF falha sem chave; clients sempre enviam UUID. |
| **Status** | ✅ **feito 27/08/2026** — `requireIdempotencyKey` em boxes + transactions; body ou header; clients enviam body+header; testes FIN-04a–d. |

**Saída Fase 1:** critério “nenhuma operação financeira pelo client-side SDK” atendido no código do piloto (`FIN-01`…`FIN-04`). Restante: **deploy** das rules.

---

## 4. Fase 2 — Contexto e hierarquia (P0)

**Meta:** operador sempre age sob CN/Unidade explícitos e autorizados.

### 2.1 Seletor global no header
| | |
|--|--|
| **ID** | `CTX-01` |
| **Esforço** | M |
| **Arquivos** | `GlobalContext.tsx`, `Layout.tsx`, preferencialmente novo `GlobalContextSelector.tsx`, reutilizar `UnitSelectors` |
| **Trabalho** | Renderizar no header (desktop + mobile) selects CN e Unidade ligados ao `GlobalContext`. Persistir em `sessionStorage`/`localStorage`. Filtrar unidades por `usuario_unidades` do usuário. Telas filhas consomem contexto (gradualmente reduzir seletores locais duplicados). |
| **DoD** | Seletor visível após login; muda contexto e dashboards/listas respeitam filtro; collector só vê unidades atribuídas. |
| **Status** | ✅ **feito 27/08/2026** — `GlobalContext` + `sessionStorage`; `GlobalContextSelector` no header; Dashboard/OpenBox ligados; filtro `usuario_unidades`. |

### 2.2 Alinhar `usuario_unidades` ↔ spec `assignedUnits`
| | |
|--|--|
| **ID** | `CTX-02` |
| **Esforço** | M |
| **Arquivos** | `useTenantState.ts`, `adminRoutes.ts`, `boxRoutes.ts`, docs `08-modelo-de-dados.md`, UserList/Profiles |
| **Trabalho** | Decisão de produto: **manter** `usuario_unidades` como fonte de verdade **ou** migrar para `assignedUnits` no doc `users`. Documentar no modelo de dados. BFF rejeita open box / sale se `unitId` ∉ lista do usuário. UI de gestão de usuários edita a lista. |
| **DoD** | Teste integração: open box com unidade não atribuída → 403; doc de modelo atualizado. |
| **Status** | ✅ **feito 27/08/2026** — canônico `usuario_unidades`; BFF open valida escopo; testes `userUnitAccess.test.ts`. UI edição em UserList concluída (criação + modal via `PUT /api/admin/users/:id`). |

### 2.3 Sociedade (mínimo piloto)
| | |
|--|--|
| **ID** | `CTX-03` |
| **Esforço** | L |
| **Arquivos** | seed, rules, SuperAdmin ou tela mínima, nav “Sociedades” |
| **Trabalho** | **Piloto mínimo:** tratar `tenantId` = Sociedade (já na spec) e esconder menu vazio **ou** CRUD mínimo de societies se o piloto multi-sociedade for obrigatório. Não bloquear Gate Piloto se single-tenant for aceito por escrito. |
| **DoD** | Decisão registrada em `00-indice.md` / notas; se single-tenant, menu “Sociedades” removido ou desabilitado até P1. |
| **Status** | ✅ **feito 27/08/2026** — decisão em `00-indice.md` + `DECISOES-FASE2-CONTEXTO.md`; menu Sociedades desabilitado. |

**Saída Fase 2:** seletor global + escopo de unidade enforçado.

---

## 5. Fase 3 — Claims e auditoria (P0)

### 3.1 Decisão e implementação de Custom Claims
| | |
|--|--|
| **ID** | `AUTH-01` |
| **Esforço** | L |
| **Arquivos** | `backend/adminRoutes.ts` (ou script), `authMiddleware.ts`, provisão de usuário |
| **Trabalho** | **Opção A (recomendada):** ao criar/atualizar usuário, `setCustomUserClaims({ role, tenantId })`; middleware lê claims primeiro, Firestore como fallback. **Opção B:** documentar formalmente “role só no Firestore” e reforçar cache no middleware (mais frágil). |
| **DoD** | ADR curta em `docs/controlmax/`; claims ou ADR Opção B assinada; teste de escalate role via client falha. |
| **Status** | ✅ **feito 27/08/2026** — Opção A; ADR-001; `syncUserCustomClaims` + middleware; teste `customClaims.test.ts`. |

### 3.2 Tela de logs reais
| | |
|--|--|
| **ID** | `AUD-01` |
| **Esforço** | M |
| **Arquivos** | novo screen ou `SuperAdminLogsTab`, queries `security_logs` / `audit_logs`, menu Layout |
| **Trabalho** | Substituir `createSimulatedTerminalLog` por leitura Firestore filtrada por `tenantId`. Colunas: data, userId, ação, resultado, entidade. Menu “Log de Acciones” aponta para esta tela (não `statistics`). |
| **DoD** | Após confirm box / adjustment, log aparece na UI em &lt; 5s; sem dados inventados. |
| **Status** | ✅ **feito 27/08/2026** — tela `AuditLogs` + rota `/audit-logs`; menu Reportes → Log de Acciones; rules `audit_logs` read; índices compostos. |

### 3.3 Homologação SyncManager em dispositivo real
| | |
|--|--|
| **ID** | `SYNC-01` |
| **Esforço** | M (QA) |
| **Trabalho** | Roteiro: modo avião → registrar pagamento/visita → voltar online → badge processa → validar Firestore/BFF. Cobrir conflito de idempotência (duplo enqueue). |
| **DoD** | Checklist QA assinado; bugs críticos corrigidos. |
| **Status** | 🟡 **checklist pronto** — `documentation/SYNC-01-CHECKLIST-QA.md` (execução em dispositivo real pendente de assinatura QA). |

**Saída Fase 3 + Fases 0–2 = Gate Piloto.**

---

## 6. Fase 4 — P1 (pós-gate ou paralelo controlado)

Só iniciar em produção piloto após Gate; em paralelo na branch é OK se não atrasar P0.

| ID | Entrega | Esforço | Escopo resumido | DoD |
|----|---------|---------|-----------------|-----|
| `P1-01` | Lista negra de clientes | L | Coleção `customer_blacklist` (ou flag), tela admin, bloqueio no BFF de sale/customer create | Cliente na lista → 403 na venda + mensagem UI |
| `P1-02` | BCTransfers via BFF | L | Endpoints transfer create/approve; rules write false já existem — hoje UI quebra ou usa path inválido; alinhar | Transfers só via API; menu “Aprobar transferencias” → fluxo correto |
| `P1-03` | Corrigir naming menu aprovações | S | `LayoutDesktopNav` / drawer: “Aprobar transferencias” → `bc-transfers` ou aba approve; “Aprobar gastos/cajas” → `bc-approvals` | Labels = comportamento |
| `P1-04` | Fechamento massivo | M | Espelhar `MassBoxOpening` para close via BFF/batch | Menu “Cierre masivo” fecha caixas, não abre |
| `P1-05` | Hub mínimo de relatórios | L | Tela catálogo + reusar exports XLSX existentes; async pode ficar P2 | Menu Reportes não aponta para `sales` genérico |

**Status Fase 4 (27/08/2026):** ✅ código entregue — `P1-01`…`P1-05` (deploy rules/indexes + QA manual pendentes).

---

## 7. Fase 5 — Limpeza e documentação

| ID | Entrega | Esforço | DoD |
|----|---------|---------|-----|
| `CLEAN-01` | Unificar `fmtCents` / `currency.ts` | M | Um import canônico; remoção de `fmt` locais duplicados |
| `CLEAN-02` | Deprecar `saldoPendiente` string | L | Leitura só cents; migração/leitura defensiva; seed sem dual write |
| `CLEAN-03` | Atualizar docs oficiais | S | `backlog-piloto.md`, `14-roadmap.md`, este plano e `PENDENCIAS-…` com `[x]` |

**Status Fase 5 (27/08/2026):** ✅ `CLEAN-01`…`CLEAN-03` concluídos.

---

## 8. Gate Piloto — checklist Go / No-go

Liberar piloto **somente** se:

```
[x] SEC-01 Login sem auto-provision — feito 27/08/2026
[x] SEC-02 Sem hardcodes de privilégio — feito 27/08/2026
[x] SEC-03 Sem defaults *-demo em venda — feito 27/08/2026
[x] FIN-01 Rules: collections + security_logs create=false (código; deploy pendente)
[x] FIN-02/03 Zero fallback financeiro client — feito 27/08/2026
[x] FIN-04 IdempotencyKey obrigatória — feito 27/08/2026
[x] CTX-01 Seletor global no header — feito 27/08/2026
[x] CTX-02 Escopo unidade enforçado no BFF — feito 27/08/2026
[x] CTX-03 Decisão Sociedade documentada — feito 27/08/2026
[x] AUTH-01 Claims ou ADR Opção B — ADR-001 + implementação 27/08/2026
[x] AUD-01 Logs reais na UI — AuditLogs 27/08/2026
[ ] SYNC-01 Homologação offline OK — `documentation/SYNC-01-CHECKLIST-QA.md`
[ ] QA regressivo: `documentation/GATE-PILOTO-QA.md` (após `DEPLOY-FIRESTORE-GATE.md`)
```

---

## 9. Ordem sugerida na timeline

```
Semana 1     SEC-01, SEC-02, SEC-03, FIN-04          (pode paralelizar)
Semana 1–2   FIN-02, FIN-03 → depois FIN-01 (rules)
Semana 2–3   CTX-01, CTX-02, CTX-03
Semana 3     AUTH-01, AUD-01, SYNC-01
             ─── GATE PILOTO ───
Semana 4+    P1-01 … P1-05, depois CLEAN-*
```

**Paralelização segura:**
- Frontend seletor (`CTX-01`) ∥ backend fallbacks (`FIN-02`)
- Docs/ADR (`AUTH-01` Opção B) ∥ UI logs (`AUD-01`)

**Não paralelizar:** deploy `FIN-01` (rules) **antes** de `FIN-02`/`FIN-03` em produção.

---

## 10. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Deploy rules antes de remover fallback | Quebra cobrança/visita offline | Feature flag / deploy coordenado; feature toggle “strictBff” |
| Custom Claims sem script de backfill | Usuários antigos sem claim | Job `setCustomUserClaims` em massa + fallback Firestore |
| Seletor global quebra telas com seletor local | UX confusa | Migrar tela a tela; contexto com default da primeira unidade atribuída |
| BCTransfers já “quebrado” pelas rules | Feature morta | Priorizar `P1-02` cedo se o piloto usa transfers |

---

## 11. Critérios de qualidade por PR

Cada PR deste plano deve:

1. Passar `frontend`: `npm run lint` + `npm run test`
2. Passar `backend`: testes BFF relevantes
3. Não reintroduzir email bypass / write financeiro client
4. Atualizar status neste arquivo e em `PENDENCIAS-DESENVOLVIMENTO.md`
5. Incluir notas de teste manual no PR (checklist curto)

---

## 12. Board rápido (copiar para issues)

**Fase 0**
- [x] `SEC-01` Auto-provision Login — feito 27/08/2026
- [x] `SEC-02` Hardcodes privilégio — feito 27/08/2026
- [x] `SEC-03` Defaults demo mobile — feito 27/08/2026

**Fase 1**
- [x] `FIN-02` Fallback payment → Sync only — feito 27/08/2026
- [x] `FIN-03` Writes diretos restantes — feito 27/08/2026
- [x] `FIN-04` Idempotency obrigatória — feito 27/08/2026
- [x] `FIN-01` Rules deny collections/security_logs — código 27/08/2026 (deploy rules pendente)

**Fase 2**
- [x] `CTX-01` Seletor header — feito 27/08/2026
- [x] `CTX-02` usuario_unidades / assignedUnits — feito 27/08/2026
- [x] `CTX-03` Decisão Sociedade — feito 27/08/2026

**Fase 3**
- [x] `AUTH-01` Custom Claims / ADR — feito 27/08/2026
- [x] `AUD-01` Logs UI reais — feito 27/08/2026
- [ ] `SYNC-01` QA offline — checklist em `SYNC-01-CHECKLIST-QA.md`

**Fase 4 / 5**
- [x] `P1-01` Lista negra — tela + BFF 403 sale + rules/indexes (27/08/2026)
- [x] `P1-02` BCTransfers via BFF — create + approval (27/08/2026)
- [x] `P1-03` Naming menus aprovações / cierre (27/08/2026)
- [x] `P1-04` Fechamento massivo + open/close-batch BFF (27/08/2026)
- [x] `P1-05` Hub de reportes `/reports-hub` (27/08/2026)
- [x] `CLEAN-01` fmtCents canônico em `currency.ts` (27/08/2026)
- [x] `CLEAN-02` resolvePendingCents + seed só cents (27/08/2026)
- [x] `CLEAN-03` docs backlog/roadmap/pendências (27/08/2026)

---

## 13. Próximo passo imediato

**Concluído (27/08/2026):** Fases 0–5 (código).

**Seguir com (ops/QA):**  
1. [`DEPLOY-FIRESTORE-GATE.md`](./DEPLOY-FIRESTORE-GATE.md)  
2. [`GATE-PILOTO-QA.md`](./GATE-PILOTO-QA.md)  
3. [`SYNC-01-CHECKLIST-QA.md`](./SYNC-01-CHECKLIST-QA.md)  
Commit/PR no fim da sessão quando solicitado.
