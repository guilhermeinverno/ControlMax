import { useState, useEffect } from 'react';
import { useTenant } from '../hooks/useTenant';
import { Screen, Box } from '../types';
import {
  CollectionRecord,
  CreditRequestRecord,
  subscribePerformanceData,
} from '../hooks/usePerformanceData';
import { computePerformanceMetrics } from '../utils/performanceMetrics';
import { PerformanceEmptyState } from './components/performance/PerformanceEmptyState';
import { PerformanceHeader } from './components/performance/PerformanceHeader';
import { PerformanceCardsGrid } from './components/performance/PerformanceCardsGrid';

interface PerformanceProps {
  onNavigate?: (screen: Screen) => void;
}

export function Performance({ onNavigate }: PerformanceProps) {
  const { tenantId, loading: tenantLoading, userName } = useTenant();
  const [loading, setLoading] = useState(true);
  const [box, setBox] = useState<Box | null>(null);
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [creditRequests, setCreditRequests] = useState<CreditRequestRecord[]>([]);

  useEffect(() => {
    if (!tenantId) return;
    return subscribePerformanceData(
      tenantId,
      setBox,
      ({ collections: loadedCollections, creditRequests: loadedRequests }) => {
        setCollections(loadedCollections);
        setCreditRequests(loadedRequests);
      },
      setLoading
    );
  }, [tenantId]);

  if (loading || tenantLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#F3F4F6]">
        <div className="border-2 border-[#6B21A8] border-t-transparent rounded-full w-8 h-8 animate-spin" />
        <p className="text-xs text-[#555555] font-bold uppercase mt-3 tracking-wider">Cargando Desempeño...</p>
      </div>
    );
  }

  if (!box) {
    return <PerformanceEmptyState onNavigate={onNavigate} />;
  }

  const metrics = computePerformanceMetrics(box, collections, creditRequests);

  return (
    <div className="bg-[#F3F4F6] min-h-screen text-[#333333] flex flex-col">
      <PerformanceHeader onNavigate={onNavigate} />
      <PerformanceCardsGrid
        box={box}
        userName={userName}
        metrics={metrics}
        onNavigate={onNavigate}
      />
    </div>
  );
}
