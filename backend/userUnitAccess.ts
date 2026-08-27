/**
 * Escopo de unidade do usuário (CTX-02).
 * Fonte de verdade no Firestore: `usuario_unidades` (alias `usuarioUnidades`).
 * Spec histórica `assignedUnits` é sinônimo documentado — não migrar no piloto.
 */

export function getUserAssignedUnits(userData: Record<string, unknown> | undefined | null): string[] {
  if (!userData) return [];
  const raw = userData.usuario_unidades ?? userData.usuarioUnidades ?? userData.assignedUnits;
  return Array.isArray(raw) ? raw.map(String) : [];
}

export function isPrivilegedUnitRole(role: string | undefined | null): boolean {
  const roleLower = String(role || "").toLowerCase();
  return ["admin", "superadmin", "gerente", "supervisor", "director", "coordinador"].includes(roleLower);
}

/**
 * Valida se unitId está na lista do usuário.
 * - Lista vazia + role privilegiado → permite (gestor vê todas no piloto).
 * - Lista vazia + collector → nega.
 * - Lista preenchida → exige includes(unitId).
 */
export function assertUnitAssignedToUser(
  userData: Record<string, unknown> | undefined | null,
  unitId: string,
  role?: string | null
): void {
  const resolvedRole = role ?? (typeof userData?.role === "string" ? userData.role : "");
  const userUnits = getUserAssignedUnits(userData);

  if (!unitId) {
    throw new Error("Acesso negado: Unidade não atribuída a este usuário (usuario_unidades).");
  }

  if (userUnits.length === 0) {
    if (isPrivilegedUnitRole(resolvedRole)) return;
    throw new Error("Acesso negado: usuário sem unidades atribuídas (usuario_unidades).");
  }

  if (!userUnits.includes(unitId)) {
    throw new Error("Acesso negado: Unidade não atribuída a este usuário (usuario_unidades).");
  }
}
