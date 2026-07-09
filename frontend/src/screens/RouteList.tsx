import { useState, useEffect, useRef } from 'react';
import type { HtmlFormSubmitEvent } from '../types/reactEvents';
import { db, auth } from '../lib/firebase';
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, updateDoc, doc, deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { SKELETON_CARD_KEYS } from '../constants/placeholders';
import { useTenant } from '../hooks/useTenant';
import { hasAdminAccess } from '../types/operational';
import { listViewBody } from '../utils/listViewBody';
import { useNavigation } from '../context/NavigationContext';
import { ConfirmModal } from './components/ConfirmModal';
import { UnitSelectors } from './components/UnitSelectors';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  MapPin, 
  Loader2, 
  X, 
  AlertCircle, 
  User, 
  Building2
} from 'lucide-react';

interface Route {
  id: string;
  tenantId: string;
  name: string;           // ex: "Rota Norte", "RT 03"
  description: string;
  assignedUserId: string;
  assignedUserName: string;
  cnId: string;
  cnName: string;
  clientCount: number;    // quantidade de clientes nessa rota
  active: boolean;
  createdAt?: any; // FIXED_BY_SCRIPT
  updatedAt?: any; // FIXED_BY_SCRIPT
}

interface AppUser {
  id: string;
  username: string;
  firstName?: string;
  lastName1?: string;
  role: string;
  tenantId: string;
}

