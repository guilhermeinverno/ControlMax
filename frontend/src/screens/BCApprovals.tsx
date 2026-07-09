import { useState, useEffect } from 'react';
import { Screen } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { approvalStatusCardBorderClasses } from '../utils/statusLabels';
import { listViewBody } from '../utils/listViewBody';
import { Check, X, CheckCircle, XCircle, Search, User, AlertCircle } from 'lucide-react';

interface BCApprovalsProps {
  onNavigate?: (screen: Screen) => void;
}

interface ExpenseRequest {
  id: string;
  tenantId: string;
  boxId: string;
  boxName: string;
  cnId: string;
  cnName: string;
  type: string;
  amount: number; // in cents
  comment: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedById: string;
  createdAt?: any; // FIXED_BY_SCRIPT
  approvedAt?: any; // FIXED_BY_SCRIPT
  approvedBy?: string;
}

export function BCApprovals({ onNavigate }: BCApprovalsProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [requests, setRequests] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { tenantId, userName } = useTenant();

  // Load real-time expense approvals under this tenant
  useEffect(() => {
    if (!tenantId) return;

    setLoadError(null);
    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: ExpenseRequest[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          tenantId: data.tenantId,
          boxId: data.boxId,
          boxName: data.boxName,
          cnId: data.cnId,
          cnName: data.cnName,
          type: data.type,
          amount: data.amount || 0,
          comment: data.comment || '',
          description: data.description || '',
          status: data.status || 'approved',
          requestedBy: data.requestedBy || 'Colaborador',
          requestedById: data.requestedById || '',
          createdAt: data.createdAt,
          approvedAt: data.approvedAt,
          approvedBy: data.approvedBy
        };
      });
      setRequests(loaded);
      setLoadError(null);
      setLoading(false);
    }, (error) => {
      console.error("Error loading approvals:", error);
      setLoadError('Erro ao carregar solicitações de aprovação do Firestore.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  const handleApprove = async (id: string, requesterName: string, amount: number) => {
    try {
      const expenseRef = doc(db, 'expenses', id);
      await updateDoc(expenseRef, {
        status: 'approved',
        approvedBy: userName || auth?.currentUser?.email || 'Gestor',
        approvedAt: serverTimestamp()
      });
      setSuccessMessage(`¡Gasto de ${requesterName} por $ ${(amount / 100).toFixed(2)} APROBADO correctamente!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error("Error approving expense:", error);
      alert("Error al aprobar el gasto.");
    }
  };

  const handleReject = async (id: string, requesterName: string, amount: number) => {
    if (!window.confirm(`¿Está seguro de que desea rechazar el gasto de ${requesterName} por $ ${(amount / 100).toFixed(2)}?`)) {
      return;
    }
    try {
      const expenseRef = doc(db, 'expenses', id);
      await updateDoc(expenseRef, {
        status: 'rejected',
        approvedBy: userName || auth?.currentUser?.email || 'Gestor',
        approvedAt: serverTimestamp()
      });
      setSuccessMessage(`El gasto de ${requesterName} ha sido rechazado.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error("Error rejecting expense:", error);
      alert("Error al rechazar el gasto.");
    }
  };

  const formatType = (type: string) => {
    switch (type) {
      case 'alimentacion': return 'Alimentación';
      case 'transporte': return 'Transporte';
      case 'papeleria': return 'Papelería';
      case 'otros': return 'Otros Gastos';
      default: return type;
    }
  };

  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return 'Reciente';
    try {
      const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date((timestamp as { seconds: number }).seconds * 1000);
      return date.toLocaleString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Reciente';
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const resolvedRequests = requests.filter(r => r.status === 'approved' || r.status === 'rejected');

  const filteredRequests = (activeTab === 'pending' ? pendingRequests : resolvedRequests).filter(r => 
    r.requestedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.cnName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPendingAmount = pendingRequests.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333]">
      
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-gray-300 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#6A008A] flex items-center gap-1.5">
              <CheckCircle className="w-5.5 h-5.5 text-[#8CC63F]" />
              Aprobaciones de Gastos
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Gestione los pedidos de dinero y egresos realizados por sus colaboradores.</p>
          </div>
          
          <div className="flex gap-2">
            <button
              id="btn-nav-dashboard"
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-[#333] font-bold px-3 py-1.5 rounded text-xs transition-colors"
            >
              Volver al Inicio
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          <div className="bg-amber-50 border border-amber-200 rounded p-3 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Pedidos Pendientes</span>
            <span className="text-2xl font-black text-amber-800 mt-1 flex items-baseline gap-1">
              {pendingRequests.length}
              <span className="text-xs font-normal text-amber-600">solicitudes</span>
            </span>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded p-3 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">Monto Pendiente</span>
            <span className="text-2xl font-black text-purple-800 mt-1">
              $ {(totalPendingAmount / 100).toFixed(2)}
            </span>
          </div>

          <div className="bg-green-50 border border-green-200 rounded p-3 col-span-2 sm:col-span-1 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-green-700 tracking-wider">Resueltos</span>
            <span className="text-2xl font-black text-green-800 mt-1 flex items-baseline gap-1">
              {resolvedRequests.length}
              <span className="text-xs font-normal text-green-600">historial</span>
            </span>
          </div>
        </div>
      </div>

      {/* TOAST / NOTIFICATION */}
      {successMessage && (
        <div className="m-3 bg-[#16A34A] text-white font-bold p-3 rounded shadow-lg text-xs animate-bounce flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 stroke-[3px]" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* TABS & SEARCH */}
      <div className="p-3">
        <div className="flex flex-col sm:flex-row gap-3 mb-4 bg-white p-2 rounded border border-gray-300">
          {/* Tabs */}
          <div className="flex flex-1 rounded bg-gray-100 p-1">
            <button
              id="tab-pending-approvals"
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-1.5 text-xs font-bold rounded text-center transition-all ${
                activeTab === 'pending' 
                  ? 'bg-white text-[#6A008A] shadow-sm' 
                  : 'text-gray-600 hover:text-[#6A008A]'
              }`}
            >
              Pendientes ({pendingRequests.length})
            </button>
            <button
              id="tab-history-approvals"
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-1.5 text-xs font-bold rounded text-center transition-all ${
                activeTab === 'history' 
                  ? 'bg-white text-[#6A008A] shadow-sm' 
                  : 'text-gray-600 hover:text-[#6A008A]'
              }`}
            >
              Historial ({resolvedRequests.length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex items-center min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5" />
            <input
              id="search-approvals"
              type="text"
              placeholder="Buscar por colaborador, comentario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded outline-none focus:border-[#6B21A8] bg-white"
            />
          </div>
        </div>

        {/* REQUESTS CONTAINER */}
        {loadError && (
          <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded text-xs flex items-start gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{loadError}</span>
          </div>
        )}

        {listViewBody(
          loading,
          filteredRequests.length,
          (
          <div className="bg-white border border-gray-300 p-8 text-center text-xs text-gray-500 rounded">
            Cargando solicitudes de aprobación...
          </div>
        ),
          (
          <div className="bg-white border border-gray-300 p-8 text-center text-xs text-gray-500 rounded">
            No se encontraron solicitudes para mostrar.
          </div>
        ),
          (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredRequests.map((req) => (
              <div 
                key={req.id} 
                className={`bg-white border rounded-sm shadow-sm p-4 relative flex flex-col justify-between ${approvalStatusCardBorderClasses(req.status)}`}
              >
                <div>
                  {/* Status & Date */}
                  <div className="flex justify-between items-start border-b border-gray-100 pb-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <h4 className="text-xs font-bold text-gray-800 leading-none">{req.requestedBy}</h4>
                        <span className="text-[9px] text-gray-500">{req.cnName || 'Sociedad Principal'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{formatDate(req.createdAt)}</span>
                  </div>

                  {/* Body Details */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Concepto</span>
                      <span className="font-bold text-purple-700 uppercase tracking-tight text-[10px]">{formatType(req.type)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-[#777777] block">Comentario</span>
                      <p className="text-xs font-semibold text-[#333] italic">"{req.comment}"</p>
                    </div>

                    {req.description && (
                      <div>
                        <span className="text-[10px] font-bold text-[#777777] block">Descripción detallada</span>
                        <p className="text-[11px] text-[#555555] bg-gray-50/50 p-1.5 rounded border border-gray-100 leading-relaxed">{req.description}</p>
                      </div>
                    )}
                    
                    <div className="text-[10px] text-gray-500">
                      <strong>Caja Origen:</strong> {req.boxName || 'No definida'}
                    </div>
                  </div>
                </div>

                {/* Amount and Actions */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-4">
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider block">Monto Solicitado</span>
                    <span className="text-lg font-black text-[#DC2626]">
                      $ {(req.amount / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleReject(req.id, req.requestedBy, req.amount)}
                          className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold px-2.5 py-1.5 rounded text-xs flex items-center gap-1 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Rechazar
                        </button>
                        <button
                          onClick={() => handleApprove(req.id, req.requestedBy, req.amount)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1 shadow-sm transition-colors"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Aprobar
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                        {req.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-[10px] border border-green-200 uppercase">
                            <CheckCircle className="w-3.5 h-3.5" /> Aprobado por {req.approvedBy || 'Gestor'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded text-[10px] border border-red-200 uppercase">
                            <XCircle className="w-3.5 h-3.5" /> Rechazado por {req.approvedBy || 'Gestor'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

    </div>
  );
}
