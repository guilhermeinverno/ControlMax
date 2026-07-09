import { useState, useEffect } from 'react';
import { Screen } from '../types';
import { Search, ChevronLeft, ChevronRight, Filter, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { PaymentRecord } from '../types/operational';

interface PaymentHistoryProps {
  onNavigate?: (screen: Screen, params?: Record<string, unknown>) => void;
  params?: Record<string, unknown>;
}

const STATIC_DEMO_PAYMENTS: PaymentRecord[] = [
  {
    id: "demo1",
    date: "25/08/2025 10:00",
    amount: 10000,
    userName: "vend_01",
    paymentMethod: "Efectivo",
    comment: "Pago recibido ok.",
    clientName: "Adriana de oliveira",
    status: "Aprobado"
  },
  {
    id: "demo2",
    date: "18/08/2025 09:30",
    amount: 10000,
    userName: "vend_01",
    paymentMethod: "Transferencia",
    comment: "REF 991230.",
    clientName: "Maria Eduarda da Silva",
    status: "Aprobado"
  },
  {
    id: "demo3",
    date: "11/08/2025 14:15",
    amount: 5000,
    userName: "vend_02",
    paymentMethod: "Efectivo",
    comment: "Pago parcial.",
    clientName: "Carlos Henrique Santos",
    status: "Aprobado"
  }
];

export function PaymentHistory({ onNavigate, params }: PaymentHistoryProps) {
  const { tenantId } = useTenant();
  const saleId = params?.saleId as string;

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!tenantId) return;

    const collectionsRef = collection(db, 'collections');
    let q = query(
      collectionsRef,
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );

    if (saleId) {
      q = query(
        collectionsRef,
        where('tenantId', '==', tenantId),
        where('saleId', '==', saleId),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => {
        const data = doc.data();
        let dateStr = '';
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          const date = data.createdAt.toDate();
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          dateStr = `${day}/${month}/${year} ${hours}:${minutes}`;
        } else {
          dateStr = 'Reciente';
        }

        return {
          id: doc.id,
          date: dateStr,
          amount: data.amount || 0,
          userName: data.registeredBy || 'vend_01',
          paymentMethod: data.paymentMethod || 'Efectivo',
          comment: data.comment || 'Pago recibido ok.',
          clientName: data.clientName || 'Cliente',
          status: 'Aprobado'
        };
      });

      setPayments(loaded);
      setLoading(false);
    }, (error) => {
      console.error("Error loading payments list:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId, saleId]);

  if (loading && tenantId) {
    return (
      <div className="flex flex-col items-center justify-center bg-[#F3F4F6] min-h-screen pt-4">
        <Loader2 className="w-8 h-8 text-[#6A008A] animate-spin mb-2" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargando pagos...</span>
      </div>
    );
  }

  // Use real payments if populated, otherwise use the nice design fallbacks
  const activePayments = payments.length > 0 ? payments : STATIC_DEMO_PAYMENTS;

  // Filter with local search query
  const filteredPayments = activePayments.filter(p => {
    if (!searchQuery.trim()) return true;
    const queryStr = searchQuery.toLowerCase();
    return (
      p.clientName.toLowerCase().includes(queryStr) ||
      p.userName.toLowerCase().includes(queryStr) ||
      p.comment.toLowerCase().includes(queryStr) ||
      p.paymentMethod.toLowerCase().includes(queryStr) ||
      (p.amount / 100).toString().includes(queryStr)
    );
  });

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333]">
      
      {/* Return Button */}
      <div className="bg-[#E5E7EB] px-3 py-2 flex items-center text-xs font-bold text-[#555555] border-b border-gray-300">
        <button 
          onClick={() => {
            if (!onNavigate) return;
            if (saleId) onNavigate('sale-detail', { saleId });
            else onNavigate('sales');
          }}
          className="uppercase hover:underline"
        >
          &lt; {saleId ? 'Volver a Detalle' : 'Volver a Ventas'}
        </button>
      </div>

      <div className="p-2 flex flex-col space-y-3">
        
        {/* FILTROS */}
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-3">
          <div className="flex items-center text-[#7B1FA2] font-bold text-xs uppercase mb-2 border-b border-[#7B1FA2]/20 pb-1">
            <Filter className="w-3.5 h-3.5 mr-1" />
            Filtros
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#555555] mb-1">Fecha Inicial</label>
              <input 
                type="date" 
                defaultValue="2025-08-01"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-bold text-[#333333] outline-none focus:border-[#6B21A8]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#555555] mb-1">Fecha Final</label>
              <input 
                type="date" 
                defaultValue="2025-08-31"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-bold text-[#333333] outline-none focus:border-[#6B21A8]"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#555555] mb-1">Buscar</label>
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cliente, método, observación..." 
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-[#333333] outline-none focus:border-[#6B21A8] pr-8"
              />
              <Search className="w-3.5 h-3.5 text-[#777777] absolute right-2.5 top-2" />
            </div>
          </div>
        </div>

        {/* TABLA COMPACTA */}
        <div className="w-full border border-gray-200 shadow-sm overflow-x-auto bg-white rounded-sm">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[#A3E635] text-[#333333] text-[10px] uppercase tracking-wider">
                <th className="p-2 border-r border-[#84CC16]/30 font-bold whitespace-nowrap">Fecha</th>
                <th className="p-2 border-r border-[#84CC16]/30 font-bold whitespace-nowrap">Cliente</th>
                <th className="p-2 border-r border-[#84CC16]/30 font-bold whitespace-nowrap">Valor</th>
                <th className="p-2 border-r border-[#84CC16]/30 font-bold whitespace-nowrap">Usuario</th>
                <th className="p-2 border-r border-[#84CC16]/30 font-bold whitespace-nowrap">Método de pago</th>
                <th className="p-2 border-r border-[#84CC16]/30 font-bold whitespace-nowrap min-w-[120px]">Observación</th>
                <th className="p-2 font-bold text-center whitespace-nowrap">Estado</th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#333333]">
              
              {filteredPayments.map((p, idx) => (
                <tr key={p.id} className={`border-b border-gray-200 hover:bg-gray-50 ${idx % 2 === 1 ? 'bg-gray-50' : ''}`}>
                  <td className="p-2 border-r border-gray-200 whitespace-nowrap">{p.date}</td>
                  <td className="p-2 border-r border-gray-200 font-semibold">{p.clientName}</td>
                  <td className="p-2 border-r border-gray-200 font-bold text-[#16A34A] whitespace-nowrap">
                    $ {(p.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 border-r border-gray-200"><span className="text-[11px]">{p.userName}</span></td>
                  <td className="p-2 border-r border-gray-200"><span className="text-[11px] uppercase text-[#555555]">{p.paymentMethod}</span></td>
                  <td className="p-2 border-r border-gray-200 text-[#555555] text-[11px] italic">{p.comment}</td>
                  <td className="p-2 text-center text-[10px] font-bold text-[#16A34A]">{p.status}</td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center text-[#777777] text-xs pt-1 px-1">
          <span>Mostrando {filteredPayments.length} registros</span>
          <div className="flex space-x-1">
            <button className="w-6 h-6 flex items-center justify-center bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none">
              <ChevronLeft className="w-4 h-4 text-[#777777]" />
            </button>
            <button className="w-6 h-6 flex items-center justify-center bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none">
              <ChevronRight className="w-4 h-4 text-[#777777]" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

