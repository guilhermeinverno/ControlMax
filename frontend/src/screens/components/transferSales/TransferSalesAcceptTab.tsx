import type { Dispatch, SetStateAction } from 'react';
import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Inbox,
  Loader2,
  MapPin,
  User,
  X,
} from 'lucide-react';
import type { TransferBusinessCenter, UnitTransfer } from '../../../types/transferSales';
import { formatFirestoreDate } from '../../../utils/firestoreTimestamp';
import { fmtTransferSales } from '../../../utils/transferSalesFormat';
import { listViewBody } from '../../../utils/listViewBody';
import { ConfirmModal } from '../ConfirmModal';

interface TransferSalesAcceptTabProps {
  loadingPending: boolean;
  pendingTransfers: UnitTransfer[];
  businessCenters: TransferBusinessCenter[];
  selectedDestCnMap: Record<string, string>;
  setSelectedDestCnMap: Dispatch<SetStateAction<Record<string, string>>>;
  submitting: boolean;
  confirmAcceptId: string | null;
  setConfirmAcceptId: (id: string | null) => void;
  confirmRejectId: string | null;
  setConfirmRejectId: (id: string | null) => void;
  onAcceptTransfer: (transfer: UnitTransfer) => void;
  onRejectTransfer: (transferId: string) => void;
}

export function TransferSalesAcceptTab({
  loadingPending,
  pendingTransfers,
  businessCenters,
  selectedDestCnMap,
  setSelectedDestCnMap,
  submitting,
  confirmAcceptId,
  setConfirmAcceptId,
  confirmRejectId,
  setConfirmRejectId,
  onAcceptTransfer,
  onRejectTransfer,
}: TransferSalesAcceptTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
        <Inbox className="w-4 h-4 text-[#6B21A8]" />
        Traslados de Unidades pendientes de recepción
      </h2>

      {listViewBody(
        loadingPending,
        pendingTransfers.length,
        (
          <div className="bg-white border border-gray-200 rounded p-12 text-center text-gray-500 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#6B21A8] mx-auto" />
            <p className="text-xs font-bold">Consultando bandeja de entrada...</p>
          </div>
        ),
        (
          <div className="bg-white border border-gray-300 rounded p-12 text-center text-gray-400 space-y-2 shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="font-bold text-gray-600 text-xs uppercase tracking-wide">Bandeja Vacía</h3>
            <p className="text-[11px]">No tiene traslados de unidades pendientes de aceptación.</p>
          </div>
        ),
        (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingTransfers.map((transfer) => {
              const totalBalance = transfer.units.reduce((s, u) => s + (u.balance || 0), 0);
              const selectedDestCn = selectedDestCnMap[transfer.id] || '';

              return (
                <div
                  key={transfer.id}
                  className="bg-white border border-gray-300 hover:border-gray-400 transition-all rounded shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="bg-purple-50/60 border-b border-gray-200 p-3.5 flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                        Pendiente Aceptación
                      </span>
                      <div className="text-[10px] text-gray-400 font-semibold font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatFirestoreDate(transfer.createdAt, 'es-CO')}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-400 uppercase font-black">Saldo Total Cartera</p>
                      <p className="font-extrabold text-xs text-[#DC2626] font-mono">$ {fmtTransferSales(totalBalance)}</p>
                    </div>
                  </div>

                  <div className="p-4 flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-xs border-b border-gray-100 pb-3">
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Origen (Centro)</span>
                        <span className="font-extrabold text-gray-700 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-600" />
                          {transfer.fromCnName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Usuario Destinatario</span>
                        <span className="font-extrabold text-gray-700 flex items-center gap-1 mt-0.5">
                          <User className="w-3.5 h-3.5 text-purple-600" />
                          {transfer.toUserName}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block">
                        Unidades en el traslado ({transfer.units.length})
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto bg-gray-50 border border-gray-200 rounded p-2 text-[11px]">
                        {transfer.units.map((unit) => (
                          <div
                            key={unit.id}
                            className="flex justify-between items-center bg-white p-1.5 rounded border border-gray-200"
                          >
                            <div>
                              <span className="font-bold text-gray-800">{unit.name}</span>
                              <span className="text-[9px] text-gray-400 ml-1.5">Box: {unit.boxStatus}</span>
                            </div>
                            <span className="font-bold text-gray-600 font-mono">$ {fmtTransferSales(unit.balance)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col bg-purple-50/30 p-3 rounded border border-purple-100 space-y-1.5">
                      <label className="text-[10px] font-black text-purple-900 uppercase tracking-wide flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        Centro de Negocios de Destino *
                      </label>
                      <div className="relative">
                        <select
                          value={selectedDestCn}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedDestCnMap((prev) => ({ ...prev, [transfer.id]: val }));
                          }}
                          className="w-full border border-gray-300 rounded p-2 text-xs bg-white text-[#333333] font-bold outline-none focus:border-[#6B21A8] appearance-none pr-8"
                        >
                          <option value="">Seleccione Centro de negocios de destino</option>
                          {businessCenters.map((cn) => (
                            <option key={cn.id} value={cn.id}>
                              {cn.name} ({cn.code})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border-t border-gray-100 p-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmRejectId(transfer.id)}
                      className="flex-1 bg-white border border-red-200 hover:bg-red-50 text-red-700 font-bold text-xs py-2 px-3 rounded shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Rechazar
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmAcceptId(transfer.id)}
                      disabled={!selectedDestCn || submitting}
                      className="flex-1 bg-[#16A34A] hover:bg-[#15803d] text-white font-extrabold text-xs py-2 px-3 rounded shadow-sm transition-all flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Aceptar Unidades
                    </button>
                  </div>

                  <ConfirmModal
                    isOpen={confirmAcceptId === transfer.id}
                    onClose={() => setConfirmAcceptId(null)}
                    onConfirm={() => onAcceptTransfer(transfer)}
                    title="Confirmar Recepción de Unidades"
                    subtitle={`¿Desea realmente aceptar estas ${transfer.units.length} unidades y vincularlas permanentemente al Centro de Negocios "${businessCenters.find((c) => c.id === selectedDestCn)?.name}"? La cartera activa por $ ${fmtTransferSales(totalBalance)} será reasignada a su nombre.`}
                    confirmText="Sí, aceptar unidades"
                    cancelText="Cancelar"
                  />

                  <ConfirmModal
                    isOpen={confirmRejectId === transfer.id}
                    onClose={() => setConfirmRejectId(null)}
                    onConfirm={() => onRejectTransfer(transfer.id)}
                    title="Rechazar Traslado de Unidades"
                    subtitle="¿Desea realmente rechazar este traslado de unidades? El remitente será notificado y la operación quedará registrada como rechazada."
                    confirmText="Sí, rechazar traslado"
                    cancelText="Cancelar"
                  />
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
