import { useState, useEffect } from 'react';
import { 
  AlertCircle, Calculator, Eye, EyeOff, MapPin, Smartphone, Users, FileText, 
  ChevronLeft, ChevronRight, Download, RefreshCw 
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { useTenant } from '../hooks/useTenant';
import { useDashboardBoxes } from '../hooks/useDashboardBoxes';
import { filterDashboardBoxes } from '../utils/dashboardBoxFilters';
import { Screen, Box } from '../types';
import { UnitSelectors } from './components/UnitSelectors';
import { useGlobalContext } from '../context/GlobalContext';
import { fmtCents } from '../utils/fmtCents';
import { parseUnknownTimestamp } from '../utils/timestampParsing';
import { collection, getDocs, query, where } from 'firebase/firestore';

import * as XLSX from 'xlsx';

// Custom interfaces for the dashboard
interface BoxTransaction {
  id: string;
  type: 'income' | 'expense' | 'sale' | 'collection' | 'transfer';
  description: string;
  amount: number;
  userId: string;
  userName: string;
  createdAt: any;
}

interface SupplementaryData {
  collections: any[];
  creditRequests: any[];
}

export function Dashboard({ onNavigate }: { onNavigate?: (screen: Screen) => void }) {
  const { tenantId, role, usuarioUnidades, loading: tenantLoading } = useTenant();

  // Redirect collectors to sales view
  useEffect(() => {
    if (!tenantLoading && role === 'collector' && onNavigate) {
      onNavigate('sales');
    }
  }, [role, tenantLoading, onNavigate]);

  const { boxes, loading: loadingBoxes, error: boxesError } = useDashboardBoxes(tenantId, usuarioUnidades);

  const {
    selectedCnId: globalCnId,
    selectedUnitId: globalUnitId,
    setSelectedCnId: setGlobalCnId,
    setSelectedUnitId: setGlobalUnitId,
  } = useGlobalContext();

  const selectedCnId = globalCnId || '';
  const selectedUnitId = globalUnitId || '';
  const [verTodas, setVerTodas] = useState(false);

  // Selected Box State
  const [selectedBoxId, setSelectedBoxId] = useState('');
  const [activeBox, setActiveBox] = useState<Box | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'resumen' | 'detalles'>('resumen');

  // Eye toggle state for showing/hiding sensitive values
  const [showValues, setShowValues] = useState(true);

  // Supplementary performance metrics & transaction extract states
  const [supplementary, setSupplementary] = useState<SupplementaryData>({ collections: [], creditRequests: [] });
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [transactions, setTransactions] = useState<BoxTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Pagination for transactions
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const targetUserId = auth.currentUser?.uid;

  // Filtered boxes list
  const filteredBoxes = filterDashboardBoxes(boxes, {
    role,
    currentUserId: targetUserId,
    verTodas,
    selectedCnId,
    selectedUnitId,
  });

  // Select the default box when list changes or filter updates
  useEffect(() => {
    if (filteredBoxes.length > 0) {
      // Find if previous box is still in list, otherwise default to first box
      const stillExists = filteredBoxes.find(b => b.id === selectedBoxId);
      if (!stillExists) {
        setSelectedBoxId(filteredBoxes[0].id);
        setActiveBox(filteredBoxes[0] as unknown as Box);
      } else {
        setActiveBox(stillExists as unknown as Box);
      }
    } else {
      setSelectedBoxId('');
      setActiveBox(null);
    }
  }, [filteredBoxes, selectedBoxId]);

  // Load supplementary data & transactions when active box changes
  useEffect(() => {
    if (!tenantId || !activeBox) {
      setSupplementary({ collections: [], creditRequests: [] });
      setTransactions([]);
      return;
    }

    const loadData = async () => {
      setLoadingMetrics(true);
      setLoadingTransactions(true);
      try {
        const openedDate = parseUnknownTimestamp(activeBox.openedAt) || new Date();
        const startOfDay = new Date(openedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(openedDate);
        endOfDay.setHours(23, 59, 59, 999);
        const uid = activeBox.userId;

        // Fetch collections & credit requests for the active box's day/user
        const [colSnap, reqSnap, txsSnap] = await Promise.all([
          getDocs(query(collection(db, 'collections'), where('tenantId', '==', tenantId), where('userId', '==', uid))),
          getDocs(query(collection(db, 'credit_requests'), where('tenantId', '==', tenantId), where('requestedById', '==', uid))),
          getDocs(collection(db, 'boxes', activeBox.id, 'transactions'))
        ]);

        const loadedCols = colSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((c: any) => {
            const dt = parseUnknownTimestamp(c.createdAt);
            return dt && dt >= startOfDay && dt <= endOfDay;
          });

        const loadedReqs = reqSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((r: any) => {
            const dt = parseUnknownTimestamp(r.createdAt);
            return dt && dt >= startOfDay && dt <= endOfDay;
          });

        const loadedTxs = txsSnap.docs.map(docSnap => {
          const txData = docSnap.data();
          return {
            id: docSnap.id,
            type: txData.type,
            description: txData.description || '',
            amount: txData.amount || 0,
            userId: txData.userId || '',
            userName: txData.userName || '',
            createdAt: txData.createdAt,
          } as BoxTransaction;
        });

        // Sort transactions desc by date
        loadedTxs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

        setSupplementary({ collections: loadedCols, creditRequests: loadedReqs });
        setTransactions(loadedTxs);
        setCurrentPage(1);
      } catch (err) {
        console.error("Error loading dashboard metrics:", err);
      } finally {
        setLoadingMetrics(false);
        setLoadingTransactions(false);
      }
    };

    loadData();
  }, [tenantId, activeBox?.id]);

  // Compute performance metrics
  const getMetrics = () => {
    if (!activeBox) return null;
    const totalCollections = activeBox.totalCollections || 0;
    const totalSales = activeBox.totalSales || 0;
    const ratioPercent = totalSales <= 0 ? '0,00%' : ((totalCollections / totalSales) * 100).toFixed(2) + '%';

    const pending = supplementary.creditRequests.filter(r => r.status === 'pending').length;
    const rejected = supplementary.creditRequests.filter(r => r.status === 'rejected').length;
    const approved = supplementary.creditRequests.filter(r => r.status === 'approved').length;

    const payments = supplementary.collections.length;
    const nonPayments = Math.max(0, supplementary.creditRequests.length - payments);

    const openedDate = parseUnknownTimestamp(activeBox.openedAt) || new Date();

    return {
      formattedOpenTime: openedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      formattedOpenDate: openedDate.toLocaleDateString('pt-BR'),
      carteraFinal: totalCollections + totalSales,
      variationPercent: ratioPercent,
      carteraRecaudadaPercent: ratioPercent,
      totalClientCount: supplementary.creditRequests.length,
      compliancePercent: ratioPercent,
      pendingCreditRequests: pending,
      rejectedCreditRequests: rejected,
      approvedCreditRequests: approved,
      paymentsCount: payments,
      nonPaymentsCount: nonPayments,
      synchronizedCount: payments,
      efficiencyPercent: supplementary.creditRequests.length > 0
        ? ((payments / supplementary.creditRequests.length) * 100).toFixed(2) + '%'
        : '0,00%'
    };
  };

  const metrics = getMetrics();

  // Excel Export Handler
  const handleExportExcel = () => {
    if (transactions.length === 0 || !activeBox) return;

    const dataToExport = transactions.map(tx => {
      const dt = parseUnknownTimestamp(tx.createdAt);
      return {
        'Hora': dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        'Tipo Movimento': tx.type.toUpperCase(),
        'Descrição': tx.description,
        'Usuário': tx.userName,
        'Valor ($)': fmtCents(tx.amount),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracto');
    XLSX.writeFile(workbook, `Extracto_Caja_${activeBox.id.slice(0,8)}.xlsx`);
  };

  // Pagination logic
  const totalItems = transactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentTransactions = transactions.slice(startIndex, endIndex);

  if (tenantLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#6A008A] border-t-transparent rounded-full animate-spin mb-2" />
        <div className="text-[#6A008A] font-extrabold animate-pulse text-xs uppercase tracking-wider">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full space-y-4 pb-12 select-none">
      
      {/* 1. SELECTORS BAR (CN, Unit & Checkbox) */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-2.5">
        <UnitSelectors
          selectedCnId={selectedCnId}
          selectedUnitId={selectedUnitId}
          allowedUnitIds={usuarioUnidades}
          onCnChange={(id) => setGlobalCnId(id || null)}
          onUnitChange={(id) => setGlobalUnitId(id || null)}
          showVerTodas
          verTodas={verTodas}
          onVerTodasChange={setVerTodas}
        />
      </div>

      {/* 2. ACTIONS ROW (Select Box Dropdown & Tabs) */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1 max-w-md relative">
          <select
            value={selectedBoxId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedBoxId(val);
              const found = filteredBoxes.find(b => b.id === val);
              if (found) setActiveBox(found as unknown as Box);
            }}
            disabled={filteredBoxes.length === 0}
            className="w-full border border-[#6A008A] rounded-xl bg-white text-gray-700 text-sm font-bold p-2.5 outline-none focus:ring-1 focus:ring-[#6A008A] cursor-pointer appearance-none"
          >
            {filteredBoxes.length === 0 ? (
              <option value="">Nenhuma caixa ativa correspondente</option>
            ) : (
              filteredBoxes.map((b) => {
                const openedDate = parseUnknownTimestamp(b.openedAt) || new Date();
                const dateStr = openedDate.toLocaleDateString('pt-BR');

                return (
                  <option key={b.id} value={b.id}>
                    Caixa {b.id.slice(0, 8)} ({b.status === 'open' ? 'Abierta' : 'Cerrada'}) - {dateStr}
                  </option>
                );
              })
            )}
          </select>
          <div className="absolute right-3.5 top-3.5 pointer-events-none text-gray-400">
            <ChevronRight className="w-4 h-4 rotate-90" />
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs ${
              activeTab === 'resumen'
                ? 'bg-[#6A008A] text-white'
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('detalles')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs ${
              activeTab === 'detalles'
                ? 'bg-[#6A008A] text-white'
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }`}
          >
            Detalles
          </button>
        </div>
      </div>

      {boxesError && (
        <div className="p-3.5 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Erro ao carregar dados: {boxesError}</span>
        </div>
      )}

      {/* 3. MAIN DASHBOARD CONTENT AREA */}
      {loadingBoxes ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs animate-pulse h-96" />
          ))}
        </div>
      ) : !activeBox ? (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
          <Calculator className="w-12 h-12 text-gray-300 animate-bounce" />
          <h3 className="font-extrabold text-sm text-gray-700 uppercase tracking-wider">Nenhuma caixa ativa encontrada</h3>
          <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
            Selecione outros filtros acima ou abra um novo caixa para começar a registrar transações.
          </p>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          
          {/* Header of Desempeño with eye visibility control */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-gray-800 tracking-tight uppercase">
                Desempeño de trabajador
              </h2>
              <button 
                onClick={() => setShowValues(!showValues)}
                className="text-gray-400 hover:text-[#6A008A] p-1.5 transition-colors"
                title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
              >
                {showValues ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {loadingMetrics && (
              <RefreshCw className="w-4.5 h-4.5 text-[#6A008A] animate-spin" />
            )}
          </div>

          {/* TAB 1: RESUMEN (Three columns) */}
          {activeTab === 'resumen' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* PANEL 1: Caja Actual */}
              <div className="bg-gradient-to-br from-[#5B1080] to-[#7C1FA2] text-white rounded-2xl p-5 flex flex-col justify-between shadow-lg border border-[#5B1080]">
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-200">Caja Actual</span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded border border-white/10">
                      {activeBox.status === 'open' ? 'Abierta' : 'Cerrada'}
                    </span>
                  </div>

                  <div className="mt-4">
                    <span className="text-[10px] text-purple-200 font-bold uppercase tracking-widest block">BRL R$</span>
                    <h2 className="text-3xl font-black text-white tracking-tight mt-0.5">
                      {showValues ? fmtCents(activeBox.finalAmount ?? 0) : '***'}
                    </h2>
                  </div>

                  <div className="mt-3">
                    <span className="inline-block bg-white text-[#7C1FA2] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shadow-xs">
                      {transactions.length === 0 ? 'Sin movimientos' : `${transactions.length} movimientos`}
                    </span>
                  </div>

                  <div className="mt-6 space-y-2.5 text-xs">
                    {[
                      ['Caja Inicial', activeBox.initialAmount ?? 0, 'text-green-300', '+'],
                      ['Nuevas Ventas', activeBox.totalSales ?? 0, 'text-red-300', '-'],
                      ['Ventas renovadas', 0, 'text-red-300', '-'],
                      ['Total Ventas', activeBox.totalSales ?? 0, 'text-red-300', '-'],
                      ['Recaudo', activeBox.totalCollections ?? 0, 'text-green-300', '+'],
                      ['Ingresos', activeBox.totalIncomes ?? 0, 'text-green-300', '+'],
                      ['Gastos', activeBox.totalExpenses ?? 0, 'text-red-300', '-'],
                      ['Retiros y Transferencias', activeBox.totalTransfers ?? 0, 'text-white', '-'],
                    ].map(([label, val, color, sign], idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-white/10 pb-1.5 last:border-b-0">
                        <span className="text-purple-200 font-medium">{label}</span>
                        <span className={`${color} font-black font-mono`}>
                          {sign}R$ {showValues ? fmtCents(Number(val)) : '***'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/15 pt-3 mt-4 text-center">
                  <p className="text-[9px] text-purple-200 font-bold uppercase tracking-widest">
                    ControlMax Caja Activa
                  </p>
                </div>
              </div>

              {/* PANEL 2: Desempeño */}
              <div className="bg-white border-4 border-[#F59E0B] text-gray-700 rounded-2xl p-5 flex flex-col justify-between shadow-md">
                <div>
                  <div className="border-b-2 border-gray-100 pb-2 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#EA580C]">Desempeño</span>
                    <span className="bg-[#F59E0B] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                      Metas
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2 text-xs">
                    <div className="font-black text-[#EA580C] text-[10px] uppercase tracking-wider mt-1 mb-1 border-b border-gray-50 pb-0.5">
                      Cartera
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-bold">Final</span>
                      <span className="text-green-600 font-black font-mono text-sm">
                        R$ {showValues ? fmtCents(metrics?.carteraFinal ?? 0) : '***'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-bold">Variación</span>
                      <span className="text-green-600 font-black font-mono">
                        {metrics?.variationPercent || '+ 0,00%'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-bold">Inicial</span>
                      <span className="text-gray-700 font-extrabold font-mono">
                        R$ {showValues ? fmtCents(activeBox.totalSales ?? 0) : '***'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-bold">Cartera Recaudada</span>
                      <span className="text-gray-700 font-black font-mono">
                        {metrics?.carteraRecaudadaPercent || 'N/A'}
                      </span>
                    </div>

                    <div className="font-black text-[#EA580C] text-[10px] uppercase tracking-wider mt-4 mb-1 border-b border-gray-50 pb-0.5">
                      Recaudo
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-bold">Pretendido</span>
                      <span className="text-yellow-600 font-black font-mono">
                        R$ {showValues ? fmtCents(metrics?.carteraFinal ?? 0) : '***'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-bold">Clientes a recaudar</span>
                      <span className="text-gray-700 font-extrabold font-mono">
                        {metrics?.totalClientCount ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-bold">Recaudo</span>
                      <span className="text-green-600 font-black font-mono">
                        R$ {showValues ? fmtCents(activeBox.totalCollections ?? 0) : '***'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-bold">Recaudo Adicional</span>
                      <span className="text-green-600 font-black font-mono">
                        R$ {showValues ? fmtCents(activeBox.totalIncomes ?? 0) : '***'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-bold">Cumplimiento</span>
                      <span className="text-green-600 font-black font-mono">
                        {metrics?.compliancePercent || '0,00%'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-bold">% Recaudo de Unidad</span>
                      <span className="text-green-600 font-black font-mono">
                        0% R$ {showValues ? fmtCents(0) : '***'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-bold">Recaudo Extra</span>
                      <span className="text-gray-700 font-extrabold font-mono">
                        R$ {showValues ? fmtCents(0) : '***'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-bold">Clientes No Programados</span>
                      <span className="text-gray-700 font-black font-mono">
                        0
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 mt-4 text-center">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                    Control de Caja y Cartera
                  </p>
                </div>
              </div>

              {/* PANEL 3: Información */}
              <div className="bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white rounded-2xl p-5 flex flex-col justify-between shadow-lg border border-[#2563EB]">
                <div>
                  {/* Action Buttons Row */}
                  <div className="grid grid-cols-4 gap-1.5 mb-4">
                    <button className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/10 border border-white/20 text-[10px] font-bold hover:bg-white/20 transition-all cursor-pointer">
                      <MapPin className="w-5 h-5 mb-1 text-amber-300" />
                      Unidade
                    </button>
                    <button className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/10 border border-white/20 text-[10px] font-bold hover:bg-white/20 transition-all cursor-pointer">
                      <Smartphone className="w-5 h-5 mb-1 text-green-300" />
                      Dispositivo
                    </button>
                    <button className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/10 border border-white/20 text-[10px] font-bold hover:bg-white/20 transition-all cursor-pointer">
                      <Users className="w-5 h-5 mb-1 text-cyan-200" />
                      Usuarios
                    </button>
                    <button className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/10 border border-white/20 text-[10px] font-bold hover:bg-white/20 transition-all cursor-pointer">
                      <FileText className="w-5 h-5 mb-1 text-yellow-300" />
                      Facturar
                    </button>
                  </div>

                  {/* Box Information Details */}
                  <div className="space-y-1.5 text-xs bg-black/10 border border-white/10 p-3.5 rounded-xl">
                    <p className="font-black border-b border-white/15 pb-1 uppercase text-[10px] tracking-wider text-blue-200">
                      Informações da Caixa
                    </p>
                    <div className="flex justify-between pt-1">
                      <span className="text-blue-100 font-medium">Caja de CN:</span>
                      <span className="font-extrabold text-white">{activeBox.cnName || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-100 font-medium">Caja UGI:</span>
                      <span className="font-extrabold text-white">{activeBox.unitName || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-100 font-medium">Trabajador:</span>
                      <span className="font-extrabold text-white">{activeBox.userName || '---'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-100 font-medium">Fecha Apertura:</span>
                      <span className="font-mono text-[10px] text-white">
                        {metrics?.formattedOpenDate} {metrics?.formattedOpenTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-100 font-medium">Inicio Móvil:</span>
                      <span className="font-mono text-[10px] text-white">
                        {metrics?.formattedOpenDate} {metrics?.formattedOpenTime}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-0.5">
                      <span className="text-blue-100 font-medium">Fecha Cierre:</span>
                      {activeBox.closedAt ? (
                        <span className="bg-red-500/30 text-red-200 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase font-mono">
                          {parseUnknownTimestamp(activeBox.closedAt)?.toLocaleString('pt-BR') || '---'}
                        </span>
                      ) : (
                        <span className="bg-green-500/30 text-green-200 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase">
                          Em Aberto
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Credits section */}
                  <div className="mt-4 space-y-1.5 text-xs bg-black/10 border border-white/10 p-3.5 rounded-xl">
                    <p className="font-black border-b border-white/15 pb-1 uppercase text-[10px] tracking-wider text-blue-200">
                      Créditos
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
                      <div className="flex justify-between"><span className="text-blue-100">A Recaudar:</span><span className="font-bold font-mono">{metrics?.pendingCreditRequests ?? 0}</span></div>
                      <div className="flex justify-between"><span className="text-blue-100">No Prog:</span><span className="font-bold font-mono">0</span></div>
                      <div className="flex justify-between"><span className="text-blue-100">Nuevos:</span><span className="font-bold font-mono">{metrics?.pendingCreditRequests ?? 0}</span></div>
                      <div className="flex justify-between"><span className="text-blue-100">Cancelados:</span><span className="font-bold font-mono">{metrics?.rejectedCreditRequests ?? 0}</span></div>
                      <div className="flex justify-between col-span-2 border-t border-white/5 pt-1.5">
                        <span className="text-blue-100">Activos:</span>
                        <span className="font-bold font-mono text-white">{metrics?.approvedCreditRequests ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Movimiento de Créditos section */}
                  <div className="mt-4 space-y-1.5 text-xs bg-black/10 border border-white/10 p-3.5 rounded-xl">
                    <p className="font-black border-b border-white/15 pb-1 uppercase text-[10px] tracking-wider text-blue-200">
                      Movimiento de Créditos
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
                      <div className="flex justify-between"><span className="text-blue-100">Pagos:</span><span className="font-bold font-mono">{metrics?.paymentsCount ?? 0}</span></div>
                      <div className="flex justify-between"><span className="text-blue-100">No Pago:</span><span className="font-bold font-mono">{metrics?.nonPaymentsCount ?? 0}</span></div>
                      <div className="flex justify-between"><span className="text-blue-100">Sincronizados:</span><span className="font-bold font-mono">{metrics?.synchronizedCount ?? 0}</span></div>
                      <div className="flex justify-between"><span className="text-blue-100">Eficiencia:</span><span className="font-black font-mono text-yellow-300">{metrics?.efficiencyPercent || '0,00%'}</span></div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-2.5 mt-4 text-center">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-blue-200">
                    ControlMax Desempeño y Sincronização
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DETALLES (Transactions extract table) */}
          {activeTab === 'detalles' && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden flex flex-col">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                <h3 className="font-black text-gray-700 text-xs uppercase tracking-wider">Extracto de Movimientos</h3>
                <button 
                  onClick={handleExportExcel}
                  disabled={transactions.length === 0}
                  className="bg-[#6A008A] hover:bg-[#52006A] text-white px-3.5 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Excel
                </button>
              </div>

              {loadingTransactions ? (
                <div className="p-12 text-center text-gray-400">
                  <div className="w-8 h-8 border-3 border-[#6A008A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">Cargando transacciones...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-black border-b border-gray-200">
                        <th className="p-3 whitespace-nowrap">Hora</th>
                        <th className="p-3 whitespace-nowrap">Tipo Movimiento</th>
                        <th className="p-3 whitespace-nowrap min-w-[200px]">Descripción</th>
                        <th className="p-3 whitespace-nowrap">Usuario</th>
                        <th className="p-3 whitespace-nowrap text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-gray-700">
                      {currentTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400 italic font-semibold">
                            No hay movimientos registrados para esta caja.
                          </td>
                        </tr>
                      ) : (
                        currentTransactions.map(tx => {
                          const dt = parseUnknownTimestamp(tx.createdAt);
                          const timeStr = dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'N/A';

                          
                          // Style resolver
                          let colorClass = 'text-gray-700';
                          let sign = '';
                          if (['income', 'collection', 'sale'].includes(tx.type)) {
                            colorClass = 'text-green-600';
                            sign = '+';
                          } else if (['expense', 'transfer'].includes(tx.type)) {
                            colorClass = 'text-red-600';
                            sign = '-';
                          }

                          return (
                            <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50/40">
                              <td className="p-3 whitespace-nowrap text-gray-500 font-mono">{timeStr}</td>
                              <td className="p-3 whitespace-nowrap uppercase text-[10px] font-black tracking-wide text-gray-500">
                                {tx.type}
                              </td>
                              <td className="p-3 text-gray-600 font-medium italic">{tx.description || '-'}</td>
                              <td className="p-3 whitespace-nowrap text-gray-500 font-bold">{tx.userName}</td>
                              <td className={`p-3 font-black font-mono text-right ${colorClass}`}>
                                {sign}$ {showValues ? fmtCents(tx.amount) : '***'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination controls */}
              {totalItems > 0 && !loadingTransactions && (
                <div className="flex justify-between items-center text-gray-400 text-xs p-3 border-t border-gray-100 bg-gray-50/30">
                  <span className="font-medium">Mostrando {startIndex + 1} a {endIndex} de {totalItems} registros</span>
                  <div className="flex space-x-1.5">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-xl shadow-xs hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-xl shadow-xs hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
