import React, { useState } from 'react';
import { Sidebar, useSidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  MapPin, 
  Wrench, 
  PhoneCall, 
  Send, 
  RotateCcw,
  Smartphone,
  HardHat
} from 'lucide-react';
import { ingestDefect } from '../services/railwayApi';

export const FieldInspect: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [assetId, setAssetId] = useState('TRK-104-FRAC');
  const [kmFrom, setKmFrom] = useState('104.2');
  const [kmTo, setKmTo] = useState('104.4');
  const [workType, setWorkType] = useState('RAIL_FLAW_DETECTION');
  const [department, setDepartment] = useState('ENG');
  const [severity, setSeverity] = useState<'ROUTINE' | 'STATUTORY' | 'URGENT' | 'EMERGENCY'>('ROUTINE');
  const [description, setDescription] = useState('Ultrasonic flaw inspection detected hairline rail fracture.');
  const [estimatedDuration, setEstimatedDuration] = useState('90');

  // Emergency Safety Interstitial State
  const [showEmergencyInterstitial, setShowEmergencyInterstitial] = useState(false);
  const [protocolConfirmed, setProtocolConfirmed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [resultTask, setResultTask] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSeverityChange = (newSev: 'ROUTINE' | 'STATUTORY' | 'URGENT' | 'EMERGENCY') => {
    setSeverity(newSev);
    if (newSev === 'EMERGENCY') {
      setShowEmergencyInterstitial(true);
      setProtocolConfirmed(false);
    } else {
      setShowEmergencyInterstitial(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResultTask(null);

    if (severity === 'EMERGENCY' && !protocolConfirmed) {
      setShowEmergencyInterstitial(true);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        description: `[${assetId}] ${description}`,
        km_from: parseFloat(kmFrom) || 104.0,
        km_to: parseFloat(kmTo) || 104.5,
        severity: severity,
        department: department,
        safety_protocol_acknowledged: severity === 'EMERGENCY' ? protocolConfirmed : false,
        estimated_duration_minutes: parseInt(estimatedDuration) || 90
      };

      const res = await ingestDefect(payload);
      setResultTask(res);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Failed to submit defect record.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setResultTask(null);
    setErrorMsg(null);
    setSeverity('ROUTINE');
    setShowEmergencyInterstitial(false);
    setProtocolConfirmed(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8F5]">
      <div className="flex flex-1">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 flex flex-col ${isCollapsed ? 'ml-20' : 'ml-[260px]'}`}>
          <Header 
            title="Field Track & Asset Defect Intake" 
            subtitle="Mobile-First Incident & Inspection Log with Statutory Emergency Guard" 
          />

          <main className="flex-1 p-6 space-y-6 max-w-3xl w-full mx-auto">
            {/* Top Card */}
            <div className="p-6 rounded-2xl glass-panel-elevated border border-white/90">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 uppercase tracking-wider flex items-center gap-1">
                  <Smartphone size={12} className="text-rose-700" />
                  Mobile Asset Intake
                </span>
                <span className="text-xs text-slate-500 font-semibold">• Channel C Defect Register</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  P.Way / TRD / S&T
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Log Asset Defect or Track Irregularity
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Inspectors on foot/trolley patrol report track faults directly into the automated optimization queue.
              </p>
            </div>

            {/* Success Result Box */}
            {resultTask && (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-emerald-800 font-black">
                  <CheckCircle2 size={22} className="text-emerald-600" />
                  <h3>Defect Logged Successfully into Corridor Register</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Task Code</span>
                    <p className="font-mono font-black text-slate-900">{resultTask.task_code}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Safety Lane</span>
                    <p className="font-mono font-bold text-slate-900">{resultTask.lane}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Status</span>
                    <p className="font-bold text-slate-900">{resultTask.status}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Location</span>
                    <p className="font-mono font-bold text-slate-900">KM {resultTask.km_from}–{resultTask.km_to}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-3 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Log Another Defect
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Mobile-First Intake Form */}
            {!resultTask && (
              <form onSubmit={handleSubmit} className="p-6 rounded-2xl glass-panel-elevated space-y-5 border border-white/90">
                {/* Severity Selector (Hero Element) */}
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-2 uppercase tracking-wider">
                    Severity & Operating Urgency <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['ROUTINE', 'STATUTORY', 'URGENT', 'EMERGENCY'] as const).map((sev) => {
                      const isSelected = severity === sev;
                      return (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => handleSeverityChange(sev)}
                          className={`p-3 rounded-xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? sev === 'EMERGENCY'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-500/30'
                                : sev === 'URGENT'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                                : 'bg-blue-600 text-white border-blue-600 shadow-md'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {sev === 'EMERGENCY' && <ShieldAlert size={16} />}
                          <span>{sev}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Asset ID & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Asset Tag / ID</label>
                    <input
                      type="text"
                      required
                      value={assetId}
                      onChange={(e) => setAssetId(e.target.value)}
                      placeholder="e.g. TRK-104.2 / Switch-03"
                      className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ENG">Engineering (P.Way)</option>
                      <option value="TRD">Electrical / Traction (TRD)</option>
                      <option value="SNT">Signal & Telecom (S&T)</option>
                    </select>
                  </div>
                </div>

                {/* Chainage KM Bounds */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Start Chainage (KM)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={kmFrom}
                      onChange={(e) => setKmFrom(e.target.value)}
                      className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">End Chainage (KM)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={kmTo}
                      onChange={(e) => setKmTo(e.target.value)}
                      className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Work Type & Estimated Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Defect Classification</label>
                    <select
                      value={workType}
                      onChange={(e) => setWorkType(e.target.value)}
                      className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="RAIL_FLAW_DETECTION">Rail Flaw / Ultrasonic Indication</option>
                      <option value="POINT_CROSSING_GAP">Point & Crossing Wear / Gap</option>
                      <option value="BALLAST_DEFICIENCY">Ballast Cushion Deficiency</option>
                      <option value="CANTILEVER_DISPLACEMENT">OHE Cantilever Displacement</option>
                      <option value="TRACK_CIRCUIT_FAILURE">Track Circuit / Axle Counter Drift</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Est. Duration (Minutes)</label>
                    <input
                      type="number"
                      step="15"
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(e.target.value)}
                      className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Description Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Inspector Field Observations</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Specific findings, flaw size, sleeper condition, or ballast condition..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Big 56px Touch-Target Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full min-h-[56px] text-white rounded-2xl text-sm font-black shadow-xl transition-all flex items-center justify-center gap-2 active:scale-98 ${
                    severity === 'EMERGENCY'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
                  }`}
                >
                  <Send size={16} />
                  {submitting ? 'Transmitting to Corridor Ledger...' : 'Submit Defect to Optimization Engine'}
                </button>
              </form>
            )}

            {/* FULL-SCREEN STATUTORY EMERGENCY INTERSTITIAL MODAL */}
            {showEmergencyInterstitial && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border-4 border-rose-600 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-900">
                  <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 mx-auto">
                    <ShieldAlert size={36} />
                  </div>

                  <span className="block text-center text-xs font-black uppercase tracking-widest text-rose-600">
                    Statutory Emergency Barrier · G&SR Protection
                  </span>

                  <h2 className="text-xl font-black text-center text-slate-950 mt-1 mb-3">
                    Immediate Physical Line Protection Required
                  </h2>

                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-950 space-y-2 mb-6 leading-relaxed">
                    <p className="font-bold flex items-center gap-2">
                      <PhoneCall size={16} className="text-rose-600 shrink-0" />
                      Statutory Safety Barrier:
                    </p>
                    <p>
                      Protect line per General & Subsidiary Rules (G&SR) immediately and inform Station Master / Section Control by authorized telephone before submitting emergency record.
                    </p>
                    <p className="text-[11px] text-rose-800">
                      Emergency defects are routed to Lane A (Manual Emergency Execution) and are strictly excluded from automated heuristic rescheduling.
                    </p>
                  </div>

                  {/* Protocol Checkbox */}
                  <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-300 cursor-pointer select-none mb-6 hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={protocolConfirmed}
                      onChange={(e) => setProtocolConfirmed(e.target.checked)}
                      className="mt-0.5 w-5 h-5 accent-rose-600 rounded cursor-pointer shrink-0"
                    />
                    <span className="text-xs font-black text-slate-900 leading-snug">
                      I have initiated the authorized emergency protection protocol and alerted Station Master / Section Control.
                    </span>
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmergencyInterstitial(false);
                        setSeverity('ROUTINE');
                      }}
                      className="flex-1 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
                    >
                      Cancel / Downgrade Severity
                    </button>

                    <button
                      type="button"
                      disabled={!protocolConfirmed}
                      onClick={() => setShowEmergencyInterstitial(false)}
                      className={`flex-1 py-3.5 rounded-xl text-white font-black text-xs transition-all shadow-md ${
                        protocolConfirmed
                          ? 'bg-rose-600 hover:bg-rose-700 active:scale-98'
                          : 'bg-slate-300 cursor-not-allowed text-slate-500'
                      }`}
                    >
                      Acknowledge & Enable Intake
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
