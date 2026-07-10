import { useState, type ReactNode } from 'react';
import {
  Award,
  RefreshCw,
  Search,
  Loader2,
  X,
  Wallet,
  Calendar,
  ShieldAlert,
  ListFilter,
  Coins,
  Edit3,
  History,
  Check,
  User,
} from 'lucide-react';
import { SKELETON_ROW_KEYS } from '../constants/placeholders';
import { listViewBody } from '../utils/listViewBody';
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
import { type SalesListSale } from '../utils/salesListMapper';

function fmt(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function seedExampleButtonContent(seeding: boolean, seedSuccess: boolean): ReactNode {
  if (seeding) {
    return (
      <>
        <Loader2 size={14} className="animate-spin" />
        <span>Semeando...</span>
      </>
    );
  }
  if (seedSuccess) {
    return (
      <>
        <Check size={14} className="stroke-[3]" />
        <span>Vendas Criadas com Sucesso!</span>
      </>
    );
  }
  return (
    <>
      <RefreshCw size={14} className="stroke-[2.5]" />
      <span>Criar 3 Vendas de Exemplo</span>
    </>
  );
}

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

  return (
    <div className="flex flex-col bg-[#F0F2F5] min-h-screen text-gray-800 relative select-none pb-20">
      <div className="max-w-md mx-auto w-full px-4 pt-4 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('Vendas')}
            className={`flex-1 py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-xs border transition-all ${
              activeTab === 'Vendas'
                ? 'bg-[#8CC63F] text-white border-[#8CC63F]'
                : 'bg-white text-gray-500 border-gray-200/60 hover:bg-gray-50'
            }`}
          >
            <ShieldAlert size={16} />
            Vendas
          </button>
          <button
            onClick={() => setActiveTab('Coleção')}
            className={`flex-1 py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-xs border transition-all ${
              activeTab === 'Coleção'
                ? 'bg-[#8CC63F] text-white border-[#8CC63F]'
                : 'bg-white text-gray-500 border-gray-200/60 hover:bg-gray-50'
            }`}
          >
            <History size={16} />
            Coleção
          </button>
        </div>

        {activeTab === 'Vendas' && (
          <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 flex flex-col items-center text-center space-y-3.5 shadow-xs">
            <div className="bg-purple-100 p-2.5 rounded-full text-[#6B21A8]">
              <Award size={20} className="stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-black text-purple-950 uppercase tracking-wide">Semear 3 Vendas do Exemplo</h3>
              <p className="text-[11px] text-purple-700/80 max-w-[280px]">
                Clique no botão abaixo para adicionar as 3 vendas do exemplo (Alexa, Ana karolina, Cleber) diretamente ao seu perfil de cobrador.
              </p>
            </div>
            <button
              onClick={handleSeedExampleSales}
              disabled={seeding}
              className="w-full bg-[#6B21A8] hover:bg-[#581c87] text-white font-extrabold text-xs py-3 px-5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {seedExampleButtonContent(seeding, seedSuccess)}
            </button>
          </div>
        )}

        {activeTab === 'Vendas' && (
          <div className="space-y-2">
            <div className="relative">
              <select
                value={selectedCn}
                onChange={(e) => setSelectedCn(e.target.value)}
                className="w-full border border-purple-300 rounded-md bg-white text-gray-700 text-xs font-bold py-3 pl-3 pr-10 outline-none appearance-none shadow-xs cursor-pointer"
              >
                <option value="all">/1/ - CN de la sociedad 6501</option>
                {cnOptions.map((cn) => (
                  <option key={cn} value={cn}>
                    {cn}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-purple-800">
                <ChevronDownIcon />
              </div>
            </div>

            <div className="relative">
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full border border-purple-300 rounded-md bg-white text-gray-700 text-xs font-bold py-3 pl-3 pr-10 outline-none appearance-none shadow-xs cursor-pointer"
              >
                <option value="all">Todas las unidades ({filteredSales.length})</option>
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-purple-800">
                <ChevronDownIcon />
              </div>
            </div>

            <div className="flex items-center space-x-2.5 pt-0.5 px-0.5">
              <input
                type="checkbox"
                id="ver-todas-sales"
                checked={verTodasUnidades}
                onChange={(e) => setVerTodasUnidades(e.target.checked)}
                className="w-4.5 h-4.5 border-purple-300 text-[#6B21A8] rounded-sm focus:ring-[#6B21A8] cursor-pointer"
              />
              <label htmlFor="ver-todas-sales" className="text-xs font-bold text-gray-700 cursor-pointer">
                Ver todas las unidades
              </label>
            </div>
          </div>
        )}

        {activeTab === 'Vendas' && (
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-lg overflow-hidden">
            <div className="inline-flex items-center bg-[#BEF264] text-gray-900 font-extrabold text-[13px] px-5 py-2.5 rounded-br-2xl shadow-xs space-x-2 border-r border-b border-gray-100">
              <ListFilter size={15} className="stroke-[2.5]" />
              <span>Lista de ventas</span>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <span className="block text-xs font-extrabold text-gray-500 mb-2">Consultar por</span>
                <div className="flex flex-col space-y-1.5 pl-1">
                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="radio"
                      name="consultarPor"
                      checked={consultarPor === 'active'}
                      onChange={() => setConsultarPor('active')}
                      className="w-4.5 h-4.5 border-purple-300 text-[#6B21A8] focus:ring-[#6B21A8]"
                    />
                    <span>Ventas activas</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="radio"
                      name="consultarPor"
                      checked={consultarPor === 'inactive'}
                      onChange={() => setConsultarPor('inactive')}
                      className="w-4.5 h-4.5 border-purple-300 text-[#6B21A8] focus:ring-[#6B21A8]"
                    />
                    <span>Ventas inactivas</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="radio"
                      name="consultarPor"
                      checked={consultarPor === 'castigadas'}
                      onChange={() => setConsultarPor('castigadas')}
                      className="w-4.5 h-4.5 border-purple-300 text-[#6B21A8] focus:ring-[#6B21A8]"
                    />
                    <span>Ventas castigadas</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div>
                  <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fecha inicio</span>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full border border-purple-300 rounded-md p-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-[#6B21A8]"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fecha fin</span>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full border border-purple-300 rounded-md p-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-[#6B21A8]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pl-0.5">
                <input
                  type="checkbox"
                  id="incluir-fecha-check"
                  checked={incluirFecha}
                  onChange={(e) => setIncluirFecha(e.target.checked)}
                  className="w-4 h-4 border-purple-300 text-[#6B21A8] rounded-xs focus:ring-[#6B21A8] cursor-pointer"
                />
                <label htmlFor="incluir-fecha-check" className="text-xs font-bold text-gray-600 cursor-pointer">
                  Incluir fecha:
                </label>
              </div>

              <div className="flex items-center border border-purple-300 rounded-md overflow-hidden shadow-2xs">
                <input
                  type="text"
                  placeholder="Ejem: id Cliente, id ver"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-white px-3 py-3 text-xs text-gray-700 outline-none placeholder-gray-400"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="px-2 text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                )}
                <div className="bg-[#8CC63F] p-3 text-white flex items-center justify-center cursor-pointer hover:bg-[#7cb235] transition-colors">
                  <Search size={16} className="stroke-[3]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Vendas' && (
          <div className="space-y-4">
            <div className="grid grid-cols-12 border border-gray-300 rounded-t-lg overflow-hidden bg-[#8CC63F] text-white font-extrabold text-[13px] text-center shadow-xs">
              <div className="col-span-6 py-2 border-r border-white/20 bg-[#7cb235]/65"></div>
              <div className="col-span-6 py-2 uppercase tracking-wide">Id Cliente</div>
            </div>

            {listViewBody(
              loadingSales,
              filteredSales.length,
              <>
                {SKELETON_ROW_KEYS.map((key) => (
                  <div key={key} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-pulse flex space-x-4">
                    <div className="w-1/2 space-y-2 border-r border-gray-100 pr-4">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <div className="w-1/2 flex items-center justify-center">
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </>,
              <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-md">
                <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-500">Nenhuma venda ativa correspondente</p>
              </div>,
              <>
                {filteredSales.map((sale) => {
                  const interest = Math.round(sale.amount * 0.2);
                  const totalWithInterest = sale.amount + interest;

                  return (
                    <div
                      key={sale.id}
                      className="grid grid-cols-12 bg-white border-l border-r border-b border-gray-200 shadow-sm rounded-b-lg overflow-hidden hover:border-[#6B21A8]/40 transition-colors"
                    >
                      <div className="col-span-6 p-3 border-r border-gray-200 flex flex-col space-y-1.5 text-xs bg-white">
                        <div>
                          <span className="block text-[10px] text-gray-400 font-bold leading-none">Id Venta</span>
                          <span className="font-extrabold text-gray-800">{sale.id.slice(0, 8)}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] text-gray-400 font-bold leading-none">Id Pre Venta</span>
                          <span className="font-bold text-gray-500">-</span>
                        </div>

                        <div>
                          <span className="block text-[10px] text-gray-400 font-bold leading-none">Unidade</span>
                          <span className="font-extrabold text-gray-800">{sale.unitName || '3 - RT 03'}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] text-gray-400 font-bold leading-none mb-1">Score</span>
                          <div className="inline-block bg-gray-500 rounded px-2.5 py-1 text-center shadow-3xs">
                            <span className="text-xs font-black text-white">N</span>
                          </div>
                        </div>

                        <div>
                          <span className="block text-[10px] text-gray-400 font-bold leading-none">Fecha de creación</span>
                          <span className="font-bold text-gray-700 leading-tight">
                            {sale.createdAt
                              ? sale.createdAt.toDate().toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })
                              : '--'}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[10px] text-gray-400 font-bold leading-none">Valor</span>
                          <span className="font-extrabold text-gray-800">${fmt(sale.amount)}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] text-gray-400 font-bold leading-none">Interés</span>
                          <span className="font-bold text-gray-700">${fmt(interest)}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] text-gray-400 font-bold leading-none">Saldo total</span>
                          <span className="font-extrabold text-gray-800">${fmt(totalWithInterest)}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] text-gray-400 font-bold leading-none">Saldo pendiente</span>
                          <span className="font-black text-red-600">${fmt(sale.saldoPendienteCents || sale.balance)}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] text-gray-400 font-bold leading-none">Tipo</span>
                          <span className="font-bold text-gray-700">Móvil</span>
                        </div>

                        <div>
                          <span className="block text-[10px] text-gray-400 font-bold leading-none">Tipo de venta</span>
                          <span className="font-bold text-gray-700">Renovación de venta</span>
                        </div>

                        <div>
                          <span className="block text-[10px] text-gray-400 font-bold leading-none">Documentos</span>
                          <span className="font-bold text-gray-700 truncate block max-w-[130px]">{sale.clientDoc || '00699672104'}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] text-gray-400 font-bold leading-none">Dias de atraso</span>
                          <span className="font-bold text-gray-700">0,00</span>
                        </div>

                        <div className="pt-2 flex flex-col space-y-1.5">
                          <button
                            onClick={() => onNavigate && onNavigate('register-payment', { saleId: sale.id })}
                            className="flex items-center justify-center space-x-1.5 border border-[#6B21A8] text-[#6B21A8] hover:bg-purple-50 rounded-full py-2 px-3 text-xs font-extrabold transition-colors shadow-3xs"
                          >
                            <Coins size={14} className="stroke-[2.5]" />
                            <span>Pagar</span>
                          </button>

                          <button
                            onClick={() => onNavigate && onNavigate('sale-detail', { saleId: sale.id })}
                            className="flex items-center justify-center space-x-1 py-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
                          >
                            <Edit3 size={12} />
                            <span>Detalles</span>
                          </button>

                          <button
                            onClick={() => onNavigate && onNavigate('sale-detail', { saleId: sale.id })}
                            className="flex items-center justify-center space-x-1 py-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
                          >
                            <History size={12} />
                            <span>Historial</span>
                          </button>
                        </div>
                      </div>

                      <div className="col-span-6 p-4 flex flex-col items-center justify-center bg-[#F9FAFB] text-center min-h-full">
                        <div
                          onClick={() => onNavigate && onNavigate('company-list', { clientId: sale.clientId })}
                          className="font-black text-[#6B21A8] hover:text-[#52006A] text-[13px] leading-snug break-words max-w-full px-1 py-2 cursor-pointer hover:underline transition-colors"
                          title="Ver ficha do cliente"
                        >
                          {sale.clientId || '1002558'} - {sale.clientName}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-2 flex items-center space-x-1">
                          <User size={10} className="text-purple-300" />
                          <span>Cliente de Campo</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {activeTab === 'Coleção' && (
          <div className="space-y-3">
            {listViewBody(
              loadingCollections,
              filteredCollections.length,
              <>
                {SKELETON_ROW_KEYS.map((key) => (
                  <div key={key} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </>,
              <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-md">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-500">Nenhum recaudo registrado hoje</p>
              </div>,
              <>
                {filteredCollections.map((col) => {
                  const hour = col.createdAt
                    ? col.createdAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '--:--';
                  return (
                    <div
                      key={col.id}
                      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between hover:border-emerald-300 transition-colors"
                    >
                      <div className="min-w-0">
                        <div
                          onClick={() => onNavigate && onNavigate('company-list', { clientId: col.clientId })}
                          className="font-extrabold text-gray-800 hover:text-[#6B21A8] text-sm truncate cursor-pointer hover:underline transition-colors"
                          title="Ver ficha do cliente"
                        >
                          {col.clientName}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                          <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            ID: {col.saleId.slice(-7)}
                          </span>
                          <span>•</span>
                          <span>{hour}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-emerald-600">+${fmt(col.amount)}</div>
                        <div className="text-[10px] text-gray-400">Pago hoje</div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-chevron-down"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
