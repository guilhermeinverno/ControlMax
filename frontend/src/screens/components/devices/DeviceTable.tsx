import {
  Smartphone,
  Pencil,
  CheckCircle,
  XCircle,
  User,
} from 'lucide-react';
import { DEFAULT_DEVICE_APP_VERSION } from '../../../constants/device';
import { deviceStatusLabel, deviceStatusBadgeClasses } from '../../../utils/statusLabels';
import { formatTimeAgo } from '../../../utils/deviceTimeAgo';
import type { Device } from '../../../types';

interface DeviceTableProps {
  devices: Device[];
  isAdmin: boolean;
  onEdit: (deviceId: string) => void;
  onToggleBlock: (device: Device) => void;
}

export function DeviceTable({ devices, isAdmin, onEdit, onToggleBlock }: DeviceTableProps) {
  return (
    <div className="w-full border border-gray-200 shadow-sm overflow-hidden text-sm mb-2 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-[#8CC63F] text-white uppercase text-[10px] tracking-wider font-bold">
            <th className="px-3 py-2.5 flex-[2]">Dispositivo / Modelo</th>
            <th className="px-3 py-2.5">IMEI / ID Único</th>
            <th className="px-3 py-2.5">Cobrador Vinculado</th>
            <th className="px-3 py-2.5 w-24 text-center">Status</th>
            <th className="px-3 py-2.5 w-20 text-center">Versão</th>
            <th className="px-3 py-2.5">Última Sinc.</th>
            <th className="px-3 py-2.5 w-24 text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {devices.map((device, idx) => (
            <tr
              key={device.id}
              className={`hover:bg-purple-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
            >
              <td className="px-3 py-3">
                <div className="font-bold text-gray-800 flex items-center">
                  <Smartphone className="w-3.5 h-3.5 text-[#8CC63F] mr-1.5 flex-shrink-0" />
                  {device.deviceName}
                </div>
                <span className="text-[10px] text-gray-500 font-medium">{device.deviceModel}</span>
              </td>
              <td className="px-3 py-3 font-mono text-xs text-gray-600">{device.deviceId}</td>
              <td className="px-3 py-3">
                <span className="text-xs text-gray-700 font-medium flex items-center">
                  <User className="w-3 h-3 text-gray-400 mr-1" />
                  {device.assignedUserName || 'Sem vínculo'}
                </span>
              </td>
              <td className="px-3 py-3 text-center">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${deviceStatusBadgeClasses(device.status)}`}
                >
                  {deviceStatusLabel(device.status)}
                </span>
              </td>
              <td className="px-3 py-3 text-center font-mono text-xs text-gray-500">
                v{device.appVersion || DEFAULT_DEVICE_APP_VERSION}
              </td>
              <td className="px-3 py-3 text-xs text-gray-600">{formatTimeAgo(device.lastSync)}</td>
              <td className="px-3 py-3 text-center">
                <div className="flex justify-center space-x-1.5">
                  {isAdmin && (
                    <button
                      onClick={() => onEdit(device.id)}
                      title="Editar"
                      className="text-gray-600 p-1.5 border border-gray-200 rounded hover:bg-gray-100 hover:text-gray-800 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => onToggleBlock(device)}
                      title={device.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                      className={`p-1.5 border rounded transition-colors cursor-pointer ${
                        device.status === 'blocked'
                          ? 'text-green-600 border-green-100 hover:bg-green-50'
                          : 'text-red-600 border-red-100 hover:bg-red-50'
                      }`}
                    >
                      {device.status === 'blocked' ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
