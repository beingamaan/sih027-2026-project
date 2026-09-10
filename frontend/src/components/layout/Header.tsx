import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Activity, 
  Command,
  ChevronDown,
  LogOut,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { useSidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { HandbackInterlockModal } from '../modals/HandbackInterlockModal';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  title = 'Indian Railways Operations', 
  subtitle = 'Northern Railway · Delhi Division' 
}) => {
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const { userProfile, currentProfile, activeRole, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [syncSeconds, setSyncSeconds] = useState(12);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInterlockModalOpen, setIsInterlockModalOpen] = useState(false);
  const [interlockPending, setInterlockPending] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sih_joint_interlock_cleared') !== 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.cleared || e.detail?.pending === 0) {
        setInterlockPending(false);
      }
    };
    window.addEventListener('interlock-status-changed', handler);
    return () => window.removeEventListener('interlock-status-changed', handler);
  }, []);

  // Real-time ticking clock & sync counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setSyncSeconds(prev => (prev >= 60 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const userName = userProfile?.name || currentProfile.name;
  const serviceId = userProfile?.service_id || currentProfile.defaultServiceId;
  const designation = userProfile?.designation || currentProfile.title;

  const getDeptInfo = () => {
    const d = (userProfile?.department || currentProfile.department || '').toUpperCase();
    const r = userProfile?.role || activeRole;
    if (d === 'ENG') return { label: 'ENG - P.Way', style: 'bg-amber-50 text-amber-900 border-amber-300' };
    if (d === 'TRD') return { label: 'TRD - Electrical', style: 'bg-purple-50 text-purple-900 border-purple-300' };
    if (d === 'SNT' || d === 'S&T') return { label: 'S&T - Signalling', style: 'bg-teal-50 text-teal-900 border-teal-300' };
    if (r === 'SECTION_CONTROLLER') return { label: 'OPERATIONS', style: 'bg-blue-50 text-blue-900 border-blue-300' };
    if (r === 'STATION_MASTER') return { label: 'OPERATIONS', style: 'bg-cyan-50 text-cyan-900 border-cyan-300' };
    if (r === 'DIVISIONAL_OFFICER') return { label: 'OPERATIONS', style: 'bg-indigo-50 text-indigo-900 border-indigo-300' };
    return { label: d || 'OPERATIONS', style: 'bg-blue-50 text-blue-900 border-blue-300' };
  };

  const deptInfo = getDeptInfo();
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'IR';

  return (
    <header 
      className="w-full h-16 bg-white border-b border-slate-200 px-3 md:px-5 flex items-center justify-between gap-2 sticky top-0 z-30 min-w-0 shadow-[0_2px_8px_rgba(15,42,67,0.03)]"
    >
      {/* Left: Hamburger toggle + Search wrapper */}
      <div className="flex items-center gap-2 flex-1 min-w-0 max-w-sm">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Sidebar"
          className="p-1.5 rounded-lg text-[#334E68] hover:text-[#102A43] hover:bg-[#F0F4F8] transition-colors cursor-pointer shrink-0"
        >
          <Menu size={20} />
        </button>

        {/* Search input */}
        <div className="relative w-full min-w-0">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, stations, assets..."
            className="w-full text-xs placeholder:text-slate-400 py-1.5 pl-8 pr-3 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
          />
        </div>
      </div>

      {/* Center pills (Interlock + System Live): hidden on smaller viewports */}
      <div className="hidden xl:flex items-center gap-2 shrink-0">
        {/* Top-bar Joint Handback Interlock Status Badge / Trigger */}
        <button
          onClick={() => setIsInterlockModalOpen(true)}
          title="Click to view Joint Track Handback & Interlock Safety Barrier (G&SR Rule 4.14)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black transition-all shadow-2xs cursor-pointer ${
            interlockPending
              ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 ring-1 ring-amber-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 ring-1 ring-emerald-200'
          }`}
        >
          {interlockPending ? (
            <>
              <ShieldAlert size={14} className="text-amber-600 animate-pulse shrink-0" />
              <span>Interlock (1 Pending)</span>
            </>
          ) : (
            <>
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              <span>Interlock (0 Pending · All Clear)</span>
            </>
          )}
        </button>

        {/* Live Telemetry & Status Block */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EAF6F0] border border-[#C6EADB] text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16805C] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16805C]"></span>
          </span>
          <span className="font-bold text-[#16805C] flex items-center gap-1.5 text-[11px]">
            ● System Live
          </span>
          <span className="text-[11px] text-[#334E68] border-l border-[#C6EADB] pl-2 font-mono">
            Last sync: {syncSeconds}s
          </span>
        </div>
      </div>

      {/* Right cluster: ALWAYS visible, never pushed off-screen */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {/* Station Master / User Status Pill: compact, hidden on < lg */}
        <div className="hidden lg:flex max-w-[180px] items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 shadow-2xs">
          <div className="w-6 h-6 rounded-full bg-[#102A43] text-[#ECC94B] font-black text-[10px] flex items-center justify-center shadow-xs shrink-0 ring-1 ring-slate-200">
            {initials}
          </div>
          <span className="truncate text-xs font-bold text-slate-800">
            {userProfile?.name || userName}
          </span>
        </div>

        {/* Notifications Bell with Red Badge (3) */}
        <button 
          aria-label="Notifications"
          className="relative p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
        >
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#B42332] text-white text-[8px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
            3
          </span>
        </button>

        {/* Dark/Light Mode Toggle Icon */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          aria-label="Toggle Theme"
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
        >
          {isDarkMode ? <Sun size={17} className="text-[#D9901A]" /> : <Moon size={17} />}
        </button>

        <div className="h-5 w-px bg-slate-200"></div>

        {/* Clean [Sign Out] button: ALWAYS 100% visible inside viewport */}
        <button
          onClick={() => logout(navigate)}
          title="Sign Out (Close secure session)"
          className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
        >
          <LogOut size={14} className="text-slate-500 hover:text-rose-600 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* G&SR Rule 4.14 Joint Handback Safety Interlock Modal */}
      <HandbackInterlockModal
        isOpen={isInterlockModalOpen}
        onClose={() => setIsInterlockModalOpen(false)}
        onHandbackSuccess={() => setInterlockPending(false)}
      />
    </header>
  );
};

export const Navbar = Header;

