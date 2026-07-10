import { Box, Screen } from '../../../types';
import { PerformanceMetrics } from '../../../utils/performanceMetrics';
import { PerformanceWorkerCard } from './PerformanceWorkerCard';
import { PerformancePortfolioCard } from './PerformancePortfolioCard';
import { PerformanceActionsCard } from './PerformanceActionsCard';

interface PerformanceCardsGridProps {
  box: Box;
  userName: string;
  metrics: PerformanceMetrics;
  onNavigate?: (screen: Screen) => void;
}

export function PerformanceCardsGrid({
  box,
  userName,
  metrics,
  onNavigate,
}: PerformanceCardsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 flex-1">
      <PerformanceWorkerCard box={box} metrics={metrics} />
      <PerformancePortfolioCard box={box} metrics={metrics} />
      <PerformanceActionsCard box={box} userName={userName} metrics={metrics} onNavigate={onNavigate} />
    </div>
  );
}
