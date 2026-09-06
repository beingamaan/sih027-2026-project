import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ListTodo, 
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
    { name: 'Planning', path: '/planning', icon: CalendarClock },
    { name: 'Train Graph', path: '/train-graph', icon: Train },
    { name: 'What-If Analysis', path: '/what-if', icon: Beaker },
    { name: 'Field Execution', path: '/field', icon: HardHat },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col h-screen fixed top-0 left-0 border-r border-slate-800 z-30">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
          <Train size={20} />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            SIH26027
            <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700/50 px-1.5 py-0.5 rounded font-mono">PROTOTYPE</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Automatic Block Planning</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Operations Portal</p>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info & Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <Link to="/profile" className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-900/80 border border-slate-800 mb-3 hover:bg-slate-800 transition-colors">
          <UserCircle2 size={32} className="text-blue-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">EMP-90823</p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              View Profile
            </p>
          </div>
        </Link>

        <div className="flex items-center justify-between text-xs text-slate-400 px-2 pt-1">
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
