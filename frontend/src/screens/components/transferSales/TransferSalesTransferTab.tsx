import {
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  Briefcase,
  Building2,
  ChevronDown,
  Loader2,
  User,
} from 'lucide-react';
import type {
  TransferBusinessCenter,
  TransferSalesUser,
  TransferUnit,
} from '../../../types/transferSales';
import { userRoleLabel } from '../../../utils/statusLabels';
import { fmtTransferSales } from '../../../utils/transferSalesFormat';
import { guardedListViewBody } from '../../../utils/listViewBody';

interface TransferSalesTransferTabProps {
  businessCenters: TransferBusinessCenter[];
  users: TransferSalesUser[];
  selectedSociedad: string;
  setSelectedSociedad: (value: string) => void;
  selectedCnId: string;
  setSelectedCnId: (value: string) => void;
  selectedUnitIds: string[];
  setSelectedUnitIds: (value: string[] | ((prev: string[]) => string[])) => void;
  destinationUserId: string;
  setDestinationUserId: (value: string) => void;
  unitBalances: Record<string, number>;
  unitBoxes: Record<string, 'Abierta' | 'Cerrada'>;
  loadingUnitsData: boolean;
  currentCn?: TransferBusinessCenter;
  activeUnitsInCn: TransferUnit[];
  totalSelectedBalance: number;
  currentUserId?: string;
  submitting: boolean;
  toggleUnitSelection: (unitId: string) => void;
  handleSelectAllUnits: (checked: boolean, units: TransferUnit[]) => void;
  onOpenConfirmTransfer: () => void;
}

