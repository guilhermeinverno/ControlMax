import { useState, useEffect, useRef } from 'react';
import type { HtmlFormSubmitEvent } from '../types/reactEvents';
import { db, auth } from '../lib/firebase';
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, updateDoc, doc,
  serverTimestamp
} from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { useNavigation } from '../context/NavigationContext';
import { UnitSelectors } from './components/UnitSelectors';
import { ConfirmModal } from './components/ConfirmModal';
import { 
  Smartphone, 
  Pencil, 
  Plus, 
  Search, 
  X, 
  AlertCircle, 
  Loader2,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react';
import { DEFAULT_DEVICE_APP_VERSION } from '../constants/device';
import { SKELETON_CARD_KEYS } from '../constants/placeholders';
import { deviceStatusLabel, deviceStatusBadgeClasses } from '../utils/statusLabels';
import { Device, AppUser } from '../types';
import { hasAdminAccess } from '../types/operational';
import { listViewBody } from '../utils/listViewBody';

// Helper para formatar o tempo de última sincronização
function formatTimeAgo(ts: unknown): string {
  if (!ts) return 'Nunca';
  let date: Date;
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as Record<string, unknown>).toDate === 'function') {
    date = (ts as { toDate: () => Date }).toDate();
  } else if (ts instanceof Date) {
    date = ts;
  } else if (typeof ts === 'object' && ts !== null && 'seconds' in ts && typeof (ts as { seconds: number }).seconds === 'number') {
    date = new Date((ts as { seconds: number }).seconds * 1000);
  } else if (typeof ts === 'number') {
    date = new Date(ts);
  } else {
    return 'Data inválida';
  }
  
  if (isNaN(date.getTime())) return 'N/A';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Agora mesmo';
  if (diffMin < 60) return `Há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
  if (diffHr < 24) return `Há ${diffHr} ${diffHr === 1 ? 'hora' : 'horas'}`;
  return `Há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
}

