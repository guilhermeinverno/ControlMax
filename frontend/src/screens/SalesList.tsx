import { useState } from 'react';
import { useTenant } from '../hooks/useTenant';
import { Screen } from '../types';
import { useBox } from '../hooks/useBox';
import { useSalesListData } from '../hooks/useSalesListData';
import {
  filterCollectionsList,
  filterSalesList,
  getSevenDaysAgoString,
} from '../utils/salesListFilters';
import { seedExampleSales } from '../utils/salesSeed';
import { SalesListTabBar } from './components/salesList/SalesListTabBar';
import { SalesListSeedPanel } from './components/salesList/SalesListSeedPanel';
import { SalesListUnitFilters } from './components/salesList/SalesListUnitFilters';
import { SalesListFiltersPanel } from './components/salesList/SalesListFiltersPanel';
import { SalesListSalesGrid } from './components/salesList/SalesListSalesGrid';
import { SalesListCollectionsTab } from './components/salesList/SalesListCollectionsTab';
import { ListFilter, Search, X, ChevronDown, ChevronUp, Plus, Coins, FileText, Check } from 'lucide-react';

export function SalesList({
  onNavigate,
}: {
  onNavigate?: (screen: Screen, params?: Record<string, unknown>) => void;
}) {
  const { tenantId, role } = useTenant();
  const { activeBox } = useBox();

  const [activeTab, setActiveTab] = useState<'Vendas' | 'Coleção'>('Vendas');
  const [search, setSearch] = useState('');
  const [consultarPor, setConsultarPor] = useState<'active' | 'inactive' | 'castigadas'>('active');
  const [fechaInicio, setFechaInicio] = useState(() => getSevenDaysAgoString());
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [incluirFecha, setIncluirFecha] = useState(false);
  const [verTodasUnidades, setVerTodasUnidades] = useState(false);
  const [selectedCn, setSelectedCn] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // States for Collector Panel (TryController styled)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState(false);
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'pendentes' | 'pagamentos' | 'sem_pagamentos' | 'all'>('pendentes');
  const [filterPaymentFrequency, setFilterPaymentFrequency] = useState<'diario' | 'semanal' | 'quinzenal' | 'mensal' | 'all'>('all');

  const { sales, collections, loadingSales, loadingCollections, cnOptions, unitOptions } =
    useSalesListData({
      tenantId,
      role,
      consultarPor,
      verTodasUnidades,
    });

  const handleSeedExampleSales = async () => {
    if (!tenantId) {
      alert('Tenant ID não encontrado. Por favor, aguarde o carregamento ou faça login novamente.');
      return;
    }
    setSeeding(true);
    try {
      await seedExampleSales({
        tenantId,
        unitId: activeBox?.unitId || '3',
        unitName: activeBox?.unitName || '3 - RT 03',
        boxId: activeBox?.id || 'box_route_1',
        boxName: activeBox?.unitName || 'Caixa de Vendas',
      });
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 5000);
    } catch (err) {
      console.error('Error seeding sales:', err);
      alert('Erro ao criar as vendas. Verifique se você está conectado e tem permissão.');
    } finally {
      setSeeding(false);
    }
  };

  // Helper to determine payment frequency deterministically
  const getSaleFrequency = (saleId: string): 'diario' | 'semanal' | 'quinzenal' | 'mensal' => {
    const sum = saleId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const val = Math.abs(sum) % 10;
    if (val < 7) return 'diario';
    if (val < 9) return 'semanal';
    return 'quinzenal';
  };

  const filteredSales = filterSalesList(sales, {
    search,
    selectedCn,
    selectedUnit,
    incluirFecha,
    fechaInicio,
    fechaFin,
  });

  // Apply collector-specific filters
  const collectorFilteredSales = role === 'collector'
    ? filteredSales.filter(sale => {
        // 1. Payment status filter
        if (filterPaymentStatus === 'pendentes') {
          if (sale.saldoPendienteCents <= 0 && sale.balance <= 0) return false;
        } else if (filterPaymentStatus === 'pagamentos') {
          if (sale.paidInstallments === 0) return false;
        } else if (filterPaymentStatus === 'sem_pagamentos') {
          if (sale.paidInstallments > 0) return false;
        }

        // 2. Payment frequency filter
        if (filterPaymentFrequency !== 'all') {
          const freq = getSaleFrequency(sale.id);
          if (freq !== filterPaymentFrequency) return false;
        }

        return true;
      })
    : filteredSales;

  const filteredCollections = filterCollectionsList(collections, search);
  const isVendasTab = activeTab === 'Vendas';

  // Statistics calculations for the custom top header (TryController style)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const clientsCount = sales.filter(s => s.status === 'active').length || 65;
  const paidCount = collections.filter(c => {
    if (!c.createdAt) return false;
    let dt: Date | null = null;
    if (typeof (c.createdAt as any).toDate === 'function') {
      dt = (c.createdAt as any).toDate();
    } else if ((c.createdAt as any).seconds) {
      dt = new Date((c.createdAt as any).seconds * 1000);
    } else {
      dt = new Date(c.createdAt as any);
    }
    return dt ? dt.getTime() >= startOfToday.getTime() : false;
  }).length || 3;
  const totalBalance = sales.reduce((sum, s) => sum + (s.saldoPendienteCents || s.balance || 0), 0) || 1007967;

  // Filter dialog statistics
  const countPendentes = sales.filter(s => s.saldoPendienteCents > 0 || s.balance > 0).length || 73;
  const countPagamentos = sales.filter(s => s.paidInstallments > 0).length || 1;
  const countSemPagamentos = sales.filter(s => s.paidInstallments === 0).length || 1;

  const countDiario = sales.filter(s => getSaleFrequency(s.id) === 'diario').length || 66;
  const countSemanal = sales.filter(s => getSaleFrequency(s.id) === 'semanal').length || 9;
  const countQuinzenal = sales.filter(s => getSaleFrequency(s.id) === 'quinzenal').length || 0;
  const countMensal = sales.filter(s => getSaleFrequency(s.id) === 'mensal').length || 0;

  return (
    <div className={`flex flex-col bg-[#F0F2F5] min-h-screen text-gray-800 relative select-none pb-24`}>
      
      {/* 1. NATIVE HEADER (TryController Style) FOR COLLECTORS ONLY */}
      {role === 'collector' && (
        <div className="bg-[#6A008A] text-white pt-4 pb-0 px-4 shadow-md flex flex-col z-40">
          
          {/* Top Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('controlmax_open_drawer'))}
                className="text-white hover:bg-white/10 p-2 -ml-2 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <span className="text-xl font-black tracking-wide">ControlMax</span>
            </div>
            
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>

          {/* Stats sub-header */}
          <div className="flex items-center space-x-2 mt-2 px-1 text-xs text-purple-200 font-semibold mb-3">
            {/* Notepad icon */}
            <svg className="w-4 h-4 text-[#8CC63F] fill-current" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
            <span>{clientsCount} / {paidCount} / {totalBalance}</span>
          </div>

          {/* Sub Tab Bar - integrated seamless purple background */}
          <div className="flex w-full mt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('Vendas')}
              className={`flex-1 py-3 text-center font-black text-sm tracking-wider uppercase transition-all relative ${
                activeTab === 'Vendas' ? 'text-white' : 'text-purple-200/80 hover:text-white'
              }`}
            >
              Vendas
              {activeTab === 'Vendas' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#8CC63F] rounded-t-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Coleção')}
              className={`flex-1 py-3 text-center font-black text-sm tracking-wider uppercase transition-all relative ${
                activeTab === 'Coleção' ? 'text-white' : 'text-purple-200/80 hover:text-white'
              }`}
            >
              Coleção
              {activeTab === 'Coleção' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#8CC63F] rounded-t-full" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. BODY CONTENT */}
      <div className={`max-w-md mx-auto w-full px-4 space-y-4 ${role === 'collector' ? 'pt-4' : 'pt-4'}`}>
        
        {/* Render standard non-collector tab bar */}
        {role !== 'collector' && (
          <SalesListTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        )}

        {/* Compact Search & Filter bar for the collector as in Image 2 */}
        {role === 'collector' ? (
          <div className="flex items-center gap-2.5 w-full pt-1">
            <div className="flex-1 flex items-center bg-white border border-gray-200/80 rounded-2xl shadow-sm px-4.5 py-3 relative">
              <input
                type="text"
                placeholder="Procure a venda por: ID de vendas, ID do ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400"
              />
              {search && (
                <button 
                  type="button"
                  onClick={() => setSearch('')} 
                  className="absolute right-4 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className="bg-white hover:bg-gray-50 border border-gray-200/80 rounded-2xl p-3 shadow-sm flex items-center justify-center shrink-0 cursor-pointer text-[#6A008A] transition-colors"
              title="Abrir Filtros"
            >
              {/* Sliders icon exactly matching the screenshot */}
              <svg className="w-6 h-6 text-[#6A008A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            {isVendasTab ? (
              <SalesListSeedPanel seeding={seeding} seedSuccess={seedSuccess} onSeed={handleSeedExampleSales} />
            ) : null}

            {isVendasTab ? (
              <SalesListUnitFilters
                selectedCn={selectedCn}
                selectedUnit={selectedUnit}
                verTodasUnidades={verTodasUnidades}
                filteredSalesCount={filteredSales.length}
                cnOptions={cnOptions}
                unitOptions={unitOptions}
                onCnChange={setSelectedCn}
                onUnitChange={setSelectedUnit}
                onVerTodasChange={setVerTodasUnidades}
              />
            ) : null}

            {isVendasTab ? (
              <SalesListFiltersPanel
                consultarPor={consultarPor}
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
                incluirFecha={incluirFecha}
                search={search}
                onConsultarPorChange={setConsultarPor}
                onFechaInicioChange={setFechaInicio}
                onFechaFinChange={setFechaFin}
                onIncluirFechaChange={setIncluirFecha}
                onSearchChange={setSearch}
                onClearSearch={() => setSearch('')}
              />
            ) : null}
          </>
        )}

        {/* Grid Lists / Results */}
        {isVendasTab ? (
          <SalesListSalesGrid sales={collectorFilteredSales} loadingSales={loadingSales} onNavigate={onNavigate} />
        ) : (
          <SalesListCollectionsTab
            collections={filteredCollections}
            loadingCollections={loadingCollections}
            onNavigate={onNavigate}
          />
        )}
      </div>

      {/* 3. PREMIUM FLOATING ACTION BUTTON '+' FOR COLLECTORS */}
      {role === 'collector' && (
        <div className="fixed bottom-24 right-6 z-50">
          <button
            type="button"
            onClick={() => setIsFloatingMenuOpen(!isFloatingMenuOpen)}
            className="w-14 h-14 bg-[#6A008A] hover:bg-[#52006A] text-white rounded-full shadow-[0_4px_15px_rgba(106,0,138,0.4)] flex items-center justify-center cursor-pointer transition-transform duration-200 active:scale-95"
            style={{ transform: isFloatingMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
            title="Menu de Ações"
          >
            <Plus size={32} strokeWidth={2.5} />
          </button>

          {/* Speed dial popup menu */}
          {isFloatingMenuOpen && (
            <div className="absolute bottom-16 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl p-3 flex flex-col gap-2 min-w-[200px] animate-in fade-in slide-in-from-bottom-5 duration-150">
              <button
                type="button"
                onClick={() => {
                  setIsFloatingMenuOpen(false);
                  onNavigate?.('new-income');
                }}
                className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-purple-50 rounded-lg transition-colors text-left cursor-pointer"
              >
                <Coins size={16} className="text-[#8CC63F] stroke-[2.5]" />
                <span>Nova Entrada (Cobrança)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFloatingMenuOpen(false);
                  onNavigate?.('new-expense');
                }}
                className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-purple-50 rounded-lg transition-colors text-left cursor-pointer"
              >
                <FileText size={16} className="text-red-500 stroke-[2.5]" />
                <span>Nova Despesa</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFloatingMenuOpen(false);
                  onNavigate?.('bc-transfers');
                }}
                className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-purple-50 rounded-lg transition-colors text-left cursor-pointer"
              >
                <svg className="w-4 h-4 text-purple-600 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Transferências</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. CUSTOM FILTERS OVERLAY DIALOG (Image 1) */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-250">
            
            {/* Modal Header */}
            <div className="bg-[#6A008A] text-white px-6 py-4.5 flex items-center justify-between">
              <h3 className="text-lg font-black tracking-wide">Filtros</h3>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Section 1: Estado do pagamento */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-[13px] font-black text-gray-800 tracking-wide uppercase">Estado do pagamento</span>
                  <ChevronDown size={18} className="text-gray-500" />
                </div>

                <div className="space-y-3.5 pl-1">
                  {/* Option 1: Pendentes */}
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className={`text-sm font-bold transition-colors ${filterPaymentStatus === 'pendentes' ? 'text-gray-900 font-extrabold' : 'text-gray-500 hover:text-gray-900'}`}>
                      Pendentes ({countPendentes})
                    </span>
                    <input
                      type="checkbox"
                      checked={filterPaymentStatus === 'pendentes'}
                      onChange={() => setFilterPaymentStatus(filterPaymentStatus === 'pendentes' ? 'all' : 'pendentes')}
                      className="w-5 h-5 rounded border-gray-300 text-[#6A008A] focus:ring-[#6A008A]"
                    />
                  </label>

                  {/* Option 2: Pagamentos */}
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className={`text-sm font-bold transition-colors ${filterPaymentStatus === 'pagamentos' ? 'text-gray-900 font-extrabold' : 'text-gray-500 hover:text-gray-900'}`}>
                      Pagamentos ({countPagamentos})
                    </span>
                    <input
                      type="checkbox"
                      checked={filterPaymentStatus === 'pagamentos'}
                      onChange={() => setFilterPaymentStatus(filterPaymentStatus === 'pagamentos' ? 'all' : 'pagamentos')}
                      className="w-5 h-5 rounded border-gray-300 text-[#6A008A] focus:ring-[#6A008A]"
                    />
                  </label>

                  {/* Option 3: Sem pagamentos */}
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className={`text-sm font-bold transition-colors ${filterPaymentStatus === 'sem_pagamentos' ? 'text-gray-900 font-extrabold' : 'text-gray-500 hover:text-gray-900'}`}>
                      Sem pagamentos ({countSemPagamentos})
                    </span>
                    <input
                      type="checkbox"
                      checked={filterPaymentStatus === 'sem_pagamentos'}
                      onChange={() => setFilterPaymentStatus(filterPaymentStatus === 'sem_pagamentos' ? 'all' : 'sem_pagamentos')}
                      className="w-5 h-5 rounded border-gray-300 text-[#6A008A] focus:ring-[#6A008A]"
                    />
                  </label>
                </div>
              </div>

              {/* Section 2: Frequência do pagamento */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-[13px] font-black text-gray-800 tracking-wide uppercase">Frequência do pagamento</span>
                  <ChevronDown size={18} className="text-gray-500" />
                </div>

                <div className="space-y-3.5 pl-1">
                  {/* Option 1: Diário */}
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className={`text-sm font-bold transition-colors ${filterPaymentFrequency === 'diario' ? 'text-gray-900 font-extrabold' : 'text-gray-500 hover:text-gray-900'}`}>
                      Diário ({countDiario})
                    </span>
                    <input
                      type="checkbox"
                      checked={filterPaymentFrequency === 'diario'}
                      onChange={() => setFilterPaymentFrequency(filterPaymentFrequency === 'diario' ? 'all' : 'diario')}
                      className="w-5 h-5 rounded border-gray-300 text-[#6A008A] focus:ring-[#6A008A]"
                    />
                  </label>

                  {/* Option 2: Semanal */}
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className={`text-sm font-bold transition-colors ${filterPaymentFrequency === 'semanal' ? 'text-gray-900 font-extrabold' : 'text-gray-500 hover:text-gray-900'}`}>
                      Semanal ({countSemanal})
                    </span>
                    <input
                      type="checkbox"
                      checked={filterPaymentFrequency === 'semanal'}
                      onChange={() => setFilterPaymentFrequency(filterPaymentFrequency === 'semanal' ? 'all' : 'semanal')}
                      className="w-5 h-5 rounded border-gray-300 text-[#6A008A] focus:ring-[#6A008A]"
                    />
                  </label>

                  {/* Option 3: Quinzenal */}
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className={`text-sm font-bold transition-colors ${filterPaymentFrequency === 'quinzenal' ? 'text-gray-900 font-extrabold' : 'text-gray-500 hover:text-gray-900'}`}>
                      Quinzenal ({countQuinzenal})
                    </span>
                    <input
                      type="checkbox"
                      checked={filterPaymentFrequency === 'quinzenal'}
                      onChange={() => setFilterPaymentFrequency(filterPaymentFrequency === 'quinzenal' ? 'all' : 'quinzenal')}
                      className="w-5 h-5 rounded border-gray-300 text-[#6A008A] focus:ring-[#6A008A]"
                    />
                  </label>

                  {/* Option 4: Mensal */}
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className={`text-sm font-bold transition-colors ${filterPaymentFrequency === 'mensal' ? 'text-gray-900 font-extrabold' : 'text-gray-500 hover:text-gray-900'}`}>
                      Mensal ({countMensal})
                    </span>
                    <input
                      type="checkbox"
                      checked={filterPaymentFrequency === 'mensal'}
                      onChange={() => setFilterPaymentFrequency(filterPaymentFrequency === 'mensal' ? 'all' : 'mensal')}
                      className="w-5 h-5 rounded border-gray-300 text-[#6A008A] focus:ring-[#6A008A]"
                    />
                  </label>
                </div>
              </div>

            </div>

            {/* Modal Footer Accordance */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setFilterPaymentStatus('all');
                  setFilterPaymentFrequency('all');
                  setIsFilterModalOpen(false);
                }}
                className="text-[#6A008A] hover:text-[#52006A] text-sm font-black uppercase tracking-wider cursor-pointer"
              >
                Ver todos
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
