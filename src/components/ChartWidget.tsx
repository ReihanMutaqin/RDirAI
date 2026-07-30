'use client';

import React from 'react';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartWidgetProps {
  type: 'bar' | 'pie' | 'donut';
  title?: string;
  subtitle?: string;
  data: ChartDataPoint[];
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
];

export const ChartWidget: React.FC<ChartWidgetProps> = ({
  type = 'bar',
  title,
  subtitle,
  data = [],
}) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const totalValue = data.reduce((acc, d) => acc + d.value, 0);

  // Render Bar Chart (Diagram Batang)
  if (type === 'bar') {
    return (
      <div className="my-5 p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-slate-100 shadow-xl max-w-2xl">
        {title && (
          <div className="mb-4">
            <h4 className="text-sm font-bold font-mono text-blue-400 tracking-wide uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 animate-pulse"></span>
              {title}
            </h4>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
        )}

        <div className="space-y-3.5">
          {data.map((item, idx) => {
            const percentage = ((item.value / maxValue) * 100).toFixed(1);
            const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-slate-200">{item.label}</span>
                  <span className="text-slate-400 font-bold">
                    {item.value.toLocaleString()} <span className="text-[10px] text-slate-500">({((item.value / totalValue) * 100).toFixed(1)}%)</span>
                  </span>
                </div>

                <div className="h-3.5 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50 shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out shadow-md"
                    style={{
                      width: `${Math.max(Number(percentage), 4)}%`,
                      backgroundColor: color,
                      boxShadow: `0 0 10px ${color}66`,
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render Pie/Donut Chart (Diagram Bundar / Lingkaran)
  let accumulatedAngle = 0;
  const slices = data.map((item, idx) => {
    const angle = (item.value / totalValue) * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;
    const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];

    return { ...item, startAngle, angle, color };
  });

  // Calculate SVG Conic Gradient string for CSS Donut Chart
  let currentPct = 0;
  const gradientStops = data.map((item, idx) => {
    const pct = (item.value / totalValue) * 100;
    const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
    const start = currentPct;
    currentPct += pct;
    return `${color} ${start}% ${currentPct}%`;
  }).join(', ');

  return (
    <div className="my-5 p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-slate-100 shadow-xl max-w-2xl">
      {title && (
        <div className="mb-4">
          <h4 className="text-sm font-bold font-mono text-purple-400 tracking-wide uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
            {title}
          </h4>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
        {/* CSS Conic Gradient Donut Wheel */}
        <div className="relative shrink-0 flex items-center justify-center">
          <div
            className="w-40 h-40 rounded-full shadow-lg transition-transform hover:scale-105 duration-300"
            style={{
              background: `conic-gradient(${gradientStops})`,
              boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            }}
          ></div>
          {/* Inner Circle for Donut Hole */}
          <div className="absolute w-24 h-24 rounded-full bg-slate-950 flex flex-col items-center justify-center border border-slate-800 shadow-inner">
            <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase">Total</span>
            <span className="text-sm font-bold font-mono text-purple-400">{totalValue.toLocaleString()}</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-2 w-full">
          {slices.map((slice, idx) => {
            const pct = ((slice.value / totalValue) * 100).toFixed(1);
            return (
              <div key={idx} className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-slate-800/40 border border-slate-800/80 hover:bg-slate-800/80 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: slice.color, boxShadow: `0 0 6px ${slice.color}aa` }}
                  ></span>
                  <span className="font-medium text-slate-200 truncate">{slice.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400">{slice.value.toLocaleString()}</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 font-bold text-[10px]">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
