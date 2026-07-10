import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fmtCents } from '../../../utils/fmtCents';

interface DualAxisChartProps {
  title: string;
  barLegend: string;
  lineLegend: string;
  barColor: string;
  lineColor: string;
  leftLabel: string;
  rightLabel: string;
  isRightPercent?: boolean;
  hasPaging?: boolean;
  pageIndex?: number;
  onPagePrev?: () => void;
  onPageNext?: () => void;
  data: Array<{ label: string; barVal: number; lineVal: number }>;
}

export function SymmetricDualAxisChart({
  title,
  barLegend,
  lineLegend,
  barColor,
  lineColor,
  leftLabel,
  rightLabel,
  isRightPercent = false,
  hasPaging = false,
  pageIndex = 0,
  onPagePrev,
  onPageNext,
  data,
}: DualAxisChartProps) {
  const maxBar = Math.max(...data.map((d) => d.barVal), 1);
  const maxLine = Math.max(...data.map((d) => d.lineVal), 1);

  const width = 420;
  const height = 150;
  const paddingLeft = 45;
  const paddingRight = 45;
  const paddingTop = 15;
  const paddingBottom = 30;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i * plotWidth) / (data.length - 1 || 1);
    const y = height - paddingBottom - (d.lineVal / maxLine) * plotHeight;
    return { x, y, val: d.lineVal, label: d.label };
  });

  let linePath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} ${points
      .slice(1)
      .map((point) => `L ${point.x} ${point.y}`)
      .join(' ')}`;
  }

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="bg-white border-b border-gray-100 py-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-900 font-extrabold text-sm uppercase tracking-tight">{title}</span>
          {hasPaging && (
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-black">
              <button
                type="button"
                onClick={onPagePrev}
                className="hover:opacity-80 active:scale-95 transition-all p-0.5 cursor-pointer"
              >
                <ChevronLeft size={12} className="stroke-[3]" />
              </button>
              <span>{pageIndex + 1}/2</span>
              <button
                type="button"
                onClick={onPageNext}
                className="hover:opacity-80 active:scale-95 transition-all p-0.5 cursor-pointer"
              >
                <ChevronRight size={12} className="stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-[10px] font-bold text-[#555555] mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2.5 rounded-xs" style={{ backgroundColor: barColor }} />
          <span>{barLegend}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5" style={{ backgroundColor: lineColor }} />
          <span>{lineLegend}</span>
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-[15px] bottom-[30px] left-0 flex flex-col justify-between text-[10px] text-gray-400 font-mono font-bold leading-none select-none">
          <span>100</span>
          <span>50</span>
          <span>0</span>
        </div>
        <div className="absolute top-[15px] bottom-[30px] right-0 flex flex-col justify-between text-[10px] text-gray-400 font-mono font-bold leading-none select-none">
          <span>{isRightPercent ? '100%' : '100'}</span>
          <span>{isRightPercent ? '50%' : '50'}</span>
          <span>{isRightPercent ? '0%' : '0'}</span>
        </div>

        <span className="absolute left-[-15px] top-[45%] -translate-y-1/2 -rotate-90 text-[10px] font-extrabold text-gray-400 select-none tracking-tight">
          {leftLabel}
        </span>
        <span className="absolute right-[-18px] top-[45%] -translate-y-1/2 rotate-90 text-[10px] font-extrabold text-gray-400 select-none tracking-tight">
          {rightLabel}
        </span>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {[0, 0.5, 1].map((ratio) => {
            const y = paddingTop + ratio * plotHeight;
            return (
              <line
                key={ratio}
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth={1}
                strokeDasharray={ratio !== 1 ? '3 3' : undefined}
              />
            );
          })}

          {data.map((d, i) => {
            const totalItems = data.length;
            const barWidth = Math.min(16, plotWidth / totalItems - 10);
            const x = paddingLeft + (i * plotWidth) / (totalItems - 1 || 1) - barWidth / 2;
            const barHeight = (d.barVal / maxBar) * plotHeight;
            const y = height - paddingBottom - barHeight;

            return (
              <g
                key={d.label}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer group"
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 1.5)}
                  fill={barColor}
                  rx={1.5}
                  className="transition-all duration-300 hover:brightness-95"
                />
                {hoveredIdx === i && (
                  <rect
                    x={x - 4}
                    y={paddingTop}
                    width={barWidth + 8}
                    height={plotHeight}
                    fill="rgba(0,0,0,0.02)"
                    rx={2}
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}

          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={lineColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((point, i) => (
            <g
              key={`point-${point.label}`}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              <circle cx={point.x} cy={point.y} r={3.5} fill="white" stroke={lineColor} strokeWidth={2} />
              {hoveredIdx === i && (
                <g pointerEvents="none">
                  <rect x={point.x - 45} y={point.y - 28} width={90} height={20} fill="#1E293B" rx={3} />
                  <text x={point.x} y={point.y - 15} fill="white" fontSize={8} textAnchor="middle" fontWeight="bold">
                    {isRightPercent ? `${point.val.toFixed(0)}%` : point.val.toLocaleString()} /{' '}
                    {data[i].barVal >= 100 ? fmtCents(data[i].barVal) : data[i].barVal.toFixed(0)}
                  </text>
                </g>
              )}
            </g>
          ))}

          {data.map((d, i) => {
            const x = paddingLeft + (i * plotWidth) / (data.length - 1 || 1);
            const y = height - paddingBottom + 14;
            return (
              <text
                key={`label-${d.label}`}
                x={x}
                y={y}
                transform={`rotate(-25, ${x}, ${y})`}
                textAnchor="end"
                className="text-[9px] font-extrabold fill-gray-400 select-none"
              >
                {d.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
