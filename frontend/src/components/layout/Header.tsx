import React from 'react';
import { Bell, ShieldCheck, Activity } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  title = 'Railway Operations Decision Support', 
  subtitle = 'Corridor Traffic & Maintenance Optimization' 
}) => {
  return (
    <header className="relative bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-8 py-3 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Decorative Railway Track Line at Top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-blue-600 to-emerald-500"></div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 font-extrabold text-xs tracking-tighter">
          IR
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            {title}
            <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded-full font-mono font-bold">
              🚂 CORRIDOR 01
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-900 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>Section Speed: 110 KMPH</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50/90 border border-emerald-200/80 rounded-full text-emerald-800 text-xs font-bold shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Activity size={13} className="text-emerald-600" />
          <span>FastAPI Engine: Online</span>
        </div>

        <div className="h-5 w-px bg-slate-200/80"></div>

        <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-200 active:scale-95">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100/90 border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-2xs">
          <ShieldCheck size={14} className="text-blue-600" />
          <span>IR-Safety Standard</span>
        </div>
      </div>
    </header>
  );
};
