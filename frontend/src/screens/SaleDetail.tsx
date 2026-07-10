import { AlertCircle, Loader2 } from 'lucide-react';
import { Screen } from '../types';
import { useTenant } from '../hooks/useTenant';
import { useSaleDetailData } from '../hooks/useSaleDetailData';
import { buildSaleFinancialDisplay } from '../utils/saleDetailDisplay';
import { SaleDetailContent } from './components/saleDetail/SaleDetailContent';

interface SaleDetailProps {
  onNavigate?: (screen: Screen, params?: Record<string, unknown>) => void;
  params?: Record<string, unknown>;
}

export function SaleDetail({ onNavigate, params }: SaleDetailProps) {
  const { tenantId } = useTenant();
  const saleId = params?.saleId as string | undefined;
  const { sale, payments, loading } = useSaleDetailData(saleId, tenantId);

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

  const financial = buildSaleFinancialDisplay(sale);

  return (
    <SaleDetailContent
      sale={sale}
      payments={payments}
      financial={financial}
      saleId={saleId}
      onNavigate={onNavigate}
    />
  );
}
