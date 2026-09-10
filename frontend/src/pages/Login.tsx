import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, OFFICIAL_DEMO_ACCOUNTS, OfficialAccount } from '../context/AuthContext';
import { Lock, ShieldCheck, ArrowRight, Train, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface DemoChipInfo {
  label: string;
  serviceId: string;
  landingRoute: string;
  department: string;
  role: string;
  initials: string;
}

const DEMO_CHIPS: DemoChipInfo[] = [
  { label: 'Operating Controller: IR-OPS-1102', serviceId: 'IR-OPS-1102', landingRoute: '/command', department: 'OPERATIONS', role: 'SECTION_CONTROLLER', initials: 'RS' },
  { label: 'Engineering P.Way: IR-ENG-0891', serviceId: 'IR-ENG-0891', landingRoute: '/department', department: 'ENG', role: 'DEPT_SUPERVISOR', initials: 'AV' },
  { label: 'Electrical TRD: IR-TRD-2290', serviceId: 'IR-TRD-2290', landingRoute: '/department', department: 'TRD', role: 'DEPT_SUPERVISOR', initials: 'PK' },
  { label: 'Signalling S&T: IR-SNT-3318', serviceId: 'IR-SNT-3318', landingRoute: '/department', department: 'SNT', role: 'DEPT_SUPERVISOR', initials: 'NS' },
  { label: 'Divisional Officer: IR-DRM-0007', serviceId: 'IR-DRM-0007', landingRoute: '/governance', department: 'OPERATIONS', role: 'DIVISIONAL_OFFICER', initials: 'SM' },
  { label: 'Field Lead: IR-FLD-8845', serviceId: 'IR-FLD-8845', landingRoute: '/field', department: 'ENG', role: 'FIELD_EXEC_LEAD', initials: 'VM' },
  { label: 'Field Inspector: IR-INS-6612', serviceId: 'IR-INS-6612', landingRoute: '/field/inspect', department: 'ENG', role: 'FIELD_INSPECTOR', initials: 'RP' },
  { label: 'Station Master: IR-STN-0450', serviceId: 'IR-STN-0450', landingRoute: '/station', department: 'OPERATIONS', role: 'STATION_MASTER', initials: 'MG' },
];

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, currentProfile, isLoading } = useAuth();

  const [serviceId, setServiceId] = useState('IR-OPS-1102');
  const [password, setPassword] = useState('demo');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('IR-OPS-1102');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!serviceId.trim()) {
      setErrorMsg('Please enter your Indian Railways Service ID');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    const response = await login(serviceId, password);
    if (response.success) {
      // Extract landing_route directly from server response
      const landingRoute = response.data?.landing_route || response.landing_route || '/command';
      // Force direct navigation without retaining previous unauthorized pathnames in history
      navigate(landingRoute, { replace: true });
    } else {
      setErrorMsg(response.error || 'Invalid credentials or inactive user profile.');
    }
  };

  const handleSelectDemoChip = (chip: DemoChipInfo) => {
    setSelectedServiceId(chip.serviceId);
    setServiceId(chip.serviceId);
    setPassword('demo');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#07131F] flex flex-col lg:flex-row text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* ========================================================================= */}
      {/* LEFT PANEL: DEEP NAVY (#102A43) WITH SVG TRACK GEOMETRY & IR EMBLEM       */}
      {/* ========================================================================= */}
      <div className="lg:w-[52%] bg-[#102A43] p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden border-r border-slate-800">
        {/* Hand-Rolled Subtle SVG Railway Tracks & Matrix Geometry Background */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="loginTrackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E5AA8" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="loginHighSpeedGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#B42332" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.4" />
              </linearGradient>
              <pattern id="loginTrackGrid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#1E3A5F" strokeWidth="0.75" strokeDasharray="2 4" />
              </pattern>
            </defs>

            <rect width="100%" height="100%" fill="url(#loginTrackGrid)" />

            {/* Sweeping Railway Track Lines (Dual Up/Down Mains) */}
            <path
              d="M -50 180 C 250 140, 450 320, 850 220 S 1100 380, 1400 320"
              fill="none"
              stroke="url(#loginTrackGradient)"
              strokeWidth="3.5"
            />
            <path
              d="M -50 196 C 250 156, 450 336, 850 236 S 1100 396, 1400 336"
              fill="none"
              stroke="#2563EB"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />

            {/* High-speed Vande Bharat Trajectory Curve */}
            <path
              d="M -50 480 C 300 420, 500 240, 950 160 S 1200 120, 1400 80"
              fill="none"
              stroke="url(#loginHighSpeedGradient)"
              strokeWidth="3"
            />

            {/* Concrete Sleepers Cross-Ties */}
            <g stroke="#38BDF8" strokeWidth="1.2" opacity="0.35">
              <line x1="80" y1="150" x2="86" y2="175" />
              <line x1="160" y1="160" x2="166" y2="185" />
              <line x1="240" y1="180" x2="246" y2="205" />
              <line x1="320" y1="210" x2="326" y2="235" />
              <line x1="400" y1="245" x2="406" y2="270" />
              <line x1="480" y1="260" x2="486" y2="285" />
              <line x1="560" y1="250" x2="566" y2="275" />
              <line x1="640" y1="235" x2="646" y2="260" />
              <line x1="720" y1="220" x2="726" y2="245" />
              <line x1="800" y1="210" x2="806" y2="235" />
            </g>

            {/* Station nodes */}
            <circle cx="200" cy="172" r="5" fill="#3B82F6" stroke="#93C5FD" strokeWidth="2" />
            <circle cx="520" cy="256" r="6" fill="#10B981" stroke="#A7F3D0" strokeWidth="2" />
            <circle cx="820" cy="214" r="5" fill="#F59E0B" stroke="#FDE68A" strokeWidth="2" />
          </svg>
        </div>

        {/* Brand Header: Authentic Crimson Red IR Emblem Seal */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden shrink-0 border-2 border-white/20 bg-white shadow-md">
            <img 
              src="/ir_logo.png" 
              alt="Indian Railways Official Emblem" 
              className="w-full h-full object-contain p-0.5 rounded-full" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wider text-amber-300 uppercase font-mono">
                INDIAN RAILWAYS
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#B42332] text-white tracking-widest uppercase">
                OFFICIAL
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Ministry of Railways • Government of India
            </h2>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              Northern Railway Division • Delhi Corridor Sector
            </p>
          </div>
        </div>

        {/* Hero Narrative Block with Required Exact Text */}
        <div className="relative z-10 my-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#081B2E] border border-blue-500/40 text-blue-300 text-xs font-mono mb-4 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>HDN-04 OPERATIONAL CORRIDOR (KM 100 - KM 158)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight uppercase font-sans">
            INDIAN RAILWAYS — INTEGRATED BLOCK PLANNING &amp; DECISION SUPPORT SYSTEM
          </h1>

          <p className="text-sm text-slate-300 mt-4 leading-relaxed font-normal">
            Deterministic maintenance scheduling with 6-gate engineering compatibility diagnostics, automated Weighted Train-Minute optimization, and G&amp;SR statutory joint handback interlocking.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#081B2E]/90 border border-slate-700/60 backdrop-blur-sm">
              <div className="text-amber-400 font-bold mb-1">3-LANE SAFETY ARCHITECTURE</div>
              <div className="text-slate-300 text-[11px]">Lane A (Emergency) • Lane B1 (Integrated P50/P90) • Lane B2 (Statutory)</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#081B2E]/90 border border-slate-700/60 backdrop-blur-sm">
              <div className="text-emerald-400 font-bold mb-1">APPEND-ONLY AUDIT LEDGER</div>
              <div className="text-slate-300 text-[11px]">Immutable event logs, joint handback gates &amp; cryptographic audit trail</div>
            </div>
          </div>
        </div>

        {/* Bottom Corridor Station Bar */}
        <div className="relative z-10 border-t border-slate-800/80 pt-4 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div>DELHI DIVISION • 58 KM SECTION</div>
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SERVER VERIFIED &amp; ACTIVE</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANEL: CLEAN LOGIN CARD WITH 8 DEMO ACCOUNT CHIPS                  */}
      {/* ========================================================================= */}
      <div className="lg:w-[48%] bg-[#F7F8F5] text-slate-900 p-8 lg:p-14 flex flex-col justify-between overflow-y-auto">
        <div className="max-w-md mx-auto w-full">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs font-mono text-[#1E5AA8] font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Authorized Rail Personnel Access</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-[#102A43] tracking-tight">
              Sign In to Rail Console
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Authenticate with your Service ID and password to access your role workspace.
            </p>
          </div>

          {/* Error Alert Notice */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                Service ID / Employee Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  placeholder="e.g. IR-OPS-1102"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D9E0E8] bg-white text-slate-900 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent transition-all shadow-sm"
                  required
                />
                <span className="absolute right-3.5 top-3 text-slate-400 text-xs font-mono pointer-events-none">
                  ID
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                  Password
                </label>
                <span className="text-[11px] text-slate-500 font-mono">Demo: <strong className="text-slate-700">demo</strong></span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D9E0E8] bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent transition-all shadow-sm"
                  required
                />
                <Lock className="w-4 h-4 absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#102A43] hover:bg-[#1E5AA8] text-white text-xs font-bold uppercase tracking-wider transition-all duration-150 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Rail Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Section with 8 Clickable Chips */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Quick Demo Accounts</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-200 px-2 py-0.5 rounded-full">
                8 Department Roles
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              Click any department account below to prefill Service ID &amp; password:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_CHIPS.map((chip, idx) => {
                const isSelected = selectedServiceId === chip.serviceId;
                return (
                  <button
                    key={chip.serviceId}
                    type="button"
                    onClick={() => handleSelectDemoChip(chip)}
                    className={`p-2.5 rounded-xl text-left border transition-all flex items-center gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#102A43] text-white border-[#102A43] shadow-md ring-2 ring-[#1E5AA8]'
                        : 'bg-white text-slate-800 border-[#D9E0E8] hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {chip.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate leading-tight">
                        {chip.label}
                      </div>
                      <div className={`text-[10px] font-mono truncate ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                        → {chip.landingRoute}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security Compliance Footnote */}
        <div className="max-w-md mx-auto w-full mt-8 pt-4 border-t border-slate-200 text-[11px] font-mono text-slate-500 flex items-center justify-between">
          <span>G&amp;SR / RBAC CAPABILITY SECURITY</span>
          <span>HS256 CRYPTOGRAPHIC JWT</span>
        </div>
      </div>
    </div>
  );
};

export default Login;

