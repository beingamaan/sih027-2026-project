import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export type RailwayRole = 
  | 'SECTION_CONTROLLER'
  | 'DEPT_SUPERVISOR'
  | 'FIELD_EXEC_LEAD'
  | 'DIVISIONAL_OFFICER'
  | 'FIELD_INSPECTOR'
  | 'STATION_MASTER';

export interface RoleProfile {
  id: RailwayRole;
  title: string;
  name: string;
  roleBadge: string;
  department: string;
  landingRoute: string;
  avatarInitials: string;
  avatarBg: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
  operationalFocus: string;
}

export const RAILWAY_ROLES: Record<RailwayRole, RoleProfile> = {
  SECTION_CONTROLLER: {
    id: 'SECTION_CONTROLLER',
    title: 'Section Controller (Operating / HDN-04)',
    name: 'Rajesh Sharma, IRTS',
    roleBadge: 'OPERATING / HDN-04',
    department: 'OPERATIONS',
    landingRoute: '/command',
    avatarInitials: 'RS',
    avatarBg: 'bg-gradient-to-tr from-blue-600 to-indigo-600',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    description: 'Corridor traffic monitoring, conflict resolution & P50/P90 window selection.',
    operationalFocus: 'Corridor map, train trajectories, What-If simulation & dual-plan possession comparison.'
  },
  DEPT_SUPERVISOR: {
    id: 'DEPT_SUPERVISOR',
    title: 'Department Supervisor (P.Way / TRD / S&T)',
    name: 'A. K. Verma, SSE (P.Way)',
    roleBadge: 'SUPERVISOR (P.WAY / TRD / S&T)',
    department: 'TRD',
    landingRoute: '/department',
    avatarInitials: 'AV',
    avatarBg: 'bg-gradient-to-tr from-emerald-600 to-teal-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
    description: '100-point gate diagnostics, gang/machine readiness & PTW paperwork clearance.',
    operationalFocus: 'Task queue department filtering, readiness checklist overrides & statutory compliance.'
  },
  FIELD_EXEC_LEAD: {
    id: 'FIELD_EXEC_LEAD',
    title: 'Field Execution Lead (Worksite In-Charge)',
    name: 'V. K. Meena, Worksite In-Charge',
    roleBadge: 'FIELD LEAD / BLK-2026',
    department: 'ENG',
    landingRoute: '/field',
    avatarInitials: 'VM',
    avatarBg: 'bg-gradient-to-tr from-amber-600 to-orange-600',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    description: 'Live field possession timeline, site verified checkpoints & track handback.',
    operationalFocus: 'Assigned block BLK-2026-DLI-04 execution, 5-step lifecycle and joint handback.'
  },
  DIVISIONAL_OFFICER: {
    id: 'DIVISIONAL_OFFICER',
    title: 'Divisional Railway Officer (Sr.DOM / Review)',
    name: 'Dr. S. Mukherjee, Sr.DOM',
    roleBadge: 'SR.DOM / EXECUTIVE GOVERNANCE',
    department: 'EXECUTIVE',
    landingRoute: '/governance',
    avatarInitials: 'SM',
    avatarBg: 'bg-gradient-to-tr from-purple-600 to-violet-600',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-300',
    description: 'Executive governance, official plan sanction & mandatory override audit.',
    operationalFocus: 'Formal sanction authority, reason-coded overrides & immutable audit trail verification.'
  },
  FIELD_INSPECTOR: {
    id: 'FIELD_INSPECTOR',
    title: 'Field Track & Asset Inspector (P.Way)',
    name: 'R. P. Singh, JE (Track)',
    roleBadge: 'TRACK INSPECTOR / DLI',
    department: 'ENG',
    landingRoute: '/field/inspect',
    avatarInitials: 'RP',
    avatarBg: 'bg-gradient-to-tr from-rose-600 to-red-600',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-300',
    description: 'Mobile defect reporting, asset condition tagging & statutory emergency barriers.',
    operationalFocus: 'Rapid mobile asset defect intake with G&SR Emergency Protection barrier.'
  },
  STATION_MASTER: {
    id: 'STATION_MASTER',
    title: 'Station Master (Local Station Control)',
    name: 'M. K. Gupta, SM (Anandpur)',
    roleBadge: 'STATION MASTER / STA',
    department: 'OPERATIONS',
    landingRoute: '/station',
    avatarInitials: 'MG',
    avatarBg: 'bg-gradient-to-tr from-cyan-600 to-blue-600',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-300',
    description: 'Situational corridor awareness, adjacent block status & train arrival visibility.',
    operationalFocus: 'Non-interfering advisory awareness, caution order logs & situational readouts.'
  }
};

