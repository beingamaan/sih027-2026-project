import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Activity, 
  Command,
  ChevronDown
} from 'lucide-react';
import { useSidebar } from './Sidebar';
import { RoleSwitcher } from './RoleSwitcher';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  title = 'Indian Railways Operations', 
  subtitle = 'Northern Railway · Delhi Division' 
}) => {
  const { toggleSidebar } = useSidebar();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [syncSeconds, setSyncSeconds] = useState(12);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time ticking clock & sync counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setSyncSeconds(prev => (prev >= 60 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header 
      style={{ backgroundColor: '#FCFBF8' }}
      className="border-b border-[#D9E0E8] px-5 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-[0_2px_8px_rgba(15,42,67,0.03)]"
    >
      {/* Left: Hamburger + Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Sidebar"
          className="p-2 rounded-lg text-[#334E68] hover:text-[#102A43] hover:bg-[#F0F4F8] transition-colors cursor-pointer shrink-0"
        >
          <Menu size={20} />
        </button>

        {/* Global Search Bar */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#829AB1]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for tasks, stations, equipment, km range... [⌘ K]"
            className="w-full pl-9 pr-14 py-2 text-xs bg-[#F0F4F8] text-[#102A43] placeholder-[#829AB1] rounded-lg border border-[#D9E0E8] focus:bg-white focus:outline-none focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/20 transition-all font-sans"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-[#627D98] bg-[#D9E0E8]/70 px-1.5 py-0.5 rounded font-mono font-bold pointer-events-none">
            <Command size={10} /> K
          </div>
        </div>
      </div>

      {/* Right: Telemetry + Role Switcher + Alerts + Avatar */}
      <div className="flex items-center gap-3.5 shrink-0 ml-4">
        {/* Live Telemetry & Status Block */}
        <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#EAF6F0] border border-[#C6EADB] text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16805C] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16805C]"></span>
          </span>
          <span className="font-bold text-[#16805C] flex items-center gap-1.5 text-[11px]">
            ● System Live
          </span>
          <span className="text-[11px] text-[#334E68] border-l border-[#C6EADB] pl-2 font-mono">
            Last sync: {syncSeconds} sec ago
          </span>
          <span className="text-[10px] text-[#627D98] font-mono border-l border-[#C6EADB] pl-2 hidden lg:inline">
            {currentTime.toLocaleTimeString('en-IN', { hour12: true })}
          </span>
        </div>

        {/* Role Switcher */}
        <RoleSwitcher />

        {/* Notifications Bell with Red Badge (3) */}
        <button 
          aria-label="Notifications"
          className="relative p-2 rounded-lg text-[#486581] hover:text-[#102A43] hover:bg-[#F0F4F8] transition-colors cursor-pointer"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#B42332] text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-[#FCFBF8]">
            3
          </span>
        </button>

        {/* Dark/Light Mode Toggle Icon */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          aria-label="Toggle Theme"
          className="p-2 rounded-lg text-[#486581] hover:text-[#102A43] hover:bg-[#F0F4F8] transition-colors cursor-pointer"
        >
          {isDarkMode ? <Sun size={18} className="text-[#D9901A]" /> : <Moon size={18} />}
        </button>

        <div className="h-6 w-px bg-[#D9E0E8]"></div>

        {/* User Avatar Pill: RS | Rajesh Sharma | Operations / HDN-04 */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#F0F4F8] border border-[#D9E0E8] hover:border-[#BCC8D6] transition-colors cursor-pointer">
          <div className="w-7 h-7 rounded-md bg-[#1E5AA8] text-white text-xs font-black flex items-center justify-center shadow-xs">
            RS
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-[#102A43] leading-tight">
              Rajesh Sharma
            </p>
            <p className="text-[10px] text-[#627D98] font-mono leading-tight mt-0.5">
              Operations / HDN-04
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
