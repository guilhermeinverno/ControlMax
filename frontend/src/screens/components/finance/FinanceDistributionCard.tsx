import { fmtFinanceValue } from '../../../utils/financeMetrics';

interface FinanceDistributionCardProps {
  distributionData: Record<string, number>;
}

export function FinanceDistributionCard({ distributionData }: FinanceDistributionCardProps) {
  const entries = Object.entries(distributionData);
  const maxCnValue = Math.max(...Object.values(distributionData).map(Math.abs), 1);

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 flex flex-col space-y-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
        Balance por Origen / Centro
      </h3>

      {entries.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-xs">Sin datos operacionales este mes.</div>
      ) : (
        <div className="space-y-5">
          {entries.map(([cnName, balance]) => {
            const absBal = Math.abs(balance);
            const percentage = Math.min((absBal / maxCnValue) * 100, 100);
            return (
              <div key={cnName} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-700 truncate max-w-[180px]">{cnName}</span>
                  <span className={balance >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {balance < 0 ? '-' : ''}
                    {fmtFinanceValue(absBal)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      balance >= 0 ? 'bg-purple-600' : 'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
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
  );
}
