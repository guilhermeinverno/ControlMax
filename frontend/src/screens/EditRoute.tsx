import { useState, useEffect } from 'react';
import type { HtmlFormSubmitEvent } from '../types/reactEvents';
import { Screen } from '../types';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { formatFirestoreDate } from '../utils/firestoreTimestamp';
import { useNavigation } from '../context/NavigationContext';
import { ConfirmModal } from './components/ConfirmModal';
import {
  MapPin,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ArrowLeft,
  Settings,
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface EditRouteProps {
  onNavigate?: (screen: Screen) => void;
  params?: Record<string, unknown>;
}

interface RouteData {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  assignedUserId: string;
  assignedUserName: string;
  cnId: string;
  cnName: string;
  clientCount: number;
  active: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

interface CollectorUser {
  id: string;
  userName: string;
  displayName?: string;
  email?: string;
  role: string;
  active: boolean;
}

export function EditRoute({ onNavigate, params }: EditRouteProps) {
  const { tenantId, role, loading: tenantLoading } = useTenant();
  const { navState, navigate } = useNavigation();

  // RouteId retrieval (tries prop first, then global navState)
  const routeId = (params?.routeId || navState.params?.routeId) as string | undefined;

  const isAdmin = role === 'admin';
  const isSupervisor = role === 'supervisor';
  const isCollector = role === 'collector';

  // State
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [collectors, setCollectors] = useState<CollectorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [active, setActive] = useState(true);

  // Modals
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);

  // Initial Fetch
  useEffect(() => {
    if (!tenantId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      if (!routeId) {
        setError("Identificador de rota ausente. Não é possível editar.");
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch Route
        const docSnap = await getDoc(doc(db, 'routes', routeId));
        if (!docSnap.exists()) {
          setError("Rota não encontrada no banco de dados.");
          setLoading(false);
          return;
        }

        const data = { id: docSnap.id, ...docSnap.data() } as RouteData;

        // Verify tenant
        if (data.tenantId !== tenantId) {
          setError("Acesso negado. Esta rota pertence a outra organização.");
          setLoading(false);
          return;
        }

        setRouteData(data);
        setName(data.name || '');
        setDescription(data.description || '');
        setAssignedUserId(data.assignedUserId || '');
        setActive(data.active !== false);

        // 2. Fetch Collectors
        const usersSnap = await getDocs(query(
          collection(db, 'users'),
          where('tenantId', '==', tenantId),
          where('role', '==', 'collector'),
          where('active', '==', true)
        ));

        const list = usersSnap.docs.map(uDoc => ({
          id: uDoc.id,
          userName: uDoc.data().userName || uDoc.data().displayName || uDoc.data().email?.split('@')[0] || 'Cobrador',
          ...uDoc.data()
        })) as CollectorUser[];

        setCollectors(list);
      } catch (err) {
        console.error("Critical: Error loading EditRoute data:", err);
        setError("Ocorreu um erro ao buscar as informações da rota no Firestore.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenantId, routeId]);

  const handleSave = async (e: HtmlFormSubmitEvent) => {
    e.preventDefault();
    if (!tenantId || !routeId) return;

    if (isAdmin && !name.trim()) {
      setError("O nome da rota é um campo obrigatório.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const selectedCol = collectors.find(c => c.id === assignedUserId);
      const assignedUserName = selectedCol?.userName || 'Cobrador Atribuído';

      const updatePayload: Record<string, unknown> = {
        description: description.trim(),
        assignedUserId,
        assignedUserName,
        active,
        updatedAt: serverTimestamp()
      };

      // Only Admin can modify the route's Name
      if (isAdmin) {
        updatePayload.name = name.trim();
      }

      await updateDoc(doc(db, 'routes', routeId), updatePayload);

      setSuccess("Rota atualizada com sucesso!");
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('route-list');
        } else {
          navigate('route-list');
        }
      }, 1500);

    } catch (err) {
      console.error("Critical: Failed to update route:", err);
      setError("Erro ao tentar salvar as alterações da rota.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!tenantId || !routeId) return;
    setSaving(true);
    setError(null);
    setIsDeactivateOpen(false);

    try {
      await updateDoc(doc(db, 'routes', routeId), {
        active: false,
        updatedAt: serverTimestamp()
      });

      setSuccess("Rota desativada com sucesso!");
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('route-list');
        } else {
          navigate('route-list');
        }
      }, 1500);
    } catch (err) {
      console.error("Critical: Failed to deactivate route:", err);
      setError("Erro ao desativar rota.");
    } finally {
      setSaving(false);
    }
  };

  if (tenantLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-2 min-h-screen bg-[#F3F4F6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6B21A8]" />
        <p className="text-xs font-medium">Buscando informações da rota...</p>
      </div>
    );
  }

  // Restrict screen to Collectors completely
  if (isCollector) {
    return (
      <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333] -m-4 p-6">
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-6 max-w-md mx-auto mt-12 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Acesso restrito</h2>
          <p className="text-xs text-gray-500 mt-2">
            Desculpe, seu perfil atual não possui privilégios de administrador ou supervisor para editar rotas/unidades.
          </p>
          <button
            onClick={() => onNavigate ? onNavigate('route-list') : navigate('route-list')}
            className="mt-5 inline-flex items-center text-xs font-bold text-white bg-[#6B21A8] hover:bg-purple-800 px-4 py-2 rounded-full transition-colors cursor-pointer"
          >
            Voltar para Lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333] -m-4">
      {/* Header Banner */}
      <div className="bg-[#6B21A8] text-white py-4 px-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate ? onNavigate('route-list') : navigate('route-list')}
            className="bg-purple-800 hover:bg-purple-900 text-white p-2 rounded-full cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wider flex items-center">
              <MapPin className="w-5 h-5 mr-1.5 text-lime-400 bg-white rounded-full p-0.5" strokeWidth={3} />
              Configurar Rota
            </h1>
            <p className="text-xs text-purple-200 mt-0.5">
              Administre atribuição de cobradores e status de funcionamento operacional da unidade.
            </p>
          </div>
        </div>
        <Settings className="w-6 h-6 text-purple-300 animate-spin-slow hidden sm:block" />
      </div>

      <div className="p-4 max-w-3xl mx-auto w-full space-y-4">
        {/* Error State Banner inside page */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded p-4 text-red-800 text-xs flex items-center">
            <AlertCircle className="w-5 h-5 mr-2.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success State Banner inside page */}
        {success && (
          <div className="bg-green-50 border border-green-300 rounded p-4 text-green-800 text-xs flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2.5 text-green-600 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {routeData && (
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded">
                ID Rota: {routeData.id}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {active ? 'ATIVA' : 'INATIVA'}
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Nome da Rota */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Nome da Rota <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSupervisor} // Supervisor can't modify route name
                  className="border border-gray-300 rounded p-2.5 text-xs text-[#333333] bg-white outline-none focus:border-[#6B21A8] disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="Ex: Rota Centro Sul 01"
                />
                {isSupervisor && (
                  <span className="text-[10px] text-gray-400 mt-1">
                    * Apenas administradores podem renomear a rota.
                  </span>
                )}
              </div>

              {/* Zona / Descrição */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Zona / Setor / Descrição
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border border-gray-300 rounded p-2.5 text-xs text-[#333333] bg-white outline-none focus:border-[#6B21A8]"
                  placeholder="Ex: Abrange todo o perímetro urbano da zona central e bairros vizinhos."
                />
              </div>

              {/* Cobrador Atribuído */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Cobrador Responsável Atribuído <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="border border-gray-300 rounded p-2.5 text-xs bg-white text-[#333333] outline-none focus:border-[#6B21A8]"
                >
                  <option value="">-- Selecione o cobrador responsável --</option>
                  {collectors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.userName} ({c.email || 'sem email'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Centro de Negócios (Mock readonly) */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Centro de Negócios Vinculado (CN)
                </label>
                <div className="bg-gray-50 border border-gray-200 text-gray-500 text-xs p-2.5 rounded select-none flex items-center">
                  <Building2 className="w-4 h-4 mr-1.5 text-gray-400" />
                  <span>{routeData.cnName || 'CN de la sociedade 6501'}</span>
                </div>
                <span className="text-[9px] text-gray-400 mt-1 italic">
                  * Pendente: Vinculação flexível de rotas com múltiplos CNs em futuras versões.
                </span>
              </div>

              {/* Status Switch (Admin only) */}
              {isAdmin && (
                <div className="flex items-center justify-between bg-gray-50 p-3.5 border border-gray-200 rounded">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#555555] uppercase">Ativar / Desativar Funcionamento</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">Rotas desativadas não podem iniciar caixa ou cobrar.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActive(!active)}
                    className="text-[#6B21A8] hover:text-purple-800 transition-colors cursor-pointer"
                  >
                    {active ? (
                      <ToggleRight className="w-10 h-10" strokeWidth={1.5} />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              )}

              {/* READ ONLY METRICS CONTAINER */}
              <div className="bg-purple-50/50 border border-purple-100 p-4 rounded grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#6B21A8]" />
                  <span className="text-gray-600">
                    Criado em:{' '}
                    <strong className="text-gray-800">
                      {routeData.createdAt
                        ? formatFirestoreDate(routeData.createdAt, 'pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : 'Desconhecido'}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[#6B21A8]" />
                  <span className="text-gray-600">
                    Clientes Ativos na Rota:{' '}
                    <strong className="text-gray-800">{routeData.clientCount || 0} cadastrados</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate('route-list') : navigate('route-list')}
                  className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2.5 rounded text-xs transition-colors cursor-pointer text-center"
                >
                  Cancelar
                </button>

                {isAdmin && active && (
                  <button
                    type="button"
                    onClick={() => setIsDeactivateOpen(true)}
                    className="bg-red-100 border border-red-200 text-red-700 hover:bg-red-200 font-bold py-2.5 px-4 rounded text-xs transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Desativar Rota
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2.5 rounded text-xs shadow-sm flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Confirm Deactivation Modal */}
      <ConfirmModal
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(null)}
        onConfirm={handleDeactivate}
        title="Confirmar Desativação de Rota"
        subtitle={`Deseja realmente desativar em definitivo a rota "${routeData?.name || ''}"? Cobradores não conseguirão trabalhar nesta unidade até que seja ativada novamente.`}
        confirmText={saving ? "Desativando..." : "Sim, desativar rota"}
        cancelText="Cancelar"
      />
    </div>
  );
}