interface AuthContextType {
  activeRole: RailwayRole;
  currentProfile: RoleProfile;
  token: string | null;
  department: string;
  currentUser: any;
  isLoading: boolean;
  toastMessage: string | null;
  toastType: 'info' | 'warning' | 'error';
  setRole: (role: RailwayRole, navigateFn?: (path: string) => void) => Promise<void>;
  showToast: (message: string, type?: 'info' | 'warning' | 'error') => void;
  dismissToast: () => void;
}

const AuthContext = createContext<AuthContextType>({
  activeRole: 'SECTION_CONTROLLER',
  currentProfile: RAILWAY_ROLES.SECTION_CONTROLLER,
  token: null,
  department: 'OPERATIONS',
  currentUser: null,
  isLoading: false,
  toastMessage: null,
  toastType: 'info',
  setRole: async () => {},
  showToast: () => {},
  dismissToast: () => {}
});

export const useAuth = () => useContext(AuthContext);
export const useRole = () => useContext(AuthContext); // Backward-compatibility alias

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<RailwayRole>(() => {
    try {
      const saved = localStorage.getItem('sih_active_role') as RailwayRole;
      if (saved && RAILWAY_ROLES[saved]) {
        return saved;
      }
    } catch {}
    return 'SECTION_CONTROLLER';
  });

  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('sih_access_token') || localStorage.getItem('sih_access_token');
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'warning' | 'error'>('info');

  const showToast = useCallback((message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    setToastMessage(message);
    setToastType(type);
  }, []);

  const loginAsRole = useCallback(async (role: RailwayRole) => {
    setIsLoading(true);
    try {
      const res = await api.post('/api/auth/login-as', {
        role: role,
        username: `Officer_${role}`
      });

      const accessToken = res.data.access_token;
      sessionStorage.setItem('sih_access_token', accessToken);
      localStorage.setItem('sih_access_token', accessToken);
      localStorage.setItem('sih_active_role', role);
      setToken(accessToken);
      setCurrentUser(res.data);
    } catch (err) {
      console.warn("Backend auth token fetch failed, falling back to local session", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial login on mount if token is not set
  useEffect(() => {
    loginAsRole(activeRole);
  }, [activeRole, loginAsRole]);

  const setRole = async (newRole: RailwayRole, navigateFn?: (path: string) => void) => {
    if (!RAILWAY_ROLES[newRole]) return;
    setActiveRole(newRole);
    const profile = RAILWAY_ROLES[newRole];

    try {
      await loginAsRole(newRole);
    } catch (e) {
      console.error("Failed to login as role", e);
    }

    showToast(`Switched to ${profile.title}`, 'info');

    if (navigateFn) {
      navigateFn(profile.landingRoute);
    }
  };

  const dismissToast = () => setToastMessage(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const currentProfile = RAILWAY_ROLES[activeRole] || RAILWAY_ROLES.SECTION_CONTROLLER;

  return (
    <AuthContext.Provider
      value={{
        activeRole,
        currentProfile,
        token,
        department: currentProfile.department,
        currentUser,
        isLoading,
        toastMessage,
        toastType,
        setRole,
        showToast,
        dismissToast
      }}
    >
      {children}

      {/* Dynamic Toast Notice with Warning Support */}
      {toastMessage && (
        <div className="fixed top-5 right-6 z-[10000] animate-in fade-in slide-in-from-top-3 duration-200">
          <div className={`px-4 py-2.5 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-semibold backdrop-blur-md ${
            toastType === 'warning'
              ? 'bg-amber-950/95 text-amber-100 border-amber-600/60 shadow-amber-950/50'
              : toastType === 'error'
              ? 'bg-rose-950/95 text-rose-100 border-rose-600/60 shadow-rose-950/50'
              : 'bg-slate-900/95 text-white border-slate-700/60 shadow-slate-950/50'
          }`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              toastType === 'warning' ? 'bg-amber-400 animate-ping' : toastType === 'error' ? 'bg-rose-400 animate-ping' : 'bg-emerald-400 animate-ping'
            }`}></span>
            <span>{toastMessage}</span>
            <button 
              onClick={dismissToast}
              className="ml-2 text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
