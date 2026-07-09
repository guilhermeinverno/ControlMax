import { useState, useEffect } from 'react';
import { UnitSelectors } from './components/UnitSelectors';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { loadingErrorEmptyContent } from '../utils/listViewBody';
import { AlertCircle, HelpCircle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

const fmt = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function Summary() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{
    totalCajaInicial: number;
    totalIngresos: number;
    totalGastos: number;
    totalVentas: number;
    totalRecaudo: number;
    totalTransferencias: number;
    cajaFinalTotal: number;
    count: number;
  } | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, 'boxes'),
      where('tenantId', '==', tenantId),
      where('openedAt', '>=', Timestamp.fromDate(startOfToday)),
      orderBy('openedAt', 'desc')
    );

    const handleSnapshot = (snapshot: import("firebase/firestore").QuerySnapshot<import("firebase/firestore").DocumentData>) => {
      let totalCajaInicial = 0;
      let totalIngresos = 0;
      let totalGastos = 0;
      let totalVentas = 0;
      let totalRecaudo = 0;
      let totalTransferencias = 0;
      let cajaFinalTotal = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        totalCajaInicial += data.initialAmount || 0;
        totalIngresos += data.totalIncomes || 0;
        totalGastos += data.totalExpenses || 0;
        totalVentas += data.totalSales || 0;
        totalRecaudo += data.totalCollections || 0;
        totalTransferencias += data.totalTransfers || 0;
        cajaFinalTotal += data.finalAmount || 0;
      });

      setSummaryData({
        totalCajaInicial,
        totalIngresos,
        totalGastos,
        totalVentas,
        totalRecaudo,
        totalTransferencias,
        cajaFinalTotal,
        count: snapshot.size
      });
      setLoading(false);
    };

    const unsubscribe = onSnapshot(q, handleSnapshot, (err) => {
      console.error("Error loading Summary boxes query with orderBy, trying fallback...", err);
      // Fallback query without orderBy to avoid requiring manual index creation in dev/preview environments
      const fallbackQuery = query(
        collection(db, 'boxes'),
        where('tenantId', '==', tenantId),
        where('openedAt', '>=', Timestamp.fromDate(startOfToday))
      );

      const unsubFallback = onSnapshot(fallbackQuery, handleSnapshot, (fallbackErr) => {
        console.error("Fallback query in Summary also failed:", fallbackErr);
        setError("Não foi possível carregar os dados de resumo do dia.");
        setLoading(false);
      });

      return () => unsubFallback();
    });

    return () => unsubscribe();
  }, [tenantId]);

  if (tenantLoading) {
    return (
      <div className="flex flex-col bg-[#F3F4F6] min-h-screen">
        <UnitSelectors />
        <div className="p-4 flex items-center justify-center">
          <div className="text-[#6B21A8] font-bold animate-pulse text-xs">Carregando dados corporativos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen pb-8">
      <UnitSelectors />

      <div className="px-3 py-2 space-y-4 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-[#6B21A8]" />
            Consolidado do Dia
          </h1>
          <span className="text-[10px] font-bold text-gray-400 font-mono">
            Hoje: {new Date().toLocaleDateString('pt-BR')}
          </span>
        </div>

        {loadingErrorEmptyContent(
          loading,
          error,
          summaryData?.count ?? 0,
          (
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-4 space-y-3">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ),
          (
          <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-sm text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Erro ao carregar dados</span>
              <span>{error}</span>
            </div>
          </div>
        ),
          (
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-8 flex flex-col items-center text-center space-y-2">
            <HelpCircle className="w-10 h-10 text-gray-300 animate-bounce" />
            <span className="font-bold text-gray-700 text-xs uppercase tracking-wider">Nenhuma caixa registrada hoje</span>
            <p className="text-[10.5px] text-gray-400 max-w-[240px]">
              Os dados consolidados de desempenho financeiro aparecerão assim que a primeira caixa for aberta hoje.
            </p>
          </div>
        ),
          (
          <div className="space-y-4">
            
            {/* Purple Card - Caja Final */}
            <div className="bg-[#FAF5FF] border border-[#D8B4FE] shadow-sm rounded-sm p-4 text-center">
              <div className="text-[11px] font-bold text-[#7B1FA2] uppercase tracking-widest mb-1">
                Caja Final Total
              </div>
              <div className="text-[#7B1FA2] text-xl font-extrabold mb-3">
                $ {fmt(summaryData.cajaFinalTotal)}
              </div>
              <div className="flex justify-center">
                <div className="bg-[#E9D5FF] text-[#6B21A8] px-3.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase shadow-sm inline-block">
                  {summaryData.count} {summaryData.count === 1 ? 'Caixa Ativa' : 'Caixas Ativas'} Hoje
                </div>
              </div>
            </div>

            {/* Performance Breakdowns */}
            <div className="bg-white rounded-sm border border-gray-300 shadow-sm p-3.5 space-y-3">
              <h2 className="text-[11px] font-black text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#16A34A]" />
                Fluxos e Recebimentos
              </h2>
              
              <div className="flex flex-col space-y-2.5 text-xs">
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="text-[11px] font-bold text-[#555555] uppercase">Total Caja Inicial</span>
                  <span className="font-bold text-gray-800">$ {fmt(summaryData.totalCajaInicial)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="text-[11px] font-bold text-[#555555] uppercase">Ventas / Vendas</span>
                  <span className="font-extrabold text-[#16A34A]">+ $ {fmt(summaryData.totalVentas)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="text-[11px] font-bold text-[#555555] uppercase">Recaudo / Cobranças</span>
                  <span className="font-extrabold text-[#16A34A]">+ $ {fmt(summaryData.totalRecaudo)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-[#555555] uppercase">Ingresos / Entradas</span>
                  <span className="font-extrabold text-[#16A34A]">+ $ {fmt(summaryData.totalIngresos)}</span>
                </div>
              </div>
            </div>

            {/* Expenses and Outflows */}
            <div className="bg-white rounded-sm border border-gray-300 shadow-sm p-3.5 space-y-3">
              <h2 className="text-[11px] font-black text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-[#DC2626]" />
                Gastos e Saídas
              </h2>
              
              <div className="flex flex-col space-y-2.5 text-xs">
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="text-[11px] font-bold text-[#555555] uppercase">Gastos / Despesas</span>
                  <span className="font-extrabold text-[#DC2626]">- $ {fmt(summaryData.totalGastos)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-[#555555] uppercase">Transferências / Retiradas</span>
                  <span className="font-extrabold text-[#DC2626]">- $ {fmt(summaryData.totalTransferencias)}</span>
                </div>
              </div>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}