export function DeviceList() {
  const { tenantId, role, isSuperAdmin, loading: tenantLoading } = useTenant();
  const { navigate } = useNavigation();

  const isAdmin = hasAdminAccess(role, isSuperAdmin);
  const isCollector = role === 'collector';

  // Estados principais
  const [devices, setDevices] = useState<Device[]>([]);
  const [collectors, setCollectors] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtro de Busca
  const [searchQuery, setSearchQuery] = useState('');

  // Modais e formulários de criação
  const [isBindModalOpen, setIsBindModalOpen] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [deviceIdInput, setDeviceIdInput] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal para Bloqueio/Desbloqueio
  const [deviceToToggleBlock, setDeviceToToggleBlock] = useState<Device | null>(null);

  const unsubRef = useRef<(() => void) | null>(null);

  // 1. Escutar Dispositivos em Tempo Real
  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    const qWithOrder = query(
      collection(db, 'devices'),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );

    try {
      unsubRef.current = onSnapshot(qWithOrder, (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Device[];
        setDevices(list);
        setLoading(false);
      }, (err) => {
        console.warn("Index needed, retrying device list without orderBy:", err);

        const qFallback = query(
          collection(db, 'devices'),
          where('tenantId', '==', tenantId)
        );

        unsubRef.current = onSnapshot(qFallback, (snapshot) => {
          const list = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Device[];
          
          // Ordenar client-side por data de criação descrescente
          list.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          });
          
          setDevices(list);
          setLoading(false);
        }, (fallbackErr) => {
          console.error("Error fetching devices with fallback query:", fallbackErr);
          setError("Erro ao carregar dispositivos.");
          setLoading(false);
        });
      });
    } catch (e) {
      console.error("Immediate error setting up devices snapshot:", e);
      setLoading(false);
    }

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
    };
  }, [tenantId]);

  // 2. Buscar cobradores do tenant
  useEffect(() => {
    if (!tenantId) return;

    const usersQuery = query(
      collection(db, 'users'),
      where('tenantId', '==', tenantId)
    );

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppUser[];

      const filteredCollectors = list.filter(u => 
        (u.role || '').toLowerCase() === 'collector'
      );
      setCollectors(filteredCollectors);
    }, (err) => {
      console.error("Error fetching collectors for devices assignment:", err);
    });

    return () => unsubscribeUsers();
  }, [tenantId]);

  // Bloquear / Desbloquear dispositivo
  const handleConfirmToggleBlock = async () => {
    if (!deviceToToggleBlock || !isAdmin) return;
    try {
      const newStatus = deviceToToggleBlock.status === 'blocked' ? 'active' : 'blocked';
      await updateDoc(doc(db, 'devices', deviceToToggleBlock.id), {
        status: newStatus,
        lastSync: serverTimestamp() // Atualiza indicador
      });
      setDeviceToToggleBlock(null);
    } catch (err) {
      console.error("Error toggling device blocked status:", err);
      alert("Erro ao alterar o status do aparelho.");
    }
  };

  // Vincular novo dispositivo
  const handleBindDeviceSubmit = async (e: HtmlFormSubmitEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!deviceName.trim() || !deviceIdInput.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      let assignedUserName = 'Sem cobrador';
      if (assignedUserId) {
        const found = collectors.find(c => c.id === assignedUserId);
        if (found) {
          assignedUserName = `${found.firstName || ''} ${found.lastName1 || ''}`.trim() || found.username || 'Cobrador';
        }
      }

      await addDoc(collection(db, 'devices'), {
        tenantId,
        deviceName: deviceName.trim(),
        deviceModel: deviceModel.trim() || 'Modelo não especificado',
        deviceId: deviceIdInput.trim(),
        assignedUserId,
        assignedUserName,
        status: 'active',
        appVersion: DEFAULT_DEVICE_APP_VERSION,
        lastSync: serverTimestamp(),
        linkedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      // Resetar form e fechar modal
      setDeviceName('');
      setDeviceModel('');
      setDeviceIdInput('');
      setAssignedUserId('');
      setIsBindModalOpen(false);
    } catch (err) {
      console.error("Error binding device:", err);
      setError("Erro ao vincular dispositivo.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtros client-side
  const filteredDevices = devices.filter(d => {
    // Se for coletor, só vê seu próprio aparelho
    if (isCollector && d.assignedUserId !== auth.currentUser?.uid) {
      return false;
    }

    const queryLower = searchQuery.toLowerCase();
    const nameMatches = (d.deviceName || '').toLowerCase().includes(queryLower);
    const modelMatches = (d.deviceModel || '').toLowerCase().includes(queryLower);
    const idMatches = (d.deviceId || '').toLowerCase().includes(queryLower);
    const collectorMatches = (d.assignedUserName || '').toLowerCase().includes(queryLower);

    return nameMatches || modelMatches || idMatches || collectorMatches;
  });

  if (tenantLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-2 min-h-screen bg-[#F3F4F6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#84CC16]" />
        <p className="text-xs font-medium">Carregando dados do inquilino...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen">
      <UnitSelectors />

      <div className="px-3 mt-2 mb-4">
        {/* Cabeçalho */}
        <div className="bg-[#84CC16] text-white py-2.5 px-3 font-bold uppercase text-sm shadow-sm flex items-center justify-between">
          <div className="flex items-center">
            <Smartphone className="w-4 h-4 mr-2" />
            Lista de Dispositivos
          </div>
          {isAdmin && (
            <button 
              onClick={() => setIsBindModalOpen(true)}
              className="bg-[#6B21A8] hover:bg-[#581c87] text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm flex items-center transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Vincular Dispositivo
            </button>
          )}
        </div>

        {/* Corpo principal */}
        <div className="bg-white border border-gray-200 border-t-0 p-3 shadow-sm rounded-b-sm">
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded mb-4 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Filtro de Busca */}
          <div className="mb-4 relative">
            <input 
              type="text" 
              placeholder="Buscar por nome, modelo, IMEI ou cobrador..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 pl-9 text-sm text-[#333333] outline-none focus:border-[#6B21A8] transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>

          {/* Skeletons de Loading */}
          {listViewBody(
            loading,
            filteredDevices.length,
            (
            <div className="border border-gray-200 rounded-sm overflow-hidden text-sm">
              <div className="bg-[#8CC63F] text-white flex px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider">
                <div className="flex-[2]">Dispositivo</div>
                <div className="flex-[2]">Cobrador</div>
                <div className="w-24 text-center">Status</div>
                <div className="w-20 text-center">Versão</div>
                <div className="flex-[1.5]">Última Sinc.</div>
                <div className="w-24 text-center">Ações</div>
              </div>
              {SKELETON_CARD_KEYS.slice(0, 3).map((key) => (
                <div key={key} className="flex border-b border-gray-100 items-center px-3 py-3 animate-pulse bg-white">
                  <div className="flex-[2] h-4 bg-gray-100 rounded w-4/5 mr-2"></div>
                  <div className="flex-[2] h-4 bg-gray-50 rounded w-3/4 mr-2"></div>
                  <div className="w-24 flex justify-center"><div className="h-4 bg-gray-100 rounded w-16"></div></div>
                  <div className="w-20 flex justify-center"><div className="h-4 bg-gray-50 rounded w-12"></div></div>
                  <div className="flex-[1.5] h-4 bg-gray-50 rounded w-2/3 mr-2"></div>
                  <div className="w-24 flex justify-center"><div className="h-5 bg-gray-100 rounded w-16"></div></div>
                </div>
              ))}
            </div>
          ),
            (
            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-sm">
              <Smartphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-700">Nenhum dispositivo vinculado ainda</p>
              <p className="text-xs text-gray-500 mt-1 mb-4">Adicione um novo dispositivo para os cobradores sincronizarem.</p>
              {isAdmin && (
                <button 
                  onClick={() => setIsBindModalOpen(true)}
                  className="bg-[#6B21A8] hover:bg-[#581c87] text-white text-xs font-bold px-4 py-2 rounded shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1 inline" />
                  Vincular Primeiro Aparelho
                </button>
              )}
            </div>
          ),
            (
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
                  {filteredDevices.map((device, idx) => (
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
                      <td className="px-3 py-3 font-mono text-xs text-gray-600">
                        {device.deviceId}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-700 font-medium flex items-center">
                          <User className="w-3 h-3 text-gray-400 mr-1" />
                          {device.assignedUserName || 'Sem vínculo'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${deviceStatusBadgeClasses(device.status)}`}>
                          {deviceStatusLabel(device.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-xs text-gray-500">
                        v{device.appVersion || DEFAULT_DEVICE_APP_VERSION}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600">
                        {formatTimeAgo(device.lastSync)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex justify-center space-x-1.5">
                          {isAdmin && (
                            <button 
                              onClick={() => navigate('edit-device', { deviceId: device.id })}
                              title="Editar"
                              className="text-gray-600 p-1.5 border border-gray-200 rounded hover:bg-gray-100 hover:text-gray-800 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && (
                            <button 
                              onClick={() => setDeviceToToggleBlock(device)}
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
          ))}
        </div>
      </div>

      {/* Modal Vincular Dispositivo */}
      {isBindModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-sm border border-gray-300 shadow-2xl w-full max-w-md p-5 flex flex-col space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-[#333333] font-bold text-base uppercase tracking-wider flex items-center">
                <Smartphone className="w-4 h-4 mr-2 text-[#6B21A8]" />
                Vincular Dispositivo
              </h2>
              <button 
                onClick={() => setIsBindModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBindDeviceSubmit} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Nome do Dispositivo <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Samsung A54 do João"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="border border-gray-300 rounded p-2 text-sm text-[#333333] outline-none focus:border-[#6B21A8]"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Modelo do Aparelho
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Samsung Galaxy A54"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
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
                  onChange={(e) => setDeviceIdInput(e.target.value)}
                  className="border border-gray-300 rounded p-2 text-sm text-[#333333] outline-none focus:border-[#6B21A8] font-mono"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Vincular a Cobrador
                </label>
                <select 
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="border border-gray-300 rounded p-2 text-sm text-[#333333] bg-white outline-none focus:border-[#6B21A8]"
                >
                  <option value="">Sem cobrador vinculado</option>
                  {collectors.map(c => (
                    <option key={c.id} value={c.id}>
                      {`${c.firstName || ''} ${c.lastName1 || ''}`.trim() || c.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-3 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsBindModalOpen(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-2 rounded text-xs shadow-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#6B21A8] hover:bg-[#581c87] text-white font-bold py-2 rounded text-xs shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Vincular"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ConfirmModal para Bloquear/Desbloquear */}
      <ConfirmModal 
        isOpen={!!deviceToToggleBlock}
        onClose={() => setDeviceToToggleBlock(null)}
        onConfirm={handleConfirmToggleBlock}
        title={deviceToToggleBlock?.status === 'blocked' ? "Desbloquear Aparelho?" : "Bloquear Aparelho?"}
        subtitle={
          deviceToToggleBlock?.status === 'blocked' 
            ? `Deseja realmente desbloquear o aparelho "${deviceToToggleBlock?.deviceName}"? Ele voltará a ter acesso ao sistema.`
            : `Deseja realmente bloquear o aparelho "${deviceToToggleBlock?.deviceName}"? O cobrador perderá o acesso instantaneamente.`
        }
        confirmText={deviceToToggleBlock?.status === 'blocked' ? "Sim, desbloquear" : "Sim, bloquear"}
        cancelText="Cancelar"
      />
    </div>
  );
}
