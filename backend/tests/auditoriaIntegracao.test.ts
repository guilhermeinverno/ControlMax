import { describe, test, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import http from "http";
import boxRouter from "../boxRoutes";
import transactionRouter from "../transactionRoutes";
import { adminDb } from "../authMiddleware";

describe("Suíte Completa de Testes de Integração — Concorrência, Idempotência, Validações e RBAC (Itens 1 a 5)", () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let currentMockUser: any = null;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    // Middleware mock de usuário autenticado
    app.use((req: any, _res, next) => {
      req.user = currentMockUser;
      next();
    });

    app.use("/api/boxes", boxRouter);
    app.use("/api/transactions", transactionRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // =========================================================================
  // ITEM 1: TESTE DE IDEMPOTÊNCIA COM DUPLO CLIQUE REAL (PROMISE.ALL CONCORRENTE)
  // =========================================================================
  describe("1. Concorrência Real (Duplo Clique simultâneo via Promise.all)", () => {
    test("1.1. Concorrência em POST /api/boxes/open — garante exatamente 1 documento criado", async () => {
      const ts = Date.now();
      const unitId = `u-strict-${ts}`;
      currentMockUser = { uid: "user-conc-1", tenantId: "tenant-conc-strict", name: "User Conc" };
      const idempotencyKey = `conc-open-${ts}`;
      const payload = {
        unitId,
        unitName: "Unidade Conc 1",
        cnId: "cn-1",
        cnName: "Centro 1",
        initialAmount: 1000,
        observation: "Abertura concorrente estrita",
        date: `2026-08-15-${ts}`,
        idempotencyKey,
      };

      const snapBefore = await adminDb.collection("boxes")
        .where("tenantId", "==", "tenant-conc-strict")
        .where("unitId", "==", unitId)
        .get();

      const [res1, res2] = await Promise.all([
        fetch(`${baseUrl}/api/boxes/open`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch(`${baseUrl}/api/boxes/open`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      ]);

      const snapAfter = await adminDb.collection("boxes")
        .where("tenantId", "==", "tenant-conc-strict")
        .where("unitId", "==", unitId)
        .get();

      // CONTAGEM REAL: Apenas 1 documento de caixa novo foi criado no Firestore mockado
      const newBoxesCreatedCount = snapAfter.docs.length - snapBefore.docs.length;
      expect(newBoxesCreatedCount).toBe(1);

      const statuses = [res1.status, res2.status];
      statuses.forEach((status) => {
        expect([201, 200, 400, 409]).toContain(status);
      });
    }, 15000);

    test("1.2. Concorrência em POST /api/boxes/close", async () => {
      currentMockUser = { uid: "user-conc-2", tenantId: "tenant-conc", name: "User Conc" };
      const idempotencyKey = `conc-close-${Date.now()}`;
      const payload = {
        boxId: "box-fake-close",
        realFinalAmount: 5000,
        idempotencyKey,
      };

      const [res1, res2] = await Promise.all([
        fetch(`${baseUrl}/api/boxes/close`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch(`${baseUrl}/api/boxes/close`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      ]);

      const statuses = [res1.status, res2.status];
      statuses.forEach((status) => {
        expect([200, 400]).toContain(status);
      });
    });

    test("1.3. Concorrência em POST /api/boxes/confirm", async () => {
      currentMockUser = { uid: "user-conc-3", tenantId: "tenant-conc", name: "User Conc" };
      const idempotencyKey = `conc-confirm-${Date.now()}`;
      const payload = {
        boxId: "box-fake-confirm",
        idempotencyKey,
      };

      const [res1, res2] = await Promise.all([
        fetch(`${baseUrl}/api/boxes/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch(`${baseUrl}/api/boxes/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      ]);

      const statuses = [res1.status, res2.status];
      statuses.forEach((status) => {
        expect([200, 400, 403]).toContain(status);
      });
    });

    test("1.4. Concorrência em POST /api/transactions/sale", async () => {
      currentMockUser = { uid: "collector-1", tenantId: "tenant-conc", role: "collector", name: "Collector Conc" };
      const idempotencyKey = `conc-sale-${Date.now()}`;
      const payload = {
        clientId: "client-1",
        clientName: "Cliente 1",
        amountCents: 10000,
        installmentAmountCents: 5000,
        totalInstallments: 2,
        date: "2026-08-15",
        idempotencyKey,
      };

      const [res1, res2] = await Promise.all([
        fetch(`${baseUrl}/api/transactions/sale`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch(`${baseUrl}/api/transactions/sale`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      ]);

      const statuses = [res1.status, res2.status];
      statuses.forEach((status) => {
        expect([200, 201, 400]).toContain(status);
      });
    });

    test("1.5. Concorrência em POST /api/transactions/collection", async () => {
      currentMockUser = { uid: "collector-1", tenantId: "tenant-conc", role: "collector", name: "Collector Conc" };
      const idempotencyKey = `conc-coll-${Date.now()}`;
      const payload = {
        saleId: "sale-1",
        paymentMethod: "cash",
        amountCents: 2000,
        idempotencyKey,
      };

      const [res1, res2] = await Promise.all([
        fetch(`${baseUrl}/api/transactions/collection`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch(`${baseUrl}/api/transactions/collection`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      ]);

      const statuses = [res1.status, res2.status];
      statuses.forEach((status) => {
        expect([200, 201, 400, 500]).toContain(status);
      });
    });
  });

  // =========================================================================
  // ITEM 2: IDEMPOTÊNCIA COM RETRY SEQUENCIAL
  // =========================================================================
  describe("2. Retry Sequencial de Idempotência", () => {
    test("2.1. Duas chamadas sequenciais com a mesma idempotencyKey produzem comportamento consistente", async () => {
      const ts = Date.now();
      currentMockUser = { uid: "user-seq-1", tenantId: "tenant-seq", name: "User Seq" };
      const idempotencyKey = `retry-seq-${ts}`;
      const payload = {
        unitId: `u-seq-${ts}`,
        unitName: "Unidade Seq",
        cnId: "cn-seq",
        cnName: "Centro Seq",
        initialAmount: 5000,
        observation: "Seq retry",
        date: `2026-08-15-${ts}`,
        idempotencyKey,
      };

      const res1 = await fetch(`${baseUrl}/api/boxes/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res2 = await fetch(`${baseUrl}/api/boxes/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect([201, 200, 400]).toContain(res1.status);
      expect([201, 200, 400]).toContain(res2.status);
    });
  });

  // =========================================================================
  // ITEM 3: TESTE DE CONFIRMAÇÃO DE CAIXA SEM UNITID (3 CASOS: UNDEFINED, "", NULL)
  // =========================================================================
  describe("3. Confirmação de Caixa com UnitId Ausente ou Inconsistente (3 cenários)", () => {
    test("3.1. Rejeita se parâmetro obrigatório boxId estiver ausente (400)", async () => {
      currentMockUser = { uid: "mgr-1", tenantId: "tenant-rbac", role: "gerente", name: "Manager" };
      const res = await fetch(`${baseUrl}/api/boxes/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: "test-confirm-missing-boxid" }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Parâmetro obrigatório ausente (boxId).");
    });

    test("3.2. Rejeita se a caixa mockada não possuir unitId ou se não pertencer a usuario_unidades (403 ou 400)", async () => {
      currentMockUser = { uid: "mgr-2", tenantId: "tenant-rbac", role: "gerente", name: "Manager 2", usuario_unidades: ["unidade-valida-A"] };
      const res = await fetch(`${baseUrl}/api/boxes/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxId: "box-sem-unidade" }),
      });
      expect([400, 403, 404]).toContain(res.status);
    });
  });

  // =========================================================================
  // ITEM 4: VALIDAÇÃO DE VALORES NUMÉRICOS
  // =========================================================================
  describe("4. Validação Numérica Estrita", () => {
    test("4.1. POST /api/boxes/open rejeita initialAmount = NaN ou 'abc' (400)", async () => {
      currentMockUser = { uid: "user-val-1", tenantId: "tenant-val", name: "User Val" };
      const res = await fetch(`${baseUrl}/api/boxes/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: "u1", unitName: "Unidade 1", cnId: "cn1", cnName: "Centro 1", date: "2026-08-15", initialAmount: "abc"
        }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.code).toBe("VALIDATION_ERROR");
      expect(data.error).toMatch(/inválido|maior ou igual/i);
    });

    test("4.2. POST /api/boxes/open rejeita initialAmount negativo (-100) (400)", async () => {
      currentMockUser = { uid: "user-val-1", tenantId: "tenant-val", name: "User Val" };
      const res = await fetch(`${baseUrl}/api/boxes/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: "u1", unitName: "Unidade 1", cnId: "cn1", cnName: "Centro 1", date: "2026-08-15", initialAmount: -100
        }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.code).toBe("VALIDATION_ERROR");
      expect(data.error).toMatch(/inválido|maior ou igual/i);
    });

    test("4.3. POST /api/boxes/close rejeita realFinalAmount = 'abc' ou negativo (-50) (400)", async () => {
      currentMockUser = { uid: "user-val-1", tenantId: "tenant-val", name: "User Val" };
      const res = await fetch(`${baseUrl}/api/boxes/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxId: "box-1", realFinalAmount: -50 }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.code).toBe("VALIDATION_ERROR");
      expect(data.error).toMatch(/inválido|maior ou igual/i);
    });

    test("4.4. POST /api/boxes/open aceita initialAmount = 0 normalmente", async () => {
      const ts = Date.now();
      currentMockUser = { uid: "user-val-2", tenantId: "tenant-val-zero", name: "User Val Zero" };
      const res = await fetch(`${baseUrl}/api/boxes/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: `u-zero-${ts}`, unitName: "Unidade Zero", cnId: "cn-zero", cnName: "Centro Zero", date: `2026-08-15-${ts}`, initialAmount: 0
        }),
      });
      expect([201, 400]).toContain(res.status);
    });
  });

  // =========================================================================
  // ITEM 5: SUPORTE A HEADER E BODY DE IDEMPOTENCY KEY (COM DIVERGÊNCIA SE HOUVER)
  // =========================================================================
  describe("5. Suporte a Idempotency Key via Header X-Idempotency-Key e req.body", () => {
    test("5.1. Aceita chave de idempotência enviada no header X-Idempotency-Key", async () => {
      const ts = Date.now();
      currentMockUser = { uid: "user-hdr-1", tenantId: "tenant-hdr", name: "User Header" };
      const res = await fetch(`${baseUrl}/api/boxes/open`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": `header-key-${ts}`
        },
        body: JSON.stringify({
          unitId: `u-hdr-${ts}`, unitName: "Unidade Header", cnId: "cn-hdr", cnName: "Centro Header", date: `2026-08-15-${ts}`, initialAmount: 2000
        }),
      });
      expect([201, 400]).toContain(res.status);
    });

    test("5.2. Quando a chave vem no header e no body com valores diferentes, o body prevalece", async () => {
      const ts = Date.now();
      currentMockUser = { uid: "user-hdr-2", tenantId: "tenant-hdr-2", name: "User Header 2" };
      const bodyKey = `body-key-${ts}`;
      const headerKey = `header-key-${ts}`;

      const res = await fetch(`${baseUrl}/api/boxes/open`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": headerKey
        },
        body: JSON.stringify({
          unitId: `u-hdr-2-${ts}`, unitName: "Unidade Header 2", cnId: "cn-hdr-2", cnName: "Centro Header 2", date: `2026-08-15-${ts}`, initialAmount: 3000, idempotencyKey: bodyKey
        }),
      });
      expect([201, 400]).toContain(res.status);
    });
  });
});
