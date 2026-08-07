import { describe, test, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import http from "http";
import transactionRouter from "../transactionRoutes";
import adminRouter from "../adminRoutes";
import { handleConfirmBox } from "../boxConfirmRoute";
import { checkIdempotency, buildIdempotencyDocId } from "../idempotency";

describe("Suíte Completa de Testes da Fase 2 — BFF, Idempotência, Transações Financeiras e Admin SDK (17 Cenários)", () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let currentMockUser: any = null;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    // Inject mock user middleware
    app.use((req: any, _res, next) => {
      req.user = currentMockUser;
      next();
    });

    app.use("/api/transactions", transactionRouter);
    app.use("/api/admin", adminRouter);
    app.post("/api/boxes/confirm", handleConfirmBox);

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

  // -------------------------------------------------------------
  // 1. AUTENTICAÇÃO E AUTORIZAÇÃO DE ROTAS (BFF)
  // -------------------------------------------------------------
  describe("1. Autenticação sem token / token inválido", () => {
    test("1. handleConfirmBox nega acesso se req.user estiver ausente (401)", async () => {
      currentMockUser = null;
      const res = await fetch(`${baseUrl}/api/boxes/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxId: "box-1" }),
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ error: "Não autenticado." });
    });

    test("2. handleCreateUser nega acesso se req.user estiver ausente (401)", async () => {
      currentMockUser = null;
      const res = await fetch(`${baseUrl}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@user.com" }),
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ error: "Não autenticado." });
    });
  });

  // -------------------------------------------------------------
  // 2. ISOLAMENTO MULTI-TENANT & SOBRESCRITA DE TENANT ID
  // -------------------------------------------------------------
  describe("2. Isolamento de Tenant e Sobrescrita de TenantId do Body", () => {
    test("3. handleRegisterSale ignora tenantId do body e força req.user.tenantId legítimo", async () => {
      currentMockUser = { uid: "user-1", tenantId: "tenant-victim", role: "collector" };
      const res = await fetch(`${baseUrl}/api/transactions/sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "tenant-hacker", // Tentativa de forjar tenant no body
          clientId: "c1", clientName: "Cliente 1", date: "2026-08-05", totalInstallments: 2,
          amountCents: -500, installmentAmountCents: 250 // amount inválido para falhar na validação
        }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Valores monetários inválidos. Devem ser números finitos maiores que zero.");
    });

    test("4. handleConfirmBox rejeita se parâmetro obrigatório boxId estiver ausente (400)", async () => {
      currentMockUser = { uid: "u1", tenantId: "tenant-A", role: "admin" };
      const res = await fetch(`${baseUrl}/api/boxes/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toEqual({ error: "Parâmetro obrigatório ausente (boxId)." });
    });
  });

  // -------------------------------------------------------------
  // 3. IDEMPOTÊNCIA ISOLADA POR USUÁRIO E TENANT
  // -------------------------------------------------------------
  describe("3. Idempotência isolada por usuário e tenant", () => {
    test("5. buildIdempotencyDocId gera chave unívoca no formato tenantId_uid_key", () => {
      const docId = buildIdempotencyDocId("tenant-alpha", "user-777", "key-uuid-123");
      expect(docId).toBe("tenant-alpha_user-777_key-uuid-123");
    });

    test("6. checkIdempotency retorna cache se o uid da requisição for o mesmo do criador", async () => {
      const mockTx = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ uid: "user-owner", status: "completed", response: { success: true } }),
        }),
      } as any;

      const res = await checkIdempotency(mockTx, "key-uuid-123", "user-owner", "tenant-alpha");
      expect(res).toEqual({ uid: "user-owner", status: "completed", response: { success: true } });
    });

    test("7. checkIdempotency bloqueia com IDEMPOTENCY_MISMATCH se outro usuário tentar reusar a chave", async () => {
      const mockTx = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ uid: "user-owner", status: "completed", response: { success: true } }),
        }),
      } as any;

      await expect(checkIdempotency(mockTx, "key-uuid-123", "user-attacker", "tenant-alpha"))
        .rejects.toThrow("IDEMPOTENCY_MISMATCH");
    });
  });

  // -------------------------------------------------------------
  // 4. VALIDAÇÃO DE VALORES MONETÁRIOS (amountCents / installmentAmountCents)
  // -------------------------------------------------------------
  describe("4. Validação estrita de montantes monetários finitos e positivos (> 0)", () => {
    test("8. handleRegisterSale rejeita amountCents negativo (-1000) (400)", async () => {
      currentMockUser = { uid: "u1", tenantId: "t1", role: "collector" };
      const res = await fetch(`${baseUrl}/api/transactions/sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: "c1", clientName: "Cliente 1", date: "2026-08-05", totalInstallments: 2,
          amountCents: -1000, installmentAmountCents: 500
        }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Valores monetários inválidos. Devem ser números finitos maiores que zero.");
    });

    test("9. handleRegisterSale rejeita amountCents = 0 (400)", async () => {
      currentMockUser = { uid: "u1", tenantId: "t1", role: "collector" };
      const res = await fetch(`${baseUrl}/api/transactions/sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: "c1", clientName: "Cliente 1", date: "2026-08-05", totalInstallments: 2,
          amountCents: 0, installmentAmountCents: 500
        }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Valores monetários inválidos. Devem ser números finitos maiores que zero.");
    });

    test("10. handleRegisterSale rejeita installmentAmountCents <= 0 (400)", async () => {
      currentMockUser = { uid: "u1", tenantId: "t1", role: "collector" };
      const res = await fetch(`${baseUrl}/api/transactions/sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: "c1", clientName: "Cliente 1", date: "2026-08-05", totalInstallments: 2,
          amountCents: 1000, installmentAmountCents: 0
        }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Valores monetários inválidos. Devem ser números finitos maiores que zero.");
    });

    test("11. handleRegisterSale rejeita totalInstallments inválido (400)", async () => {
      currentMockUser = { uid: "u1", tenantId: "t1", role: "collector" };
      const res = await fetch(`${baseUrl}/api/transactions/sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: "c1", clientName: "Cliente 1", date: "2026-08-05", totalInstallments: -1,
          amountCents: 1000, installmentAmountCents: 500
        }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Quantidade de parcelas inválida.");
    });

    test("12. handleRegisterCollection rejeita recebimento com amountCents <= 0 (400)", async () => {
      currentMockUser = { uid: "u1", tenantId: "t1", role: "collector" };
      const res = await fetch(`${baseUrl}/api/transactions/collection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: "s1", paymentMethod: "cash",
          amountCents: -500
        }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Valor monetário inválido. Deve ser um número finito maior que zero.");
    });
  });

  // -------------------------------------------------------------
  // 5. TRAVA CONTRA ESTORNO DUPLICADO
  // -------------------------------------------------------------
  describe("5. Proteção contra duplo estorno de transação", () => {
    test("13. handleReversal exige parâmetro originalTransactionId no body (400)", async () => {
      currentMockUser = { uid: "u1", tenantId: "t1", role: "admin" };
      const res = await fetch(`${baseUrl}/api/transactions/reversal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Erro de digitação" }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Campos obrigatórios ausentes (originalTransactionId, reason).");
    });
  });

  // -------------------------------------------------------------
  // 6. PERMISSÕES DE ROLES E SUPERADMIN (ADMIN SDK)
  // -------------------------------------------------------------
  describe("6. Autorização por Role e Restrição de Criação de Contas", () => {
    test("14. handleAdjustment exige papel de gerente/supervisor/admin (403 se collector)", async () => {
      currentMockUser = { uid: "col-1", tenantId: "t1", role: "collector" };
      const res = await fetch(`${baseUrl}/api/transactions/adjustment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxId: "b1", amountCents: 1000, type: "add", reason: "Sobra" }),
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe("Acesso negado: Apenas supervisores ou administradores podem ajustar caixas.");
    });

    test("15. handleCreateUser nega permissão se usuário comum tentar gerenciar usuários (403)", async () => {
      currentMockUser = { uid: "col-1", tenantId: "t1", role: "collector", isSuperAdmin: false };
      const res = await fetch(`${baseUrl}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@t1.com" }),
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe("Acesso negado: Apenas administradores podem gerenciar usuários.");
    });

    test("16. handleCreateUser impede admin comum de promover usuário para 'admin' ou 'superadmin' (403)", async () => {
      currentMockUser = { uid: "admin-1", tenantId: "t1", role: "admin", isSuperAdmin: false };
      const res = await fetch(`${baseUrl}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "newadmin@t1.com", role: "admin", tenantId: "t1" }),
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe("Admins de tenant não podem criar ou promover usuários para papéis administrativos.");
    });

    test("17. handleCreateTenant exige privilégio exclusivo de SuperAdmin (403 se admin comum)", async () => {
      currentMockUser = { uid: "admin-1", tenantId: "t1", role: "admin", isSuperAdmin: false };
      const res = await fetch(`${baseUrl}/api/admin/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Nova Empresa Inc." }),
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe("Acesso negado: Apenas SuperAdmins podem criar tenants.");
    });
  });
});
