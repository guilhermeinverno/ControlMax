import { getErrorMessage } from '../utils/errorMessage';
import { useState, useEffect } from 'react';
import { Screen, Box } from '../types';
import { Search, ChevronLeft, ChevronRight, Download, AlertCircle } from 'lucide-react';
import { boxStatusLabel, boxStatusBadgeBorderClasses } from '../utils/statusLabels';
import { useTenant } from '../hooks/useTenant';
import { getBoxSummaryUserId, searchBoxSummaryForDate, type BoxTransaction } from '../utils/boxSummarySearch';
import * as XLSX from 'xlsx';

interface BoxSummaryProps {
  onNavigate?: (screen: Screen) => void;
}

export function BoxSummary({ onNavigate }: BoxSummaryProps) {
  const { tenantId, loading: tenantLoading } = useTenant();

  // Local helper to get today's date in YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayString();
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // CN and Unit Options (Mocked for now as requested)
  // Pendente: Conectar con Firestore futuramente
  const cnOptions = [
    { id: 'CN_6501', name: 'CN de la sociedad 6501' }
  ];

  const unitOptions = [
    { id: 'RT_03', name: 'Centro Histórico' }
  ];

  const [selectedCnId, setSelectedCnId] = useState('CN_6501');
  const [selectedUnitId, setSelectedUnitId] = useState('RT_03');

  // Search results
  const [box, setBox] = useState<Box | null>(null);
  const [transactions, setTransactions] = useState<BoxTransaction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleSearch = async () => {
    const uid = getBoxSummaryUserId();
    if (!uid || !tenantId) return;

    setIsSearching(true);
    setSearchError(null);
    setBox(null);
    setTransactions([]);
    setHasSearched(true);

    try {
      const result = await searchBoxSummaryForDate(tenantId, selectedDate, uid);
      setBox(result.box);
      setTransactions(result.transactions);
      if (result.box) setCurrentPage(1);
    } catch (err: unknown) {
      console.error(err);
      setSearchError(getErrorMessage(err) || 'Error al buscar la caja.');
    } finally {
      setIsSearching(false);
    }
  };

  // Trigger search on mount/date change
  useEffect(() => {
    if (!tenantLoading && tenantId) {
      handleSearch();
    }
  }, [tenantLoading, tenantId, selectedDate]);

  // Handle Excel Export
  const handleExportExcel = () => {
    if (transactions.length === 0) return;

    const dataToExport = transactions.map(tx => {
      const timeStr = tx.createdAt ? tx.createdAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
      const typeLabel = getTypeName(tx.type);

      return {
        'Hora': timeStr,
        'Tipo Movimento': typeLabel,
        'Descrição': tx.description,
        'Usuário': tx.userName,
        'Valor ($)': (tx.amount / 100).toFixed(2),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracto');
    XLSX.writeFile(workbook, `Extracto_Caja_${selectedDate}.xlsx`);
  };

  // Pagination logic
  const totalItems = transactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentTransactions = transactions.slice(startIndex, endIndex);

  // Format type helpers
  const getTypeName = (type: string) => {
    switch (type) {
      case 'income': return 'Ingreso';
      case 'expense': return 'Gasto';
      case 'sale': return 'Venda';
      case 'collection': return 'Recaudo';
      case 'transfer': return 'Transferência';
      default: return type;
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'income':
      case 'collection':
      case 'sale':
        return 'text-[#16A34A] font-bold';
      case 'expense':
      case 'transfer':
        return 'text-[#DC2626] font-bold';
      default:
        return 'text-[#333333]';
    }
  };

  const getSign = (type: string) => {
    switch (type) {
      case 'income':
      case 'collection':
      case 'sale':
        return '+';
      case 'expense':
      case 'transfer':
        return '-';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333]">
      <div className="p-3 flex flex-col space-y-4">
        
        {/* FILTROS */}
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-3">
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#555555] mb-1">CN de la sociedad</label>
              {/* Pendente: Conectar con Firestore futuramente */}
              <select 
                value={selectedCnId}
                onChange={(e) => setSelectedCnId(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs text-[#333333] outline-none focus:border-[#6B21A8] bg-white font-bold"
              >
                {cnOptions.map(cn => (
                  <option key={cn.id} value={cn.id}>{cn.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#555555] mb-1">Unidad</label>
              {/* Pendente: Conectar con Firestore futuramente */}
              <select 
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs text-[#333333] outline-none focus:border-[#6B21A8] bg-white font-bold"
              >
                {unitOptions.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#555555] mb-1">Fecha</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-bold text-[#333333] outline-none focus:border-[#6B21A8]"
              />
            </div>

            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full bg-[#16A34A] text-white font-bold py-2.5 text-xs flex justify-center items-center rounded-sm shadow-sm uppercase mt-1 hover:bg-[#15803D] transition-colors disabled:opacity-75"
            >
              <Search className="w-4 h-4 mr-1.5" />
              {isSearching ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        {searchError && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-2.5 rounded-sm text-xs font-semibold">
            {searchError}
          </div>
        )}

        {/* LOADING STATE - SKELETON */}
        {isSearching && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-300 rounded-sm p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-300 rounded-sm p-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-8 bg-gray-100 rounded"></div>
                <div className="h-8 bg-gray-100 rounded"></div>
                <div className="h-8 bg-gray-100 rounded"></div>
              </div>
            </div>
          </div>
        )}

        {/* CAIXA ENCONTRADA */}
        {!isSearching && box && (
          <>
            {/* RESUMEN */}
            <div className="bg-white text-xs border border-gray-300 shadow-sm rounded-sm p-3">
              <div className="flex justify-between items-center border-b border-gray-200 pb-1 mb-2">
                <h3 className="font-bold text-[#6B21A8] uppercase text-[10px] tracking-wider">Cierre de Caja</h3>
                <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-sm border ${boxStatusBadgeBorderClasses(box.status)}`}>
                  {boxStatusLabel(box.status)}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
                  <span className="text-[#555555]">Caja Inicial</span>
                  <span className="font-semibold text-[#333333]">$ {(box.initialAmount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
                  <span className="text-[#555555]">Ingresos</span>
                  <span className="font-semibold text-[#16A34A]">+ $ {(box.totalIncomes / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
                  <span className="text-[#555555]">Gastos</span>
                  <span className="font-semibold text-[#DC2626]">- $ {(box.totalExpenses / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
                  <span className="text-[#555555]">Transferencias</span>
                  <span className="font-semibold text-[#DC2626]">- $ {(box.totalTransfers / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
                  <span className="text-[#555555]">Recaudo</span>
                  <span className="font-semibold text-[#16A34A]">+ $ {(box.totalCollections / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
                  <span className="text-[#555555]">Ventas</span>
                  <span className="font-semibold text-[#16A34A]">+ $ {(box.totalSales / 100).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-[#FAF5FF] border border-[#D8B4FE] mt-2 rounded-sm p-2">
                <span className="font-bold text-[#333333] uppercase text-[11px]">Caja Final</span>
                <span className="font-extrabold text-[#7B1FA2] text-sm">
                  $ {(box.finalAmount / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* EXTRATO (Tabela de movimentos) */}
            <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
              <div className="bg-gray-100 border-b border-gray-300 px-3 py-2 flex justify-between items-center">
                <h3 className="font-bold text-[#333333] text-[11px] uppercase tracking-wider">Extracto</h3>
                <button 
                  onClick={handleExportExcel}
                  disabled={transactions.length === 0}
                  className="text-[#7B1FA2] hover:text-[#581c87] flex items-center text-[10px] uppercase font-bold disabled:opacity-50"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Excel
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-white text-[#777777] text-[10px] uppercase border-b border-gray-200">
                      <th className="p-2 font-bold whitespace-nowrap">Hora</th>
                      <th className="p-2 font-bold whitespace-nowrap">Tipo Movimiento</th>
                      <th className="p-2 font-bold whitespace-nowrap min-w-[120px]">Descripción</th>
                      <th className="p-2 font-bold whitespace-nowrap">Usuario</th>
                      <th className="p-2 font-bold whitespace-nowrap text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-[#333333]">
                    {currentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500 italic">
                          No hay movimientos registrados para esta caja.
                        </td>
                      </tr>
                    ) : (
                      currentTransactions.map(tx => {
                        const timeStr = tx.createdAt ? tx.createdAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                        return (
                          <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-2 whitespace-nowrap text-[#555555]">{timeStr}</td>
                            <td className="p-2 whitespace-nowrap uppercase text-[10px] font-semibold">{getTypeName(tx.type)}</td>
                            <td className="p-2 text-[#555555] text-[11px] italic">{tx.description || '-'}</td>
                            <td className="p-2 whitespace-nowrap text-[#555555]">{tx.userName}</td>
                            <td className={`p-2 font-bold text-right ${getTypeStyle(tx.type)}`}>
                              {getSign(tx.type)} $ {(tx.amount / 100).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* PAGINACIÓN */}
              {totalItems > 0 && (
                <div className="flex justify-between items-center text-[#777777] text-xs p-2 border-t border-gray-200">
                  <span>Mostrando de {startIndex + 1} a {endIndex} de {totalItems} registros</span>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="w-6 h-6 flex items-center justify-center bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4 text-[#777777]" />
                    </button>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="w-6 h-6 flex items-center justify-center bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4 text-[#777777]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ESTADO VAZIO */}
        {!isSearching && hasSearched && !box && (
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-6 text-center flex flex-col items-center space-y-3">
            <AlertCircle className="w-12 h-12 text-gray-400" />
            <h3 className="font-bold text-sm text-gray-700">Nenhuma caixa encontrada para esta data</h3>
            <p className="text-xs text-gray-500 max-w-xs">
              Por favor, selecione outra data ou abra uma nova caixa para hoje no menu principal.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
