import { useState, useEffect } from 'react';
import { Screen } from '../types';
import { db, auth } from '../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { reportPeriodBody } from '../utils/listViewBody';
import { toJsDate } from '../utils/firestoreTimestamp';
import * as XLSX from 'xlsx';
import {
  Calendar,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Percent,
  Search,
  Loader2,
  AlertCircle,
  Award,
  DollarSign,
  X,
  FileSpreadsheet,
  Layers
} from 'lucide-react';

interface PeriodSummaryProps {
  onNavigate?: (screen: Screen) => void;
  params?: Record<string, unknown>;
}

interface Box {
  id: string;
  tenantId: string;
  openedAt: Timestamp;
  closedAt?: Timestamp;
  status: 'open' | 'closed' | 'confirmed';
  initialAmount: number;
  totalIncomes: number;
  totalExpenses: number;
  totalSales: number;
  totalCollections: number;
  totalTransfers: number;
  finalAmount: number;
  userId: string;
  userName: string;
}

interface CollectionItem {
  id: string;
  tenantId: string;
  amount: number;
  userId: string;
  createdAt: Timestamp;
}

interface ExpenseItem {
  id: string;
  tenantId: string;
  amount: number;
  userId: string;
  createdAt: Timestamp;
}

const fmt = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function PeriodSummary({ onNavigate }: PeriodSummaryProps) {
  const { tenantId, role, userName, loading: tenantLoading } = useTenant();

  const isCollector = role === 'collector';
  const isAdmin = role === 'admin';
  const isSupervisor = role === 'supervisor';
  const showPerformance = isAdmin || isSupervisor;

  // Defaults: 1st of current month and today
  const getFirstOfCurrentMonth = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  };

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDateStr, setStartDateStr] = useState(getFirstOfCurrentMonth());
  const [endDateStr, setEndDateStr] = useState(getTodayString());

  // Report States
  // Relatório usa agregados das caixas; consultas separadas de collections/expenses removidas.
  const [boxes, setBoxes] = useState<Box[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Fetch report data
  const generateReport = async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);

    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);

    try {
      const boxesCol = collection(db, 'boxes');

      const qBoxes = query(
        boxesCol,
        where('tenantId', '==', tenantId),
        where('openedAt', '>=', startTimestamp),
        where('openedAt', '<=', endTimestamp)
      );

      let boxesSnap;

      try {
        boxesSnap = await getDocs(qBoxes);
      } catch (errSnap) {
        console.warn("Primary query with filters failed (index might be missing). Using fallback tenant-wide queries:", errSnap);

        const qBoxesFallback = query(boxesCol, where('tenantId', '==', tenantId));
        boxesSnap = await getDocs(qBoxesFallback);
      }

      let boxesList = boxesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Box[];

      boxesList = boxesList.filter(b => {
        if (!b.openedAt) return false;
        const dt = toJsDate(b.openedAt);
        return dt >= start && dt <= end;
      });

      boxesList.sort((a, b) => {
        const tA = a.openedAt?.seconds || 0;
        const tB = b.openedAt?.seconds || 0;
        return tB - tA;
      });

      if (isCollector) {
        const currentUserId = auth.currentUser?.uid;
        boxesList = boxesList.filter(b => b.userId === currentUserId);
      }

      setBoxes(boxesList);
      setReportGenerated(true);
    } catch (err) {
      console.error("Critical: Failed to generate Period Summary:", err);
      setError("Erro ao compilar os dados do período solicitado. Certifique-se de que as permissões estejam corretas.");
    } finally {
      setLoading(false);
    }
  };

  // Auto trigger report on mount once tenantId is loaded
  useEffect(() => {
    if (tenantId) {
      generateReport();
    }
  }, [tenantId]);

  // Calculations
  const totalBoxes = boxes.length;
  const totalOpen = boxes.filter(b => b.status === 'open').length;
  const totalClosed = boxes.filter(b => b.status === 'closed').length;
  const totalConfirmed = boxes.filter(b => b.status === 'confirmed').length;

  const totalInitial = boxes.reduce((s, b) => s + (b.initialAmount || 0), 0);
  const totalIncomes = boxes.reduce((s, b) => s + (b.totalIncomes || 0), 0);
  const totalExpenses = boxes.reduce((s, b) => s + (b.totalExpenses || 0), 0);
  const totalSales = boxes.reduce((s, b) => s + (b.totalSales || 0), 0);
  const totalCollections = boxes.reduce((s, b) => s + (b.totalCollections || 0), 0);
  const totalTransfers = boxes.reduce((s, b) => s + (b.totalTransfers || 0), 0);
  const totalFinal = boxes.reduce((s, b) => s + (b.finalAmount || 0), 0);

  const eficiencia = totalSales > 0
    ? ((totalCollections / totalSales) * 100).toFixed(2)
    : '0.00';

  // Grouping by collector (Performance)
  const byCollector: Record<string, {
    name: string;
    boxes: number;
    collections: number;
    expenses: number;
    final: number;
  }> = {};

  boxes.forEach(box => {
    const uid = box.userId || 'unknown';
    if (!byCollector[uid]) {
      byCollector[uid] = {
        name: box.userName || 'Cobrador Indefinido',
        boxes: 0,
        collections: 0,
        expenses: 0,
        final: 0
      };
    }
    byCollector[uid].boxes += 1;
    byCollector[uid].collections += (box.totalCollections || 0);
    byCollector[uid].expenses += (box.totalExpenses || 0);
    byCollector[uid].final += (box.finalAmount || 0);
  });

  const collectorList = Object.values(byCollector)
    .sort((a, b) => b.collections - a.collections);

  // Excel exporter
  const exportToExcel = () => {
    try {
      const startD = new Date(startDateStr);
      const endD = new Date(endDateStr);

      const wsData = [
        ['Relatório de Consolidação de Caixa por Período'],
        ['Gerado por', userName || auth.currentUser?.email || 'Admin'],
        ['Inquilino ID', tenantId || ''],
        ['Período', `${startD.toLocaleDateString('pt-BR')} a ${endD.toLocaleDateString('pt-BR')}`],
        [],
        ['MÉTRICAS FINANCEIRAS GERAIS'],
        ['Indicador', 'Valor', 'Anotação'],
        ['Total de Caixas Analisadas', totalBoxes, `${totalOpen} abertas, ${totalClosed} fechadas, ${totalConfirmed} confirmadas`],
        ['Caja Inicial Agregada', totalInitial / 100, '$ em formato numérico'],
        ['Total de Ingresos (+)', totalIncomes / 100],
        ['Total de Gastos / Despesas (-)', totalExpenses / 100],
        ['Total de Vendas / Contratos (-)', totalSales / 100],
        ['Total de Recaudo / Cobrança (+)', totalCollections / 100],
        ['Total de Transferências (-)', totalTransfers / 100],
        ['CAJA FINAL ACUMULADA', totalFinal / 100],
        ['Eficiência de Recaudo (%)', `${eficiencia}%`, 'Porcentagem sobre Vendas'],
        [],
        ['PERFORMANCE DE RECAUDO POR COBRADOR'],
        ['COBRADOR', 'CAIXAS', 'TOTAL RECAUDO ($)', 'TOTAL EXPENSES ($)', 'CAJA FINAL ($)'],
        ...collectorList.map(c => [
          c.name,
          c.boxes,
          c.collections / 100,
          c.expenses / 100,
          c.final / 100
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Resumo por Período');
      XLSX.writeFile(wb, `ControlMax_Resumo_Periodo_${startDateStr}_a_${endDateStr}.xlsx`);
    } catch (err) {
      console.error("Failed to export Period Summary to Excel:", err);
      alert("Erro ao exportar planilha Excel.");
    }
  };

  if (tenantLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-2 min-h-screen bg-[#F3F4F6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6B21A8]" />
        <p className="text-xs font-medium">Carregando dados do inquilino...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333] -m-4">
      {/* Header Banner */}
      <div className="bg-[#6B21A8] text-white py-4 px-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-wider flex items-center">
            <Layers className="w-5 h-5 mr-1.5 text-[#8CC63F] bg-white rounded-full p-0.5" strokeWidth={3} />
            Resumo / Consolidação por Período
          </h1>
          <p className="text-xs text-purple-200 mt-1">
            Gere relatórios agregados e acompanhe indicadores financeiros de todas as rotas e cobradores de uma vez.
          </p>
        </div>
        {reportGenerated && (
          <button
            onClick={exportToExcel}
            className="self-start sm:self-auto bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2 px-4 rounded-full text-xs transition-colors flex items-center shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Exportar Excel
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Date Selector Card */}
        <div className="bg-white border border-gray-300 shadow-sm rounded p-4 space-y-3">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center">
            <Calendar className="w-4 h-4 mr-1.5 text-[#6B21A8]" />
            Seletor de Intervalo de Datas
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">Fecha Inicial (De)</label>
              <input
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="border border-gray-300 rounded p-2 text-xs bg-white text-[#333333] outline-none focus:border-[#6B21A8]"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">Fecha Final (Até)</label>
              <input
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                className="border border-gray-300 rounded p-2 text-xs bg-white text-[#333333] outline-none focus:border-[#6B21A8]"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">Centro de Negócio</label>
              <select disabled className="border border-gray-300 rounded p-2 text-xs bg-gray-100 text-gray-400 cursor-not-allowed">
                <option value="all">Todos os CNs (Mock)</option>
              </select>
            </div>

            <div>
              <button
                onClick={generateReport}
                disabled={loading}
                className="w-full bg-[#6B21A8] hover:bg-purple-800 text-white font-bold py-2 px-4 rounded text-xs transition-all flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5 mr-1.5" />
                )}
                Gerar Relatório
              </button>
            </div>
          </div>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded p-3 text-red-800 text-xs flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Overlay */}
        {reportPeriodBody(
          loading,
          reportGenerated,
          totalBoxes,
          (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 bg-white border border-gray-300 rounded">
            <Loader2 className="w-8 h-8 animate-spin text-[#6B21A8]" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Compilando transações do período...</p>
          </div>
          ),
          (
          <div className="bg-white border border-gray-300 p-8 text-center rounded">
            <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-400">Escolha as datas acima e clique em "Gerar Relatório".</p>
          </div>
          ),
          (
          <div className="bg-white border border-gray-300 p-8 text-center rounded">
            <X className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-400">Nenhuma caixa encontrada para o período selecionado</p>
          </div>
          ),
          (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Seção 1 — Cards de Totais (grid 2x2 → 4 colunas desktop) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Total Caixas */}
              <div className="bg-white border border-gray-300 p-3.5 rounded flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Total Caixas</span>
                  <h3 className="text-base font-extrabold text-gray-800 mt-1">{totalBoxes} registradas</h3>
                </div>
                <Briefcase className="w-5 h-5 text-purple-600 opacity-65" />
              </div>

              {/* Total Recaudo */}
              <div className="bg-white border border-gray-300 p-3.5 rounded flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-green-700 tracking-wider">Total Recaudo</span>
                  <h3 className="text-base font-extrabold text-[#16A34A] mt-1">$ {fmt(totalCollections)}</h3>
                </div>
                <TrendingUp className="w-5 h-5 text-[#16A34A] opacity-65" />
              </div>

              {/* Total Gastos */}
              <div className="bg-white border border-gray-300 p-3.5 rounded flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-red-700 tracking-wider">Total Gastos</span>
                  <h3 className="text-base font-extrabold text-[#DC2626] mt-1">$ {fmt(totalExpenses)}</h3>
                </div>
                <TrendingDown className="w-5 h-5 text-red-500 opacity-65" />
              </div>

              {/* Eficiência */}
              <div className="bg-white border border-gray-300 p-3.5 rounded flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-purple-700 tracking-wider">Eficiência</span>
                  <h3 className="text-base font-extrabold text-purple-900 mt-1">{eficiencia}%</h3>
                </div>
                <Percent className="w-5 h-5 text-purple-700 opacity-65" />
              </div>
            </div>

            {/* Layout Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Seção 2 — Resumo Financeiro Detalhado (Col-span 2) */}
              <div className="bg-white border border-gray-300 rounded p-4 space-y-3.5 md:col-span-2 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2">
                    Resumo Financeiro Detalhado do Período
                  </h3>

                  <div className="divide-y divide-gray-150 mt-2 text-xs">
                    <div className="py-2.5 flex justify-between">
                      <span className="text-[#555555] font-semibold">Caja Inicial Total</span>
                      <span className="font-bold text-gray-800">$ {fmt(totalInitial)}</span>
                    </div>

                    <div className="py-2.5 flex justify-between">
                      <span className="text-[#555555] font-semibold flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                        Ingresos (+)
                      </span>
                      <span className="font-bold text-green-600">+$ {fmt(totalIncomes)}</span>
                    </div>

                    <div className="py-2.5 flex justify-between">
                      <span className="text-[#555555] font-semibold flex items-center">
                        <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                        Gastos (-)
                      </span>
                      <span className="font-bold text-red-600">-$ {fmt(totalExpenses)}</span>
                    </div>

                    <div className="py-2.5 flex justify-between">
                      <span className="text-[#555555] font-semibold flex items-center">
                        <span className="w-2 h-2 rounded-full bg-red-400 mr-2"></span>
                        Ventas / Contratos de Crédito (-)
                      </span>
                      <span className="font-bold text-red-600">-$ {fmt(totalSales)}</span>
                    </div>

                    <div className="py-2.5 flex justify-between">
                      <span className="text-[#555555] font-semibold flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                        Recaudo / Cobrança (+)
                      </span>
                      <span className="font-bold text-green-600">+$ {fmt(totalCollections)}</span>
                    </div>

                    <div className="py-2.5 flex justify-between">
                      <span className="text-[#555555] font-semibold flex items-center">
                        <span className="w-2 h-2 rounded-full bg-orange-400 mr-2"></span>
                        Transferencias (-)
                      </span>
                      <span className="font-bold text-gray-700">-$ {fmt(totalTransfers)}</span>
                    </div>
                  </div>
                </div>

                {/* Caja Final Acumulada Large Box */}
                <div className="bg-[#FAF5FF] border border-[#D8B4FE] text-[#7B1FA2] p-4 rounded-sm flex items-center justify-between mt-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-purple-700">Caja Final Total do Período</span>
                    <h2 className="text-xl font-extrabold mt-1">$ {fmt(totalFinal)}</h2>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-400 opacity-60" />
                </div>
              </div>

              {/* Seção 3 — Status das Caixas */}
              <div className="bg-white border border-gray-300 rounded p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2">
                    Status Operacional das Caixas
                  </h3>

                  <div className="space-y-2.5 mt-4">
                    {/* Abertas */}
                    <div className="bg-green-50 border border-green-200 p-3 rounded flex justify-between items-center text-xs">
                      <span className="font-bold text-green-800">Abertas (Em rota)</span>
                      <span className="font-extrabold text-sm text-green-900 bg-white border border-green-200 w-7 h-7 rounded-full flex items-center justify-center">
                        {totalOpen}
                      </span>
                    </div>

                    {/* Fechadas */}
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded flex justify-between items-center text-xs">
                      <span className="font-bold text-yellow-800">Fechadas (Aguardando confirm.)</span>
                      <span className="font-extrabold text-sm text-yellow-900 bg-white border border-yellow-200 w-7 h-7 rounded-full flex items-center justify-center">
                        {totalClosed}
                      </span>
                    </div>

                    {/* Confirmadas */}
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded flex justify-between items-center text-xs">
                      <span className="font-bold text-blue-800">Confirmadas pelo Admin</span>
                      <span className="font-extrabold text-sm text-blue-900 bg-white border border-blue-200 w-7 h-7 rounded-full flex items-center justify-center">
                        {totalConfirmed}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 leading-relaxed italic border-t border-gray-100 pt-3">
                  * Caixas confirmadas são aquelas validadas fisicamente no cofre da empresa.
                </div>
              </div>
            </div>

            {/* Seção 4 — Performance por Cobrador (só admin/supervisor) */}
            {showPerformance && (
              <div className="bg-white border border-gray-300 rounded p-4 space-y-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2 flex items-center">
                  <Award className="w-4 h-4 mr-1.5 text-yellow-500" />
                  Performance e Produtividade por Cobrador
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 uppercase font-bold text-[10px]">
                        <th className="py-2">Posição / Cobrador</th>
                        <th className="py-2 text-center">Caixas Ativas</th>
                        <th className="py-2 text-right">Recaudo / Cobrança</th>
                        <th className="py-2 text-right">Gastos Operacionais</th>
                        <th className="py-2 text-right">Saldo Final Caixa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {collectorList.map((col, index) => {
                        let medal = '';
                        if (index === 0) medal = '🥇 ';
                        else if (index === 1) medal = '🥈 ';
                        else if (index === 2) medal = '🥉 ';

                        return (
                          <tr key={col.name} className="hover:bg-gray-50">
                            <td className="py-2.5 font-semibold text-gray-800">
                              <span>{medal}</span>
                              <span>{col.name}</span>
                            </td>
                            <td className="py-2.5 text-center font-bold text-gray-600">{col.boxes}</td>
                            <td className="py-2.5 text-right font-bold text-[#16A34A]">$ {fmt(col.collections)}</td>
                            <td className="py-2.5 text-right font-medium text-[#DC2626]">$ {fmt(col.expenses)}</td>
                            <td className="py-2.5 text-right font-extrabold text-purple-950">$ {fmt(col.final)}</td>
                          </tr>
                        );
                      })}
                      {/* Totals Row */}
                      <tr className="bg-purple-50/50 border-t border-purple-200 font-bold">
                        <td className="py-3 text-purple-950">TOTAL PERÍODO</td>
                        <td className="py-3 text-center text-purple-950">{totalBoxes}</td>
                        <td className="py-3 text-right text-green-700">$ {fmt(totalCollections)}</td>
                        <td className="py-3 text-right text-red-600">$ {fmt(totalExpenses)}</td>
                        <td className="py-3 text-right text-purple-950">$ {fmt(totalFinal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          )
        )}
      </div>
    </div>
  );
}
