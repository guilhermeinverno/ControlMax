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

  const filteredSales = filterSalesList(sales, {
    search,
    selectedCn,
    selectedUnit,
    incluirFecha,
    fechaInicio,
    fechaFin,
  });
  const filteredCollections = filterCollectionsList(collections, search);
  const isVendasTab = activeTab === 'Vendas';

  return (
    <div className="flex flex-col bg-[#F0F2F5] min-h-screen text-gray-800 relative select-none pb-20">
      <div className="max-w-md mx-auto w-full px-4 pt-4 space-y-4">
        <SalesListTabBar activeTab={activeTab} onTabChange={setActiveTab} />

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

        {isVendasTab ? (
          <SalesListSalesGrid sales={filteredSales} loadingSales={loadingSales} onNavigate={onNavigate} />
        ) : (
          <SalesListCollectionsTab
            collections={filteredCollections}
            loadingCollections={loadingCollections}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </div>
  );
}
