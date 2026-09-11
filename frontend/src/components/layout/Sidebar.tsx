import React, { createContext, useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Users,
  Wrench,
  HardHat, 
  AlertTriangle,
  Radio,
  CalendarDays,
  Train,
  ListTodo,
  CalendarClock,
  FileSpreadsheet,
  FileCheck,
  FileText,
  LayoutDashboard,
  Sliders,
  Layers,
  ShieldAlert,
  ShieldCheck,
  BarChart3,
  Archive,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
  toggleSidebar: () => {}
});

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sih_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sih_sidebar_collapsed', String(isCollapsed));
      if (isCollapsed) {
        document.body.classList.add('sidebar-collapsed');
      } else {
        document.body.classList.remove('sidebar-collapsed');
      }
    } catch {}
  }, [isCollapsed]);

  const toggleSidebar = () => setIsCollapsed(prev => !prev);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

// High-Fidelity Official Indian Railways Circular Crest SVG in Crimson Red
export const IndianRailwaysCrestSVG: React.FC<{ size?: number; className?: string }> = ({ size = 38, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-label="Official Indian Railways Crest"
  >
    {/* Outer boundary with gold accent */}
    <circle cx="50" cy="50" r="48" fill="#7A141E" />
    <circle cx="50" cy="50" r="46" stroke="#D9901A" strokeWidth="2" fill="#9E1B28" />
    
    {/* Outer Beaded / White Ring */}
    <circle cx="50" cy="50" r="42" stroke="#FFFFFF" strokeWidth="1.2" strokeDasharray="3 2" />
    
    {/* Inner Crimson Base Circle */}
    <circle cx="50" cy="50" r="37" fill="#B42332" stroke="#ECC94B" strokeWidth="1.5" />
    
    {/* National Flag Tricolor Arc Banner */}
    <path d="M 24 27 Q 50 17 76 27" stroke="#FF9933" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M 26 31 Q 50 22 74 31" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M 28 35 Q 50 26 72 35" stroke="#138808" strokeWidth="2" strokeLinecap="round" fill="none" />
    
    {/* Central Chakra / Wheel Spokes in White & Gold */}
    <circle cx="50" cy="55" r="18" stroke="#ECC94B" strokeWidth="2" fill="#7A141E" />
    <circle cx="50" cy="55" r="3.5" fill="#ECC94B" />
    {Array.from({ length: 16 }).map((_, i) => (
      <line
        key={i}
        x1="50"
        y1="55"
        x2={50 + 16 * Math.cos((i * 22.5 * Math.PI) / 180)}
        y2={55 + 16 * Math.sin((i * 22.5 * Math.PI) / 180)}
        stroke="#FFFFFF"
        strokeWidth="1.2"
        opacity="0.9"
      />
    ))}

    {/* Central Steam Engine Locomotive Silhouette inside the wheel */}
    {/* Chimney / Smoke stack */}
    <rect x="42" y="44" width="3" height="6" rx="0.5" fill="#FFFFFF" />
    {/* Steam dome */}
    <path d="M 48 47 Q 50 44 52 47 Z" fill="#ECC94B" />
    {/* Boiler Barrel */}
    <rect x="40" y="49" width="18" height="9" rx="2" fill="#FFFFFF" />
    {/* Cab */}
    <path d="M 53 45 L 60 45 L 60 58 L 53 58 Z" fill="#ECC94B" />
    <rect x="54" y="47" width="4" height="4" rx="0.5" fill="#7A141E" />
    {/* Headlamp */}
    <circle cx="39" cy="52" r="1.8" fill="#ECC94B" />
    <path d="M 37 50 L 35 48 L 35 56 L 37 54 Z" fill="#ECC94B" opacity="0.6" />
    {/* Cowcatcher / Front Pilot */}
    <polygon points="37,58 43,58 40,63" fill="#ECC94B" />
    {/* Wheels */}
    <circle cx="43" cy="59" r="2.5" fill="#FFFFFF" stroke="#7A141E" strokeWidth="0.8" />
    <circle cx="49" cy="59" r="2.5" fill="#FFFFFF" stroke="#7A141E" strokeWidth="0.8" />
    <circle cx="55" cy="59" r="2.5" fill="#FFFFFF" stroke="#7A141E" strokeWidth="0.8" />
    <line x1="43" y1="59" x2="55" y2="59" stroke="#ECC94B" strokeWidth="1" />
    
    {/* Golden Stars at 9 o'clock & 3 o'clock */}
    <polygon points="14,50 16,52 13,54 17,54 18,57 20,54 24,54 21,52 22,50 19,51" fill="#ECC94B" />
    <polygon points="86,50 88,52 85,54 89,54 90,57 92,54 96,54 93,52 94,50 91,51" fill="#ECC94B" />

    {/* Bottom Golden Laurel Arc */}
    <path d="M 28 73 Q 50 84 72 73" stroke="#ECC94B" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <path d="M 32 77 Q 50 86 68 77" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.8" />
  </svg>
);

import { useAuth, RailwayRole } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { activeRole, currentProfile } = useAuth();
  const [profileExpanded, setProfileExpanded] = useState(false);

  // Grouped Navigation Structure strictly filtered by authenticated RailwayRole
  interface NavItem {
    name: string;
    path: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }

  interface NavGroup {
    group: string;
    items: NavItem[];
  }

  const getRoleNavigationGroups = (role: RailwayRole): NavGroup[] => {
    switch (role) {
      case 'SECTION_CONTROLLER':
        return [
          {
            group: 'OPERATIONS',
            items: [
              { name: 'Command Center', path: '/command', icon: Activity }
            ]
          },
          {
            group: 'PLANNING & ANALYTICS',
            items: [
              { name: 'Marey Train Graph', path: '/train-graph', icon: Train },
              { name: 'Task Register', path: '/tasks', icon: ListTodo },
              { name: 'Dual-Plan Engine', path: '/planning', icon: CalendarClock }
            ]
          }
        ];

      case 'DEPT_SUPERVISOR':
        return [
          {
            group: 'OPERATIONS',
            items: [
              { name: 'Department Overview', path: '/department', icon: LayoutDashboard },
              { name: 'Horizons & Quotas', path: '/department?tab=horizons', icon: CalendarDays },
              { name: 'Readiness Board', path: '/department?tab=readiness', icon: Sliders },
              { name: 'Assigned Blocks (Co-Block)', path: '/department?tab=assigned', icon: Layers }
            ]
          },
          {
            group: 'TASK MANAGEMENT',
            items: [
              { name: 'Task Register (413)', path: '/tasks', icon: FileText }
            ]
          }
        ];

      case 'FIELD_EXEC_LEAD':
        return [
          {
            group: 'OPERATIONS',
            items: [
              { name: 'Field Execution', path: '/field', icon: HardHat }
            ]
          }
        ];

      case 'FIELD_INSPECTOR':
        return [
          {
            group: 'OPERATIONS',
            items: [
              { name: 'Track Inspection', path: '/field/inspect', icon: AlertTriangle }
            ]
          }
        ];

      case 'DIVISIONAL_OFFICER':
        return [
          {
            group: 'GOVERNANCE',
            items: [
              { name: 'Governance & Audit', path: '/governance', icon: FileCheck },
              { name: 'Sanction & Overrides', path: '/governance?tab=sanctions', icon: ShieldCheck }
            ]
          },
          {
            group: 'REPORTS & ANALYTICS',
            items: [
              { name: 'Reports & Insights', path: '/reports', icon: BarChart3 },
              { name: 'Data Archive', path: '/archive', icon: Archive }
            ]
          }
        ];

      case 'STATION_MASTER':
        return [
          {
            group: 'OPERATIONS',
            items: [
              { name: 'Station Awareness', path: '/station', icon: Radio },
              { name: 'G&SR Memo Register', path: '/station/memos', icon: FileCheck }
            ]
          }
        ];

      default:
        return [
          {
            group: 'OPERATIONS',
            items: [
              { name: 'Command Center', path: '/command', icon: Activity }
            ]
          }
        ];
    }
  };

  let effectiveRole = activeRole;
  if (location.pathname.startsWith('/department')) {
    effectiveRole = 'DEPT_SUPERVISOR';
  } else if (location.pathname.startsWith('/governance') || location.pathname === '/reports' || location.pathname === '/archive') {
    effectiveRole = 'DIVISIONAL_OFFICER';
  }
  const navigationGroups = getRoleNavigationGroups(effectiveRole);

  const getProfileDisplay = () => {
    if (activeRole === 'STATION_MASTER') {
      return {
        name: 'M. K. Gupta',
        title: 'Station Master · LKO (Lucknow Charbagh)',
        status: 'Station Control Active'
      };
    }
    if (activeRole === 'SECTION_CONTROLLER') {
      return {
        name: 'R. K. Sharma',
        title: 'Section Controller · Lucknow (LKO)',
        status: 'Section Control Active'
      };
    }
    if (activeRole === 'DEPT_SUPERVISOR') {
      return {
        name: 'A. K. Verma',
        title: 'Dept Supervisor · Lucknow Division · LKO Operations',
        status: 'Department Control Active'
      };
    }
    if (activeRole === 'FIELD_EXEC_LEAD') {
      return {
        name: 'V. K. Meena',
        title: 'Field Lead · Lucknow Division · LKO Operations',
        status: 'Field Operations Active'
      };
    }
    if (activeRole === 'FIELD_INSPECTOR') {
      return {
        name: 'R. P. Singh',
        title: 'Track Inspector · LKO Division',
        status: 'Track Inspection Active'
      };
    }
    if (activeRole === 'DIVISIONAL_OFFICER' || effectiveRole === 'DIVISIONAL_OFFICER') {
      return {
        name: 'Dr. S. Mukherjee',
        title: 'Sr. DOM · Lucknow Division',
        status: 'Governance Active'
      };
    }
    return {
      name: currentProfile.name ? currentProfile.name.split(',')[0] : 'Railway Officer',
      title: currentProfile.title || currentProfile.roleBadge,
      status: 'System Active'
    };
  };

  const profileDisplay = getProfileDisplay();

  return (
    <aside 
      className={`h-screen sticky top-0 flex flex-col justify-between bg-[#102A43] text-white border-r border-slate-800 z-30 select-none overflow-y-auto transition-all duration-300 ease-in-out shrink-0 ${
        isCollapsed ? 'w-20' : 'w-[260px]'
      }`}
    >
      {/* Brand Header */}
      <div 
        className={`h-20 shrink-0 border-b border-[#1B3C5E]/80 flex items-center transition-all duration-300 ${
          isCollapsed ? 'px-2 justify-center gap-1.5' : 'px-4 justify-between'
        }`}
      >
        {isCollapsed ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/20 bg-white shadow-sm">
              <img src="/ir_logo.png" alt="Indian Railways Crest" className="w-full h-full object-cover rounded-full" />
            </div>
            <button
              onClick={toggleSidebar}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <PanelLeftOpen size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-full overflow-hidden shrink-0 border border-white/20 bg-white shadow-sm">
                <img src="/ir_logo.png" alt="Indian Railways Crest" className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold tracking-wide text-white text-sm truncate font-sans leading-tight">
                  INDIAN RAILWAYS
                </h1>
                <p className="text-[10.5px] text-amber-200/90 font-semibold tracking-wide truncate mt-0.5">
                  Ministry of Railways · Government of India
                </p>
                <p className="text-slate-400 text-[10px] tracking-wider truncate">
                  People • Progress • Possibilities
                </p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <PanelLeftClose size={18} />
            </button>
          </>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-2 px-2.5 space-y-3 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar">
        {navigationGroups.map((grp) => (
          <div key={grp.group} className="space-y-1">
            {!isCollapsed && (
              <p className="px-2.5 text-[9.5px] font-bold text-[#718096] uppercase tracking-wider mb-1.5">
                {grp.group}
              </p>
            )}

            {grp.items.map((item, itemIdx) => {
              const Icon = item.icon;
              const searchParams = new URLSearchParams(location.search);
              const currentTab = searchParams.get('tab');
              const currentFullPath = location.pathname + location.search;

              let isActive = false;
              if (item.path === '/governance') {
                isActive = location.pathname === '/governance' && (!currentTab || currentTab === '');
              } else if (item.path === '/governance?tab=sanctions') {
                isActive = location.pathname === '/governance' && currentTab === 'sanctions';
              } else if (item.path === '/department') {
                isActive = location.pathname === '/department' && (!currentTab || currentTab === '' || currentTab === 'overview');
              } else if (item.path.startsWith('/department?tab=')) {
                isActive = currentFullPath === item.path;
              } else if (item.path === '/reports') {
                isActive = location.pathname === '/reports';
              } else if (item.path === '/archive') {
                isActive = location.pathname === '/archive';
              } else if (item.path === '/command') {
                if (grp.group === 'PRIMARY' && item.name === 'Dashboard') {
                  isActive = location.pathname === '/dashboard';
                } else if (item.name === 'Command Center') {
                  isActive = location.pathname === '/command' || location.pathname === '/';
                }
              } else {
                isActive = location.pathname === item.path;
              }

              if (isCollapsed) {
                return (
                  <div key={`${grp.group}-${item.name}-${itemIdx}`} className="relative group flex items-center justify-center my-0.5">
                    <Link
                      to={item.path}
                      className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-150 ${
                        isActive
                          ? 'bg-[#9E1B28] text-white shadow-md shadow-[#9E1B28]/35 ring-1 ring-red-400/40'
                          : 'text-[#A0AEC0] hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon size={19} className="text-white" />
                    </Link>
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#071A2F] border border-[#1C3D5A] text-white text-xs font-semibold rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={`${grp.group}-${item.name}-${itemIdx}`}
                  to={item.path}
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-150 font-medium ${
                    isActive
                      ? 'bg-[#9E1B28] text-white shadow-sm font-semibold'
                      : 'text-[#CBD5E0] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon 
                    size={16} 
                    className={`shrink-0 transition-colors text-white ${
                      isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
                    }`} 
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Pinned Zone: Heritage Illustration directly flush above user card */}
      <div className="mt-auto w-full shrink-0 flex flex-col">
        {/* Heritage Illustration directly flush above user card */}
        {!isCollapsed && (
          <div className="relative w-full overflow-hidden border-b border-slate-700/50 block select-none pointer-events-none">
            <img
              src="/sidebar_heritage.png"
              alt="Heritage Architecture"
              className="w-full h-auto max-h-[105px] object-cover object-bottom block"
            />
            <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#102A43] to-transparent" />
          </div>
        )}

        {/* Pinned User Profile Card */}
        <div className="p-3 bg-[#0C2138] border-t border-slate-700/40">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-10 h-10 rounded-lg bg-[#9E1B28] text-white flex items-center justify-center font-black text-xs shadow-md cursor-pointer group relative"
              title={`${profileDisplay.name} | ${profileDisplay.title}`}
            >
              {currentProfile.avatarInitials}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0C2138]"></span>
            </div>
            <button
              onClick={toggleSidebar}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <PanelLeftOpen size={15} />
            </button>
          </div>
        ) : (
          <div>
            <div 
              onClick={() => setProfileExpanded(!profileExpanded)}
              className="p-2 rounded-lg bg-[#071A2F]/90 border border-[#1C3D5A] hover:border-[#2B547E] cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-md bg-[#9E1B28] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs relative">
                    {currentProfile.avatarInitials}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#071A2F]"></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white tracking-wide truncate">{profileDisplay.name}</p>
                    <p className="text-[11px] font-medium text-slate-300 leading-tight">{profileDisplay.title}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> {profileDisplay.status}
                    </span>
                  </div>
                </div>
                {profileExpanded ? (
                  <ChevronDown size={14} className="text-[#A0AEC0] shrink-0" />
                ) : (
                  <ChevronRight size={14} className="text-[#A0AEC0] shrink-0" />
                )}
              </div>

              {profileExpanded && (
                <div className="mt-2 pt-2 border-t border-[#1C3D5A] text-[10px] text-[#A0AEC0] space-y-1 animate-in fade-in duration-150">
                  <div className="flex justify-between">
                    <span>Department:</span>
                    <span className="text-white font-bold">{currentProfile.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Division:</span>
                    <span className="text-white font-bold">Lucknow (LKO)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Collapse Toggle [<< Collapse] */}
            <button
              onClick={toggleSidebar}
              className="w-full mt-2 py-1 px-3 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#1B3C5E]"
            >
              <PanelLeftClose size={13} />
              <span>« Collapse</span>
            </button>
          </div>
        )}
        </div>
      </div>
    </aside>
  );
};
