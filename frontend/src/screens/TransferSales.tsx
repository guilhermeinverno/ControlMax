import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { db, auth } from '../lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  doc,
  writeBatch,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { ConfirmModal } from './components/ConfirmModal';
import {
  ArrowRightLeft,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  History as HistoryIcon,
  User,
  MapPin,
  Check,
  X,
  Inbox,
  Calendar,
  DollarSign,
  Briefcase,
  AlertTriangle
} from 'lucide-react';

interface TransferSalesProps {
  onNavigate?: (screen: Screen) => void;
  params?: Record<string, unknown>;
}

interface Unit {
  id: string;
  name: string;
  location: string;
  active: boolean;
}

interface BusinessCenter {
  id: string;
  name: string;
  code: string;
  status: 'Activo' | 'Inactivo';
  linkedUnits: Unit[];
}

interface UnitTransfer {
  id: string;
  tenantId: string;
  fromCnId: string;
  fromCnName: string;
  toUserId: string;
  toUserName: string;
  toCnId?: string;
  toCnName?: string;
  units: {
    id: string;
    name: string;
    location: string;
    balance: number;
    boxStatus: 'Abierta' | 'Cerrada';
  }[];
  status: 'pending' | 'accepted' | 'rejected';
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
  resolvedBy?: string;
}

interface DBUser {
  id: string;
  userName: string;
  displayName?: string;
  role: string;
  active: boolean;
}

