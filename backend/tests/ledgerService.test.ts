import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const setMock = vi.fn();
let docCounter = 0;
const docMock = vi.fn(() => {
  docCounter += 1;
  return { id: `ledger-doc-${docCounter}`, set: setMock };
});

const boxGetMock = vi.fn();
const boxSetMock = vi.fn();
const ledgerWhereGetMock = vi.fn();

vi.mock("../authMiddleware", () => ({
  adminDb: {
    collection: (name: string) => {
      if (name === "boxes") {
        return {
          doc: () => ({
            get: boxGetMock,
            set: boxSetMock,
          }),
        };
      }
      return {
        doc: docMock,
        where: () => ({
          where: () => ({
            get: ledgerWhereGetMock,
          }),
        }),
      };
    },
  },
}));

import {
  ACCOUNT_AJUSTE_CAIXA,
  ACCOUNT_DIFERENCA_CAIXA,
  LEDGER_SHADOW_COLLECTION,
  accountCaixa,
  accountCn,
  accountRecebiveis,
  cutoverBoxToLedger,
  getLedgerModePolicy,
  ledgerWriteModesForPolicy,
  setLedgerShadowInTransaction,
  writeLedgerShadow,
} from "../services/ledgerService";

describe("ledgerService ENT-02/09", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    docCounter = 0;
    delete process.env.LEDGER_MODE;
    ledgerWhereGetMock.mockResolvedValue({ docs: [], size: 0 });
  });

  afterEach(() => {
    delete process.env.LEDGER_MODE;
  });

  it("monta contas canônicas", () => {
    expect(accountCaixa("b1")).toBe("caixa:b1");
    expect(accountRecebiveis("s1")).toBe("recebiveis:s1");
    expect(accountCn("cn1")).toBe("cn:cn1");
    expect(ACCOUNT_AJUSTE_CAIXA).toBe("ajuste_caixa");
    expect(ACCOUNT_DIFERENCA_CAIXA).toBe("diferenca_caixa");
  });

  it("LEDGER_MODE default shadow; dual e canonical", () => {
    expect(getLedgerModePolicy()).toBe("shadow");
    expect(ledgerWriteModesForPolicy("shadow")).toEqual(["shadow"]);
    expect(ledgerWriteModesForPolicy("dual")).toEqual(["shadow", "canonical"]);
    expect(ledgerWriteModesForPolicy("canonical")).toEqual(["canonical"]);
  });

  it("setLedgerShadowInTransaction grava entry append-only (shadow)", () => {
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
    expect(tx.set).toHaveBeenCalledTimes(1);
    const payload = tx.set.mock.calls[0][1];
    expect(payload.amountCents).toBe(1500);
    expect(payload.mode).toBe("shadow");
    expect(payload.debitAccount).toBe("recebiveis:s1");
  });

  it("LEDGER_MODE=dual grava shadow + canonical", () => {
    process.env.LEDGER_MODE = "dual";
    const tx = { set: vi.fn() } as any;
    setLedgerShadowInTransaction(tx, {
      tenantId: "t1",
      transactionId: "idem-dual",
      debitAccount: accountCaixa("b1"),
      creditAccount: accountRecebiveis("s1"),
      amountCents: 100,
      source: "collection",
      boxId: "b1",
    });
    expect(tx.set).toHaveBeenCalledTimes(2);
    expect(tx.set.mock.calls[0][1].mode).toBe("shadow");
    expect(tx.set.mock.calls[1][1].mode).toBe("canonical");
  });

  it("LEDGER_MODE=canonical grava só canônico (sombra off)", () => {
    process.env.LEDGER_MODE = "canonical";
    const tx = { set: vi.fn() } as any;
    setLedgerShadowInTransaction(tx, {
      tenantId: "t1",
      transactionId: "idem-c",
      debitAccount: accountCaixa("b1"),
      creditAccount: accountRecebiveis("s1"),
      amountCents: 50,
      source: "collection",
      boxId: "b1",
    });
    expect(tx.set).toHaveBeenCalledTimes(1);
    expect(tx.set.mock.calls[0][1].mode).toBe("canonical");
  });

  it("ignora amountCents <= 0", () => {
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
    expect(LEDGER_SHADOW_COLLECTION).toBe("ledger_shadow");
  });

  it("cutover bloqueia quando delta != 0", async () => {
    boxGetMock.mockResolvedValue({
      exists: true,
      data: () => ({ tenantId: "t1", finalAmount: 1000, initialAmount: 500 }),
    });
    ledgerWhereGetMock.mockResolvedValue({ docs: [], size: 0 });

    const result = await cutoverBoxToLedger("t1", "b1", { dryRun: false });
    expect(result.applied).toBe(false);
    expect(result.reconcile.consistent).toBe(false);
    expect(boxSetMock).not.toHaveBeenCalled();
  });

  it("cutover dry-run OK quando consistente", async () => {
    boxGetMock.mockResolvedValue({
      exists: true,
      data: () => ({ tenantId: "t1", finalAmount: 0, initialAmount: 0 }),
    });
    ledgerWhereGetMock.mockResolvedValue({ docs: [], size: 0 });

    const result = await cutoverBoxToLedger("t1", "b1", { dryRun: true });
    expect(result.dryRun).toBe(true);
    expect(result.applied).toBe(false);
    expect(result.reconcile.consistent).toBe(true);
    expect(result.message).toMatch(/Dry-run OK/i);
    expect(boxSetMock).not.toHaveBeenCalled();
  });

  it("cutover aplica balanceSource=ledger quando consistente", async () => {
    boxGetMock.mockResolvedValue({
      exists: true,
      data: () => ({ tenantId: "t1", finalAmount: 0, initialAmount: 0 }),
    });
    ledgerWhereGetMock.mockResolvedValue({ docs: [], size: 0 });
    boxSetMock.mockResolvedValue(undefined);

    const result = await cutoverBoxToLedger("t1", "b1", { dryRun: false, userId: "admin1" });
    expect(result.applied).toBe(true);
    expect(result.balanceSource).toBe("ledger");
    expect(boxSetMock).toHaveBeenCalledTimes(1);
    const payload = boxSetMock.mock.calls[0][0];
    expect(payload.balanceSource).toBe("ledger");
    expect(payload.ledgerCutoverBy).toBe("admin1");
  });
});
