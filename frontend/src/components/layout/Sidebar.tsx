import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ListTodo, 
  PlusCircle,
  CalendarClock, 
  Beaker, 
  HardHat, 
  BarChart3, 
  UserCircle2, 
  LogOut, 
  Settings,
  Train
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', path: '/tasks', icon: ListTodo },
    { name: 'Add Task', path: '/add-task', icon: PlusCircle },
    { name: 'Planning', path: '/planning', icon: CalendarClock },
    { name: 'Train Graph', path: '/train-graph', icon: Train },
    { name: 'What-If Analysis', path: '/what-if', icon: Beaker },
    { name: 'Field Execution', path: '/field', icon: HardHat },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-200 flex flex-col h-screen fixed top-0 left-0 border-r border-slate-800/90 z-30 shadow-2xl">
      {/* Railway Track Accent Pattern on Sidebar Edge */}
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 via-amber-500 to-emerald-500 opacity-80"></div>

      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-600/30 ring-1 ring-white/20 font-black text-sm">
          IR
        </div>
        <div>
          <h1 className="text-sm font-black tracking-wider text-white flex items-center gap-1.5">
            INDIAN RAILWAYS
          </h1>
          <p className="text-[10px] text-amber-400 font-extrabold tracking-widest uppercase">Corridor Control • SIH26027</p>
        </div>
      </div>

      {/* Railway Signal Status Panel */}
      <div className="mx-3 mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between shadow-inner">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Corridor Signal:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
          <span className="text-[11px] font-extrabold text-emerald-400 font-mono">CLEAR (PROCEED)</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Operations Portal</p>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/60 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></span>
              )}
              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200 transition-colors'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info & Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950">
        <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 mb-3 hover:bg-slate-900 transition-all group shadow-inner">
          <div className="relative">
            <UserCircle2 size={32} className="text-blue-400 shrink-0 group-hover:text-blue-300 transition-colors" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-pulse"></span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate group-hover:text-blue-200 transition-colors">EMP-90823</p>
            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <span>Section Controller</span>
            </p>
          </div>
        </Link>

        <div className="flex items-center justify-between text-xs text-slate-400 px-2 pt-1 font-medium">
          <button className="hover:text-white flex items-center gap-1.5 transition-colors">
            <Settings size={14} /> Settings
          </button>
          <Link to="/login" className="hover:text-rose-400 flex items-center gap-1.5 transition-colors">
            <LogOut size={14} /> Logout
          </Link>
        </div>
      </div>
    </aside>
  );
};
