import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
  getDocs,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { Screen, Box } from '../types';
import {
  MapPin,
  Smartphone,
  Users,
  FileText,
  TrendingUp,
  Percent,
  Calendar,
  DollarSign,
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface PerformanceProps {
  onNavigate?: (screen: Screen) => void;
}

interface CollectionRecord {
  id: string;
  amount: number;
  status: string;
  tenantId: string;
  userId: string;
  createdAt: Timestamp;
}

interface CreditRequestRecord {
  id: string;
  status: 'pending' | 'rejected' | 'approved' | string;
  tenantId: string;
  requestedById: string;
  createdAt: Timestamp;
}

export function Performance({ onNavigate }: PerformanceProps) {
  const { tenantId, loading: tenantLoading, userName } = useTenant();

  // Selected date is today
  const [todayDate] = useState(() => {
    const d = new Date();
    return d.toLocaleDateString('pt-BR');
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for fetched data
  const [box, setBox] = useState<Box | null>(null);
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [creditRequests, setCreditRequests] = useState<CreditRequestRecord[]>([]);

  // Format currency helper (cents to BRL string)
  const fmt = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Get current authenticated user ID safely
    const uid = auth.currentUser?.uid || 'test-user-id';

    // 1. Box Sync (Real-time stream)
    let unsubscribeBox: (() => void) | null = null;

    const setupBoxSync = (useFallback: boolean) => {
      let q;
      if (!useFallback) {
        q = query(
          collection(db, 'boxes'),
          where('tenantId', '==', tenantId),
          where('userId', '==', uid),
          where('openedAt', '>=', Timestamp.fromDate(startOfToday)),
          limit(1)
        );
      } else {
        // Fallback: Query by tenantId and filter client-side to prevent missing index errors
        q = query(
          collection(db, 'boxes'),
          where('tenantId', '==', tenantId)
        );
      }

      return onSnapshot(
        q,
        (snapshot) => {
          let foundBox: Box | null = null;
          if (useFallback) {
            const boxesList: Box[] = [];
            snapshot.forEach((docSnap) => {
              boxesList.push({ id: docSnap.id, ...docSnap.data() } as Box);
            });

            // Client-side filter: match userId and openedAt >= startOfToday
            const filtered = boxesList.filter((b) => {
              const isUser = b.userId === uid;
              const isToday = b.openedAt && b.openedAt.toDate() >= startOfToday;
              return isUser && isToday;
            });

            // Take the latest open box
            if (filtered.length > 0) {
              // Sort desc by openedAt
              filtered.sort((a, b) => b.openedAt.toMillis() - a.openedAt.toMillis());
              foundBox = filtered[0];
            }
          } else {
            if (!snapshot.empty) {
              foundBox = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Box;
            }
          }

          setBox(foundBox);
          setError(null);
        },
        (err) => {
          console.error("Box query failed:", err);
          if (!useFallback) {
            console.log("Retrying box query with fallback...");
            if (unsubscribeBox) unsubscribeBox();
            unsubscribeBox = setupBoxSync(true);
          } else {
            setError("Erro ao carregar dados do caixa diário.");
          }
        }
      );
    };

    unsubscribeBox = setupBoxSync(false);

    // 2. Collections and Credit Requests Fetching
    const fetchData = async () => {
      try {
        // Fetch Collections
        let collectionsList: CollectionRecord[] = [];
        try {
          const colQuery = query(
            collection(db, 'collections'),
            where('tenantId', '==', tenantId),
            where('userId', '==', uid),
            where('createdAt', '>=', Timestamp.fromDate(startOfToday))
          );
          const colSnap = await getDocs(colQuery);
          colSnap.forEach((docSnap) => {
            collectionsList.push({ id: docSnap.id, ...docSnap.data() } as CollectionRecord);
          });
        } catch (colErr) {
          console.warn("Primary collections query failed, trying index-free fallback...", colErr);
          // Fallback: fetch by tenantId and filter client-side
          const colQueryFallback = query(
            collection(db, 'collections'),
            where('tenantId', '==', tenantId)
          );
          const colSnapFallback = await getDocs(colQueryFallback);
          colSnapFallback.forEach((docSnap) => {
            const data = docSnap.data() as CollectionRecord;
            if (data.userId === uid && data.createdAt && data.createdAt.toDate() >= startOfToday) {
              collectionsList.push({ id: docSnap.id, ...data });
            }
          });
        }
        setCollections(collectionsList);

        // Fetch Credit Requests
        let creditReqsList: CreditRequestRecord[] = [];
        try {
          const reqQuery = query(
            collection(db, 'credit_requests'),
            where('tenantId', '==', tenantId),
            where('requestedById', '==', uid),
            where('createdAt', '>=', Timestamp.fromDate(startOfToday))
          );
          const reqSnap = await getDocs(reqQuery);
          reqSnap.forEach((docSnap) => {
            creditReqsList.push({ id: docSnap.id, ...docSnap.data() } as CreditRequestRecord);
          });
        } catch (reqErr) {
          console.warn("Primary credit requests query failed, trying index-free fallback...", reqErr);
          // Fallback: fetch by tenantId and filter client-side
          const reqQueryFallback = query(
            collection(db, 'credit_requests'),
            where('tenantId', '==', tenantId)
          );
          const reqSnapFallback = await getDocs(reqQueryFallback);
          reqSnapFallback.forEach((docSnap) => {
            const data = docSnap.data() as CreditRequestRecord;
            if (
              data.requestedById === uid &&
              data.createdAt &&
              data.createdAt.toDate() >= startOfToday
            ) {
              creditReqsList.push({ id: docSnap.id, ...data });
            }
          });
        }
        setCreditRequests(creditReqsList);

      } catch (err) {
        console.error("General error fetching supplementary performance data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (unsubscribeBox) unsubscribeBox();
    };
  }, [tenantId]);

  // Loading state
  if (loading || tenantLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#F3F4F6]">
        <div className="border-2 border-[#6B21A8] border-t-transparent rounded-full w-8 h-8 animate-spin" />
        <p className="text-xs text-[#555555] font-bold uppercase mt-3 tracking-wider">Cargando Desempeño...</p>
      </div>
    );
  }

  // No active or open/closed box found today
  if (!box) {
    return (
      <div className="flex flex-col items-center justify-center p-6 min-h-[400px] bg-[#F3F4F6]">
        <div className="bg-purple-100 border border-purple-200 rounded-sm p-6 max-w-md w-full text-center shadow-sm space-y-4">
          <div className="mx-auto w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-[#6B21A8]" />
          </div>
          <h2 className="text-base font-black text-purple-900 uppercase tracking-wide">
            Nenhuma caixa registrada hoje
          </h2>
          <p className="text-xs text-purple-700 leading-relaxed">
            Você não possui uma caixa de trabalho aberta ou registrada para o dia de hoje. Abra um novo caixa para começar a registrar transações e acompanhar o desempenho.
          </p>
          <button
            id="btn-open-box-performance"
            onClick={() => onNavigate && onNavigate('open-box')}
            className="w-full bg-[#6B21A8] hover:bg-purple-800 text-white font-bold py-2.5 px-4 rounded text-xs uppercase shadow transition-all tracking-wider"
          >
            Abrir Caixa
          </button>
        </div>
      </div>
    );
  }

  // Formatting dates
  const formattedOpenTime = box.openedAt
    ? box.openedAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '---';

  const formattedOpenDate = box.openedAt
    ? box.openedAt.toDate().toLocaleDateString('pt-BR')
    : '---';

  // Card 2 calculations
  const totalCollections = box.totalCollections || 0;
  const totalSales = box.totalSales || 0;
  const totalIncomes = box.totalIncomes || 0;

  // Cartera calculations
  const carteraFinal = totalCollections + totalSales;
  const variationPercent = totalSales > 0
    ? ((totalCollections / totalSales) * 100).toFixed(2) + '%'
    : '0,00%';
  const carteraRecaudadaPercent = totalSales > 0
    ? ((totalCollections / totalSales) * 100).toFixed(2) + '%'
    : '0,00%';

  // Recaudo calculations
  const totalClientCount = creditRequests.length;
  const compliancePercent = totalSales > 0
    ? ((totalCollections / totalSales) * 100).toFixed(2) + '%'
    : '0,00%';

  // Card 3 calculations
  const pendingCreditRequests = creditRequests.filter((r) => r.status === 'pending').length;
  const rejectedCreditRequests = creditRequests.filter((r) => r.status === 'rejected').length;
  const approvedCreditRequests = creditRequests.filter((r) => r.status === 'approved').length;

  const paymentsCount = collections.length;
  const nonPaymentsCount = Math.max(0, creditRequests.length - collections.length);
  const synchronizedCount = collections.length;
  const efficiencyPercent = creditRequests.length > 0
    ? ((collections.length / creditRequests.length) * 100).toFixed(2) + '%'
    : '0,00%';

  return (
    <div className="bg-[#F3F4F6] min-h-screen text-[#333333] flex flex-col">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-gray-300 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#6B21A8] flex items-center gap-2 uppercase tracking-tight">
            <TrendingUp className="w-5 h-5 text-[#EA580C]" />
            Desempeño Diario
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Vista global de caja, cumplimiento de cartera y actividades correspondientes a hoy.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            id="btn-perf-dashboard"
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-[#333333] font-bold px-4 py-1.5 rounded text-xs transition-colors shadow-sm"
          >
            Volver al Inicio
          </button>
        </div>
      </div>

      {/* CORE 3-CARD BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 flex-1">
        
        {/* CARD 1 — ROXO bg-[#6B21A8] texto branco */}
        <div className="bg-[#6B21A8] text-white rounded-sm p-4 flex flex-col justify-between shadow-sm border border-[#581c87] min-h-[480px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-purple-200 tracking-widest">
                Desempeño de Trabajador
              </span>
              <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10 uppercase">
                {box.status === 'open' ? 'Abierta' : 'Cerrada'}
              </span>
            </div>
            
            <div className="mt-3">
              <span className="text-xs text-purple-200 uppercase font-medium">Caja Final</span>
              <h2 className="text-3xl font-black text-white leading-tight">
                $ {fmt(box.finalAmount ?? 0)}
              </h2>
            </div>

            <div className="mt-2.5">
              <span className="inline-block bg-white text-[#6B21A8] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase shadow-sm">
                Apertura: {formattedOpenDate} às {formattedOpenTime}
              </span>
            </div>

            {/* Structured rows of Box details */}
            <div className="mt-6 space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-purple-500/20 pb-1.5">
                <span className="text-purple-200 font-medium">Caja Inicial</span>
                <span className="text-[#86efac] font-black font-mono">
                  +$ {fmt(box.initialAmount ?? 0)}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-purple-500/20 pb-1.5">
                <span className="text-purple-200 font-medium">Nuevas Ventas</span>
                <span className="text-[#fca5a5] font-black font-mono">
                  -$ {fmt(box.totalSales ?? 0)}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-purple-500/20 pb-1.5">
                <span className="text-purple-200 font-medium">Ventas Renovadas</span>
                <span className="text-[#fca5a5] font-black font-mono">
                  -$ 0,00
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-purple-500/20 pb-1.5">
                <span className="text-purple-200 font-medium">Total Ventas</span>
                <span className="text-[#fca5a5] font-black font-mono">
                  -$ {fmt(box.totalSales ?? 0)}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-purple-500/20 pb-1.5">
                <span className="text-purple-200 font-medium">Recaudo</span>
                <span className="text-[#86efac] font-black font-mono">
                  +$ {fmt(box.totalCollections ?? 0)}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-purple-500/20 pb-1.5">
                <span className="text-purple-200 font-medium">Ingresos</span>
                <span className="text-[#86efac] font-black font-mono">
                  +$ {fmt(box.totalIncomes ?? 0)}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-purple-500/20 pb-1.5">
                <span className="text-purple-200 font-medium">Gastos</span>
                <span className="text-[#fca5a5] font-black font-mono">
                  -$ {fmt(box.totalExpenses ?? 0)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-1">
                <span className="text-purple-200 font-medium">Retiros y Transf.</span>
                <span className="text-white font-black font-mono">
                  -$ {fmt(box.totalTransfers ?? 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-purple-500/30 pt-3 mt-4 text-center">
            <p className="text-[10px] text-purple-200 font-bold uppercase tracking-wider">
              Unidade: {box.unitName || '---'} | CN: {box.cnName || '---'}
            </p>
          </div>
        </div>

        {/* CARD 2 — AMARELO bg-white border-2 border-[#EA580C] */}
        <div className="bg-white border-2 border-[#EA580C] text-[#333333] rounded-sm shadow-sm flex flex-col justify-between overflow-hidden min-h-[480px]">
          <div className="flex-1">
            
            {/* Seção Cartera */}
            <div className="bg-[#F3F4F6] px-3.5 py-2 border-b border-gray-300 flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#EA580C]" />
                Cartera
              </span>
              <span className="bg-[#EA580C] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                Metas
              </span>
            </div>
            
            <div className="p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                <span className="text-gray-500 font-medium">Final</span>
                <span className="text-[#16A34A] font-extrabold font-mono text-sm">
                  $ {fmt(carteraFinal)}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                <span className="text-gray-500 font-medium">Variación</span>
                <span className="text-[#16A34A] font-extrabold font-mono">
                  {variationPercent}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                <span className="text-gray-500 font-medium">Inicial</span>
                <span className="text-gray-600 font-bold font-mono">
                  $ {fmt(box.totalSales ?? 0)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Cartera Recaudada</span>
                <span className="text-gray-700 font-black font-mono">
                  {carteraRecaudadaPercent}
                </span>
              </div>
            </div>

            {/* Seção Recaudo */}
            <div className="bg-[#F3F4F6] px-3.5 py-2 border-b border-t border-gray-300 flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-[#EA580C]" />
                Recaudo
              </span>
            </div>

            <div className="p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                <span className="text-gray-500 font-medium">Pretendido</span>
                <span className="text-gray-700 font-bold font-mono">
                  $ {fmt(box.totalSales ?? 0)}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                <span className="text-gray-500 font-medium">Clientes a recaudar</span>
                <span className="text-gray-700 font-extrabold font-mono">
                  {totalClientCount}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                <span className="text-gray-500 font-medium">Recaudo</span>
                <span className="text-[#16A34A] font-extrabold font-mono">
                  $ {fmt(box.totalCollections ?? 0)}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                <span className="text-gray-500 font-medium">Recaudo Adicional</span>
                <span className="text-[#16A34A] font-extrabold font-mono">
                  $ {fmt(box.totalIncomes ?? 0)}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                <span className="text-gray-500 font-medium">Cumplimiento</span>
                <span className="text-[#16A34A] font-extrabold font-mono">
                  {compliancePercent}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                <span className="text-gray-500 font-medium">% Recaudo de Unidad</span>
                <span className="text-[#16A34A] font-extrabold font-mono">
                  {compliancePercent}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                <span className="text-gray-500 font-medium">Recaudo Extra</span>
                <span className="text-gray-600 font-mono">
                  $ 0,00
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Clientes No Programados</span>
                <span className="text-gray-600 font-bold font-mono">
                  0
                </span>
              </div>
            </div>

          </div>

          <div className="bg-[#EA580C] text-white p-2.5 text-center text-[10px] font-black uppercase tracking-wider">
            Control de Caja y Cartera
          </div>
        </div>

        {/* CARD 3 — AZUL bg-[#2563EB] texto branco */}
        <div className="bg-[#2563EB] text-white rounded-sm p-4 flex flex-col justify-between shadow-sm border border-[#1d4ed8] min-h-[480px]">
          <div>
            {/* Grid 2x2 of action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-perf-unidade"
                onClick={() => onNavigate && onNavigate('route-list')}
                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded p-2 text-center font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all uppercase"
              >
                <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                Unidad
              </button>

              <button
                id="btn-perf-dispositivo"
                onClick={() => onNavigate && onNavigate('device-list')}
                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded p-2 text-center font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all uppercase"
              >
                <Smartphone className="w-3.5 h-3.5 shrink-0 text-green-300" />
                Dispositivo
              </button>

              <button
                id="btn-perf-usuarios"
                onClick={() => onNavigate && onNavigate('user-list')}
                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded p-2 text-center font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all uppercase"
              >
                <Users className="w-3.5 h-3.5 shrink-0 text-cyan-200" />
                Usuarios
              </button>

              <button
                id="btn-perf-resumen"
                onClick={() => onNavigate && onNavigate('box-summary')}
                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded p-2 text-center font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all uppercase"
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-yellow-300" />
                Resumen
              </button>
            </div>

            {/* Info de la caja */}
            <div className="mt-5 space-y-1.5 text-xs bg-black/10 border border-white/10 p-3 rounded-sm">
              <p className="font-bold border-b border-white/15 pb-1 uppercase text-[10px] tracking-wider text-blue-200">
                Informações da Caixa
              </p>
              <div className="flex justify-between pt-1">
                <span className="text-blue-100 font-medium">Caja de CN:</span>
                <span className="font-bold text-white">{box.cnName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100 font-medium">Caja UGI:</span>
                <span className="font-bold text-white">{box.unitName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100 font-medium">Trabajador:</span>
                <span className="font-bold text-white">{box.userName || userName || '---'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100 font-medium">Fecha Apertura:</span>
                <span className="font-mono text-[11px] text-white">
                  {box.openedAt ? box.openedAt.toDate().toLocaleString('pt-BR') : '---'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100 font-medium">Inicio Móvil:</span>
                <span className="font-mono text-[11px] text-white">
                  {box.openedAt ? box.openedAt.toDate().toLocaleString('pt-BR') : '---'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-blue-100 font-medium">Fecha Cierre:</span>
                {box.closedAt ? (
                  <span className="bg-red-500/30 text-red-200 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase font-mono">
                    {box.closedAt.toDate().toLocaleString('pt-BR')}
                  </span>
                ) : (
                  <span className="bg-green-500/30 text-green-200 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase">
                    Em Aberto
                  </span>
                )}
              </div>
            </div>

            {/* Seção Créditos */}
            <div className="mt-4 space-y-1.5 text-xs">
              <p className="font-bold border-b border-white/10 pb-1 uppercase text-[10px] tracking-wider text-blue-200">
                Créditos
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex justify-between">
                  <span className="text-blue-100">A Recaudar:</span>
                  <span className="font-bold font-mono">{pendingCreditRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">No Prog:</span>
                  <span className="font-bold font-mono">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">Nuevos:</span>
                  <span className="font-bold font-mono">{pendingCreditRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">Cancelados:</span>
                  <span className="font-bold font-mono">{rejectedCreditRequests}</span>
                </div>
                <div className="flex justify-between col-span-2 border-t border-white/5 pt-1.5">
                  <span className="text-blue-100">Activos:</span>
                  <span className="font-bold font-mono text-white">{approvedCreditRequests}</span>
                </div>
              </div>
            </div>

            {/* Seção Movimiento de Créditos */}
            <div className="mt-4 space-y-1.5 text-xs">
              <p className="font-bold border-b border-white/10 pb-1 uppercase text-[10px] tracking-wider text-blue-200">
                Movimiento de Créditos
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex justify-between">
                  <span className="text-blue-100">Pagos:</span>
                  <span className="font-bold font-mono">{paymentsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">No Pago:</span>
                  <span className="font-bold font-mono">{nonPaymentsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">Sincronizados:</span>
                  <span className="font-bold font-mono">{synchronizedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">Eficiencia:</span>
                  <span className="font-black font-mono text-yellow-300">{efficiencyPercent}</span>
                </div>
              </div>
            </div>

          </div>

          <div className="border-t border-white/10 pt-2.5 mt-4 text-center">
            <span className="text-[9px] uppercase font-bold tracking-widest text-blue-200">
              ControlMax — Desempeño y Sincronización
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
