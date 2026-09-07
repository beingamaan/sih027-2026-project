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
  const variantStyles = {
    default: 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md',
    blue: 'border-blue-200/90 bg-gradient-to-b from-blue-50/40 to-white hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/5',
    red: 'border-rose-200/90 bg-gradient-to-b from-rose-50/40 to-white hover:border-rose-300 hover:shadow-md hover:shadow-rose-500/5',
    amber: 'border-amber-200/90 bg-gradient-to-b from-amber-50/40 to-white hover:border-amber-300 hover:shadow-md hover:shadow-amber-500/5',
    green: 'border-emerald-200/90 bg-gradient-to-b from-emerald-50/40 to-white hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/5',
  };

  const iconStyles = {
    default: 'text-slate-700 bg-slate-100/80 ring-1 ring-slate-200/60',
    blue: 'text-blue-600 bg-blue-100/80 ring-1 ring-blue-200/60 shadow-xs shadow-blue-500/10',
    red: 'text-rose-600 bg-rose-100/80 ring-1 ring-rose-200/60 shadow-xs shadow-rose-500/10',
    amber: 'text-amber-700 bg-amber-100/80 ring-1 ring-amber-200/60 shadow-xs shadow-amber-500/10',
    green: 'text-emerald-700 bg-emerald-100/80 ring-1 ring-emerald-200/60 shadow-xs shadow-emerald-500/10',
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-xs transition-all duration-200 hover:-translate-y-0.5 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight">{value}</h3>
          {subtext && <p className="text-xs text-slate-500 mt-1 font-medium leading-snug">{subtext}</p>}
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-105 ${iconStyles[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
