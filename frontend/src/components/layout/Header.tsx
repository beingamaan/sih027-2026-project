import React from 'react';
import { Bell, ShieldCheck, Activity } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  title = 'Railway Operations Decision Support', 
  subtitle = 'Northern Railway Division (Synthetic Demo Sandbox)' 
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
        <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-xs font-semibold">
          <Activity size={13} className="animate-pulse text-emerald-600" />
          FastAPI Backend: Online (:8000)
        </div>

        <div className="h-6 w-px bg-slate-200"></div>

        <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg">
          <ShieldCheck size={14} className="text-blue-600" />
          <span>RB-IR Ruleset v2.4</span>
        </div>
      </div>
    </header>
  );
};
