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
  defaultServiceId: string;
}

export interface OfficialAccount {
  serviceId: string;
  name: string;
  designation: string;
  role: RailwayRole;
  department: string;
  landingRoute: string;
  avatarInitials: string;
}

export const OFFICIAL_DEMO_ACCOUNTS: OfficialAccount[] = [
  { serviceId: 'IR-OPS-1102', name: 'Rajesh Sharma', designation: 'Chief Section Controller', role: 'SECTION_CONTROLLER', department: 'OPS', landingRoute: '/command', avatarInitials: 'RS' },
  { serviceId: 'IR-ENG-0891', name: 'A. K. Verma', designation: 'DEPT SUPERVISOR · P.WAY (ENG)', role: 'DEPT_SUPERVISOR', department: 'ENG', landingRoute: '/department', avatarInitials: 'AV' },
  { serviceId: 'IR-ENG-4471', name: 'A. K. Verma', designation: 'DEPT SUPERVISOR · P.WAY (ENG)', role: 'DEPT_SUPERVISOR', department: 'ENG', landingRoute: '/department', avatarInitials: 'AV' },
  { serviceId: 'IR-TRD-2290', name: 'P. Kulkarni', designation: 'Senior Section Engineer (TRD/OHE)', role: 'DEPT_SUPERVISOR', department: 'TRD', landingRoute: '/department', avatarInitials: 'PK' },
  { serviceId: 'IR-SNT-3318', name: 'N. Srinivasan', designation: 'Senior Section Engineer (Signal & Telecom)', role: 'DEPT_SUPERVISOR', department: 'SNT', landingRoute: '/department', avatarInitials: 'NS' },
  { serviceId: 'IR-DRM-0007', name: 'Dr. S. Mukherjee', designation: 'Divisional Railway Manager (DRM)', role: 'DIVISIONAL_OFFICER', department: 'OPS', landingRoute: '/governance', avatarInitials: 'SM' },
  { serviceId: 'IR-FLD-8845', name: 'V. K. Meena', designation: 'Junior Engineer / Field Execution Lead', role: 'FIELD_EXEC_LEAD', department: 'ENG', landingRoute: '/field', avatarInitials: 'VM' },
  { serviceId: 'IR-INS-6612', name: 'R. P. Singh', designation: 'Track & Signaling Inspector', role: 'FIELD_INSPECTOR', department: 'ENG', landingRoute: '/field/inspect', avatarInitials: 'RP' },
  { serviceId: 'IR-STN-0450', name: 'M. K. Gupta', designation: 'Station Superintendent / Station Master', role: 'STATION_MASTER', department: 'OPS', landingRoute: '/station', avatarInitials: 'MG' },
];

export const ROLE_CAPABILITIES: Record<RailwayRole, string[]> = {
  SECTION_CONTROLLER: ['VIEW_COMMAND', 'RUN_OPTIMIZER', 'SUBMIT_BLOCK', 'VIEW_TIMETABLE'],
  DEPT_SUPERVISOR: ['VIEW_DEPT', 'VERIFY_TASK', 'UPDATE_READINESS', 'ACK_BLOCK'],
  DIVISIONAL_OFFICER: ['VIEW_GOVERNANCE', 'SANCTION_BLOCK', 'OVERRIDE_BLOCK', 'VIEW_AUDIT'],
  FIELD_EXEC_LEAD: ['VIEW_FIELD', 'EXECUTE_BLOCK', 'LOG_FIELD_EVENT'],
  FIELD_INSPECTOR: ['REPORT_DEFECT', 'VIEW_INSPECTIONS'],
  STATION_MASTER: ['VIEW_STATION', 'ACK_STATION'],
};

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
    operationalFocus: 'Corridor map, train trajectories, What-If simulation & dual-plan possession comparison.',
    defaultServiceId: 'IR-OPS-1102'
  },
  DEPT_SUPERVISOR: {
    id: 'DEPT_SUPERVISOR',
    title: 'DEPT SUPERVISOR · P.WAY (ENG)',
    name: 'A. K. Verma',
    roleBadge: 'DEPT SUPERVISOR · P.WAY (ENG)',
    department: 'ENG',
    landingRoute: '/department',
    avatarInitials: 'AV',
    avatarBg: 'bg-gradient-to-tr from-emerald-600 to-teal-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
    description: '100-point gate diagnostics, gang/machine readiness & PTW paperwork clearance.',
    operationalFocus: 'Task queue department filtering, readiness checklist overrides & statutory compliance.',
    defaultServiceId: 'IR-ENG-0891'
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
    operationalFocus: 'Assigned block BLK-2026-DLI-04 execution, 5-step lifecycle and joint handback.',
    defaultServiceId: 'IR-FLD-8845'
  },
  DIVISIONAL_OFFICER: {
    id: 'DIVISIONAL_OFFICER',
    title: 'Divisional Railway Officer (Sr.DOM / Review)',
    name: 'Dr. S. Mukherjee, Sr.DOM',
    roleBadge: 'SR.DOM / EXECUTIVE GOVERNANCE',
    department: 'OPS',
    landingRoute: '/governance',
    avatarInitials: 'SM',
    avatarBg: 'bg-gradient-to-tr from-purple-600 to-violet-600',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-300',
    description: 'Executive governance, official plan sanction & mandatory override audit.',
    operationalFocus: 'Formal sanction authority, reason-coded overrides & immutable audit trail verification.',
    defaultServiceId: 'IR-DRM-0007'
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
    operationalFocus: 'Rapid mobile asset defect intake with G&SR Emergency Protection barrier.',
    defaultServiceId: 'IR-INS-6612'
  },
  STATION_MASTER: {
    id: 'STATION_MASTER',
    title: 'Station Master (Local Station Control)',
    name: 'M. K. Gupta, SM (Anandpur)',
    roleBadge: 'STATION MASTER / STA',
    department: 'OPS',
    landingRoute: '/station',
    avatarInitials: 'MG',
    avatarBg: 'bg-gradient-to-tr from-cyan-600 to-blue-600',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-300',
    description: 'Situational corridor awareness, adjacent block status & train arrival visibility.',
    operationalFocus: 'Non-interfering advisory awareness, caution order logs & situational readouts.',
    defaultServiceId: 'IR-STN-0450'
  }
};

