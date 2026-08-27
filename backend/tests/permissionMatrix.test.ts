import { describe, expect, it } from "vitest";
import {
  emptyPermissionMatrix,
  fullPermissionMatrix,
  hasMatrixPermission,
  mergePermissionMatrix,
} from "../permissionMatrix";

describe("permissionMatrix", () => {
  it("empty e full diferem em sales.create", () => {
    expect(hasMatrixPermission(emptyPermissionMatrix(), "sales", "create")).toBe(false);
    expect(hasMatrixPermission(fullPermissionMatrix(), "sales", "create")).toBe(true);
  });

  it("mergePermissionMatrix preserva defaults e sobrescreve booleanos", () => {
    const merged = mergePermissionMatrix({
      sales: { create: true },
      platform: { manageRoles: true },
    });
    expect(merged.sales.create).toBe(true);
    expect(merged.sales.read).toBe(false);
    expect(merged.platform.manageRoles).toBe(true);
    expect(merged.platform.manageUsers).toBe(false);
  });
});
