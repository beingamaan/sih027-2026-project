import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

interface ResourceUtilizationChartProps {
  data?: Array<{ name: string; utilization: number; idle: number; type: string }>;
}

export const ResourceUtilizationChart: React.FC<ResourceUtilizationChartProps> = ({ data = [] }) => {
  const fallbackData = [
    { name: 'Tamping M/C 01', utilization: 82, idle: 18 },
    { name: 'BCM M/C 03', utilization: 68, idle: 32 },
    { name: 'Tower Wagon TW-04', utilization: 74, idle: 26 },
    { name: 'Wiring Train WT-01', utilization: 61, idle: 39 },
    { name: 'Track Gang G-101', utilization: 89, idle: 11 },
  ];

  const chartData = data.length > 0 ? data : fallbackData;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">Key Resource Utilization (%)</h3>
          <p className="text-xs text-slate-500">Track machines, OHE wagons, and maintenance gangs</p>
        </div>
        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
          7-Day Planning Horizon
        </span>
      </div>

      <div className="h-64 mt-4 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} width={110} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="utilization" name="Active Operational %" fill="#0284c7" stackId="a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="idle" name="Idle / Transit %" fill="#e2e8f0" stackId="a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