export const ROLE_LANDING_ROUTES: Record<string, string> = {
  SECTION_CONTROLLER: '/command',
  DEPT_SUPERVISOR: '/department',
  DIVISIONAL_OFFICER: '/governance',
  FIELD_EXEC_LEAD: '/field',
  FIELD_INSPECTOR: '/field/inspect',
  STATION_MASTER: '/station',
};

export const getLandingRouteForAccount = (serviceId: string, role: string): string => {
  const s = serviceId.toUpperCase().trim();
  const matched = OFFICIAL_DEMO_ACCOUNTS.find(a => a.serviceId.toUpperCase() === s);
  if (matched) return matched.landingRoute;
  return ROLE_LANDING_ROUTES[role] || '/command';
};

export interface UserSessionProfile {
  service_id: string;
  name: string;
  designation: string;
  role: RailwayRole;
  department: string;
  division_id: string;
  section_ids?: number[];
  team_id?: number;
  station_id?: number;
  capabilities: string[];
  landing_route?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  activeRole: RailwayRole;
  currentProfile: RoleProfile;
  userProfile: UserSessionProfile | null;
  user: UserSessionProfile | null;
  capabilities: string[];
  token: string | null;
  department: string;
  currentUser: any;
  isLoading: boolean;
  toastMessage: string | null;
  toastType: 'info' | 'warning' | 'error';
  login: (serviceId: string, password: string) => Promise<{ success: boolean; error?: string; landing_route?: string; data?: any }>;
  logout: (navigateFn?: (path: string) => void) => void;
  hasCapability: (capability: string) => boolean;
  setRole: (role: RailwayRole, navigateFn?: (path: string) => void) => Promise<void>;
  showToast: (message: string, type?: 'info' | 'warning' | 'error') => void;
  dismissToast: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  activeRole: 'SECTION_CONTROLLER',
  currentProfile: RAILWAY_ROLES.SECTION_CONTROLLER,
  userProfile: null,
  user: null,
  capabilities: ROLE_CAPABILITIES.SECTION_CONTROLLER,
  token: null,
  department: 'OPERATIONS',
  currentUser: null,
  isLoading: false,
  toastMessage: null,
  toastType: 'info',
  login: async () => ({ success: false }),
  logout: () => {},
  hasCapability: () => false,
  setRole: async () => {},
  showToast: () => {},
  dismissToast: () => {}
});

