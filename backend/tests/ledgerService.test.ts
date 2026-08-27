import { describe, expect, it, vi, beforeEach } from "vitest";

const setMock = vi.fn();
const docMock = vi.fn(() => ({ id: "ledger-doc-1", set: setMock }));
const collectionMock = vi.fn(() => ({ doc: docMock }));

vi.mock("../authMiddleware", () => ({
  adminDb: {
    collection: (...args: unknown[]) => collectionMock(...args),
  },
}));

import {
  ACCOUNT_AJUSTE_CAIXA,
  ACCOUNT_DIFERENCA_CAIXA,
  LEDGER_SHADOW_COLLECTION,
  accountCaixa,
  accountCn,
  accountRecebiveis,
  setLedgerShadowInTransaction,
  writeLedgerShadow,
} from "../services/ledgerService";

describe("ENT-02 ledgerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("monta contas canônicas", () => {
    expect(accountCaixa("b1")).toBe("caixa:b1");
    expect(accountRecebiveis("s1")).toBe("recebiveis:s1");
    expect(accountCn("cn1")).toBe("cn:cn1");
    expect(ACCOUNT_AJUSTE_CAIXA).toBe("ajuste_caixa");
    expect(ACCOUNT_DIFERENCA_CAIXA).toBe("diferenca_caixa");
  });

  it("setLedgerShadowInTransaction grava entry append-only", () => {
    const tx = { set: vi.fn() } as any;
    const id = setLedgerShadowInTransaction(tx, {
      tenantId: "t1",
      transactionId: "idem-1",
      debitAccount: accountRecebiveis("s1"),
      creditAccount: accountCaixa("b1"),
      amountCents: 1500.4,
      source: "sale",
      boxId: "b1",
      saleId: "s1",
      userId: "u1",
    });

    expect(id).toBe("ledger-doc-1");
    expect(collectionMock).toHaveBeenCalledWith(LEDGER_SHADOW_COLLECTION);
    expect(tx.set).toHaveBeenCalledTimes(1);
    const payload = tx.set.mock.calls[0][1];
    expect(payload.amountCents).toBe(1500);
    expect(payload.mode).toBe("shadow");
    expect(payload.debitAccount).toBe("recebiveis:s1");
    expect(payload.creditAccount).toBe("caixa:b1");
  });

  it("ignora amountCents <= 0 (visita sem pagamento)", () => {
    const tx = { set: vi.fn() } as any;
    expect(
      setLedgerShadowInTransaction(tx, {
        tenantId: "t1",
        transactionId: "idem-0",
        debitAccount: accountCaixa("b1"),
        creditAccount: accountRecebiveis("s1"),
        amountCents: 0,
        source: "collection",
      })
    ).toBeNull();
    expect(tx.set).not.toHaveBeenCalled();
  });

  it("writeLedgerShadow persiste fora de transação", async () => {
    const id = await writeLedgerShadow({
      tenantId: "t1",
      transactionId: "batch-1",
      debitAccount: accountCaixa("b2"),
      creditAccount: accountCn("cn1"),
      amountCents: 2000,
      source: "box_open_batch",
      boxId: "b2",
    });
    expect(id).toBe("ledger-doc-1");
    expect(setMock).toHaveBeenCalledTimes(1);
  });
});
