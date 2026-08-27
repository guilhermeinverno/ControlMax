import { describe, expect, it } from "vitest";
import { saleBodySchema, collectionBodySchema, reversalBodySchema } from "../schemas/transactions";
import { openBoxBodySchema, closeBoxBodySchema } from "../schemas/boxes";
import { createUserBodySchema, updateUserBodySchema } from "../schemas/users";
import { formatZodError } from "../middleware/validateBody";

describe("ENT-01 schemas Zod — transactions", () => {
  it("sale aceita payload válido e arredonda centavos", () => {
    const r = saleBodySchema.safeParse({
      clientId: "c1",
      clientName: "Ana",
      amountCents: 1000.4,
      installmentAmountCents: 500,
      totalInstallments: 2,
      date: "2026-08-27",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.amountCents).toBe(1000);
      expect(r.data.frequency).toBe("diaria");
    }
  });

  it("sale rejeita amountCents <= 0 sem tocar handler", () => {
    const r = saleBodySchema.safeParse({
      clientId: "c1",
      clientName: "Ana",
      amountCents: 0,
      installmentAmountCents: 500,
      totalInstallments: 2,
      date: "2026-08-27",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const body = formatZodError(r.error);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(body.error).toContain("maiores que zero");
    }
  });

  it("collection permite amountCents = 0 (visita sem pagamento)", () => {
    const r = collectionBodySchema.safeParse({
      saleId: "s1",
      amountCents: 0,
      paymentMethod: "cash",
    });
    expect(r.success).toBe(true);
  });

  it("collection rejeita amountCents negativo", () => {
    const r = collectionBodySchema.safeParse({
      saleId: "s1",
      amountCents: -1,
      paymentMethod: "cash",
    });
    expect(r.success).toBe(false);
  });

  it("reversal exige originalTransactionId e reason", () => {
    expect(reversalBodySchema.safeParse({ reason: "x" }).success).toBe(false);
    expect(
      reversalBodySchema.safeParse({ originalTransactionId: "t1", reason: "erro" }).success
    ).toBe(true);
  });
});

describe("ENT-01 schemas Zod — boxes", () => {
  it("open aceita contrato BFF", () => {
    const r = openBoxBodySchema.safeParse({
      unitId: "u1",
      cnId: "cn1",
      date: "2026-08-27",
      initialAmount: 0,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.initialAmount).toBe(0);
  });

  it("open aceita alias Sync initialBalanceCents", () => {
    const r = openBoxBodySchema.safeParse({
      unitId: "u1",
      cnId: "cn1",
      date: "2026-08-27",
      initialBalanceCents: 1500,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.initialAmount).toBe(1500);
  });

  it("open rejeita sem valor inicial", () => {
    const r = openBoxBodySchema.safeParse({
      unitId: "u1",
      cnId: "cn1",
      date: "2026-08-27",
    });
    expect(r.success).toBe(false);
  });

  it("close aceita alias finalBalanceCents", () => {
    const r = closeBoxBodySchema.safeParse({
      boxId: "b1",
      finalBalanceCents: 2000,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.realFinalAmount).toBe(2000);
  });
});

describe("ENT-01 schemas Zod — users", () => {
  it("create exige email e normaliza lowercase", () => {
    const r = createUserBodySchema.safeParse({ email: "  Admin@Tenant.COM " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("admin@tenant.com");
  });

  it("create rejeita sem email", () => {
    expect(createUserBodySchema.safeParse({}).success).toBe(false);
  });

  it("update rejeita body vazio", () => {
    expect(updateUserBodySchema.safeParse({}).success).toBe(false);
  });

  it("update aceita patch parcial", () => {
    expect(updateUserBodySchema.safeParse({ active: false, reason: "off" }).success).toBe(true);
  });
});
