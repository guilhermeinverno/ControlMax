import { describe, expect, test } from "vitest";
import { assertUnitAssignedToUser, getUserAssignedUnits } from "../userUnitAccess";

describe("CTX-02 userUnitAccess", () => {
  test("getUserAssignedUnits lê usuario_unidades e aliases", () => {
    expect(getUserAssignedUnits({ usuario_unidades: ["u1"] })).toEqual(["u1"]);
    expect(getUserAssignedUnits({ usuarioUnidades: ["u2"] })).toEqual(["u2"]);
    expect(getUserAssignedUnits({ assignedUnits: ["u3"] })).toEqual(["u3"]);
    expect(getUserAssignedUnits({})).toEqual([]);
  });

  test("collector sem lista → nega", () => {
    expect(() => assertUnitAssignedToUser({ role: "collector" }, "u1", "collector")).toThrow(
      /sem unidades atribuídas/
    );
  });

  test("admin sem lista → permite qualquer unidade", () => {
    expect(() => assertUnitAssignedToUser({ role: "admin" }, "u-qualquer", "admin")).not.toThrow();
  });

  test("unidade fora da lista → nega", () => {
    expect(() =>
      assertUnitAssignedToUser({ usuario_unidades: ["u-ok"] }, "u-outro", "collector")
    ).toThrow(/não atribuída/);
  });

  test("unidade na lista → permite", () => {
    expect(() =>
      assertUnitAssignedToUser({ usuario_unidades: ["u-ok"] }, "u-ok", "collector")
    ).not.toThrow();
  });
});
