import React, { useState, useEffect } from 'react';
import { Sidebar, useSidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  MapPin, 
  Wrench, 
  Send, 
  Camera, 
  Layers, 
  Clock, 
  Check, 
  Circle, 
  UploadCloud,
  FileText,
  AlertOctagon
} from 'lucide-react';
import { ingestDefect, getFieldTasks } from '../services/railwayApi';
import { Task } from '../types';

type DefectSeverity = 'NORMAL' | 'MEDIUM' | 'SAFETY_CRITICAL';
type ActiveTab = 'REPORT' | 'TRACKER';

const LIFECYCLE_STAGES = [
  'REPORTED',
  'VERIFIED',
  'ELIGIBLE',
  'SCHEDULED',
  'EXECUTED',
  'CLOSED'
];

export const FieldInspect: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState<ActiveTab>('REPORT');
  
  // Form Fields
  const [assetType, setAssetType] = useState('TRACK_RAIL');
  const [assetId, setAssetId] = useState('TRK-119-WELD-04');
  const [kmFrom, setKmFrom] = useState('119.2');
  const [kmTo, setKmTo] = useState('119.5');
  const [defectCategory, setDefectCategory] = useState('RAIL_SURFACE_FLAW');
  const [department, setDepartment] = useState('ENG');
  const [severity, setSeverity] = useState<DefectSeverity>('NORMAL');
  const [description, setDescription] = useState('Ultrasonic flaw inspection detected hairline weld micro-fracture.');
  const [estimatedDuration, setEstimatedDuration] = useState('90');
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [photoName, setPhotoName] = useState<string | null>(null);

  // Statutory Emergency Interstitial Modal for SAFETY_CRITICAL
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyAcknowledged, setEmergencyAcknowledged] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [resultTask, setResultTask] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // My Reports Tracker List
  const [myReports, setMyReports] = useState<Task[]>([]);

  useEffect(() => {
    getFieldTasks()
      .then(tasks => {
        setMyReports(tasks.slice(0, 5));
      })
      .catch(() => {});
  }, [resultTask]);

  const handleSeverityChange = (newSev: DefectSeverity) => {
    setSeverity(newSev);
    if (newSev === 'SAFETY_CRITICAL') {
      setShowEmergencyModal(true);
      setEmergencyAcknowledged(false);
    } else {
      setShowEmergencyModal(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoName(e.target.files[0].name);
      setPhotoUploaded(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResultTask(null);

    if (severity === 'SAFETY_CRITICAL' && !emergencyAcknowledged) {
      setShowEmergencyModal(true);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        description: `[${assetType}:${assetId}] ${description}`,
        km_from: parseFloat(kmFrom) || 119.2,
        km_to: parseFloat(kmTo) || 119.5,
        severity: severity === 'SAFETY_CRITICAL' ? 'SAFETY_CRITICAL' : (severity === 'MEDIUM' ? 'URGENT' : 'ROUTINE'),
        department: department,
        safety_protocol_acknowledged: severity === 'SAFETY_CRITICAL' ? emergencyAcknowledged : false,
        estimated_duration_minutes: parseInt(estimatedDuration) || 90
      };

      const res = await ingestDefect(payload);
      setResultTask(res);
      setMyReports(prev => [res, ...prev]);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Failed to submit defect record.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setResultTask(null);
    setErrorMsg(null);
    setSeverity('NORMAL');
    setPhotoUploaded(false);
    setPhotoName(null);
    setShowEmergencyModal(false);
    setEmergencyAcknowledged(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8F5]">
      <div className="flex flex-1 min-h-screen">
        <Sidebar />
        <div className="flex-1 min-w-0 transition-all duration-300 flex flex-col">
          <Header 
            title="Field Inspector Defect Intake & Tracking" 
            subtitle="Channel C Incident Reporting, Safety Critical Lane A Routing & Lifecycle Audit" 
          />

          <main className="flex-1 p-6 space-y-6 max-w-5xl w-full mx-auto">
            {/* Top Workspace Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl card-warm">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle size={12} className="text-rose-700" />
                    Field Patrol Inspection Log
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">• Inspector: IR-INSP-9011</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Channel C Register
                  </span>
                </div>
                <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
                  Track Asset Defect Intake &amp; Lifecycle Progress
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Report patrol flaws directly with automatic Lane A safety routing or track previously reported defect resolutions.
                </p>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0">
                <button
                  onClick={() => setActiveTab('REPORT')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'REPORT'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Log Defect
                </button>
                <button
                  onClick={() => setActiveTab('TRACKER')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'TRACKER'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  My Reports ({myReports.length})
                </button>
              </div>
            </div>

            {/* TAB 1: LOG DEFECT FORM */}
            {activeTab === 'REPORT' && (
              <div className="space-y-6">
                {/* Success Result Box */}
                {resultTask && (
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-emerald-800 font-black">
                      <CheckCircle2 size={22} className="text-emerald-600" />
                      <h3 className="text-sm font-bold">Defect Logged Successfully into Corridor Register</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-emerald-200 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Task Code</span>
                        <p className="font-mono font-black text-slate-900">{resultTask.task_code}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Safety Lane</span>
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] font-mono ${
                          resultTask.lane === 'LANE_A' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {resultTask.lane}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Stage / Status</span>
                        <p className="font-bold text-slate-900">{resultTask.status}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Location</span>
                        <p className="font-mono font-bold text-slate-900">KM {resultTask.km_from}–{resultTask.km_to}</p>
                      </div>
                    </div>

                    {resultTask.lane === 'LANE_A' && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
                        <AlertOctagon size={16} className="text-rose-600 shrink-0" />
                        <span>SAFETY CRITICAL: Task isolated to Lane A (Manual Dispatch). Excluded from automated bundling optimizer.</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Log Another Defect
                      </button>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Form */}
                {!resultTask && (
                  <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
                    {/* Severity Selection (NORMAL / MEDIUM / SAFETY_CRITICAL) */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Defect Severity &amp; Safety Routing
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => handleSeverityChange('NORMAL')}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            severity === 'NORMAL'
                              ? 'bg-slate-50 border-slate-400 ring-2 ring-slate-400/30'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="font-bold text-xs text-slate-900 block">NORMAL (Lane B1)</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">Condition-based maintenance candidate</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSeverityChange('MEDIUM')}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            severity === 'MEDIUM'
                              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="font-bold text-xs text-amber-900 block">MEDIUM (Urgent)</span>
                          <span className="text-[10px] text-amber-700 block mt-0.5">Priority review within 72 hours</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSeverityChange('SAFETY_CRITICAL')}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            severity === 'SAFETY_CRITICAL'
                              ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/30'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                            <AlertOctagon size={13} className="text-rose-600" />
                            SAFETY CRITICAL
                          </span>
                          <span className="text-[10px] text-rose-700 block mt-0.5">Immediate Lane A Emergency protection</span>
                        </button>
                      </div>
                    </div>

                    {/* Asset Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Asset Type</label>
                        <select
                          value={assetType}
                          onChange={(e) => setAssetType(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="TRACK_RAIL">Track / Rail Section</option>
                          <option value="TURNOUT_SWITCH">Turnout &amp; Switch Point</option>
                          <option value="OHE_CANTILEVER">OHE Mast / Cantilever</option>
                          <option value="POINT_MACHINE">S&amp;T Point Machine</option>
                          <option value="TRACK_CIRCUIT">Track Circuit / Axle Counter</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Asset ID</label>
                        <input
                          type="text"
                          value={assetId}
                          onChange={(e) => setAssetId(e.target.value)}
                          placeholder="e.g. TRK-119-WELD-04"
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-mono font-bold"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-bold"
                        >
                          <option value="ENG">Engineering (P.Way)</option>
                          <option value="TRD">Electrical (TRD)</option>
                          <option value="SNT">Signal &amp; Telecom (S&amp;T)</option>
                        </select>
                      </div>
                    </div>

                    {/* Chainage KM & Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">KM Start</label>
                        <input
                          type="number"
                          step="0.1"
                          value={kmFrom}
                          onChange={(e) => setKmFrom(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">KM End</label>
                        <input
                          type="number"
                          step="0.1"
                          value={kmTo}
                          onChange={(e) => setKmTo(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Est. Duration (min)</label>
                        <input
                          type="number"
                          value={estimatedDuration}
                          onChange={(e) => setEstimatedDuration(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono"
                          required
                        />
                      </div>
                    </div>

                    {/* Defect Description */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Defect Category &amp; Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500"
                        placeholder="Detailed technical inspection notes..."
                        required
                      />
                    </div>

                    {/* Photo Upload Simulation */}
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                          <Camera size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {photoUploaded ? `Photo attached: ${photoName}` : 'Attach Inspection Photo / Ultrasonic Scan'}
                          </p>
                          <p className="text-[10px] text-slate-400">JPEG, PNG, or USFD diagnostic logs up to 10 MB</p>
                        </div>
                      </div>

                      <label className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 shadow-xs cursor-pointer transition-all">
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        {photoUploaded ? 'Change File' : 'Browse File'}
                      </label>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-3 bg-[#102A43] hover:bg-[#1E5AA8] text-white rounded-xl text-xs font-black shadow-md active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Send size={14} />
                        {submitting ? 'Submitting to Registry...' : 'Submit Defect Report'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Emergency Confirmation Interstitial Modal */}
                {showEmergencyModal && (
                  <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-rose-300 shadow-2xl space-y-4 animate-scaleUp">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                          <AlertOctagon size={22} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block">
                            Statutory Railway Safety Rule
                          </span>
                          <h3 className="text-base font-black text-slate-900">
                            Declare Lane A Safety Critical Defect
                          </h3>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        Declaring a defect as <strong>SAFETY CRITICAL</strong> strictly tags the task into <strong>Lane A (Manual Dispatch)</strong>. It will be completely excluded from automated optimizer candidate bundling, and will require immediate telephonic coordination with Section Control.
                      </p>

                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            id="protoCheck"
                            checked={emergencyAcknowledged}
                            onChange={(e) => setEmergencyAcknowledged(e.target.checked)}
                            className="mt-0.5 accent-rose-600 w-4 h-4 rounded cursor-pointer"
                          />
                          <label htmlFor="protoCheck" className="text-xs font-bold cursor-pointer">
                            I confirm track protection is being established at site under Indian Railways G&amp;SR rules and Section Controller has been informed.
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowEmergencyModal(false);
                            setSeverity('NORMAL');
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel / Downgrade to Normal
                        </button>
                        <button
                          type="button"
                          disabled={!emergencyAcknowledged}
                          onClick={() => setShowEmergencyModal(false)}
                          className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white shadow-md cursor-pointer transition-all"
                        >
                          Confirm Lane A Declaration
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MY REPORTS TRACKER */}
            {activeTab === 'TRACKER' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Defect Inspection Reports &amp; Resolution Process
                  </h3>
                  <span className="text-xs font-mono text-slate-400">Total: {myReports.length}</span>
                </div>

                <div className="space-y-4">
                  {myReports.map((task) => {
                    const currentStage = String(task.status).toUpperCase();
                    const stageIdx = LIFECYCLE_STAGES.indexOf(currentStage);
                    const effectiveIdx = stageIdx >= 0 ? stageIdx : 0;

                    return (
                      <div key={task.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black text-slate-900">{task.task_code}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {task.department}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                              task.lane === 'LANE_A' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {task.lane}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                            <span>KM {task.km_from}–{task.km_to}</span>
                            <span>{task.estimated_duration_minutes}m duration</span>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-slate-800">{task.work_type}</h4>

                        {/* Horizontal Process Tracker */}
                        <div className="pt-2">
                          <div className="grid grid-cols-6 gap-1.5 text-center">
                            {LIFECYCLE_STAGES.map((stageName, idx) => {
                              const done = idx <= effectiveIdx;
                              const isCurrent = idx === effectiveIdx;

                              return (
                                <div key={stageName} className="space-y-1">
                                  <div className={`h-1.5 rounded-full transition-all ${
                                    done ? 'bg-emerald-500' : 'bg-slate-200'
                                  }`} />
                                  <span className={`text-[9px] font-mono uppercase block truncate ${
                                    isCurrent ? 'font-black text-blue-900' : (done ? 'font-bold text-emerald-800' : 'text-slate-400')
                                  }`}>
                                    {stageName}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
