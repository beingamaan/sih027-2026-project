import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

interface TrainImpactChartProps {
  data?: Array<{ section: string; baseline: number; plan_a: number; plan_b: number }>;
}

export const TrainImpactChart: React.FC<TrainImpactChartProps> = ({ data = [] }) => {
  const fallbackData = [
    { section: 'NDLS-GZB', baseline: 65, plan_a: 18, plan_b: 32 },
    { section: 'GZB-MB', baseline: 50, plan_a: 12, plan_b: 24 },
    { section: 'MB-BE', baseline: 45, plan_a: 14, plan_b: 26 },
    { section: 'BE-LKO', baseline: 35, plan_a: 8, plan_b: 16 },
  ];

  const chartData = data.length > 0 ? data : fallbackData;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">Train Detention & Impact (Simulated)</h3>
          <p className="text-xs text-slate-500">Estimated cumulative passenger & freight detention minutes</p>
        </div>
        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
          Simulated Heuristic Model
        </span>
      </div>

      <div className="h-64 mt-4 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="section" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} unit="m" />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="baseline" name="Baseline (Unplanned)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="plan_b" name="Plan B (Alternative)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="plan_a" name="Plan A (Optimal)" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
