import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  trend?: string;
  variant?: 'default' | 'blue' | 'red' | 'amber' | 'green';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  variant = 'default',
}) => {
  const borderStyles = {
    default: 'border-slate-200 hover:border-slate-300',
    blue: 'border-blue-200 bg-blue-50/20 hover:border-blue-300',
    red: 'border-rose-200 bg-rose-50/20 hover:border-rose-300',
    amber: 'border-amber-200 bg-amber-50/20 hover:border-amber-300',
    green: 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300',
  };

  const iconStyles = {
    default: 'text-slate-600 bg-slate-100',
    blue: 'text-blue-600 bg-blue-100',
    red: 'text-rose-600 bg-rose-100',
    amber: 'text-amber-700 bg-amber-100',
    green: 'text-emerald-700 bg-emerald-100',
  };

  return (
    <div className={`p-5 bg-white rounded-xl border shadow-xs transition-all ${borderStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1.5">{value}</h3>
          {subtext && <p className="text-xs text-slate-500 mt-1 font-medium">{subtext}</p>}
        </div>
        <div className={`p-2.5 rounded-lg shrink-0 ${iconStyles[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