const fmt = (cents: number) =>
  (cents / 100).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function TransferSales({ onNavigate }: TransferSalesProps) {
  const { tenantId, role, userName, loading: tenantLoading } = useTenant();
  const currentUserId = auth.currentUser?.uid;

  const isAdmin = role === 'admin';
  const isSupervisor = role === 'supervisor';
  const canApproveAll = isAdmin || isSupervisor;

  // Active Tab: 'transfer' | 'accept' | 'history'
  const [activeTab, setActiveTab] = useState<'transfer' | 'accept' | 'history'>('transfer');

  // Business Centers & Users lists
  const [businessCenters, setBusinessCenters] = useState<BusinessCenter[]>([]);
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // --- TAB 1: TRASLADAR UNIDADES STATE ---
  const [selectedSociedad, setSelectedSociedad] = useState('');
  const [selectedCnId, setSelectedCnId] = useState('');
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [destinationUserId, setDestinationUserId] = useState('');

  // Live Unit balances & box statuses
  const [unitBalances, setUnitBalances] = useState<Record<string, number>>({});
  const [unitBoxes, setUnitBoxes] = useState<Record<string, 'Abierta' | 'Cerrada'>>({});
  const [loadingUnitsData, setLoadingUnitsData] = useState(false);

  // --- TAB 2: ACEPTAR UNIDADES STATE ---
  const [pendingTransfers, setPendingTransfers] = useState<UnitTransfer[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [selectedDestCnMap, setSelectedDestCnMap] = useState<Record<string, string>>({}); // transferId -> destCnId

  // --- TAB 3: HISTÓRICO STATE ---
  const [historyTransfers, setHistoryTransfers] = useState<UnitTransfer[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Global action status
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Confirmations
  const [isConfirmTransferOpen, setIsConfirmTransferOpen] = useState(false);
  const [confirmAcceptId, setConfirmAcceptId] = useState<string | null>(null);
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);

  // Load Societies, Business Centers and Users
  useEffect(() => {
    if (!tenantId) return;

    setLoadingMetadata(true);

    // 1. Fetch Business Centers
    const qCenters = query(collection(db, 'business_centers'), where('tenantId', '==', tenantId));
    const unsubCenters = onSnapshot(qCenters, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BusinessCenter[];
      setBusinessCenters(list);
    }, (err) => {
      console.error("Error fetching business centers:", err);
    });

    // 2. Fetch Active Users (who can receive units)
    const qUsers = query(collection(db, 'users'), where('tenantId', '==', tenantId), where('active', '==', true));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        userName: doc.data().userName || doc.data().displayName || doc.data().email?.split('@')[0] || 'Cobrador',
        ...doc.data()
      })) as DBUser[];
      setUsers(list);
      setLoadingMetadata(false);
    }, (err) => {
      console.error("Error fetching users:", err);
      setLoadingMetadata(false);
    });

    return () => {
      unsubCenters();
      unsubUsers();
    };
  }, [tenantId]);

  // Load live portfolio balances & open box statuses for units in the selected CN
  useEffect(() => {
    if (!tenantId || !selectedCnId) {
      setUnitBalances({});
      setUnitBoxes({});
      return;
    }

    setLoadingUnitsData(true);
    const selectedCn = businessCenters.find(c => c.id === selectedCnId);
    if (!selectedCn || !selectedCn.linkedUnits || selectedCn.linkedUnits.length === 0) {
      setLoadingUnitsData(false);
      return;
    }

    const unitIds = selectedCn.linkedUnits.map(u => u.id);

    // 1. Query all active sales to sum active balances for each unit
    const qSales = query(
      collection(db, 'sales'),
      where('tenantId', '==', tenantId),
      where('status', '==', 'active')
    );

    // 2. Query open boxes to determine box statuses
    const qBoxes = query(
      collection(db, 'boxes'),
      where('tenantId', '==', tenantId),
      where('status', '==', 'open')
    );

    let unsubSales = () => {};
    let unsubBoxes = () => {};

    try {
      unsubSales = onSnapshot(qSales, (snapshot) => {
        const balances: Record<string, number> = {};
        // Pre-populate with 0
        unitIds.forEach(id => { balances[id] = 0; });

        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          const uId = data.unitId;
          const bal = data.balance || 0;
          if (uId && unitIds.includes(uId)) {
            balances[uId] = (balances[uId] || 0) + bal;
          }
        });
        setUnitBalances(balances);
        setLoadingUnitsData(false);
      }, (err) => {
        console.error("Error fetching live unit balances:", err);
        setLoadingUnitsData(false);
      });

      unsubBoxes = onSnapshot(qBoxes, (snapshot) => {
        const statuses: Record<string, 'Abierta' | 'Cerrada'> = {};
        unitIds.forEach(id => { statuses[id] = 'Cerrada'; });

        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          const uId = data.unitId;
          if (uId && unitIds.includes(uId)) {
            statuses[uId] = 'Abierta';
          }
        });
        setUnitBoxes(statuses);
      }, (err) => {
        console.error("Error fetching live boxes:", err);
      });
    } catch (err) {
      console.error("Error setting up live unit queries:", err);
      setLoadingUnitsData(false);
    }

    return () => {
      unsubSales();
      unsubBoxes();
    };
  }, [tenantId, selectedCnId, businessCenters]);

  // Load pending transfers for the "Aceptar Unidades" tab
  useEffect(() => {
    if (!tenantId || activeTab !== 'accept') return;

    setLoadingPending(true);
    let qPending = query(
      collection(db, 'unit_transfers'),
      where('tenantId', '==', tenantId),
      where('status', '==', 'pending')
    );

    // If collector and not supervisor/admin, filter by assigned to this user
    if (!canApproveAll && currentUserId) {
      qPending = query(
        collection(db, 'unit_transfers'),
        where('tenantId', '==', tenantId),
        where('toUserId', '==', currentUserId),
        where('status', '==', 'pending')
      );
    }

    const unsub = onSnapshot(qPending, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UnitTransfer[];

      // Sort pending client-side
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      setPendingTransfers(list);
      setLoadingPending(false);
    }, (err) => {
      console.error("Error fetching pending transfers:", err);
      setLoadingPending(false);
    });

    return unsub;
  }, [tenantId, activeTab, currentUserId, canApproveAll]);

  // Load historical transfers for the "Histórico" tab
  useEffect(() => {
    if (!tenantId || activeTab !== 'history') return;

    setLoadingHistory(true);
    const qHistory = query(
      collection(db, 'unit_transfers'),
      where('tenantId', '==', tenantId),
      limit(50)
    );

    const unsub = onSnapshot(qHistory, (snapshot) => {
      const list = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as UnitTransfer))
        .filter(t => t.status !== 'pending');

      // Sort descending
      list.sort((a, b) => (b.resolvedAt?.seconds || b.createdAt?.seconds || 0) - (a.resolvedAt?.seconds || a.createdAt?.seconds || 0));

      setHistoryTransfers(list);
      setLoadingHistory(false);
    }, (err) => {
      console.error("Error fetching history transfers:", err);
      setLoadingHistory(false);
    });

    return unsub;
  }, [tenantId, activeTab]);

  // Handle selected units change
  const toggleUnitSelection = (unitId: string) => {
    setSelectedUnitIds(prev =>
      prev.includes(unitId) ? prev.filter(id => id !== unitId) : [...prev, unitId]
    );
  };

  const handleSelectAllUnits = (checked: boolean, units: Unit[]) => {
    if (checked) {
      setSelectedUnitIds(units.map(u => u.id));
    } else {
      setSelectedUnitIds([]);
    }
  };

  // Submit Unit Transfer (Step 1 -> Step 2)
  const executeTransferRequest = async () => {
    if (!tenantId || !selectedCnId || selectedUnitIds.length === 0 || !destinationUserId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setIsConfirmTransferOpen(false);

    try {
      const sourceCn = businessCenters.find(c => c.id === selectedCnId);
      const destUser = users.find(u => u.id === destinationUserId);

      if (!sourceCn || !destUser) {
        throw new Error("Centro de Negocios de origen o Usuario destino inválidos.");
      }

      // Collect specific unit objects with live balances and box statuses
      const unitsToTransfer = sourceCn.linkedUnits
        .filter(u => selectedUnitIds.includes(u.id))
        .map(u => ({
          id: u.id,
          name: u.name,
          location: u.location || '',
          balance: unitBalances[u.id] || 0,
          boxStatus: unitBoxes[u.id] || 'Cerrada'
        }));

      const payload = {
        tenantId,
        fromCnId: selectedCnId,
        fromCnName: sourceCn.name,
        toUserId: destinationUserId,
        toUserName: destUser.userName || destUser.displayName || 'Destinatario',
        units: unitsToTransfer,
        status: 'pending' as const,
        createdBy: currentUserId || 'system',
        createdByName: userName || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Administrador',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'unit_transfers'), payload);

      setSuccess(`¡Traslado registrado con éxito! Las ${unitsToTransfer.length} unidades seleccionadas han sido enviadas para la aceptación de ${payload.toUserName}.`);
      
      // Reset form states
      setSelectedUnitIds([]);
      setDestinationUserId('');
    } catch (err) {
      console.error("Error creating unit transfer request:", err);
      setError("Error al registrar el traslado de unidades en Firestore.");
    } finally {
      setSubmitting(false);
    }
  };

  // Accept Unit Transfer (Tab 2)
  const handleAcceptTransfer = async (transfer: UnitTransfer) => {
    const destCnId = selectedDestCnMap[transfer.id];
    if (!destCnId) {
      setError("Por favor, seleccione el Centro de Negocios de destino.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setConfirmAcceptId(null);

    try {
      const destCn = businessCenters.find(c => c.id === destCnId);
      if (!destCn) throw new Error("Centro de Negocios de destino no encontrado.");

      const batch = writeBatch(db);

      // 1. Load source Business Center to remove units from linkedUnits
      const sourceCnRef = doc(db, 'business_centers', transfer.fromCnId);
      const sourceCnDoc = businessCenters.find(c => c.id === transfer.fromCnId);
      if (sourceCnDoc) {
        const transferUnitIds = transfer.units.map(u => u.id);
        const updatedSourceUnits = (sourceCnDoc.linkedUnits || []).filter(u => !transferUnitIds.includes(u.id));
        batch.update(sourceCnRef, {
          linkedUnits: updatedSourceUnits
        });
      }

      // 2. Add units to destination Business Center
      const destCnRef = doc(db, 'business_centers', destCnId);
      const destCnDoc = businessCenters.find(c => c.id === destCnId);
      if (destCnDoc) {
        const newUnitsToAdd = transfer.units.map(u => ({
          id: u.id,
          name: u.name,
          location: u.location || '',
          active: true
        }));
        const updatedDestUnits = [...(destCnDoc.linkedUnits || []), ...newUnitsToAdd];
        batch.update(destCnRef, {
          linkedUnits: updatedDestUnits
        });
      }

      // 3. Update transfer logs in Firestore
      const transferRef = doc(db, 'unit_transfers', transfer.id);
      batch.update(transferRef, {
        status: 'accepted' as const,
        toCnId: destCnId,
        toCnName: destCn.name,
        resolvedAt: serverTimestamp(),
        resolvedBy: userName || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Usuario'
      });

      // 4. Update sales associated with these units so they now belong to the destination user/recipient
      const salesSnapshot = await getDocs(
        query(
          collection(db, 'sales'),
          where('tenantId', '==', tenantId),
          where('unitId', 'in', transfer.units.map(u => u.id)),
          where('status', '==', 'active')
        )
      );

      salesSnapshot.docs.forEach(saleDoc => {
        batch.update(doc(db, 'sales', saleDoc.id), {
          userId: transfer.toUserId,
          userName: transfer.toUserName,
          unitName: transfer.units.find(u => u.id === saleDoc.data().unitId)?.name || saleDoc.data().unitName,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      setSuccess(`¡Unidades aceptadas y reubicadas con éxito en "${destCn.name}"!`);
      
      // Clean mapping
      setSelectedDestCnMap(prev => {
        const next = { ...prev };
        delete next[transfer.id];
        return next;
      });
    } catch (err) {
      console.error("Critical: Error accepting transfer batch:", err);
      setError("Error al procesar la aceptación física en Firestore. Operación cancelada.");
    } finally {
      setSubmitting(false);
    }
  };

  // Reject Unit Transfer (Tab 2)
  const handleRejectTransfer = async (transferId: string) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setConfirmRejectId(null);

    try {
      const transferRef = doc(db, 'unit_transfers', transferId);
      await updateDoc(transferRef, {
        status: 'rejected' as const,
        resolvedAt: serverTimestamp(),
        resolvedBy: userName || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Usuario'
      });

      setSuccess("El traslado de unidades ha sido rechazado correctamente.");
    } catch (err) {
      console.error("Error rejecting transfer:", err);
      setError("Error al procesar el rechazo del traslado.");
    } finally {
      setSubmitting(false);
    }
  };

  // Find currently selected business center details
  const currentCn = businessCenters.find(c => c.id === selectedCnId);
  const activeUnitsInCn = currentCn?.linkedUnits?.filter(u => u.active) || [];

  // Sum of selected unit balances
  const totalSelectedBalance = selectedUnitIds.reduce((sum, id) => sum + (unitBalances[id] || 0), 0);

  if (tenantLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-2 min-h-screen bg-[#F3F4F6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6B21A8]" />
        <p className="text-xs font-semibold">Cargando datos organizacionales...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#F0F2F5] min-h-screen text-[#333333] -m-4 pb-28 select-none">
      {/* Top Professional Header */}
      <div className="bg-[#6A008A] text-white py-5 px-6 shadow-md border-b border-[#52006A]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-[#8CC63F]" strokeWidth={2.5} />
              Traslado de Unidades
            </h1>
            <p className="text-xs text-purple-200 mt-0.5">
              Gestione la reubicación física de rutas de cobranza y asignación de carteras entre Centros de Negocios.
            </p>
          </div>
          
          {/* Quick Back Nav */}
          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="text-[11px] font-black text-purple-100 bg-purple-900/40 hover:bg-purple-950/40 px-3 py-1.5 rounded-lg border border-purple-500/30 transition-all uppercase self-start sm:self-center cursor-pointer"
          >
            Volver al Panel
          </button>
        </div>

        {/* Tab Selection Row matching NewExpense toggle button pattern */}
        <div className="flex flex-wrap gap-2.5 mt-5">
          <button
            onClick={() => { setActiveTab('transfer'); setError(null); setSuccess(null); }}
            className={`flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all border shadow-xs cursor-pointer ${
              activeTab === 'transfer'
                ? 'bg-[#8CC63F] text-black border-[#8CC63F] font-black'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 shrink-0" />
            Trasladar Unidades
          </button>
          
          <button
            onClick={() => { setActiveTab('accept'); setError(null); setSuccess(null); }}
            className={`flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all border shadow-xs relative cursor-pointer ${
              activeTab === 'accept'
                ? 'bg-[#8CC63F] text-black border-[#8CC63F] font-black'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
            }`}
          >
            <Inbox className="w-4 h-4 shrink-0" />
            Aceptar Unidades
            {pendingTransfers.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-white">
                {pendingTransfers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('history'); setError(null); setSuccess(null); }}
            className={`flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all border shadow-xs cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#8CC63F] text-black border-[#8CC63F] font-black'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
            }`}
          >
            <HistoryIcon className="w-4 h-4 shrink-0" />
            Histórico
          </button>
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto w-full space-y-4">
        {/* Alerts Center */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded p-4 text-red-800 text-xs flex items-start shadow-sm">
            <AlertCircle className="w-4.5 h-4.5 mr-2.5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block uppercase tracking-wider mb-0.5 text-red-900">Atención / Error</span>
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-300 rounded p-4 text-green-800 text-xs flex items-start shadow-sm">
            <CheckCircle2 className="w-4.5 h-4.5 mr-2.5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block uppercase tracking-wider mb-0.5 text-green-950">Operación Exitosa</span>
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* LOADING SCREEN */}
        {loadingMetadata && (
          <div className="bg-white border border-gray-300 rounded p-12 text-center text-gray-500 space-y-2 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-[#6A008A] mx-auto" />
            <p className="text-xs font-bold">Cargando base de datos organizacionales...</p>
          </div>
        )}

        {/* TAB 1: TRASLADAR UNIDADES CONTENT */}
        {!loadingMetadata && activeTab === 'transfer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* LEFT PANEL: ORIGEN */}
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
                  {/* Sociedad */}
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

                  {/* Centro de Negocios */}
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
                        {businessCenters.map(cn => (
                          <option key={cn.id} value={cn.id}>
                            {cn.name} ({cn.code || 'S/C'})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Table: Unidades en CN de origen */}
                <div className="border border-gray-200 rounded overflow-hidden mt-4">
                  <div className="bg-gray-100/70 border-b border-gray-200 px-3.5 py-2.5">
                    <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-wider">
                      Unidades en CN de origen
                    </h3>
                  </div>

                  {!selectedCnId ? (
                    <div className="text-center py-10 bg-gray-50/50">
                      <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-[11px] text-gray-400 font-bold">
                        Seleccione un Centro de Negocios para ver sus unidades.
                      </p>
                    </div>
                  ) : loadingUnitsData ? (
                    <div className="text-center py-10 bg-gray-50/50 space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#6A008A] mx-auto" />
                      <p className="text-[10px] text-gray-400 font-bold">Calculando saldos y estados de caja...</p>
                    </div>
                  ) : activeUnitsInCn.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50/50">
                      <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-[11px] text-gray-400 font-bold">No hay unidades activas en este centro de negocios.</p>
                    </div>
                  ) : (
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
                                $ {fmt(balance)}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  boxStatus === 'Abierta'
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                  }`}>
                                  {boxStatus}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: DESTINO */}
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
                {/* Destinatario User Selector */}
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
                        .filter(u => u.id !== currentUserId)
                        .map(u => (
                          <option key={u.id} value={u.id}>
                            {u.userName} ({u.role === 'collector' ? 'Cobrador' : u.role === 'supervisor' ? 'Supervisor' : 'Administrador'})
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Warnings / Explanations */}
                <div className="bg-amber-50/50 border border-amber-200 rounded p-4 text-xs text-amber-900 flex gap-2.5 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px] font-medium">
                    Las unidades trasladadas deben ser <strong>aceptadas por el destinatario</strong> y ubicadas en un Centro de Negocios, de lo contrario el traslado no será realizado.
                  </p>
                </div>

                {/* Subcounter details if selected */}
                {selectedUnitIds.length > 0 && (
                  <div className="bg-purple-50/50 border border-purple-250 rounded p-4 text-xs text-purple-900 space-y-2">
                    <div className="font-extrabold uppercase tracking-wide text-[10px] text-[#6A008A] flex items-center justify-between">
                      <span>Resumen del traslado</span>
                      <span className="bg-purple-100 px-2 py-0.5 rounded-full text-[#6A008A] text-[9px]">
                        {selectedUnitIds.length} unidades
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] text-purple-950/80">
                      <div>Origen: <span className="font-extrabold text-gray-800">{currentCn?.name}</span></div>
                      <div>Destinatario: <span className="font-extrabold text-gray-800">
                        {users.find(u => u.id === destinationUserId)?.userName || 'Por seleccionar'}
                      </span></div>
                      <div className="flex items-center justify-between border-t border-purple-200/50 pt-2 font-black text-xs text-purple-950">
                        <span>Saldo Total Cartera:</span>
                        <span className="text-red-700 font-mono text-sm">$ {fmt(totalSelectedBalance)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => setIsConfirmTransferOpen(true)}
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
        )}

        {/* TAB 2: ACEPTAR UNIDADES CONTENT */}
        {activeTab === 'accept' && (
          <div className="space-y-4">
            <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Inbox className="w-4 h-4 text-[#6B21A8]" />
              Traslados de Unidades pendientes de recepción
            </h2>

            {loadingPending ? (
              <div className="bg-white border border-gray-200 rounded p-12 text-center text-gray-500 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#6B21A8] mx-auto" />
                <p className="text-xs font-bold">Consultando bandeja de entrada...</p>
              </div>
            ) : pendingTransfers.length === 0 ? (
              <div className="bg-white border border-gray-300 rounded p-12 text-center text-gray-400 space-y-2 shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="font-bold text-gray-600 text-xs uppercase tracking-wide">Bandeja Vacía</h3>
                <p className="text-[11px]">No tiene traslados de unidades pendientes de aceptación.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingTransfers.map((transfer) => {
                  const totalBalance = transfer.units.reduce((s, u) => s + (u.balance || 0), 0);
                  const selectedDestCn = selectedDestCnMap[transfer.id] || '';

                  return (
                    <div
                      key={transfer.id}
                      className="bg-white border border-gray-300 hover:border-gray-400 transition-all rounded shadow-sm overflow-hidden flex flex-col"
                    >
                      {/* Card Header */}
                      <div className="bg-purple-50/60 border-b border-gray-200 p-3.5 flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                            Pendiente Aceptación
                          </span>
                          <div className="text-[10px] text-gray-400 font-semibold font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {transfer.createdAt ? (transfer.createdAt.toDate ? transfer.createdAt.toDate().toLocaleString('es-CO') : new Date().toLocaleString()) : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-gray-400 uppercase font-black">Saldo Total Cartera</p>
                          <p className="font-extrabold text-xs text-[#DC2626] font-mono">$ {fmt(totalBalance)}</p>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 flex-1 space-y-4">
                        {/* Route/Transfer entities detail */}
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

                        {/* Transferred units checklist */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block">
                            Unidades en el traslado ({transfer.units.length})
                          </span>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto bg-gray-50 border border-gray-200 rounded p-2 text-[11px]">
                            {transfer.units.map(unit => (
                              <div key={unit.id} className="flex justify-between items-center bg-white p-1.5 rounded border border-gray-200">
                                <div>
                                  <span className="font-bold text-gray-800">{unit.name}</span>
                                  <span className="text-[9px] text-gray-400 ml-1.5">Box: {unit.boxStatus}</span>
                                </div>
                                <span className="font-bold text-gray-600 font-mono">$ {fmt(unit.balance)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Select Destination Business Center */}
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
                                setSelectedDestCnMap(prev => ({ ...prev, [transfer.id]: val }));
                              }}
                              className="w-full border border-gray-300 rounded p-2 text-xs bg-white text-[#333333] font-bold outline-none focus:border-[#6B21A8] appearance-none pr-8"
                            >
                              <option value="">Seleccione Centro de negocios de destino</option>
                              {businessCenters.map(cn => (
                                <option key={cn.id} value={cn.id}>
                                  {cn.name} ({cn.code})
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-2.5 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
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

                      {/* Modal Confirms Specific to Card */}
                      <ConfirmModal
                        isOpen={confirmAcceptId === transfer.id}
                        onClose={() => setConfirmAcceptId(null)}
                        onConfirm={() => handleAcceptTransfer(transfer)}
                        title="Confirmar Recepción de Unidades"
                        subtitle={`¿Desea realmente aceptar estas ${transfer.units.length} unidades y vincularlas permanentemente al Centro de Negocios "${businessCenters.find(c => c.id === selectedDestCn)?.name}"? La cartera activa por $ ${fmt(totalBalance)} será reasignada a su nombre.`}
                        confirmText="Sí, aceptar unidades"
                        cancelText="Cancelar"
                      />

                      <ConfirmModal
                        isOpen={confirmRejectId === transfer.id}
                        onClose={() => setConfirmRejectId(null)}
                        onConfirm={() => handleRejectTransfer(transfer.id)}
                        title="Rechazar Traslado de Unidades"
                        subtitle="¿Desea realmente rechazar este traslado de unidades? El remitente será notificado y la operación quedará registrada como rechazada."
                        confirmText="Sí, rechazar traslado"
                        cancelText="Cancelar"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HISTÓRICO CONTENT */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <HistoryIcon className="w-4 h-4 text-[#6B21A8]" />
              Historial de traslados finalizados (Últimos 50 registros)
            </h2>

            {loadingHistory ? (
              <div className="bg-white border border-gray-200 rounded p-12 text-center text-gray-500 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#6B21A8] mx-auto" />
                <p className="text-xs font-bold">Cargando histórico de auditoría...</p>
              </div>
            ) : historyTransfers.length === 0 ? (
              <div className="bg-white border border-gray-300 rounded p-12 text-center text-gray-400 space-y-1 shadow-sm">
                <HistoryIcon className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="font-bold text-gray-600 text-xs uppercase tracking-wide">Sin Registros</h3>
                <p className="text-[11px]">No hay traslados finalizados en el histórico de auditoría.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Fecha Traslado</th>
                        <th className="p-3">Unidades</th>
                        <th className="p-3">Origen (CN)</th>
                        <th className="p-3">Destinatario</th>
                        <th className="p-3">Reubicación (CN)</th>
                        <th className="p-3 text-right">Saldo Cartera</th>
                        <th className="p-3 text-center">Estado</th>
                        <th className="p-3">Resolución</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {historyTransfers.map((t) => {
                        const totalBalance = t.units.reduce((s, u) => s + (u.balance || 0), 0);
                        const transDate = t.createdAt
                          ? (t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt.seconds * 1000))
                          : new Date();
                        const resolDate = t.resolvedAt
                          ? (t.resolvedAt.toDate ? t.resolvedAt.toDate() : new Date(t.resolvedAt.seconds * 1000))
                          : null;

                        return (
                          <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="p-3 whitespace-nowrap text-gray-500">
                              <span className="font-bold text-gray-700">{transDate.toLocaleDateString('es-CO')}</span>
                              <span className="block text-[10px] text-gray-400 mt-0.5">{transDate.toLocaleTimeString('es-CO')}</span>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-gray-800">{t.units.map(u => u.name).join(', ')}</div>
                              <span className="text-[10px] text-purple-700 font-bold">{t.units.length} unidades</span>
                            </td>
                            <td className="p-3 font-semibold text-gray-600">{t.fromCnName}</td>
                            <td className="p-3 font-semibold text-gray-600">{t.toUserName}</td>
                            <td className="p-3 font-semibold text-gray-600">{t.toCnName || '---'}</td>
                            <td className="p-3 text-right font-bold text-gray-800 font-mono">
                              $ {fmt(totalBalance)}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                t.status === 'accepted'
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {t.status === 'accepted' ? 'Aceptado' : 'Rechazado'}
                              </span>
                            </td>
                            <td className="p-3 text-gray-500">
                              <div className="font-semibold text-gray-700">Por: {t.resolvedBy || 'Desconocido'}</div>
                              {resolDate && (
                                <span className="text-[10px] text-gray-400 block mt-0.5">{resolDate.toLocaleDateString('es-CO')} {resolDate.toLocaleTimeString('es-CO')}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* CONFIRMATION MODAL - TAB 1 GLOBAL REQUEST */}
      <ConfirmModal
        isOpen={isConfirmTransferOpen}
        onClose={() => setIsConfirmTransferOpen(false)}
        onConfirm={executeTransferRequest}
        title="Confirmar Registro de Traslado de Unidades"
        subtitle={`¿Desea iniciar el traslado en custodia de las ${selectedUnitIds.length} unidades seleccionadas de "${currentCn?.name}" hacia el usuario "${users.find(u => u.id === destinationUserId)?.userName}"? El destinatario recibirá una notificación para aceptar o rechazar el traslado físico y la cartera total de $ ${fmt(totalSelectedBalance)}.`}
        confirmText={submitting ? "Procesando..." : "Sí, registrar traslado"}
        cancelText="Cancelar"
      />
    </div>
  );
}
