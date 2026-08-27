# Deploy Firestore — Gate Piloto (rules + indexes)

**Objetivo:** publicar `firestore.rules` e `firestore.indexes.json` em homologação/produção **antes** do QA regressivo e da assinatura SYNC-01.

**Projeto padrão:** `ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d` (ver `.firebaserc`)

**Pré-condição de código:** FIN-02/03 já removem writes financeiros no client — seguro deployar FIN-01.

---

## 1. Pré-checagem local

```bash
cd /Users/fabio/Documents/Controlmax

# Confirmar arquivos
test -f firestore.rules && test -f firestore.indexes.json && echo "OK files"

# Confirmar deny financeiro (amostra)
rg -n "collections|security_logs|audit_logs|sales|boxes" firestore.rules | head -40

# Confirmar índice de audit_logs
rg -n '"audit_logs"' firestore.indexes.json
```

Esperado nas rules: `collections`, `sales`, `boxes`, `security_logs`, `audit_logs` com **create/update/delete: if false** (só Admin SDK / BFF).

### 1.1 Suite automatizada de rules + BFF (obrigatório no Gate)

Antes do deploy, o time de ops/QA deve rodar a mesma suíte do CI (job `test-backend` em `.github/workflows/tests.yml`).

**Pré-requisitos:** JDK **21**, `firebase-tools`, `npm ci` na raiz do monorepo.

```bash
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export LOCAL_DEV=true

npx firebase emulators:exec --only firestore \
  "npm test -w backend && npm test -w frontend -- src/tests/firestore.rules.test.ts"
```

Alternativa só rules: `npm run test:rules` (raiz).

| Suite | Esperado |
|-------|----------|
| `frontend/src/tests/firestore.rules.test.ts` | 100% pass com Emulator `:8080` |
| `backend` (incl. `auditoriaIntegracao` / idempotência) | 100% pass com Emulator + `LOCAL_DEV` |

Sem Emulator, a suíte de rules falha com `ECONNREFUSED 127.0.0.1:8080` e a integração BFF falha por falta de credenciais/Firestore — **não** é regressão de código; é pré-requisito de ambiente.

Relatório da varredura de saúde (build/unitários/greps) e correções TS: [`PENDENCIAS-DESENVOLVIMENTO.md`](../planejamento/PENDENCIAS-DESENVOLVIMENTO.md) §2.1.

---

## 2. Login e projeto

```bash
# Instalar CLI (se ainda não houver)
npm i -g firebase-tools
# ou: npx firebase-tools …

firebase login
firebase use ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d
firebase projects:list
```

---

## 3. Deploy (só Firestore)

```bash
# Preferir dry-run / diff se disponível na sua versão:
firebase deploy --only firestore:rules,firestore:indexes --project ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d
```

Console (alternativa manual de indexes):  
https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/databases/(default)/indexes

Rules:  
https://console.firebase.google.com/project/ai-studio-33f8fa6b-5557-48dc-aeb6-271cd5c38c6d/firestore/rules

---

## 4. Validação pós-deploy (smoke)

1. Login no app como collector.
2. Abrir DevTools → Network: pagamento **não** deve chamar `Write` client em `collections` (apenas `POST /api/transactions/…`).
3. Tentativa artificial no console do browser:

```js
// Deve FALHAR com permission-denied
import { doc, setDoc } from 'firebase/firestore';
await setDoc(doc(db, 'collections', 'qa-deny-test'), { tenantId: 'x' });
```

4. Abrir tela **AuditLogs** — query por `tenantId` + `timestamp` não deve exigir índice faltando.

5. Marcar na tabela abaixo.

| Item | Homolog | Prod | Quem | Data |
|------|---------|------|------|------|
| Rules deployadas | [ ] | [ ] | | |
| Indexes deployados (incl. `audit_logs`, blacklist, `tenant_roles`) | [ ] | [ ] | | |
| Smoke deny `collections` create | [ ] | [ ] | | |
| AuditLogs UI sem erro de índice | [ ] | [ ] | | |

---

## 5. Rollback (emergência)

No Console → Firestore → Rules → histórico → restaurar versão anterior.  
Indexes novos não “quebram” o app imediatamente (só queries novas); rules erradas sim — rollback prioritário nas rules.

---

## Próximo passo

Após marcar §4: executar [`GATE-PILOTO-QA.md`](./GATE-PILOTO-QA.md) e assinar [`SYNC-01-CHECKLIST-QA.md`](./SYNC-01-CHECKLIST-QA.md).