export function RouteList() {
  const { tenantId, role, isSuperAdmin, loading: tenantLoading } = useTenant();
  const { navigate } = useNavigation();

  // Permissões
  const isAdmin = hasAdminAccess(role, isSuperAdmin);
  const isCollector = role === 'collector';

  // Estados principais
  const [routes, setRoutes] = useState<Route[]>([]);
  const [collectors, setCollectors] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Busca e Filtros
  const [searchQuery, setSearchQuery] = useState('');

  // Modais de Criação
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal de Confirmação para Deletar
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);

  const unsubRef = useRef<(() => void) | null>(null);

  // 1. Ouvir Rotas com real-time (onSnapshot) e fallback se der erro de índice
  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    const qWithOrder = query(
      collection(db, 'routes'),
      where('tenantId', '==', tenantId),
      orderBy('name', 'asc')
    );

    try {
      unsubRef.current = onSnapshot(qWithOrder, (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Route[];

        setRoutes(list);
        setLoading(false);
      }, (err) => {
        console.warn("Retrying routes query without orderBy due to possible missing index:", err);
        
        // Fallback sem orderBy
        const qFallback = query(
          collection(db, 'routes'),
          where('tenantId', '==', tenantId)
        );

        unsubRef.current = onSnapshot(qFallback, (snapshot) => {
          const list = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Route[];
          
          // Ordenação manual client-side
          list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setRoutes(list);
          setLoading(false);
        }, (fallbackErr) => {
          console.error("Error fetching routes with fallback query:", fallbackErr);
          setError("Erro ao carregar as rotas de cobro.");
          setLoading(false);
        });
      });
    } catch (e) {
      console.error("Immediate error setting up routes snapshot:", e);
      setLoading(false);
    }

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
    };
  }, [tenantId]);

  // 2. Buscar coletores do tenant (filtrar por role='collector')
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

      // Filtrar client-side por cobradores para evitar necessidade de índices extras complexos
      const filteredCollectors = list.filter(u => 
        (u.role || '').toLowerCase() === 'collector'
      );
      setCollectors(filteredCollectors);
    }, (err) => {
      console.error("Error fetching users/collectors:", err);
    });

    return () => unsubscribeUsers();
  }, [tenantId]);

  // Alternar Ativo/Inativo inline
  const handleToggleActive = async (route: Route) => {
    if (!isAdmin) return;
    try {
      const routeDocRef = doc(db, 'routes', route.id);
      await updateDoc(routeDocRef, {
        active: !route.active,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error toggling route active state:", err);
      alert("Erro ao alterar o status da rota.");
    }
  };

  // Criar nova rota
  const handleCreateRouteSubmit = async (e: HtmlFormSubmitEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      // Procurar nome do cobrador selecionado
      let assignedUserName = 'Sem cobrador';
      if (assignedUserId) {
        const found = collectors.find(c => c.id === assignedUserId);
        if (found) {
          assignedUserName = `${found.firstName || ''} ${found.lastName1 || ''}`.trim() || found.username || 'Cobrador';
        }
      }

      // Pendente: Implementar seleção real de Centro de Negócios (CN).
      // Atualmente, as rotas são associadas por padrão ao "CN Padrão".
      const cnId = ''; 
      const cnName = 'CN Padrão';

      await addDoc(collection(db, 'routes'), {
        tenantId,
        name: name.trim(),
        description: description.trim(),
        assignedUserId,
        assignedUserName,
        cnId,
        cnName,
        clientCount: 0,
        active: formActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Resetar form e fechar modal
      setName('');
      setDescription('');
      setAssignedUserId('');
      setFormActive(true);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Error creating route:", err);
      setError("Erro ao salvar nova rota.");
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmar Deletar Rota
  const handleDeleteConfirm = async () => {
    if (!routeToDelete) return;
    try {
      await deleteDoc(doc(db, 'routes', routeToDelete.id));
      setRouteToDelete(null);
    } catch (err) {
      console.error("Error deleting route:", err);
      alert("Erro ao excluir a rota.");
    }
  };

  // Filtros client-side
  const filteredRoutes = routes.filter(r => {
    // Filtrar por cobrador se o usuário logado for collector (segurança)
    if (isCollector && r.assignedUserId !== auth.currentUser?.uid) {
      return false;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const nameMatches = (r.name || '').toLowerCase().includes(lowerQuery);
    const collectorMatches = (r.assignedUserName || '').toLowerCase().includes(lowerQuery);

    return nameMatches || collectorMatches;
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
            <MapPin className="w-4 h-4 mr-2" />
            Rotas de Cobrança
          </div>
          {isAdmin && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#16A34A] hover:bg-[#15803d] text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm flex items-center transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Nova Rota
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
              placeholder="Buscar rota por nome ou cobrador..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 pl-9 text-sm text-[#333333] outline-none focus:border-[#6B21A8] transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>

          {/* Loading Skeletons */}
          {listViewBody(
            loading,
            filteredRoutes.length,
            (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SKELETON_CARD_KEYS.slice(0, 3).map((key) => (
                <div key={key} className="bg-white border border-gray-200 shadow-sm rounded-sm p-4 animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  <div className="space-y-2 pt-2">
                    <div className="h-3 bg-gray-50 rounded w-full"></div>
                    <div className="h-3 bg-gray-50 rounded w-4/5"></div>
                  </div>
                </div>
              ))}
            </div>
          ),
            (
            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-sm">
              <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-700">Nenhuma rota cadastrada ainda</p>
              <p className="text-xs text-gray-500 mt-1 mb-4">Cadastre uma nova rota para começar a organizar as cobranças.</p>
              {isAdmin && (
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-[#16A34A] hover:bg-[#15803d] text-white text-xs font-bold px-4 py-2 rounded shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1 inline" />
                  Criar Primeira Rota
                </button>
              )}
            </div>
          ),
            (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRoutes.map((route) => (
                <div key={route.id} className="bg-white border border-gray-300 shadow-sm rounded-sm p-3 flex flex-col justify-between hover:border-gray-400 transition-colors">
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-gray-800 text-sm flex items-center">
                        <MapPin className="w-3.5 h-3.5 text-[#84CC16] mr-1.5 flex-shrink-0" />
                        {route.name}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        route.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {route.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    {route.description && (
                      <p className="text-xs text-gray-500 mt-1 italic">{route.description}</p>
                    )}
                    
                    <div className="mt-3 space-y-2 border-t border-gray-100 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[11px] font-bold text-[#555555] uppercase">Cobrador:</span>
                        <span className="text-gray-700 font-semibold flex items-center">
                          <User className="w-3 h-3 text-gray-400 mr-1" />
                          {route.assignedUserName || 'Sem cobrador'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[11px] font-bold text-[#555555] uppercase">CN:</span>
                        <span className="text-gray-700 font-medium flex items-center">
                          <Building2 className="w-3 h-3 text-gray-400 mr-1" />
                          {route.cnName || 'CN Padrão'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[11px] font-bold text-[#555555] uppercase">Clientes:</span>
                        <span className="text-gray-700 font-bold bg-gray-100 px-2 py-0.5 rounded-full text-[10px]">
                          {route.clientCount ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  {isAdmin && (
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleActive(route)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        {route.active ? 'Desativar' : 'Ativar'}
                      </button>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => navigate('edit-route', { routeId: route.id })}
                          title="Editar"
                          className="p-1.5 text-gray-600 hover:text-gray-800 border border-gray-200 rounded hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setRouteToDelete(route)}
                          title="Excluir"
                          className="p-1.5 text-red-600 hover:text-red-800 border border-gray-200 rounded hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Modal Criar Rota */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-sm border border-gray-300 shadow-2xl w-full max-w-md p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-[#333333] font-bold text-base uppercase tracking-wider flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-[#84CC16]" />
                Nova Rota de Cobro
              </h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRouteSubmit} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Nome da Rota <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Rota Leste, RT 03"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border border-gray-300 rounded p-2 text-sm text-[#333333] outline-none focus:border-[#6B21A8]"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Descrição
                </label>
                <textarea 
                  placeholder="Opcional: Bairros ou pontos de referência"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border border-gray-300 rounded p-2 text-sm text-[#333333] outline-none focus:border-[#6B21A8] h-16 resize-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Atribuir Cobrador
                </label>
                <select 
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="border border-gray-300 rounded p-2 text-sm text-[#333333] bg-white outline-none focus:border-[#6B21A8]"
                >
                  <option value="">Nenhum cobrador atribuído</option>
                  {collectors.map(c => (
                    <option key={c.id} value={c.id}>
                      {`${c.firstName || ''} ${c.lastName1 || ''}`.trim() || c.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* CN - Mock por enquanto (Pendente comment) */}
              <div className="flex flex-col opacity-60">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Centro de Negócios (CN)
                </label>
                <select 
                  disabled
                  className="border border-gray-300 rounded p-2 text-sm text-gray-500 bg-gray-50 outline-none"
                >
                  <option value="">CN Padrão (Mock)</option>
                </select>
                <span className="text-[10px] text-gray-400 mt-1 italic">
                  * Pendente: Vincular com centro de negócios reais em atualizações futuras.
                </span>
              </div>

              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="form-active" 
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 text-[#84CC16] rounded border-gray-300 focus:ring-[#84CC16] mr-2"
                />
                <label htmlFor="form-active" className="text-xs font-bold text-[#555555] uppercase cursor-pointer pl-1">
                  Rota Ativa
                </label>
              </div>

              <div className="flex space-x-3 pt-3 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-2 rounded text-xs shadow-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2 rounded text-xs shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ConfirmModal Deletar */}
      <ConfirmModal 
        isOpen={!!routeToDelete}
        onClose={() => setRouteToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Rota?"
        subtitle={`Deseja realmente remover permanentemente a rota "${routeToDelete?.name}"?`}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
