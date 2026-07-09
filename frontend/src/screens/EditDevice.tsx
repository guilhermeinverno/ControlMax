import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { useNavigation } from '../context/NavigationContext';
import { UnitSelectors } from './components/UnitSelectors';
import { ConfirmModal } from './components/ConfirmModal';
import { 
  Smartphone, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  Clock
} from 'lucide-react';

interface DeviceData {
  id: string;
  tenantId: string;
  deviceName: string;
  deviceModel: string;
  deviceId: string; // IMEI ou Serial do Aparelho
  assignedUserId: string;
  assignedUserName: string;
  status: 'active' | 'inactive' | 'blocked';
  appVersion: string;
  lastSync?: any; // FIXED_BY_SCRIPT
  linkedAt?: any; // FIXED_BY_SCRIPT
  createdAt?: any; // FIXED_BY_SCRIPT
}

interface AppUser {
  id: string;
  username: string;
  firstName?: string;
  lastName1?: string;
  role: string;
}

export function EditDevice() {
  const { tenantId, role, isSuperAdmin, loading: tenantLoading } = useTenant();
  const { navState, navigate } = useNavigation();

  const isAdmin = role === 'admin' || role === 'superadmin' || isSuperAdmin;

  // Extrair ID com suporte para refresh / deep link
  const queryParams = new URLSearchParams(window.location.search);
  const deviceId = (navState.params?.deviceId || queryParams.get('deviceId')) as string | undefined;

  // Estados locais
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [collectors, setCollectors] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados de campos editáveis do formulário
  const [deviceName, setDeviceName] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'blocked'>('active');
  const [appVersion, setAppVersion] = useState('');

  // Modal de Confirmação
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);

  // 1. Buscar coletor do tenant para preencher a seleção
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
      console.error("Error loading collectors inside edit device screen:", err);
    });

    return () => unsubscribeUsers();
  }, [tenantId]);

  // 2. Buscar dispositivo pelo ID
  useEffect(() => {
    if (!deviceId || !tenantId) return;

    const fetchDevice = async () => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, 'devices', deviceId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("Dispositivo não encontrado no banco de dados.");
          setLoading(false);
          return;
        }

        const data = { id: docSnap.id, ...docSnap.data() } as DeviceData;

        // Regra de segurança: Garantir que pertença ao mesmo inquilino
        if (data.tenantId !== tenantId) {
          setError("Acesso não autorizado para editar este dispositivo.");
          setLoading(false);
          return;
        }

        setDevice(data);
        
        // Populando campos editáveis
        setDeviceName(data.deviceName || '');
        setDeviceModel(data.deviceModel || '');
        setAssignedUserId(data.assignedUserId || '');
        setStatus(data.status || 'active');
        setAppVersion(data.appVersion || '6.0.0.2');

      } catch (err) {
        console.error("Error fetching device details:", err);
        setError("Erro ao obter dados do dispositivo.");
      } finally {
        setLoading(false);
      }
    };

    fetchDevice();
  }, [deviceId, tenantId]);

  // Handler para Salvar Alterações
  const handleSaveDevice = async () => {
    if (!deviceId || !device) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Obter nome completo do cobrador selecionado
      let assignedUserName = 'Sem vínculo';
      if (assignedUserId) {
        const found = collectors.find(c => c.id === assignedUserId);
        if (found) {
          assignedUserName = `${found.firstName || ''} ${found.lastName1 || ''}`.trim() || found.username || 'Cobrador';
        }
      }

      const deviceDocRef = doc(db, 'devices', deviceId);
      await updateDoc(deviceDocRef, {
        deviceName: deviceName.trim(),
        deviceModel: deviceModel.trim(),
        assignedUserId,
        assignedUserName,
        status,
        appVersion: appVersion.trim()
      });

      setSuccess("Aparelho atualizado com sucesso!");
      setTimeout(() => {
        navigate('device-list');
      }, 1500);

    } catch (err) {
      console.error("Error updating device:", err);
      setError("Erro ao salvar as modificações do dispositivo.");
    } finally {
      setSaving(false);
      setIsConfirmSaveOpen(false);
    }
  };

  // Guardião para ID ausente
  if (!deviceId) {
    return (
      <div className="p-4 bg-[#F3F4F6] min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-300 rounded p-5 text-center text-red-800 text-sm max-w-sm shadow-sm">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="font-bold mb-1">ID do Dispositivo Ausente</h3>
          <p className="text-xs text-red-700">Não foi possível identificar o dispositivo para edição.</p>
          <button 
            onClick={() => navigate('device-list')}
            className="mt-4 bg-[#6B21A8] hover:bg-[#581c87] text-white font-bold text-xs py-2 px-6 rounded transition-all cursor-pointer"
          >
            Voltar para Lista
          </button>
        </div>
      </div>
    );
  }

  // Loading do Tenant ou do próprio Dispositivo
  if (tenantLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-2 min-h-screen bg-[#F3F4F6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#84CC16]" />
        <p className="text-xs font-medium">Carregando dados do dispositivo...</p>
      </div>
    );
  }

  // Se houver algum erro de acesso ou de busca
  if (error && !device) {
    return (
      <div className="p-4 bg-[#F3F4F6] min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-300 rounded p-5 text-center text-red-800 text-sm max-w-sm shadow-sm">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="font-bold mb-1">Acesso Bloqueado ou Falha</h3>
          <p className="text-xs text-red-700">{error}</p>
          <button 
            onClick={() => navigate('device-list')}
            className="mt-4 bg-[#6B21A8] hover:bg-[#581c87] text-white font-bold text-xs py-2 px-6 rounded transition-all cursor-pointer"
          >
            Voltar para Lista
          </button>
        </div>
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
            Editar Dispositivo
          </div>
          <button 
            onClick={() => navigate('device-list')}
            className="text-white hover:text-gray-100 flex items-center text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </button>
        </div>

        {/* Formulário */}
        <div className="bg-white border border-gray-300 border-t-0 p-4 shadow-sm rounded-b-sm space-y-4">
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded text-xs flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0 text-green-600" />
              <span>{success}</span>
            </div>
          )}

          {/* IMEI / ID Único - Apenas Leitura */}
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
              IMEI / ID Único do Aparelho (Somente Leitura)
            </label>
            <input 
              type="text" 
              className="border border-gray-200 rounded p-2 text-sm text-[#777777] bg-gray-50 outline-none font-mono" 
              value={device?.deviceId || ''}
              readOnly
            />
          </div>

          {/* Nome do dispositivo */}
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
              Nome de Exibição <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              required
              className="border border-gray-300 rounded p-2 text-sm text-[#333333] bg-white outline-none focus:border-[#6B21A8]" 
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="Ex: Samsung S23 do Lucas"
            />
          </div>

          {/* Modelo */}
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
              Modelo do Aparelho
            </label>
            <input 
              type="text" 
              className="border border-gray-300 rounded p-2 text-sm text-[#333333] bg-white outline-none focus:border-[#6B21A8]" 
              value={deviceModel}
              onChange={(e) => setDeviceModel(e.target.value)}
              placeholder="Ex: Samsung Galaxy S23 Ultra"
            />
          </div>

          {/* Cobrador Atribuído */}
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
              Cobrador Vinculado
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

          {/* Versão do App */}
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
              Versão do Aplicativo (App Version)
            </label>
            <input 
              type="text" 
              className="border border-gray-300 rounded p-2 text-sm text-[#333333] bg-white outline-none focus:border-[#6B21A8] font-mono" 
              value={appVersion}
              onChange={(e) => setAppVersion(e.target.value)}
              placeholder="Ex: 6.0.0.2"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
              Status do Aparelho
            </label>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-300 rounded p-2 text-sm text-[#333333] bg-white outline-none focus:border-[#6B21A8]"
            >
              <option value="active">Ativo (Permitido sincronizar)</option>
              <option value="inactive">Inativo</option>
              <option value="blocked">Bloqueado (Negar acessos)</option>
            </select>
          </div>

          {/* Datas / Auditoria - Apenas Leitura */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border border-gray-100 p-3 rounded">
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <div>
                <span className="font-semibold block text-[10px] uppercase text-[#777777]">Vinculado em</span>
                <span>
                  {device?.linkedAt?.seconds 
                    ? new Date(device.linkedAt.seconds * 1000).toLocaleString('pt-BR') 
                    : 'Não registrado'}
                </span>
              </div>
            </div>

            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-4 h-4 mr-2 text-gray-400" />
              <div>
                <span className="font-semibold block text-[10px] uppercase text-[#777777]">Última Sincronização</span>
                <span>
                  {device?.lastSync?.seconds 
                    ? new Date(device.lastSync.seconds * 1000).toLocaleString('pt-BR') 
                    : 'Nunca'}
                </span>
              </div>
            </div>
          </div>

          {/* Layout de botões */}
          <div className="flex space-x-3 pt-4">
            <button 
              type="button"
              onClick={() => navigate('device-list')}
              className="flex-1 bg-[#F3F4F6] border border-gray-300 text-gray-700 font-bold py-2.5 rounded text-sm shadow-sm hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={() => setIsConfirmSaveOpen(true)}
              disabled={saving}
              className="flex-1 bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2.5 rounded text-sm shadow-sm transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Guardar"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ConfirmModal para Salvar */}
      <ConfirmModal 
        isOpen={isConfirmSaveOpen}
        onClose={() => setIsConfirmSaveOpen(false)}
        onConfirm={handleSaveDevice}
        title="Salvar Alterações?"
        subtitle="Tem certeza que deseja atualizar os dados de acesso deste dispositivo móvel?"
        confirmText="Sim, salvar"
        cancelText="Cancelar"
      />
    </div>
  );
}
