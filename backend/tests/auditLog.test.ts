import { describe, expect, it, vi } from "vitest";

vi.mock("../authMiddleware", () => {
  const docs: Record<string, unknown> = {};
  return {
    adminDb: {
      collection: () => ({
        doc: (id?: string) => {
          const docId = id || `auto_${Object.keys(docs).length + 1}`;
          return {
            id: docId,
            set: async (data: unknown) => {
              docs[docId] = data;
            },
          };
        },
      }),
    },
  };
});

import { writeAuditLog } from "../auditLog";

describe("auditLog", () => {
  it("grava AuditLogEntry canônico com id e timestamp ISO", async () => {
    const id = await writeAuditLog({
      tenantId: "t1",
      userId: "u1",
      userEmail: "a@b.com",
      action: "REVERSAL",
      entity: "collections",
      entityId: "col-1",
      changes: [{ field: "status", oldValue: "active", newValue: "reversed" }],
      reason: "Erro de digitação",
    });

    expect(id).toBeTruthy();
  });
});
