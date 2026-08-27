export interface OperationalUnitContext {
  tenantId: string;
  unitId: string;
  unitName: string;
  cnId: string;
  boxId?: string;
}

export type ResolveOperationalUnitResult =
  | { ok: true; context: OperationalUnitContext }
  | { ok: false; error: string };

interface ResolveOperationalUnitParams {
  tenantId?: string;
  activeBox?: {
    id?: string;
    unitId?: string;
    unitName?: string;
    cnId?: string;
  } | null;
  usuarioUnidades?: string[];
  selectedUnitId?: string | null;
  selectedCnId?: string | null;
}

/**
 * Resolve unidade operacional sem defaults demo.
 * Prioridade: caixa aberta → seletor global → única unidade atribuída.
 */
export function resolveOperationalUnit(
  params: ResolveOperationalUnitParams
): ResolveOperationalUnitResult {
  const tenantId = String(params.tenantId || '').trim();
  if (!tenantId) {
    return {
      ok: false,
      error: 'Sesión sin empresa (tenant). Vuelva a iniciar sesión.',
    };
  }

  const box = params.activeBox;
  if (box?.unitId) {
    return {
      ok: true,
      context: {
        tenantId,
        unitId: String(box.unitId),
        unitName: String(box.unitName || box.unitId),
        cnId: String(box.cnId || params.selectedCnId || ''),
        boxId: box.id ? String(box.id) : undefined,
      },
    };
  }

  const selectedUnitId = String(params.selectedUnitId || '').trim();
  if (selectedUnitId) {
    return {
      ok: true,
      context: {
        tenantId,
        unitId: selectedUnitId,
        unitName: selectedUnitId,
        cnId: String(params.selectedCnId || ''),
      },
    };
  }

  const units = (params.usuarioUnidades || []).map((u) => String(u).trim()).filter(Boolean);
  if (units.length === 1) {
    return {
      ok: true,
      context: {
        tenantId,
        unitId: units[0],
        unitName: units[0],
        cnId: String(params.selectedCnId || ''),
      },
    };
  }

  if (units.length > 1) {
    return {
      ok: false,
      error: 'Hay varias unidades asignadas. Abra un caixa o seleccione la unidad en el contexto antes de continuar.',
    };
  }

  return {
    ok: false,
    error: 'No hay unidad asignada ni caixa abierta. Abra un caixa o contacte al administrador.',
  };
}
