import { describe, expect, test } from "vitest";
import { resolveAuthProfile, shouldRevokeSessionsOnUserPatch } from "../customClaims";

describe("AUTH-01 resolveAuthProfile", () => {
  test("prioriza Custom Claims sobre Firestore (bloqueia escalate de role)", () => {
    const profile = resolveAuthProfile(
      { role: "collector", tenantId: "t1", isSuperAdmin: false },
      { role: "admin", tenantId: "t1", isSuperAdmin: false }
    );
    expect(profile.role).toBe("collector");
    expect(profile.source).toBe("claims");
    expect(profile.isSuperAdmin).toBe(false);
  });

  test("prioriza tenantId das claims", () => {
    const profile = resolveAuthProfile(
      { role: "admin", tenantId: "tenant-legit" },
      { role: "admin", tenantId: "tenant-hacker" }
    );
    expect(profile.tenantId).toBe("tenant-legit");
  });

  test("fallback Firestore quando claims ausentes (usuário legado)", () => {
    const profile = resolveAuthProfile({}, { role: "supervisor", tenantId: "t2", isSuperAdmin: false });
    expect(profile.role).toBe("supervisor");
    expect(profile.tenantId).toBe("t2");
    expect(profile.source).toBe("firestore");
  });

  test("superadmin via claim role", () => {
    const profile = resolveAuthProfile(
      { role: "superadmin", tenantId: "platform" },
      { role: "collector", tenantId: "t1" }
    );
    expect(profile.isSuperAdmin).toBe(true);
    expect(profile.role).toBe("superadmin");
  });
});

describe("ENT-04 shouldRevokeSessionsOnUserPatch", () => {
  test("revoga quando role muda", () => {
    expect(shouldRevokeSessionsOnUserPatch({ role: "collector" }, { role: "admin" })).toBe(true);
  });

  test("revoga quando active vira false", () => {
    expect(shouldRevokeSessionsOnUserPatch({ active: true }, { active: false })).toBe(true);
  });

  test("não revoga em update só de usuario_unidades", () => {
    expect(
      shouldRevokeSessionsOnUserPatch(
        { role: "collector", usuario_unidades: ["u1"] },
        { usuario_unidades: ["u1", "u2"] }
      )
    ).toBe(false);
  });

  test("não revoga quando role permanece igual", () => {
    expect(
      shouldRevokeSessionsOnUserPatch({ role: "collector" }, { role: "collector", name: "Ana" })
    ).toBe(false);
  });
});