export const useAuth = () => useContext(AuthContext);
export const useRole = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('sih_access_token') || localStorage.getItem('sih_access_token');
  });

  const [activeRole, setActiveRole] = useState<RailwayRole>(() => {
    try {
      const saved = localStorage.getItem('sih_active_role') as RailwayRole;
      if (saved && RAILWAY_ROLES[saved]) {
        return saved;
      }
    } catch {}
    return 'SECTION_CONTROLLER';
  });

  const [userProfile, setUserProfile] = useState<UserSessionProfile | null>(() => {
    try {
      const saved = localStorage.getItem('sih_user_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [capabilities, setCapabilities] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sih_capabilities');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ROLE_CAPABILITIES[activeRole] || [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'warning' | 'error'>('info');

  const isAuthenticated = Boolean(token);

  const showToast = useCallback((message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    setToastMessage(message);
    setToastType(type);
  }, []);

  const hasCapability = useCallback((cap: string): boolean => {
    return capabilities.includes(cap);
  }, [capabilities]);

  // Real server-side login
  const login = useCallback(async (serviceId: string, password: string): Promise<{ success: boolean; error?: string; landing_route?: string; data?: any }> => {
    setIsLoading(true);
    try {
      const res = await api.post('/api/auth/login', {
        service_id: serviceId.trim(),
        password: password
      });

      const data = res.data;
      const accessToken = data.access_token;
      const role = (data.role as RailwayRole) || 'SECTION_CONTROLLER';
      const caps = data.capabilities || ROLE_CAPABILITIES[role] || [];
      const targetLandingRoute = data.landing_route || getLandingRouteForAccount(serviceId, role);

      const user = data.user || {
        service_id: serviceId,
        name: data.role,
        designation: 'Railway Official',
        role: role,
        department: data.department,
        division_id: 'DLI',
        capabilities: caps,
        landing_route: targetLandingRoute
      };
      user.landing_route = targetLandingRoute;

      sessionStorage.setItem('sih_access_token', accessToken);
      localStorage.setItem('sih_access_token', accessToken);
      localStorage.setItem('sih_active_role', role);
      localStorage.setItem('sih_capabilities', JSON.stringify(caps));
      localStorage.setItem('sih_user_profile', JSON.stringify(user));

      setToken(accessToken);
      setActiveRole(role);
      setCapabilities(caps);
      setUserProfile(user);

      showToast(`Welcome, ${user.name || serviceId}! Authenticated as ${user.designation || role}`, 'info');
      return { 
        success: true, 
        landing_route: targetLandingRoute,
        data: {
          ...data,
          landing_route: targetLandingRoute
        }
      };
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || "Authentication failed. Verify credentials.";
      showToast(errorDetail, 'error');
      return { success: false, error: errorDetail };
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const logout = useCallback((navigateFn?: (path: string) => void) => {
    sessionStorage.removeItem('sih_access_token');
    localStorage.removeItem('sih_access_token');
    localStorage.removeItem('sih_active_role');
    localStorage.removeItem('sih_capabilities');
    localStorage.removeItem('sih_user_profile');

    setToken(null);
    setUserProfile(null);
    setCapabilities([]);
    showToast('Secure session closed. Logged out.', 'info');

    if (navigateFn) {
      navigateFn('/login');
    }
  }, [showToast]);

  // Backward-compatible developer role switch
  const setRole = useCallback(async (newRole: RailwayRole, navigateFn?: (path: string) => void) => {
    if (!RAILWAY_ROLES[newRole]) return;
    setIsLoading(true);
    try {
      const res = await api.post('/api/auth/login-as', {
        role: newRole,
        username: `Officer_${newRole}`
      });

      const accessToken = res.data.access_token;
      const caps = res.data.capabilities || ROLE_CAPABILITIES[newRole] || [];
      const user = res.data.user || {
        service_id: RAILWAY_ROLES[newRole].defaultServiceId,
        name: RAILWAY_ROLES[newRole].name,
        designation: RAILWAY_ROLES[newRole].title,
        role: newRole,
        department: res.data.department || RAILWAY_ROLES[newRole].department,
        division_id: 'DLI',
        capabilities: caps
      };

      sessionStorage.setItem('sih_access_token', accessToken);
      localStorage.setItem('sih_access_token', accessToken);
      localStorage.setItem('sih_active_role', newRole);
      localStorage.setItem('sih_capabilities', JSON.stringify(caps));
      localStorage.setItem('sih_user_profile', JSON.stringify(user));

      setToken(accessToken);
      setActiveRole(newRole);
      setCapabilities(caps);
      setUserProfile(user);

      showToast(`Switched active context to ${user.designation || newRole}`, 'info');

      if (navigateFn) {
        navigateFn(RAILWAY_ROLES[newRole].landingRoute);
      }
    } catch (e) {
      console.error("Failed to switch role context", e);
      showToast("Could not switch role on server", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Restore session from server on mount if token is present
  useEffect(() => {
    if (!token) return;
    api.get('/api/auth/me')
      .then((res) => {
        const decoded = res.data;
        const role = (decoded.role as RailwayRole) || activeRole;
        const caps = decoded.capabilities || ROLE_CAPABILITIES[role] || [];
        setActiveRole(role);
        setCapabilities(caps);
        if (!userProfile) {
          setUserProfile({
            service_id: decoded.service_id || decoded.sub || 'IR-OFFICER',
            name: decoded.name || 'Railway Official',
            designation: decoded.designation || decoded.role,
            role: role,
            department: decoded.department || 'OPS',
            division_id: decoded.division_id || 'DLI',
            section_ids: decoded.section_ids,
            team_id: decoded.team_id,
            station_id: decoded.station_id,
            capabilities: caps
          });
        }
      })
      .catch((err) => {
        // Token invalid or expired
        console.warn("Stored token expired or invalidated", err);
        sessionStorage.removeItem('sih_access_token');
        localStorage.removeItem('sih_access_token');
        setToken(null);
      });
  }, []);

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
        isAuthenticated,
        activeRole,
        currentProfile,
        userProfile,
        user: userProfile,
        capabilities,
        token,
        department: userProfile?.department || currentProfile.department,
        currentUser: userProfile,
        isLoading,
        toastMessage,
        toastType,
        login,
        logout,
        hasCapability,
        setRole,
        showToast,
        dismissToast
      }}
    >
      {children}

      {/* Dynamic Toast Notice with Warning/Error Support */}
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
