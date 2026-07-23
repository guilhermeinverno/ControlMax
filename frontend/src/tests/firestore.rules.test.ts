import { initializeTestEnvironment, assertFails, assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import * as fs from "fs";
import * as path from "path";
import { describe, beforeAll, afterAll, beforeEach, test } from "vitest";

// Use dynamic path search to find the correct firestore.rules file path
const rulesPath = fs.existsSync(path.resolve(process.cwd(), "firestore.rules"))
  ? path.resolve(process.cwd(), "firestore.rules")
  : fs.existsSync(path.resolve(process.cwd(), "../firestore.rules"))
    ? path.resolve(process.cwd(), "../firestore.rules")
    : path.resolve(process.cwd(), "../../firestore.rules");

const rulesContent = fs.readFileSync(rulesPath, "utf8");

describe("Testes de Regras de Segurança do Firestore", () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "controlmax-test-project",
      firestore: {
        rules: rulesContent,
        host: "127.0.0.1",
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // Helper para criar um usuário autenticado e já cadastrar seu perfil de usuário no Firestore
  async function setupUser(uid: string, tenantId: string, role: string, email: string) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await adminDb.doc(`users/${uid}`).set({
        tenantId,
        role,
        email,
        active: true,
      });
    });

    return testEnv.authenticatedContext(uid, { email });
  }

  // 1. ISOLAMENTO DE CAIXAS (BOXES) E TRANSAÇÕES
  describe("1. Isolamento de boxes/{boxId}/transactions/{txId}", () => {
    test("usuário do tenant B não pode ler transações do tenant A", async () => {
      // Cria o box do Tenant A
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.doc("boxes/box-tenant-a").set({
          tenantId: "tenant-a",
          userId: "collector-a",
          status: "open",
        });
        await adminDb.doc("boxes/box-tenant-a/transactions/tx-1").set({
          amount: 1000,
          description: "Pagamento legítimo",
        });
      });

      const userBContext = await setupUser("collector-b", "tenant-b", "collector", "collector-b@tenant-b.com");
      const dbB = userBContext.firestore();

      await assertFails(dbB.doc("boxes/box-tenant-a/transactions/tx-1").get());
    });

    test("usuário do tenant B não pode criar/escrever um documento em transactions do tenant A", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.doc("boxes/box-tenant-a").set({
          tenantId: "tenant-a",
          userId: "collector-a",
          status: "open",
        });
      });

      const userBContext = await setupUser("collector-b", "tenant-b", "collector", "collector-b@tenant-b.com");
      const dbB = userBContext.firestore();

      await assertFails(
        dbB.doc("boxes/box-tenant-a/transactions/tx-malicious").set({
          amount: 999999,
          description: "Transação maliciosa",
        })
      );
    });

    test("usuário do próprio tenant A com role adequada consegue ler e criar transações normalmente", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.doc("boxes/box-tenant-a").set({
          tenantId: "tenant-a",
          userId: "collector-a",
          status: "open",
        });
      });

      const userAContext = await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const dbA = userAContext.firestore();

      // Escrever transação no box de seu tenant deve funcionar
      await assertSucceeds(
        dbA.doc("boxes/box-tenant-a/transactions/tx-legit").set({
          amount: 5000,
          description: "Pagamento de rota",
        })
      );

      // Ler transação no box de seu tenant deve funcionar
      await assertSucceeds(dbA.doc("boxes/box-tenant-a/transactions/tx-legit").get());
    });

    test("um superadmin consegue ler transações de qualquer tenant", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.doc("boxes/box-tenant-a").set({
          tenantId: "tenant-a",
          userId: "collector-a",
          status: "open",
        });
        await adminDb.doc("boxes/box-tenant-a/transactions/tx-1").set({
          amount: 1000,
          description: "Pagamento",
        });
      });

      // Configurar superadmin via email permitido em firestore.rules
      const superadminContext = testEnv.authenticatedContext("super-uid", {
        email: "controlmaxia@gmail.com",
      });
      const dbSuper = superadminContext.firestore();

      await assertSucceeds(dbSuper.doc("boxes/box-tenant-a/transactions/tx-1").get());
    });
  });

  // 2. PRIVILEGE ESCALATION EM /users/{userId}
  describe("2. Privilege escalation em /users/{userId}", () => {
    test("um usuário com role collector tenta atualizar o próprio documento mudando role para admin deve falhar", async () => {
      await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const userAContext = testEnv.authenticatedContext("collector-a", { email: "collector-a@tenant-a.com" });
      const dbA = userAContext.firestore();

      await assertFails(
        dbA.doc("users/collector-a").set({
          tenantId: "tenant-a",
          role: "admin",
          email: "collector-a@tenant-a.com",
          active: true,
        })
      );
    });

    test("um usuário com role collector tenta mudar tenantId para outro tenant deve falhar", async () => {
      await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const userAContext = testEnv.authenticatedContext("collector-a", { email: "collector-a@tenant-a.com" });
      const dbA = userAContext.firestore();

      await assertFails(
        dbA.doc("users/collector-a").set({
          tenantId: "tenant-b",
          role: "collector",
          email: "collector-a@tenant-a.com",
          active: true,
        })
      );
    });

    test("um usuário com role collector tenta atualizar um campo não sensível do próprio perfil deve funcionar", async () => {
      await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const userAContext = testEnv.authenticatedContext("collector-a", { email: "collector-a@tenant-a.com" });
      const dbA = userAContext.firestore();

      await assertSucceeds(
        dbA.doc("users/collector-a").set({
          tenantId: "tenant-a",
          role: "collector",
          email: "collector-a@tenant-a.com",
          active: true,
          name: "Novo Nome de Teste",
        })
      );
    });

    test("um admin do Tenant A tenta mudar role de um usuário do Tenant A deve funcionar", async () => {
      await setupUser("admin-a", "tenant-a", "admin", "admin-a@tenant-a.com");
      await setupUser("collector-a2", "tenant-a", "collector", "collector-a2@tenant-a.com");

      const adminAContext = testEnv.authenticatedContext("admin-a", { email: "admin-a@tenant-a.com" });
      const dbAdminA = adminAContext.firestore();

      await assertSucceeds(
        dbAdminA.doc("users/collector-a2").set({
          tenantId: "tenant-a",
          role: "admin",
          email: "collector-a2@tenant-a.com",
          active: true,
        })
      );
    });

    test("um admin do Tenant A tenta mudar role de um usuário do Tenant B deve falhar", async () => {
      await setupUser("admin-a", "tenant-a", "admin", "admin-a@tenant-a.com");
      await setupUser("collector-b", "tenant-b", "collector", "collector-b@tenant-b.com");

      const adminAContext = testEnv.authenticatedContext("admin-a", { email: "admin-a@tenant-a.com" });
      const dbAdminA = adminAContext.firestore();

      await assertFails(
        dbAdminA.doc("users/collector-b").set({
          tenantId: "tenant-b",
          role: "admin",
          email: "collector-b@tenant-b.com",
          active: true,
        })
      );
    });
  });

  // 3. ISOLAMENTO DE SECURITY_LOGS
  describe("3. Isolamento de security_logs", () => {
    test("usuário do Tenant B não pode ler logs de segurança do Tenant A", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.doc("security_logs/log-tenant-a").set({
          tenantId: "tenant-a",
          message: "Acesso suspeito de rota",
        });
      });

      const userBContext = await setupUser("collector-b", "tenant-b", "collector", "collector-b@tenant-b.com");
      const dbB = userBContext.firestore();

      await assertFails(dbB.doc("security_logs/log-tenant-a").get());
    });

    test("usuário do Tenant A não pode criar um log com tenantId de outro tenant (forjar log)", async () => {
      const userAContext = await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const dbA = userAContext.firestore();

      await assertFails(
        dbA.doc("security_logs/log-forged").set({
          tenantId: "tenant-b",
          message: "Tentativa de forjar log",
        })
      );
    });

    test("usuário do Tenant A consegue criar um log com seu próprio tenantId legítimo", async () => {
      const userAContext = await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const dbA = userAContext.firestore();

      await assertSucceeds(
        dbA.doc("security_logs/log-legit").set({
          tenantId: "tenant-a",
          message: "Log legítimo de alteração",
        })
      );
    });

    test("ninguém (nem superadmin) consegue dar update ou delete em um log existente", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.doc("security_logs/log-tenant-a").set({
          tenantId: "tenant-a",
          message: "Log de auditoria inalterável",
        });
      });

      // Superadmin tentará modificar
      const superadminContext = testEnv.authenticatedContext("super-uid", {
        email: "controlmaxia@gmail.com",
      });
      const dbSuper = superadminContext.firestore();

      await assertFails(
        dbSuper.doc("security_logs/log-tenant-a").update({
          message: "Mensagem alterada maliciosamente",
        })
      );

      await assertFails(dbSuper.doc("security_logs/log-tenant-a").delete());

      // Usuário comum tentará modificar
      const userAContext = await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const dbA = userAContext.firestore();

      await assertFails(
        dbA.doc("security_logs/log-tenant-a").update({
          message: "Ataque",
        })
      );

      await assertFails(dbA.doc("security_logs/log-tenant-a").delete());
    });
  });

  // 4. REGRESSÃO GERAL DE TENANT
  describe("4. Regressão geral de tenant (clients, customers, sales)", () => {
    test("usuário do Tenant B não pode ler nem escrever clients do Tenant A", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.doc("clients/client-tenant-a").set({
          tenantId: "tenant-a",
          name: "Cliente do Tenant A",
        });
      });

      const userBContext = await setupUser("collector-b", "tenant-b", "collector", "collector-b@tenant-b.com");
      const dbB = userBContext.firestore();

      // Negar leitura
      await assertFails(dbB.doc("clients/client-tenant-a").get());

      // Negar escrita em client do Tenant A
      await assertFails(
        dbB.doc("clients/client-tenant-a-new").set({
          tenantId: "tenant-a",
          name: "Client Injetado",
        })
      );
    });

    test("usuário do Tenant B não pode ler nem escrever customers do Tenant A", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.doc("customers/customer-tenant-a").set({
          tenantId: "tenant-a",
          name: "Comprador do Tenant A",
        });
      });

      const userBContext = await setupUser("collector-b", "tenant-b", "collector", "collector-b@tenant-b.com");
      const dbB = userBContext.firestore();

      // Negar leitura
      await assertFails(dbB.doc("customers/customer-tenant-a").get());

      // Negar escrita
      await assertFails(
        dbB.doc("customers/customer-tenant-a-new").set({
          tenantId: "tenant-a",
          name: "Customer Injetado",
        })
      );
    });

    test("usuário do Tenant B não pode ler nem escrever sales do Tenant A", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.doc("sales/sale-tenant-a").set({
          tenantId: "tenant-a",
          amount: 50000,
        });
      });

      const userBContext = await setupUser("collector-b", "tenant-b", "collector", "collector-b@tenant-b.com");
      const dbB = userBContext.firestore();

      // Negar leitura
      await assertFails(dbB.doc("sales/sale-tenant-a").get());

      // Negar escrita
      await assertFails(
        dbB.doc("sales/sale-tenant-a-new").set({
          tenantId: "tenant-a",
          amount: 10000,
        })
      );
    });

    test("casos legítimos: usuário do Tenant A consegue ler e escrever seus próprios recursos", async () => {
      const userAContext = await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const dbA = userAContext.firestore();

      // Escritas válidas
      await assertSucceeds(
        dbA.doc("clients/client-tenant-a-valid").set({
          tenantId: "tenant-a",
          name: "Novo Cliente Legítimo",
        })
      );

      await assertSucceeds(
        dbA.doc("customers/customer-tenant-a-valid").set({
          tenantId: "tenant-a",
          name: "Novo Customer Legítimo",
        })
      );

      await assertSucceeds(
        dbA.doc("sales/sale-tenant-a-valid").set({
          tenantId: "tenant-a",
          amount: 35000,
        })
      );

      // Leituras válidas
      await assertSucceeds(dbA.doc("clients/client-tenant-a-valid").get());
      await assertSucceeds(dbA.doc("customers/customer-tenant-a-valid").get());
      await assertSucceeds(dbA.doc("sales/sale-tenant-a-valid").get());
    });
  });
});
