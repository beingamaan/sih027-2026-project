import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut, KeyRound, AlertTriangle } from 'lucide-react';

interface Forbidden403Props {
  requiredRole?: string;
  requiredCapability?: string;
  attemptedPath?: string;
}

export const Forbidden403: React.FC<Forbidden403Props> = ({
  requiredRole,
  requiredCapability,
  attemptedPath
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const { userProfile, activeRole, currentProfile, capabilities, logout } = auth;

  const path = attemptedPath || location.pathname;
  const incidentId = React.useMemo(() => `SEC-DLI-${Math.floor(100000 + Math.random() * 900000)}`, []);
  const timestamp = React.useMemo(() => new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC', []);

  const handleReturn = () => {
    const targetRoute = auth.user?.landing_route || userProfile?.landing_route || currentProfile.landingRoute || '/command';
    navigate(targetRoute, { replace: true });
  };

  const handleSwitchIdentity = () => {
    logout(navigate);
  };

  return (
    <div className="min-h-screen bg-[#07131F] text-slate-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white font-sans antialiased relative overflow-hidden">
      {/* Background Track Grid Canvas (Hand-rolled subtle curves & telemetry grid) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.07]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="sec-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sec-grid)" />
          <path d="M -100 200 C 300 150, 700 400, 1400 250" fill="none" stroke="#F43F5E" strokeWidth="2" strokeDasharray="6 6" />
          <path d="M -100 450 C 400 350, 800 650, 1500 500" fill="none" stroke="#F43F5E" strokeWidth="1.5" strokeDasharray="4 4" />
        </svg>
      </div>

      {/* Top Warning Banner */}
      <div className="relative z-10 border-b border-rose-900/60 bg-rose-950/40 backdrop-blur-md px-6 py-2.5 flex items-center justify-between text-xs text-rose-200">
        <div className="flex items-center gap-2 font-mono tracking-wider font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          <span className="text-rose-400 font-bold">SECURITY BARRIER ACTIVE</span>
          <span className="text-rose-500">•</span>
          <span>G&amp;SR SECTION 167 ACCESS RESTRICTION</span>
        </div>
        <div className="font-mono text-[11px] text-slate-400 hidden sm:block">
          INCIDENT ID: <span className="text-rose-300 font-bold">{incidentId}</span> | {timestamp}
        </div>
      </div>

      {/* Main Diagnostic Terminal Box */}
      <div className="relative z-10 max-w-3xl mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center items-center">
        <div className="w-full bg-[#0D1E30]/90 border border-rose-900/60 rounded-2xl shadow-2xl p-8 backdrop-blur-xl relative overflow-hidden">
          {/* Subtle Red Pulse Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600"></div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-slate-800 pb-6 mb-6">
            <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-700/60 text-rose-400 shadow-inner">
              <ShieldAlert className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-black uppercase tracking-wider bg-rose-900/80 text-rose-300 border border-rose-700">
                  HTTP 403 FORBIDDEN
                </span>
                <span className="text-xs font-mono text-slate-400">RESTRICTED WORKSPACE AREA</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                Access Authorization Restricted
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Your authenticated credentials lack the statutory capabilities required to enter or execute actions on this operating resource.
              </p>
            </div>
          </div>

          {/* Diagnostic Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs mb-6">
            <div className="p-4 rounded-xl bg-[#081523] border border-slate-800 space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Attempted Resource</span>
              </div>
              <div className="text-rose-300 font-semibold truncate text-sm">
                {path}
              </div>
              <div className="text-[11px] text-slate-400">
                Required Capability:{' '}
                <span className="text-amber-300 font-semibold">
                  {requiredCapability || requiredRole || 'EXECUTIVE_CLEARANCE'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#081523] border border-slate-800 space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Active Authenticated Session
              </div>
              <div className="text-slate-100 font-semibold truncate text-sm">
                {userProfile?.name || currentProfile.name}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Service ID: <strong className="text-slate-200">{userProfile?.service_id || currentProfile.defaultServiceId}</strong></span>
                <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 text-[10px] font-bold border border-blue-700/50">
                  {activeRole}
                </span>
              </div>
            </div>
          </div>

          {/* Current Granted Capabilities Badge List */}
          <div className="p-4 rounded-xl bg-[#081523] border border-slate-800 mb-6">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold flex items-center justify-between">
              <span>Your Current Granted Capabilities:</span>
              <span className="text-[10px] text-slate-500 font-normal">Based on cryptographic JWT claims</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {capabilities && capabilities.length > 0 ? (
                capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="px-2.5 py-1 rounded bg-slate-800/90 text-slate-200 text-[11px] font-mono border border-slate-700"
                  >
                    ✓ {cap}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-xs italic">No operational capabilities assigned</span>
              )}
            </div>
          </div>

          {/* Statutory Security Alert Warning */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/60 text-amber-200/90 text-xs flex items-start gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <strong>Railway Safety Notice:</strong> All unauthorized attempts to access block planning, sanction, or train control channels are immutably logged to the server-side <code className="text-amber-300">security_audit_logs</code> database table with verified network IP address and time-of-day telemetry.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={handleReturn}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold tracking-wide transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Authorized Workspace ({currentProfile.roleBadge})
            </button>

            <button
              onClick={handleSwitchIdentity}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Switch Official Profile
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-slate-800/80 bg-[#050E17] px-6 py-3 text-center text-[11px] font-mono text-slate-500">
        Ministry of Railways • Government of India • Northern Railway Operational Safety Architecture
      </div>
    </div>
  );
};

export default Forbidden403;
