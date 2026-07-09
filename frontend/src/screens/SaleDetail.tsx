import { useState, useEffect } from 'react';
import { Coins, Clock, Pencil, MapPin, User as UserIcon, Phone, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Screen } from '../types';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { saleActivityLabel } from '../utils/statusLabels';
import { formatFirestoreDate } from '../utils/firestoreTimestamp';
import { useTenant } from '../hooks/useTenant';

interface Sale {
  id: string;
  clientName: string;
  score?: string;
  unidade?: string;
  createdAt?: any; // FIXED_BY_SCRIPT
  valor: string;
  interes?: string;
  saldoTotal: string;
  saldoPendiente: string;
  saldoTotalCents?: number;
  saldoPendienteCents?: number;
  status: string;
  idPreVenta?: string;
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  userName: string;
  status: string;
}

interface SaleDetailProps {
  onNavigate?: (screen: Screen, params?: Record<string, unknown>) => void;
  params?: Record<string, unknown>;
}

export function SaleDetail({ onNavigate, params }: SaleDetailProps) {
  const { tenantId } = useTenant();
  const saleId = params?.saleId as string | undefined;

  const [sale, setSale] = useState<Sale | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(!!saleId);

  useEffect(() => {
    if (!saleId || !tenantId) {
      setLoading(false);
      return;
    }

    // 1. Subscribe to the specific sale document
    const saleDocRef = doc(db, 'sales', saleId);
    const unsubscribeSale = onSnapshot(saleDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSale({
          id: docSnap.id,
          clientName: data.clientName || '',
          score: data.score || 'N',
          unidade: data.unidade || '',
          createdAt: data.createdAt || '',
          valor: data.valor || '0,00',
          interes: data.interes || '0,0%',
          saldoTotal: data.saldoTotal || '0,00',
          saldoPendiente: data.saldoPendiente || '0,00',
          saldoTotalCents: data.saldoTotalCents || 0,
          saldoPendienteCents: data.saldoPendienteCents !== undefined ? data.saldoPendienteCents : 0,
          status: data.status || 'active',
          idPreVenta: data.idPreVenta || ''
        });
      } else {
        console.warn("Sale not found with ID:", saleId);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching sale detail:", error);
      setLoading(false);
    });

    // 2. Subscribe to collections/payments for this specific sale
    const collectionsRef = collection(db, 'collections');
    const qPayments = query(
      collectionsRef,
      where('tenantId', '==', tenantId),
      where('saleId', '==', saleId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribePayments = onSnapshot(qPayments, (snapshot) => {
      const loadedPayments = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let dateStr = '';
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          const date = data.createdAt.toDate();
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          dateStr = `${day}/${month}`;
        } else {
          dateStr = 'Reciente';
        }

        return {
          id: docSnap.id,
          date: dateStr,
          amount: data.amount || 0,
          userName: data.registeredBy || 'vend_01',
          status: 'OK'
        };
      });
      setPayments(loadedPayments);
    }, (error) => {
      console.error("Error fetching payments history:", error);
    });

    return () => {
      unsubscribeSale();
      unsubscribePayments();
    };
  }, [saleId, tenantId]);

  if (!saleId) {
    return (
      <div className="flex flex-col bg-[#F3F4F6] min-h-screen p-4 space-y-3">
        <div className="bg-red-50 border border-red-300 rounded p-4 flex flex-col items-center text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <span className="font-bold text-red-800 text-sm">Venda não encontrada</span>
          <span className="text-red-700 text-xs">Nenhum ID de venda foi fornecido.</span>
          <button
            onClick={() => onNavigate && onNavigate('sales')}
            className="bg-[#6B21A8] text-white font-bold text-xs py-2 px-6 rounded shadow cursor-pointer"
          >
            Voltar às Vendas
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center bg-[#F3F4F6] min-h-screen pt-4">
        <Loader2 className="w-8 h-8 text-[#6A008A] animate-spin mb-2" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargando venta...</span>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex flex-col bg-[#F3F4F6] min-h-screen p-4">
        <div className="bg-yellow-50 border border-yellow-300 rounded p-4 text-center text-yellow-800 text-sm font-semibold">
          Venda não encontrada no sistema.
        </div>
      </div>
    );
  }

  // Safe numeric evaluations
  const totalCents = sale.saldoTotalCents || 0;
  const pendingCents = sale.saldoPendienteCents !== undefined ? sale.saldoPendienteCents : 0;
  const paidCents = Math.max(0, totalCents - pendingCents);

  // Formatted financial strings
  const valorStr = sale.valor.startsWith('$') ? sale.valor : `$ ${sale.valor}`;
  const saldoTotalStr = sale.saldoTotal.startsWith('$') ? sale.saldoTotal : `$ ${sale.saldoTotal}`;
  const saldoPendienteStr = sale.saldoPendiente.startsWith('$') ? sale.saldoPendiente : `$ ${sale.saldoPendiente}`;
  const totalPagadoStr = `$ ${(paidCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333] pt-2 pb-6 px-2 space-y-2">
      
      {/* SECCIÓN RESUMEN DE LA VENTA */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-2 text-xs">
        <div className="flex items-center justify-between border-b border-gray-200 pb-1 mb-1">
          <div className="flex items-center space-x-1.5">
            <span className="bg-[#555555] text-white w-5 h-5 flex items-center justify-center font-bold text-[10px] rounded-sm shrink-0">
              {sale.score || 'N'}
            </span>
            <span className="font-bold text-[#333333] text-sm">{sale.clientName}</span>
          </div>
          <span className="font-bold text-gray-500">#{sale.id}</span>
        </div>

        <div className="grid grid-cols-2 gap-y-1 gap-x-2 mt-2">
          <div className="flex flex-col">
            <span className="text-[#777777] text-[10px] font-bold">ID Cliente</span>
            <span className="font-semibold text-[#333333]">{sale.idPreVenta || sale.id}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#777777] text-[10px] font-bold">Estado</span>
            <span className="font-semibold text-[#333333] capitalize">{saleActivityLabel(sale.status)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#777777] text-[10px] font-bold">Unidad</span>
            <span className="font-semibold text-[#333333]">{sale.unidade}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#777777] text-[10px] font-bold">Fecha Creación</span>
            <span className="font-semibold text-[#333333]">
              {sale.createdAt
                ? formatFirestoreDate(sale.createdAt, 'pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN FINANCIERA */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-2 text-xs">
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
            <span className="font-bold text-[#777777]">Valor Venta</span>
            <span className="font-bold text-[#16A34A]">{valorStr}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
            <span className="font-bold text-[#777777]">Interés</span>
            <span className="font-bold text-[#16A34A]">{sale.interes || "0,00"}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
            <span className="font-bold text-[#777777]">Saldo Total</span>
            <span className="font-bold text-[#16A34A]">{saldoTotalStr}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-400 bg-gray-50 pb-0.5 px-1 rounded-sm">
            <span className="font-bold text-[#333333]">Saldo Pendiente</span>
            <span className="font-bold text-[#16A34A]">{saldoPendienteStr}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
            <span className="font-bold text-[#777777]">Total Pagado</span>
            <span className="font-bold text-[#16A34A]">{totalPagadoStr}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
            <span className="font-bold text-[#777777]">Número de Cuotas</span>
            <span className="font-semibold text-[#333333]">12</span>
          </div>
          <div className="flex justify-between pb-0.5">
            <span className="font-bold text-[#777777]">Próximo Vencimiento</span>
            <span className="font-semibold text-[#333333]">20/09/2025</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN CLIENTE */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-2 text-xs">
        <div className="space-y-1.5">
          <div className="flex items-start">
            <UserIcon className="w-3.5 h-3.5 text-[#777777] mr-1.5 mt-0.5 shrink-0" />
            <span className="font-semibold text-[#333333]">{sale.clientName}</span>
          </div>
          <div className="flex items-start">
            <Phone className="w-3.5 h-3.5 text-[#777777] mr-1.5 mt-0.5 shrink-0" />
            <span className="font-semibold text-[#333333]">+55 11 99999-8888</span>
          </div>
          <div className="flex items-start">
            <MapPin className="w-3.5 h-3.5 text-[#777777] mr-1.5 mt-0.5 shrink-0" />
            <span className="font-semibold text-[#333333]">Av. Principal 123, {sale.unidade}.</span>
          </div>
          <div className="flex items-start">
            <FileText className="w-3.5 h-3.5 text-[#777777] mr-1.5 mt-0.5 shrink-0" />
            <span className="font-semibold text-[#777777] italic">Cobrar solo por la mañana.</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN PAGOS */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm text-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#E5E7EB] text-[#555555]">
            <tr>
              <th className="p-1.5 border-r border-gray-300 font-bold uppercase text-[10px]">Fecha</th>
              <th className="p-1.5 border-r border-gray-300 font-bold uppercase text-[10px]">Valor</th>
              <th className="p-1.5 border-r border-gray-300 font-bold uppercase text-[10px]">Usuario</th>
              <th className="p-1.5 font-bold uppercase text-[10px] text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="text-[#333333]">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-3 text-center text-gray-400 italic">No hay pagos registrados aún para esta venta.</td>
              </tr>
            ) : (
              payments.map((p, index) => (
                <tr key={p.id} className={`border-b border-gray-200 ${index % 2 === 1 ? 'bg-gray-50' : ''}`}>
                  <td className="p-1.5 border-r border-gray-200">{p.date}</td>
                  <td className="p-1.5 border-r border-gray-200 font-bold text-[#16A34A]">
                    $ {(p.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-1.5 border-r border-gray-200 truncate max-w-[80px]">{p.userName}</td>
                  <td className="p-1.5 text-center font-semibold text-[#16A34A]">{p.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* AÇÕES */}
      <div className="pt-2 flex flex-col space-y-2">
        <button 
          onClick={() => onNavigate && onNavigate('register-payment', { saleId })} 
          className="w-full bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2.5 text-sm flex justify-center items-center rounded-sm shadow-sm transition-colors cursor-pointer"
        >
          <Coins className="w-4 h-4 mr-1.5" />
          PAGAR
        </button>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => onNavigate && onNavigate('payment-history', { saleId })} 
            className="flex-1 bg-[#F3F4F6] text-[#333333] border border-gray-300 font-bold py-2 text-xs flex justify-center items-center rounded-sm shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 mr-1 text-[#555555]" />
            Historial
          </button>
          <button className="flex-1 bg-[#2563EB] text-white font-bold py-2 text-xs flex justify-center items-center rounded-sm shadow-sm hover:bg-[#1d4ed8] transition-colors cursor-pointer">
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Editar
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('sales')} 
            className="flex-[0.5] bg-gray-200 text-[#333333] border border-gray-300 font-bold py-2 text-xs flex justify-center items-center rounded-sm shadow-sm hover:bg-gray-300 transition-colors cursor-pointer"
          >
            Volver
          </button>
        </div>
      </div>

    </div>
  );
}