export function TransferSalesTransferTab({
  businessCenters,
  users,
  selectedSociedad,
  setSelectedSociedad,
  selectedCnId,
  setSelectedCnId,
  selectedUnitIds,
  setSelectedUnitIds,
  destinationUserId,
  setDestinationUserId,
  unitBalances,
  unitBoxes,
  loadingUnitsData,
  currentCn,
  activeUnitsInCn,
  totalSelectedBalance,
  currentUserId,
  submitting,
  toggleUnitSelection,
  handleSelectAllUnits,
  onOpenConfirmTransfer,
}: TransferSalesTransferTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-7 bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
        <div className="bg-gray-50 border-b border-gray-200 py-3.5 px-4">
          <h2 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#6A008A]" />
            1. Datos de origen
          </h2>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Seleccione la sociedad, centro de negocios y las unidades que desea trasladar.
          </p>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                Sociedad *
              </label>
              <div className="relative">
                <select
                  value={selectedSociedad}
                  onChange={(e) => {
                    setSelectedSociedad(e.target.value);
                    setSelectedCnId('');
                    setSelectedUnitIds([]);
                  }}
                  className="w-full border border-gray-300 rounded p-2.5 text-xs bg-white text-[#333333] font-bold outline-none focus:border-[#6A008A] appearance-none pr-8"
                >
                  <option value="">Seleccione Sociedad</option>
                  <option value="6501">Sociedad 6501</option>
                  <option value="6502">Sociedad 6502</option>
                  <option value="principal">Sociedad Principal</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                Centro de negocios *
              </label>
              <div className="relative">
                <select
                  value={selectedCnId}
                  onChange={(e) => {
                    setSelectedCnId(e.target.value);
                    setSelectedUnitIds([]);
                  }}
                  disabled={!selectedSociedad}
                  className="w-full border border-gray-300 rounded p-2.5 text-xs bg-white text-[#333333] font-bold outline-none focus:border-[#6A008A] disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none pr-8"
                >
                  <option value="">Seleccione Centro de negocios</option>
                  {businessCenters.map((cn) => (
                    <option key={cn.id} value={cn.id}>
                      {cn.name} ({cn.code || 'S/C'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded overflow-hidden mt-4">
            <div className="bg-gray-100/70 border-b border-gray-200 px-3.5 py-2.5">
              <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-wider">
                Unidades en CN de origen
              </h3>
            </div>

            {guardedListViewBody(
              Boolean(selectedCnId),
              (
                <div className="text-center py-10 bg-gray-50/50">
                  <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-[11px] text-gray-400 font-bold">
                    Seleccione un Centro de Negocios para ver sus unidades.
                  </p>
                </div>
              ),
              loadingUnitsData,
              activeUnitsInCn.length,
              (
                <div className="text-center py-10 bg-gray-50/50 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#6A008A] mx-auto" />
                  <p className="text-[10px] text-gray-400 font-bold">Calculando saldos y estados de caja...</p>
                </div>
              ),
              (
                <div className="text-center py-10 bg-gray-50/50">
                  <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-[11px] text-gray-400 font-bold">No hay unidades activas en este centro de negocios.</p>
                </div>
              ),
              (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={activeUnitsInCn.length > 0 && selectedUnitIds.length === activeUnitsInCn.length}
                          onChange={(e) => handleSelectAllUnits(e.target.checked, activeUnitsInCn)}
                          className="w-4 h-4 text-[#6A008A] focus:ring-[#6A008A] border-gray-300 rounded cursor-pointer"
                        />
                      </th>
                      <th className="p-3">Nombre de unidad</th>
                      <th className="p-3 text-right">Saldo</th>
                      <th className="p-3 text-center">Estado de la caja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeUnitsInCn.map((unit) => {
                      const isChecked = selectedUnitIds.includes(unit.id);
                      const balance = unitBalances[unit.id] || 0;
                      const boxStatus = unitBoxes[unit.id] || 'Cerrada';

                      return (
                        <tr
                          key={unit.id}
                          onClick={() => toggleUnitSelection(unit.id)}
                          className={`hover:bg-purple-50/20 cursor-pointer transition-colors ${
                            isChecked ? 'bg-purple-50/40' : ''
                          }`}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleUnitSelection(unit.id)}
                              className="w-4 h-4 text-[#6A008A] focus:ring-[#6A008A] border-gray-300 rounded cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-gray-800">{unit.name}</div>
                            <div className="text-[10px] text-gray-400 font-medium">{unit.location || 'Sin ubicación'}</div>
                          </td>
                          <td className="p-3 text-right font-bold text-gray-800 font-mono">
                            $ {fmtTransferSales(balance)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                boxStatus === 'Abierta'
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : 'bg-gray-100 text-gray-500 border border-gray-200'
                              }`}
                            >
                              {boxStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
        <div className="bg-gray-50 border-b border-gray-200 py-3.5 px-4">
          <h2 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-[#8CC63F]" />
            2. Datos de destino
          </h2>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Seleccione el usuario destinatario de las unidades a trasladar.
          </p>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide mb-1.5">
              Usuario destinatario *
            </label>
            <div className="relative">
              <select
                value={destinationUserId}
                onChange={(e) => setDestinationUserId(e.target.value)}
                disabled={selectedUnitIds.length === 0}
                className="w-full border border-gray-300 rounded p-2.5 text-xs bg-white text-[#333333] font-bold outline-none focus:border-[#6A008A] disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none pr-8"
              >
                <option value="">Seleccione un usuario destinatario</option>
                {users
                  .filter((u) => u.id !== currentUserId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.userName} ({userRoleLabel(u.role)})
                    </option>
                  ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-200 rounded p-4 text-xs text-amber-900 flex gap-2.5 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px] font-medium">
              Las unidades trasladadas deben ser <strong>aceptadas por el destinatario</strong> y ubicadas en un Centro de Negocios, de lo contrario el traslado no será realizado.
            </p>
          </div>

          {selectedUnitIds.length > 0 && (
            <div className="bg-purple-50/50 border border-purple-250 rounded p-4 text-xs text-purple-900 space-y-2">
              <div className="font-extrabold uppercase tracking-wide text-[10px] text-[#6A008A] flex items-center justify-between">
                <span>Resumen del traslado</span>
                <span className="bg-purple-100 px-2 py-0.5 rounded-full text-[#6A008A] text-[9px]">
                  {selectedUnitIds.length} unidades
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-purple-950/80">
                <div>
                  Origen: <span className="font-extrabold text-gray-800">{currentCn?.name}</span>
                </div>
                <div>
                  Destinatario:{' '}
                  <span className="font-extrabold text-gray-800">
                    {users.find((u) => u.id === destinationUserId)?.userName || 'Por seleccionar'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-purple-200/50 pt-2 font-black text-xs text-purple-950">
                  <span>Saldo Total Cartera:</span>
                  <span className="text-red-700 font-mono text-sm">$ {fmtTransferSales(totalSelectedBalance)}</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenConfirmTransfer}
            disabled={selectedUnitIds.length === 0 || !destinationUserId || submitting}
            className="w-full bg-[#8CC63F] hover:bg-[#7cb532] text-white font-extrabold text-xs py-3 px-5 rounded shadow transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando Traslado...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4" />
                Trasladar Unidades
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
