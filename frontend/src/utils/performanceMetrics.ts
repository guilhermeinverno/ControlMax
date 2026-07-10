import { Box } from '../types';
import { CollectionRecord, CreditRequestRecord } from '../hooks/usePerformanceData';

export interface PerformanceMetrics {
  formattedOpenTime: string;
  formattedOpenDate: string;
  totalCollections: number;
  totalSales: number;
  carteraFinal: number;
  variationPercent: string;
  carteraRecaudadaPercent: string;
  totalClientCount: number;
  compliancePercent: string;
  pendingCreditRequests: number;
  rejectedCreditRequests: number;
  approvedCreditRequests: number;
  paymentsCount: number;
  nonPaymentsCount: number;
  synchronizedCount: number;
  efficiencyPercent: string;
}

function percentOfCollectionsOverSales(totalCollections: number, totalSales: number): string {
  if (totalSales <= 0) return '0,00%';
  return ((totalCollections / totalSales) * 100).toFixed(2) + '%';
}

export function computePerformanceMetrics(
  box: Box,
  collections: CollectionRecord[],
  creditRequests: CreditRequestRecord[]
): PerformanceMetrics {
  const totalCollections = box.totalCollections || 0;
  const totalSales = box.totalSales || 0;
  const ratioPercent = percentOfCollectionsOverSales(totalCollections, totalSales);

  const pendingCreditRequests = creditRequests.filter((r) => r.status === 'pending').length;
  const rejectedCreditRequests = creditRequests.filter((r) => r.status === 'rejected').length;
  const approvedCreditRequests = creditRequests.filter((r) => r.status === 'approved').length;

  const paymentsCount = collections.length;
  const nonPaymentsCount = Math.max(0, creditRequests.length - collections.length);

  return {
    formattedOpenTime: box.openedAt
      ? box.openedAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : '---',
    formattedOpenDate: box.openedAt ? box.openedAt.toDate().toLocaleDateString('pt-BR') : '---',
    totalCollections,
    totalSales,
    carteraFinal: totalCollections + totalSales,
    variationPercent: ratioPercent,
    carteraRecaudadaPercent: ratioPercent,
    totalClientCount: creditRequests.length,
    compliancePercent: ratioPercent,
    pendingCreditRequests,
    rejectedCreditRequests,
    approvedCreditRequests,
    paymentsCount,
    nonPaymentsCount,
    synchronizedCount: collections.length,
    efficiencyPercent:
      creditRequests.length > 0
        ? ((collections.length / creditRequests.length) * 100).toFixed(2) + '%'
        : '0,00%',
  };
}
