import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { 
  Landmark, 
  ArrowUpRight, 
  ArrowDownRight, 
  Percent, 
  Scale, 
  FileSpreadsheet, 
  Loader2, 
  Lock, 
  RefreshCw,
  Search,
  AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';

enum OperationType {
  LIST = 'list',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error in Finance: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface UnifiedMovement {
  id: string;
  type: 'Ingreso' | 'Egreso' | 'Transferencia' | 'Recaudo';
  amount: number; // in cents
  description: string;
  status: 'Aprobado' | 'Pendiente' | 'Rechazado';
  date: Date;
  dateStr: string;
  responsible: string;
  cnName: string;
}

export function Finance() {
  const { tenantId, role, userName, isSuperAdmin, loading: tenantLoading } = useTenant();

  // Access Control: collector -> restricted access
  const isCollector = role === 'collector';
  const hasAccess = !isCollector && tenantId;

  // State
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [movements, setMovements] = useState<UnifiedMovement[]>([]);
  const [activeTabFilter, setActiveTabFilter] = useState<'Todos' | 'Ingreso' | 'Egreso' | 'Transferencia' | 'Recaudo'>('Todos');
  const [selectedCnFilter, setSelectedCnFilter] = useState<string>('Todos');
  const [availableCns, setAvailableCns] = useState<string[]>([]);

  // Month and Year selections
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const monthsList = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const yearsList = [
    selectedYear - 1,
    selectedYear,
    selectedYear + 1
  ];

  // Helper to safely parse dates from Firestore fields
  const parseFirestoreDate = (field: unknown): Date => {
    if (!field) return new Date();
    if (typeof field === "object" && field !== null && "toDate" in field && typeof (field as Record<string, unknown>).toDate === "function") return (field as { toDate: () => Date }).toDate();
    if (field instanceof Date) return field;
    if ((field as { seconds: number }).seconds !== undefined) return new Timestamp((field as { seconds: number }).seconds, (field as { nanoseconds?: number }).nanoseconds || 0).toDate();
    const parsed = new Date(field as string | number);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const loadFinancialData = async () => {
    if (!tenantId) return;
    setLoadingData(true);
    setErrorMsg(null);

    try {
      // 1. Fetch collections in parallel using Promise.all()
      const [incomesSnap, expensesSnap, transfersSnap, collectionsSnap] = await Promise.all([
        getDocs(query(collection(db, 'bc_incomes'), where('tenantId', '==', tenantId))),
        getDocs(query(collection(db, 'bc_expenses'), where('tenantId', '==', tenantId))),
        getDocs(query(collection(db, 'bc_transfers'), where('tenantId', '==', tenantId))),
        getDocs(query(collection(db, 'collections'), where('tenantId', '==', tenantId)))
      ]);

      const loadedMovements: UnifiedMovement[] = [];
      const cnNamesSet = new Set<string>();

      // 2. Process bc_incomes
      incomesSnap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const date = parseFirestoreDate(data.createdAt);
        const cnName = data.cnName || 'CN General';
        cnNamesSet.add(cnName);

        // Normalize status
        let mappedStatus: 'Aprobado' | 'Pendiente' | 'Rechazado' = 'Pendiente';
        if (data.status === 'approved') mappedStatus = 'Aprobado';
        else if (data.status === 'rejected') mappedStatus = 'Rechazado';

        loadedMovements.push({
          id: docSnap.id,
          type: 'Ingreso',
          amount: Number(data.amount || 0),
          description: data.description || 'Ingreso de Capital',
          status: mappedStatus,
          date,
          dateStr: date.toLocaleString(),
          responsible: data.userName || 'Sistema',
          cnName
        });
      });

      // 3. Process bc_expenses
      expensesSnap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const date = parseFirestoreDate(data.createdAt);
        const cnName = data.cnName || 'CN General';
        cnNamesSet.add(cnName);

        let mappedStatus: 'Aprobado' | 'Pendiente' | 'Rechazado' = 'Pendiente';
        if (data.status === 'approved') mappedStatus = 'Aprobado';
        else if (data.status === 'rejected') mappedStatus = 'Rechazado';

        loadedMovements.push({
          id: docSnap.id,
          type: 'Egreso',
          amount: Number(data.amount || 0),
          description: data.description || 'Gasto Operativo',
          status: mappedStatus,
          date,
          dateStr: date.toLocaleString(),
          responsible: data.userName || 'Sistema',
          cnName
        });
      });

      // 4. Process bc_transfers
      transfersSnap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const date = parseFirestoreDate(data.createdAt);
        const cnName = data.toCnName || 'CN Destino';
        cnNamesSet.add(cnName);

        let mappedStatus: 'Aprobado' | 'Pendiente' | 'Rechazado' = 'Pendiente';
        if (data.status === 'confirmed') mappedStatus = 'Aprobado';
        else if (data.status === 'rejected') mappedStatus = 'Rechazado';

        loadedMovements.push({
          id: docSnap.id,
          type: 'Transferencia',
          amount: Number(data.amount || 0),
          description: data.description || 'Transferencia entre cajas',
          status: mappedStatus,
          date,
          dateStr: date.toLocaleString(),
          responsible: data.fromName || 'Sistema',
          cnName
        });
      });

      // 5. Process collections
      collectionsSnap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const date = parseFirestoreDate(data.createdAt);
        const cnName = data.cnName || 'Ruta de Cobro';
        cnNamesSet.add(cnName);

        loadedMovements.push({
          id: docSnap.id,
          type: 'Recaudo',
          amount: Number(data.amount || 0),
          description: `Cobro de Cliente - ${data.clientName || 'Sin Nombre'}`,
          status: 'Aprobado',
          date,
          dateStr: date.toLocaleString(),
          responsible: data.registeredBy || 'Cobrador',
          cnName
        });
      });

      // Sort by date descending
      loadedMovements.sort((a, b) => b.date.getTime() - a.date.getTime());

      setMovements(loadedMovements);
      setAvailableCns(Array.from(cnNamesSet));
    } catch (err: unknown) {
      setErrorMsg('No se pudo cargar la información financiera. Intente de nuevo.');
      try {
        handleFirestoreError(err, OperationType.LIST, 'finance_collections');
      } catch (e) {}
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (tenantId && !isCollector) {
      loadFinancialData();
    }
  }, [tenantId, isCollector]);

  // Filters logic
  const filteredByDate = movements.filter(m => {
    const mMonth = m.date.getMonth();
    const mYear = m.date.getFullYear();
    return mMonth === selectedMonth && mYear === selectedYear;
  });

  const filteredMovements = filteredByDate.filter(m => {
    const matchesTab = activeTabFilter === 'Todos' || m.type === activeTabFilter;
    const matchesCn = selectedCnFilter === 'Todos' || m.cnName === selectedCnFilter;
    return matchesTab && matchesCn;
  });

  // KPI Calculations (scoped to selected Month & Year)
  const approvedIncomes = filteredByDate.filter(m => m.status === 'Aprobado' && (m.type === 'Ingreso' || m.type === 'Recaudo'));
  const approvedExpenses = filteredByDate.filter(m => m.status === 'Aprobado' && (m.type === 'Egreso' || m.type === 'Transferencia'));

  const totalIncomes = approvedIncomes.reduce((sum, m) => sum + m.amount, 0);
  const totalExpenses = approvedExpenses.reduce((sum, m) => sum + m.amount, 0);
  const currentCapitalBalance = totalIncomes - totalExpenses;

  // Margin calculation
  const marginPercentage = totalIncomes > 0 ? (currentCapitalBalance / totalIncomes) * 100 : 0;

  // Distribution by Center
  const distributionData = filteredByDate.reduce((acc: Record<string, number>, m) => {
    if (m.status === 'Aprobado') {
      const isOut = m.type === 'Egreso' || m.type === 'Transferencia';
      const change = isOut ? -m.amount : m.amount;
      acc[m.cnName] = (acc[m.cnName] || 0) + change;
    }
    return acc;
  }, {});

  const maxCnValue = Math.max(...Object.values(distributionData).map(Math.abs), 1);

  // Format currency helper - STRICT CONSTRAINT: No Currency Symbol (e.g. no "$", no "COP", just formatted value)
  const fmtValue = (cents: number) => {
    return (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Export to Excel with SheetJS
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredMovements.map(m => ({
        ID: m.id,
        Tipo: m.type,
        Descripción: m.description,
        Monto: m.amount / 100,
        Estado: m.status,
        Fecha: m.dateStr,
        Centro: m.cnName,
        Responsable: m.responsible
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Finanzas');
      XLSX.writeFile(workbook, `Reporte_Financiero_${monthsList[selectedMonth]}_${selectedYear}.xlsx`);
    } catch (err) {
      console.error('Error exporting excel: ', err);
    }
  };

  if (tenantLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-purple-700 mb-2" />
        <p className="text-sm text-gray-500 font-medium">Cargando perfil...</p>
      </div>
    );
  }

  // Access Control View
  if (isCollector) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center max-w-md mx-auto mt-12 animate-fadeIn">
        <Lock className="w-16 h-16 text-purple-600 mb-4" />
        <h2 className="text-lg font-black text-gray-800">Acceso Restringido</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Lo sentimos, el módulo de finanzas y tesorería central solo está disponible para administradores y supervisores de la plataforma.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 w-full max-w-[1550px] mx-auto animate-fadeIn px-2 sm:px-4">
      
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-purple-700" />
            <span>Finanzas y Contabilidad Central</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Control de tesorería, balances contables consolidados y aportes de capital social de los Centros de Negocios.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month/Year selectors */}
          <div className="flex items-center bg-white border border-gray-300 rounded shadow-sm px-2 py-1.5 gap-1.5">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs font-bold text-gray-700 bg-transparent outline-none cursor-pointer"
            >
              {monthsList.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold text-gray-700 bg-transparent border-l border-gray-200 pl-1.5 outline-none cursor-pointer"
            >
              {yearsList.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={loadFinancialData}
            title="Recargar datos"
            className="p-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 rounded transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button 
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold py-2 px-3.5 rounded text-xs transition-colors shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {loadingData ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-gray-200 rounded-lg shadow-sm">
          <Loader2 className="w-12 h-12 animate-spin text-purple-700 mb-3" />
          <p className="text-xs font-medium text-gray-500">Cargando flujos financieros del mes seleccionado...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Error al cargar datos</h4>
            <p className="text-xs mt-1">{errorMsg}</p>
            <button onClick={loadFinancialData} className="mt-2 text-xs font-bold underline text-red-900">Reintentar</button>
          </div>
        </div>
      ) : (
        <>
          {/* KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Saldo Disponible - PURPLE CARD */}
            <div className="bg-gradient-to-br from-purple-700 to-purple-900 text-white rounded-lg p-5 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-bold text-purple-200 uppercase tracking-wide">Saldo Disponible</div>
                  <div className="text-2xl font-black mt-1.5">
                    {fmtValue(currentCapitalBalance)}
                  </div>
                </div>
                <div className="p-2 bg-white/10 rounded-full text-white">
                  <Scale className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[10px] text-purple-200 font-semibold mt-4">
                Entradas netas menos salidas operativas
              </div>
            </div>

            {/* Total Entradas */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Entradas (Ingresos/Recaudos)</div>
                  <div className="text-xl font-black text-gray-800 mt-1">
                    {fmtValue(totalIncomes)}
                  </div>
                </div>
                <div className="p-2 bg-green-50 rounded-full text-green-600">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[10px] text-green-600 font-bold mt-4 flex items-center gap-1">
                <span>{approvedIncomes.length} movimientos aprobados</span>
              </div>
            </div>

            {/* Total Saídas */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Salidas (Egresos/Transf.)</div>
                  <div className="text-xl font-black text-gray-800 mt-1">
                    {fmtValue(totalExpenses)}
                  </div>
                </div>
                <div className="p-2 bg-red-50 rounded-full text-red-600">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[10px] text-red-600 font-bold mt-4">
                <span>{approvedExpenses.length} egresos contabilizados</span>
              </div>
            </div>

            {/* Margem de Caixa */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Margen de Caja</div>
                  <div className="text-xl font-black text-blue-600 mt-1">
                    {marginPercentage.toFixed(2)}%
                  </div>
                </div>
                <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[10px] text-gray-500 mt-4">
                Porcentaje retenido del total ingresado
              </div>
            </div>

          </div>

          {/* Main List & Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Unified movements list */}
            <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm rounded-lg p-4 flex flex-col space-y-4">
              
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Historial de Movimientos</h3>
                
                {/* Tabs / Filters */}
                <div className="flex flex-wrap gap-1">
                  {(['Todos', 'Ingreso', 'Egreso', 'Transferencia', 'Recaudo'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTabFilter(tab)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
                        activeTabFilter === tab 
                          ? 'bg-purple-700 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-filtering by Business Center */}
              <div className="flex items-center gap-2 text-xs bg-gray-50 p-2.5 rounded border border-gray-100">
                <span className="font-bold text-gray-500 text-[10px] uppercase">Centro:</span>
                <select 
                  value={selectedCnFilter}
                  onChange={(e) => setSelectedCnFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-purple-600 cursor-pointer"
                >
                  <option value="Todos">Todos los centros</option>
                  {availableCns.map(cn => (
                    <option key={cn} value={cn}>{cn}</option>
                  ))}
                </select>
              </div>

              {/* List */}
              <div className="overflow-x-auto">
                {filteredMovements.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs font-medium">
                    No se encontraron transacciones para los filtros seleccionados.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                        <th className="p-2.5">ID</th>
                        <th className="p-2.5">Tipo</th>
                        <th className="p-2.5">Descripción</th>
                        <th className="p-2.5 text-right">Monto</th>
                        <th className="p-2.5">Centro / Origen</th>
                        <th className="p-2.5">Fecha</th>
                        <th className="p-2.5 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-gray-700">
                      {filteredMovements.map(m => {
                        const isIncome = m.type === 'Ingreso' || m.type === 'Recaudo';
                        return (
                          <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <td className="p-2.5 font-mono text-[10px] text-gray-400" title={m.id}>
                              {m.id.substring(0, 8)}...
                            </td>
                            <td className="p-2.5">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                isIncome ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {m.type}
                              </span>
                            </td>
                            <td className="p-2.5 font-medium text-gray-800 max-w-xs truncate" title={m.description}>
                              {m.description}
                            </td>
                            <td className={`p-2.5 text-right font-bold ${
                              isIncome ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {fmtValue(m.amount)}
                            </td>
                            <td className="p-2.5 font-semibold text-purple-700 text-[11px]">
                              {m.cnName}
                            </td>
                            <td className="p-2.5 text-[11px] text-gray-500 font-mono">
                              {m.dateStr.split(' ')[0]}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                                m.status === 'Aprobado' 
                                  ? 'bg-green-100 text-green-800' 
                                  : m.status === 'Pendiente' 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {m.status}
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

            {/* Distribution/Breakdown Card */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 flex flex-col space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
                Balance por Origen / Centro
              </h3>

              {Object.keys(distributionData).length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  Sin datos operacionales este mes.
                </div>
              ) : (
                <div className="space-y-5">
                  {(Object.entries(distributionData) as [string, number][]).map(([cnName, balance]) => {
                    const absBal = Math.abs(balance);
                    const percentage = Math.min((absBal / maxCnValue) * 100, 100);
                    return (
                      <div key={cnName} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-700 truncate max-w-[180px]">{cnName}</span>
                          <span className={balance >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                            {balance < 0 ? '-' : ''}{fmtValue(absBal)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              balance >= 0 ? 'bg-purple-600' : 'bg-red-500'
                            }`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-purple-50 p-3.5 rounded border border-purple-100 text-[10px] leading-relaxed text-purple-700 font-medium">
                ★ Las transacciones mostradas están consolidadas a nivel de base de datos multi-tenant y se actualizan de manera estricta bajo aprobación.
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
}
