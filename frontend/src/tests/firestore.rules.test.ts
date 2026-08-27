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
  }, 30000);

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  }, 30000);

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  }, 30000);


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

    test("usuário do próprio tenant A NÃO consegue criar transações diretamente (BFF apenas)", async () => {
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

      // Escrever transação no box pelo client-side DEVE FALHAR
      await assertFails(
        dbA.doc("boxes/box-tenant-a/transactions/tx-legit").set({
          amount: 5000,
          description: "Pagamento de rota",
        })
      );
    });

    test("usuário do próprio tenant A consegue LER transações do seu box normalmente", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.doc("boxes/box-tenant-a").set({
          tenantId: "tenant-a",
          userId: "collector-a",
          status: "open",
        });
        await adminDb.doc("boxes/box-tenant-a/transactions/tx-legit").set({
          amount: 5000,
          description: "Pagamento de rota",
        });
      });

      const userAContext = await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const dbA = userAContext.firestore();

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

      // Configurar superadmin via banco de dados
      const superadminContext = await setupUser("super-uid", "super_admin_tenant", "superadmin", "superadmin@controlmax.dev");
      const dbSuper = superadminContext.firestore();

      await assertSucceeds(dbSuper.doc("boxes/box-tenant-a/transactions/tx-1").get());
    });
  });

  // 2. PRIVILEGE ESCALATION EM /users/{userId}
  describe("2. Privilege escalation em /users/{userId}", () => {
    test("usuário autenticado sem documento /users/{uid} tenta criar próprio documento como collector -> NEGADO (create: if false)", async () => {
      const userAContext = testEnv.authenticatedContext("new-user-a", { email: "new-user-a@tenant-a.com" });
      const dbA = userAContext.firestore();

      await assertFails(
        dbA.doc("users/new-user-a").set({
          tenantId: "tenant-a",
          role: "collector",
          email: "new-user-a@tenant-a.com",
          active: true,
        })
      );
    });

    test("usuário autenticado sem documento /users/{uid} tenta criar próprio documento como admin -> NEGADO", async () => {
      const userAContext = testEnv.authenticatedContext("new-user-b", { email: "new-user-b@tenant-a.com" });
      const dbA = userAContext.firestore();

      await assertFails(
        dbA.doc("users/new-user-b").set({
          tenantId: "tenant-a",
          role: "admin",
          email: "new-user-b@tenant-a.com",
          active: true,
        })
      );
    });

    test("usuário autenticado sem documento /users/{uid} tenta criar próprio documento com isSuperAdmin: true -> NEGADO", async () => {
      const userAContext = testEnv.authenticatedContext("new-user-c", { email: "new-user-c@tenant-a.com" });
      const dbA = userAContext.firestore();

      await assertFails(
        dbA.doc("users/new-user-c").set({
          tenantId: "tenant-a",
          role: "superadmin",
          isSuperAdmin: true,
          email: "new-user-c@tenant-a.com",
          active: true,
        })
      );
    });

    test("usuário com role collector tenta atualizar o próprio documento mudando role para admin -> NEGADO", async () => {
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

    test("usuário com role collector tenta mudar tenantId para outro tenant -> NEGADO", async () => {
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

    test("usuário com role collector atualizando campo não sensível do próprio perfil preservando role/tenantId -> PERMITIDO", async () => {
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

    test("admin de um tenant tenta promover outro usuário do mesmo tenant para role='admin' via update -> NEGADO", async () => {
      await setupUser("admin-a", "tenant-a", "admin", "admin-a@tenant-a.com");
      await setupUser("collector-a2", "tenant-a", "collector", "collector-a2@tenant-a.com");

      const adminAContext = testEnv.authenticatedContext("admin-a", { email: "admin-a@tenant-a.com" });
      const dbAdminA = adminAContext.firestore();

      await assertFails(
        dbAdminA.doc("users/collector-a2").set({
          tenantId: "tenant-a",
          role: "admin",
          email: "collector-a2@tenant-a.com",
          active: true,
        })
      );
    });

    test("admin de um tenant tenta promover outro usuário do mesmo tenant para role='superadmin' via update -> NEGADO", async () => {
      await setupUser("admin-a", "tenant-a", "admin", "admin-a@tenant-a.com");
      await setupUser("collector-a3", "tenant-a", "collector", "collector-a3@tenant-a.com");

      const adminAContext = testEnv.authenticatedContext("admin-a", { email: "admin-a@tenant-a.com" });
      const dbAdminA = adminAContext.firestore();

      await assertFails(
        dbAdminA.doc("users/collector-a3").set({
          tenantId: "tenant-a",
          role: "superadmin",
          isSuperAdmin: true,
          email: "collector-a3@tenant-a.com",
          active: true,
        })
      );
    });

    test("admin de um tenant alterando outro usuário para papel de menor privilégio (supervisor) sem admin/superadmin -> PERMITIDO", async () => {
      await setupUser("admin-a", "tenant-a", "admin", "admin-a@tenant-a.com");
      await setupUser("collector-a4", "tenant-a", "collector", "collector-a4@tenant-a.com");

      const adminAContext = testEnv.authenticatedContext("admin-a", { email: "admin-a@tenant-a.com" });
      const dbAdminA = adminAContext.firestore();

      await assertSucceeds(
        dbAdminA.doc("users/collector-a4").set({
          tenantId: "tenant-a",
          role: "supervisor",
          email: "collector-a4@tenant-a.com",
          active: true,
        })
      );
    });

    test("admin do Tenant A tentando alterar usuário do Tenant B -> NEGADO", async () => {
      await setupUser("admin-a", "tenant-a", "admin", "admin-a@tenant-a.com");
      await setupUser("collector-b", "tenant-b", "collector", "collector-b@tenant-b.com");

      const adminAContext = testEnv.authenticatedContext("admin-a", { email: "admin-a@tenant-a.com" });
      const dbAdminA = adminAContext.firestore();

      await assertFails(
        dbAdminA.doc("users/collector-b").set({
          tenantId: "tenant-b",
          role: "supervisor",
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

    test("usuário do Tenant A NÃO consegue criar security_logs diretamente (deve usar BFF)", async () => {
      const userAContext = await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const dbA = userAContext.firestore();

      await assertFails(
        dbA.doc("security_logs/log-legit").set({
          tenantId: "tenant-a",
          message: "Log legítimo de alteração",
        })
      );
    });

    test("superadmin também NÃO consegue criar security_logs pelo client SDK", async () => {
      const superadminContext = await setupUser("super-uid", "super_admin_tenant", "superadmin", "superadmin@controlmax.dev");
      const dbSuper = superadminContext.firestore();

      await assertFails(
        dbSuper.doc("security_logs/log-super").set({
          tenantId: "tenant-a",
          message: "Tentativa via client",
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
      const superadminContext = await setupUser("super-uid", "super_admin_tenant", "superadmin", "superadmin@controlmax.dev");
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

    test("usuário do Tenant B não pode ler sales do Tenant A", async () => {
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
    });

    test("usuário do próprio Tenant A NÃO consegue criar sales diretamente (deve usar BFF)", async () => {
      const userAContext = await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const dbA = userAContext.firestore();

      await assertFails(
        dbA.doc("sales/sale-tenant-a-new").set({
          tenantId: "tenant-a",
          amount: 10000,
        })
      );
    });

    test("usuário do próprio Tenant A NÃO consegue criar collections diretamente (FIN-01 / BFF)", async () => {
      const userAContext = await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const dbA = userAContext.firestore();

      await assertFails(
        dbA.doc("collections/col-tenant-a-new").set({
          tenantId: "tenant-a",
          saleId: "sale-1",
          amount: 1000,
        })
      );
    });

    test("usuário do Tenant B não pode ler collections do Tenant A", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.doc("collections/col-tenant-a").set({
          tenantId: "tenant-a",
          amount: 2500,
        });
      });

      const userBContext = await setupUser("collector-b", "tenant-b", "collector", "collector-b@tenant-b.com");
      const dbB = userBContext.firestore();

      await assertFails(dbB.doc("collections/col-tenant-a").get());
    });

    test("usuário do próprio Tenant A NÃO consegue atualizar sales diretamente (deve usar BFF)", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.doc("sales/sale-tenant-a-exist").set({
          tenantId: "tenant-a",
          amount: 50000,
        });
      });

      const userAContext = await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const dbA = userAContext.firestore();

      await assertFails(
        dbA.doc("sales/sale-tenant-a-exist").update({
          amount: 1000,
        })
      );
    });

    test("usuário do próprio Tenant A NÃO consegue escrever em payments diretamente (deve usar BFF)", async () => {
      const userAContext = await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const dbA = userAContext.firestore();

      await assertFails(
        dbA.doc("payments/pay-tenant-a-new").set({
          tenantId: "tenant-a",
          amount: 5000,
        })
      );
    });

    test("usuário do próprio Tenant A NÃO consegue escrever em expenses diretamente (deve usar BFF)", async () => {
      const userAContext = await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const dbA = userAContext.firestore();

      await assertFails(
        dbA.doc("expenses/exp-tenant-a-new").set({
          tenantId: "tenant-a",
          amount: 2000,
        })
      );
    });

    test("usuário do próprio Tenant A NÃO consegue escrever em incomes diretamente (deve usar BFF)", async () => {
      const userAContext = await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const dbA = userAContext.firestore();

      await assertFails(
        dbA.doc("incomes/inc-tenant-a-new").set({
          tenantId: "tenant-a",
          amount: 10000,
        })
      );
    });

    test("usuário do próprio Tenant A NÃO consegue atualizar boxes diretamente (deve usar BFF)", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.doc("boxes/box-tenant-a-exist").set({
          tenantId: "tenant-a",
          status: "open",
        });
      });

      const userAContext = await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const dbA = userAContext.firestore();

      await assertFails(
        dbA.doc("boxes/box-tenant-a-exist").update({
          status: "confirmed",
        })
      );
    });


    test("casos legítimos: usuário do Tenant A consegue ler seus próprios recursos", async () => {
      const userAContext = await setupUser("collector-a", "tenant-a", "collector", "collector-a@tenant-a.com");
      const dbA = userAContext.firestore();

      // Escrita de client/customer (permitido no client-side)
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

      // Injeta uma venda via Admin para poder ler no client-side
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.doc("sales/sale-tenant-a-valid").set({
          tenantId: "tenant-a",
          amount: 35000,
        });
      });

      // Leituras válidas
      await assertSucceeds(dbA.doc("clients/client-tenant-a-valid").get());
      await assertSucceeds(dbA.doc("customers/customer-tenant-a-valid").get());
      await assertSucceeds(dbA.doc("sales/sale-tenant-a-valid").get());
    });
  });
});
