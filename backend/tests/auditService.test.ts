import { describe, expect, it } from "vitest";
import { diffObjects } from "../services/auditService";

describe("auditService.diffObjects", () => {
  it("detecta campos alterados e ignora timestamps", () => {
    const changes = diffObjects(
      { name: "Ana", active: true, updatedAt: "old", balance: 100 },
      { name: "Ana", active: false, updatedAt: "new", balance: 100 }
    );
    expect(changes).toEqual([{ field: "active", oldValue: true, newValue: false }]);
  });

  it("inclui campos adicionados e removidos", () => {
    const changes = diffObjects({ a: 1 }, { b: 2 });
    expect(changes).toEqual(
      expect.arrayContaining([
        { field: "a", oldValue: 1, newValue: null },
        { field: "b", oldValue: null, newValue: 2 },
      ])
    );
  });
});
