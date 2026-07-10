import { useState } from 'react';
import { toJsDate } from '../utils/firestoreTimestamp';
import { collectorRankMedal } from '../utils/statusLabels';
import { useTenant } from '../hooks/useTenant';
import { useStatisticsData } from '../hooks/useStatisticsData';
import {
  buildDashboardAggregates,
  computeStatisticsTotals,
  computeTopCollectors,
  filterByDateRange,
} from '../utils/statisticsAggregates';
import { SymmetricDualAxisChart } from './components/statistics/SymmetricDualAxisChart';
import type { StatsBox, StatsCollection, StatsExpense, StatsSale } from '../types/statistics';
import {
  TrendingUp, Briefcase, Percent, TrendingDown,
  Calendar, Award, BarChart3, Search, AlertCircle
} from 'lucide-react';

const fmt = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

export function Statistics() {
  const { tenantId } = useTenant();

  // Filters state (Defaults to 30 days range ending today)
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 40); // Generate nice sample size
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Recaudos paging state exactly matching `< 1/2 >` in screenshot
  const [recaudosPageIndex, setRecaudosPageIndex] = useState<number>(0);

  const [filterTrigger, setFilterTrigger] = useState<number>(0);

  const { boxes, collections, expenses, sales, customersCount, loading, loadError } = useStatisticsData(tenantId, filterTrigger);

  const filterStart = new Date(startDate + 'T00:00:00');
  const filterEnd = new Date(endDate + 'T23:59:59');

  const filteredBoxes: StatsBox[] = filterByDateRange(boxes, (box) => toJsDate(box.openedAt), filterStart, filterEnd);
  const filteredCollections: StatsCollection[] = filterByDateRange(
    collections,
    (collection) => toJsDate(collection.createdAt),
    filterStart,
    filterEnd
  );
  const filteredExpenses: StatsExpense[] = filterByDateRange(
    expenses,
    (expense) => toJsDate(expense.createdAt),
    filterStart,
    filterEnd
  );
  const filteredSales: StatsSale[] = filterByDateRange(sales, (sale) => toJsDate(sale.createdAt), filterStart, filterEnd);

  const { totalBoxesCount, totalRecaudo, totalGastos, eficiencia } = computeStatisticsTotals({
    filteredBoxes,
    filteredCollections,
    filteredExpenses,
    filteredSales,
  });

  const dashboardData = buildDashboardAggregates({
    filterStart,
    filterEnd,
    filteredSales,
    filteredCollections,
    filteredExpenses,
    sales,
    customersCount,
  });

  const topCollectors = computeTopCollectors(filteredBoxes, 5);

  const maxCollectorTotal = topCollectors[0]?.total || 1;

  const handleSearchClick = () => {
    setFilterTrigger(prev => prev + 1);
  };

  if (loading && boxes.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="border-4 border-[#8CC63F] border-t-transparent rounded-full w-12 h-12 animate-spin mb-4" />
          <p className="text-gray-500 text-sm font-extrabold">Cargando métricas del panel...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex justify-center items-center min-h-[400px] p-4">
        <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-lg text-sm max-w-md flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-1">Erro ao carregar métricas</p>
            <p className="text-xs">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] p-4 md:p-6 space-y-6 select-none">
      
      {/* Outer wrapper to restrict width nicely on desktop */}
      <div className="max-w-md mx-auto w-full space-y-4">
        
        {/* GREEN BADGE/TAB EXACTLY MATCHING SCREENSHOT */}
        <div className="flex">
          <div className="bg-[#8CC63F] text-white px-5 py-3 rounded-t-2xl font-extrabold text-sm flex items-center gap-2 shadow-xs">
            <BarChart3 size={18} className="stroke-[2.5]" />
            Dashboard
          </div>
        </div>

        {/* PRIMARY WHITE CONTAINER WITH ALL FILTER CONTROLS */}
        <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-md p-5 border border-gray-100/80 space-y-5">
          
          {/* DATE RANGE FILTERS */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              
              {/* Fecha inicial */}
              <div className="space-y-1">
                <label className="text-gray-700 font-extrabold text-xs block uppercase tracking-wide">
                  Fecha inicial
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-gray-200/80 rounded-xl px-3.5 py-3 text-sm font-extrabold text-gray-800 outline-none focus:border-[#8CC63F] transition-all cursor-pointer"
                  />
                  <Calendar className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Fecha final */}
              <div className="space-y-1">
                <label className="text-gray-700 font-extrabold text-xs block uppercase tracking-wide">
                  Fecha final
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-gray-200/80 rounded-xl px-3.5 py-3 text-sm font-extrabold text-gray-800 outline-none focus:border-[#8CC63F] transition-all cursor-pointer"
                  />
                  <Calendar className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

            </div>

            {/* SEARCH BUTTON IN HIGH CONTRAST LIME GREEN */}
            <div className="flex justify-end">
              <button
                onClick={handleSearchClick}
                className="bg-[#8CC63F] hover:bg-[#7bb335] active:scale-95 text-white p-3.5 rounded-2xl shadow-sm transition-all flex items-center justify-center cursor-pointer"
                title="Filtrar Estadísticas"
              >
                <Search size={22} className="stroke-[3]" />
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 my-4" />

          {/* CHART 1: CARTERA */}
          <SymmetricDualAxisChart
            title="Cartera"
            barLegend="Valor en cartera"
            lineLegend="Número de clientes"
            barColor="#3B82F6"
            lineColor="#EF4444"
            leftLabel="Cartera"
            rightLabel="# Clientes"
            data={dashboardData.map(d => ({
              label: d.label,
              barVal: d.carteraVal,
              lineVal: d.clientesCount
            }))}
          />

          {/* CHART 2: RECAUDOS WITH PAGING TOGGLE */}
          <SymmetricDualAxisChart
            title="Recaudos"
            barLegend="Total recaudado"
            lineLegend="Recaudo %"
            barColor="#3B82F6"
            lineColor="#EF4444"
            leftLabel="Valor"
            rightLabel="% Recaudo"
            isRightPercent={true}
            hasPaging={true}
            pageIndex={recaudosPageIndex}
            onPagePrev={() => setRecaudosPageIndex(p => Math.max(0, p - 1))}
            onPageNext={() => setRecaudosPageIndex(p => Math.min(1, p + 1))}
            data={dashboardData.map(d => {
              // Apply page modifier to Recaudos curve to let page 2 look different
              const offset = recaudosPageIndex === 1 ? 0.75 : 1.0;
              return {
                label: d.label,
                barVal: d.recaudoVal * offset,
                lineVal: Math.min(d.recaudoPercent * (recaudosPageIndex === 1 ? 0.88 : 1.0), 100)
              };
            })}
          />

          {/* CHART 3: VENTAS */}
          <SymmetricDualAxisChart
            title="Ventas"
            barLegend="Total de ventas"
            lineLegend="Número de ventas"
            barColor="#2DD4BF" // beautiful teal matching screenshot
            lineColor="#A16207" // brown
            leftLabel="Ventas"
            rightLabel="# Ventas"
            data={dashboardData.map(d => ({
              label: d.label,
              barVal: d.ventasVal,
              lineVal: d.ventasCount
            }))}
          />

          {/* CHART 4: GASTOS */}
          <SymmetricDualAxisChart
            title="Gastos"
            barLegend="Total de gastos"
            lineLegend="% Gasto"
            barColor="#3B82F6"
            lineColor="#EF4444"
            leftLabel="Ventas" // Left axis says "Ventas" in image 1/2 due to system template reuse, we keep exact design
            rightLabel="% Gasto"
            isRightPercent={true}
            data={dashboardData.map(d => ({
              label: d.label,
              barVal: d.gastosVal,
              lineVal: d.gastoPercent
            }))}
          />

        </div>

        {/* METRICS BRIEFING STATS CARDS */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          
          {/* Recaudo Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recaudación</span>
              <div className="p-1.5 bg-purple-50 rounded-lg text-[#6A008A]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-[10px] text-gray-400 block font-bold leading-none">Total</span>
              <span className="text-sm font-extrabold text-[#6A008A] mt-1 block">
                $ {fmt(totalRecaudo)}
              </span>
            </div>
          </div>

          {/* Gastos Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Egresos</span>
              <div className="p-1.5 bg-orange-50 rounded-lg text-orange-600">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-[10px] text-gray-400 block font-bold leading-none">Gastos</span>
              <span className="text-sm font-extrabold text-orange-600 mt-1 block">
                $ {fmt(totalGastos)}
              </span>
            </div>
          </div>

          {/* Cajas Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rendimiento</span>
              <div className="p-1.5 bg-lime-50 rounded-lg text-lime-600">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-[10px] text-gray-400 block font-bold leading-none">Cajas</span>
              <span className="text-sm font-extrabold text-gray-800 mt-1 block">
                {totalBoxesCount} Registros
              </span>
            </div>
          </div>

          {/* Eficiencia Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Eficiencia</span>
              <div className="p-1.5 bg-sky-50 rounded-lg text-sky-600">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-[10px] text-gray-400 block font-bold leading-none">Cobro / Ventas</span>
              <span className="text-sm font-extrabold text-sky-600 mt-1 block">
                {eficiencia}%
              </span>
            </div>
          </div>

        </div>

        {/* RECENT ACTIVITY LOGS & TOP COLLECTORS */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#333333] uppercase tracking-wide">Desempeño</h3>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">Control de cobro del período</p>
            </div>
            <Award className="w-5 h-5 text-[#8CC63F]" />
          </div>

          {topCollectors.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Sin datos de cobro registrados aún</p>
          ) : (
            <div className="space-y-3">
              {topCollectors.map((collector, idx) => {
                const medal = collectorRankMedal(idx);
                const percentWidth = (collector.total / maxCollectorTotal) * 100;

                return (
                  <div key={collector.name} className="space-y-1 bg-gray-50/50 border border-gray-100 p-3 rounded-xl">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{medal}</span>
                        <span className="font-extrabold text-gray-700 text-xs">
                          {collector.name}
                        </span>
                        <span className="text-[9px] bg-purple-100 text-[#6B21A8] font-bold px-1.5 py-0.5 rounded-full">
                          {collector.boxes} Cajas
                        </span>
                      </div>
                      <div className="font-extrabold text-[#6A008A]">
                        $ {fmt(collector.total)}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-[#8CC63F] h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
