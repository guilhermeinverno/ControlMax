import { getErrorMessage } from '../utils/errorMessage';
import { useEffect, useState } from 'react';
import { Screen } from '../types';
import { useTenant } from '../hooks/useTenant';
import { useMassBoxOpeningData } from '../hooks/useMassBoxOpeningData';
import { ConfirmModal } from './components/ConfirmModal';
import { AlertCircle, CheckCircle2, ChevronLeft, Loader2, ShieldAlert } from 'lucide-react';
import { closeBoxesBatchViaBff } from '../utils/massBoxBatchApi';
import { expectedBoxAmount } from '../utils/massBoxOpening';
import { fmtCents } from '../utils/currency';

interface MassBoxClosingProps {
  onNavigate?: (screen: Screen) => void;
}

/** P1-04 — fechamento massivo de caixas abertas via BFF. */
export function MassBoxClosing({ onNavigate }: MassBoxClosingProps) {
  const { tenantId, role, isSuperAdmin, loading: tenantLoading } = useTenant();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { activeBoxes, loading, loadError } = useMassBoxOpeningData(tenantId);

  useEffect(() => {
    setErrorMsg(loadError);
  }, [loadError]);

  const isAuthorized = role === 'admin' || role === 'supervisor' || isSuperAdmin;
  const openBoxes = activeBoxes.filter((b) => b.status === 'open');

  const filtered = openBoxes.filter((box) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      box.userName?.toLowerCase().includes(q) ||
      box.unitName?.toLowerCase().includes(q) ||
      box.cnName?.toLowerCase().includes(q)
    );
  });

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    const ids = filtered.map((b) => b.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? selectedIds.filter((id) => !ids.includes(id)) : Array.from(new Set([...selectedIds, ...ids])));
  };

  const handleClose = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const items = selectedIds.map((boxId) => {
        const box = openBoxes.find((b) => b.id === boxId);
        return {
          boxId,
          realFinalAmount: box ? expectedBoxAmount(box) : undefined,
        };
      });
      const result = await closeBoxesBatchViaBff(items);
      if (result.failed.length > 0) {
        setErrorMsg(
          `${result.closedCount} fechada(s); ${result.failed.length} falha(s): ${result.failed
            .slice(0, 3)
            .map((f) => f.error)
            .join('; ')}`
        );
      } else {
        setSuccessMsg(`${result.closedCount} caja(s) cerrada(s) con éxito.`);
      }
      setSelectedIds([]);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err) || 'Error al cerrar las cajas.');
    } finally {
      setSubmitting(false);
      setIsConfirmOpen(false);
    }
  };

  if (!tenantLoading && !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-gray-300 rounded-lg p-8 max-w-md shadow-sm space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-800">Acceso denegado</h2>
          <p className="text-sm text-gray-600">Solo gestores pueden cerrar cajas en masa.</p>
          <button
            type="button"
            onClick={() => onNavigate?.('dashboard')}
            className="text-[#6A008A] font-semibold text-sm underline"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] pb-24">
      <div className="bg-[#6A008A] text-white px-4 py-4 flex items-center gap-3">
        <button type="button" onClick={() => onNavigate?.('dashboard')} className="p-1 rounded hover:bg-white/10">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-lg font-black">Cierre masivo de cajas</h1>
          <p className="text-xs text-purple-200">Cierra cajas abiertas usando el saldo esperado (BFF)</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {errorMsg && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cobrador, unidad o CN…"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <div className="flex items-center justify-between text-xs text-gray-600">
            <button type="button" onClick={toggleAll} className="font-semibold text-[#6A008A]">
              Seleccionar / limpiar filtrados
            </button>
            <span>
              {selectedIds.length} seleccionada(s) · {filtered.length} abiertas
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-10">No hay cajas abiertas.</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((box) => {
              const expected = expectedBoxAmount(box);
              const checked = selectedIds.includes(box.id);
              return (
                <li key={box.id}>
                  <label className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-[#6A008A]/40">
                    <input type="checkbox" checked={checked} onChange={() => toggle(box.id)} className="rounded" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-800 truncate">{box.userName}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {box.unitName} · {box.cnName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[#6A008A]">$ {fmtCents(expected)}</p>
                      <p className="text-[10px] text-gray-400">esperado</p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          disabled={selectedIds.length === 0 || submitting}
          onClick={() => setIsConfirmOpen(true)}
          className="w-full py-3 rounded-lg bg-[#6A008A] text-white font-bold text-sm disabled:opacity-40"
        >
          Cerrar {selectedIds.length || ''} caja(s)
        </button>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Confirmar cierre masivo"
        subtitle={`Se cerrarán ${selectedIds.length} caja(s) con el saldo esperado recalculado en el servidor. ¿Continuar?`}
        confirmText={submitting ? 'Cerrando…' : 'Cerrar cajas'}
        cancelText="Cancelar"
        onConfirm={handleClose}
        onClose={() => !submitting && setIsConfirmOpen(false)}
        isSaving={submitting}
      />
    </div>
  );
}
