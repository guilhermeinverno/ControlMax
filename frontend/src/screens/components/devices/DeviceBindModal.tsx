import { Smartphone, X, Loader2 } from 'lucide-react';
import type { HtmlFormSubmitEvent } from '../../../types/reactEvents';
import type { AppUser } from '../../../types';

interface DeviceBindModalProps {
  isOpen: boolean;
  submitting: boolean;
  deviceName: string;
  deviceModel: string;
  deviceIdInput: string;
  assignedUserId: string;
  collectors: AppUser[];
  onClose: () => void;
  onSubmit: (e: HtmlFormSubmitEvent) => void;
  onDeviceNameChange: (value: string) => void;
  onDeviceModelChange: (value: string) => void;
  onDeviceIdInputChange: (value: string) => void;
  onAssignedUserIdChange: (value: string) => void;
}

export function DeviceBindModal({
  isOpen,
  submitting,
  deviceName,
  deviceModel,
  deviceIdInput,
  assignedUserId,
  collectors,
  onClose,
  onSubmit,
  onDeviceNameChange,
  onDeviceModelChange,
  onDeviceIdInputChange,
  onAssignedUserIdChange,
}: DeviceBindModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-sm border border-gray-300 shadow-2xl w-full max-w-md p-5 flex flex-col space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h2 className="text-[#333333] font-bold text-base uppercase tracking-wider flex items-center">
            <Smartphone className="w-4 h-4 mr-2 text-[#6B21A8]" />
            Vincular Dispositivo
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
              Nome do Dispositivo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Samsung A54 do João"
              value={deviceName}
              onChange={(e) => onDeviceNameChange(e.target.value)}
              className="border border-gray-300 rounded p-2 text-sm text-[#333333] outline-none focus:border-[#6B21A8]"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">Modelo do Aparelho</label>
            <input
              type="text"
              placeholder="Ex: Samsung Galaxy A54"
              value={deviceModel}
              onChange={(e) => onDeviceModelChange(e.target.value)}
              className="border border-gray-300 rounded p-2 text-sm text-[#333333] outline-none focus:border-[#6B21A8]"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
              ID Único (IMEI / Serial) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: IMEI3574892183921"
              value={deviceIdInput}
              onChange={(e) => onDeviceIdInputChange(e.target.value)}
              className="border border-gray-300 rounded p-2 text-sm text-[#333333] outline-none focus:border-[#6B21A8] font-mono"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">Vincular a Cobrador</label>
            <select
              value={assignedUserId}
              onChange={(e) => onAssignedUserIdChange(e.target.value)}
              className="border border-gray-300 rounded p-2 text-sm text-[#333333] bg-white outline-none focus:border-[#6B21A8]"
            >
              <option value="">Sem cobrador vinculado</option>
              {collectors.map((c) => (
                <option key={c.id} value={c.id}>
                  {`${c.firstName || ''} ${c.lastName1 || ''}`.trim() || c.username}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-2 rounded text-xs shadow-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#6B21A8] hover:bg-[#581c87] text-white font-bold py-2 rounded text-xs shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vincular'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
