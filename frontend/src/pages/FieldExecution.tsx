import React, { useState, useEffect } from 'react';
import { Sidebar, useSidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  HardHat, 
  Smartphone, 
  ShieldCheck, 
  MapPin, 
  Users, 
  Lock, 
  RefreshCw,
  Info
} from 'lucide-react';
import { getFieldTasks, submitFieldEvent, getPartnerStatus, getPlans } from '../services/railwayApi';
import { Task, LOSS_CODES } from '../types';

export interface CoBlockTask {
  id: number;
  task_code: string;
  department: string;
  dept_short: 'ENG' | 'TRD' | 'S&T';
  task_title: string;
  status: 'COMPLETE' | 'IN_PROGRESS';
  lead_in_charge: string;
  location_km: string;
  is_complete: boolean;
}

const LIFECYCLE_STEPS = [
  { key: 'ACK', label: '1. Acknowledge Sanctioned Plan', color: 'bg-blue-600 hover:bg-blue-700' },
  { key: 'READY', label: '2. Confirm Site Readiness & Machine Arrival', color: 'bg-indigo-600 hover:bg-indigo-700' },
  { key: 'START', label: '3. Start Maintenance Work Window', color: 'bg-amber-600 hover:bg-amber-700' },
  { key: 'COMPLETE', label: '4. Complete Work & Clear Track', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { key: 'HANDBACK', label: '5. Hand Back Line', color: 'bg-slate-900 hover:bg-slate-800' },
];

export const FieldExecution: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [timestamps, setTimestamps] = useState<Record<string, string>>({});
  const [showLossModal, setShowLossModal] = useState(false);
  const [showHandbackLockoutModal, setShowHandbackLockoutModal] = useState(false);
  const [selectedLossCode, setSelectedLossCode] = useState<string>('');
  const [lossNotes, setLossNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [safetyDisclaimer, setSafetyDisclaimer] = useState<string | null>(null);

  // Version Control & Re-Acknowledgement Cycle
  const [activePlanId, setActivePlanId] = useState<number>(1);
  const [activePlanVersion, setActivePlanVersion] = useState<number>(2);
  const [userAckVersion, setUserAckVersion] = useState<number>(1); // Simulating an un-re-acknowledged version initially

  // 3 Bundled Co-Block Tasks for BLK-2026-DLI-04
  const [coBlockTasks, setCoBlockTasks] = useState<CoBlockTask[]>([
    {
      id: 1,
      task_code: 'TSK_ENG_02',
      department: 'ENG (P.Way)',
      dept_short: 'ENG',
      task_title: 'ENG Tamping: Track Tamping & Alignment Renewal',
      status: 'IN_PROGRESS',
      lead_in_charge: 'V. K. Meena, SSE (P.Way)',
      location_km: 'KM 104.2 – 124.8',
      is_complete: false
    },
    {
      id: 2,
      task_code: 'TSK_TRD_01',
      department: 'TRD (OHE)',
      dept_short: 'TRD',
      task_title: 'TRD OHE: Cantilever Inspection & Power Isolation',
      status: 'COMPLETE',
      lead_in_charge: 'S. P. Yadav, SSE (TRD)',
      location_km: 'KM 104.2 – 124.8',
      is_complete: true
    },
    {
      id: 3,
      task_code: 'TSK_SNT_01',
      department: 'S&T (Signalling)',
      dept_short: 'S&T',
      task_title: 'S&T Cable: Point Machine Cable Testing & Disconnection',
      status: 'COMPLETE',
      lead_in_charge: 'A. R. Rao, JE (S&T)',
      location_km: 'KM 104.2 – 124.8',
      is_complete: true
    }
  ]);

  const loadTasksAndPlan = async () => {
    try {
      const [fieldTasks, plans] = await Promise.all([
        getFieldTasks().catch(() => []),
        getPlans().catch(() => [])
      ]);

      if (plans.length > 0) {
        const latestPlan = plans[0];
        setActivePlanId(latestPlan.id);
        const ver = latestPlan.plan_version || 2;
        setActivePlanVersion(ver);
      }

      const assignedTasks = fieldTasks.filter(t => 
        (t.km_from >= 104 && t.km_to <= 125) || 
        t.task_code === 'TSK_ENG_02'
      );
      const displayList = assignedTasks.length > 0 ? assignedTasks : fieldTasks.slice(0, 1);
      setTasks(displayList);
      if (displayList.length > 0 && !selectedTask) {
        setSelectedTask(displayList[0]);
      }
    } catch (e) {
      console.error("Failed to load field tasks", e);
    }
  };

  useEffect(() => {
    loadTasksAndPlan();
  }, []);

  // Check if stale plan version is blocking work
  const isStalePlan = activePlanVersion > userAckVersion;

  // Check if all partner tasks are complete for handback
  const allPartnersComplete = coBlockTasks.every(p => p.is_complete);

  const handleReAcknowledge = async () => {
    setSubmitting(true);
    setStatusMsg(null);
    try {
      setUserAckVersion(activePlanVersion);
      if (selectedTask) {
        await submitFieldEvent({
          block_id: activePlanId,
          task_id: selectedTask.id,
          event_type: 'ACK',
          plan_version: activePlanVersion,
          remarks: `Field Lead re-acknowledged updated Plan V${activePlanVersion}`
        });
      }
      setStatusMsg({
        type: 'success',
        text: `Plan V${activePlanVersion} re-acknowledged. Field execution controls unlocked.`
      });
      if (currentStepIdx === 0) {
        setCurrentStepIdx(1);
        setTimestamps(prev => ({ ...prev, ACK: new Date().toLocaleTimeString('en-IN') }));
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.response?.data?.detail || "Re-acknowledgement failed."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteStep = async () => {
    if (!selectedTask || currentStepIdx >= LIFECYCLE_STEPS.length) return;
    const step = LIFECYCLE_STEPS[currentStepIdx];

    // Pre-flight check 1: Stale plan blocks start of work
    if (step.key === 'START' && isStalePlan) {
      setStatusMsg({
        type: 'error',
        text: `STALE PLAN: You are attempting to start work on plan V${userAckVersion}, but latest authorized plan is V${activePlanVersion}. Please refresh and re-acknowledge.`
      });
      return;
    }

    // Pre-flight check 2: Joint Handback locked if co-block partners are not complete
    if (step.key === 'HANDBACK' && !allPartnersComplete) {
      setShowHandbackLockoutModal(true);
      setStatusMsg({
        type: 'error',
        text: "Cannot hand back line. Co-block partners (e.g. TRD / S&T) are still actively working in this window. All bundled works must be marked COMPLETE first."
      });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    try {
      const res = await submitFieldEvent({
        block_id: activePlanId,
        task_id: selectedTask.id,
        event_type: step.key,
        plan_version: userAckVersion,
        remarks: `Field Lead recorded ${step.key}`
      });

      setTimestamps(prev => ({ ...prev, [step.key]: timeStr }));
      setCurrentStepIdx(prev => prev + 1);
      setStatusMsg({
        type: 'success',
        text: res.message || `Field event ${step.key} recorded to operational ledger.`
      });

      if (res.safety_disclaimer) {
        setSafetyDisclaimer(res.safety_disclaimer);
      }

      if (step.key === 'COMPLETE') {
        setShowLossModal(true);
      }
    } catch (e: any) {
      console.error("Event record error", e);
      setStatusMsg({
        type: 'error',
        text: e?.response?.data?.detail || "Failed to record event to backend."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulatePartnerComplete = () => {
    setCoBlockTasks(prev => 
      prev.map(p => ({ ...p, is_complete: true, status: 'COMPLETE' }))
    );
    setStatusMsg({
      type: 'success',
      text: 'Simulated: All bundled co-block tasks (ENG, TRD & S&T) marked COMPLETE. Handback gate unlocked.'
    });
  };

  const handleLossSubmit = async () => {
    if (selectedLossCode && selectedTask) {
      try {
        await submitFieldEvent({
          block_id: activePlanId,
          task_id: selectedTask.id,
          event_type: 'COMPLETE',
          plan_version: userAckVersion,
          loss_code: selectedLossCode,
          remarks: lossNotes || `Delay reason logged: ${selectedLossCode}`
        });
        setStatusMsg({
          type: 'success',
          text: `Delay loss reason ${selectedLossCode} logged to audit ledger.`
        });
        setShowLossModal(false);
      } catch (e: any) {
        console.error("Loss code error", e);
        setStatusMsg({
          type: 'error',
          text: e?.response?.data?.detail || "Failed to submit loss code."
        });
      }
    } else {
      setShowLossModal(false);
    }
  };

  const isFinished = currentStepIdx >= LIFECYCLE_STEPS.length;
  const currentStep = LIFECYCLE_STEPS[currentStepIdx];

  // Determine if action button is disabled
  const isButtonDisabled = () => {
    if (submitting) return true;
    if (currentStep?.key === 'START' && isStalePlan) return true;
    // Allow clicking '5. Hand Back Line' so the Joint Handback Lockout Safety Modal is triggered
    return false;
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8F5]">
      <div className="flex flex-1">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 flex flex-col ${isCollapsed ? 'ml-20' : 'ml-[260px]'}`}>
          <Header 
            title="Field Possession Lifecycle & Joint Handback" 
            subtitle="Real-Time Timestamps, Re-Ack Cycle & Integrated Multi-Department Barrier" 
          />

          <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
            {/* Top Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl card-warm">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#EAF6F0] text-[#16805C] border border-[#16805C]/20 uppercase tracking-wider flex items-center gap-1">
                    <Smartphone size={12} className="text-[#16805C]" />
                    Mobile Field Supervisor Loop
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">• 56px Touch Targets</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#D9901A] flex items-center gap-1">
                    <MapPin size={11} className="text-[#D9901A]" />
                    Block: BLK-2026-DLI-04 (KM 104.2 – 124.8)
                  </span>
                </div>
                <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
                  Field Maintenance Block Possession & Joint Handback
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Records operational timestamps, enforces plan version freshness, and locks track handback until all bundled co-block partners report complete.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-500 font-mono">
                  Active Plan: <span className="text-[#1E5AA8] font-black">V{activePlanVersion}</span>
                </span>
              </div>
            </div>

            {/* CRITICAL WARNING BANNER: STALE PLAN VERSION RE-ACK REQUIREMENT */}
            {isStalePlan && (
              <div className="p-4 rounded-2xl bg-[#B42332] text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} className="text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-200 block">
                      STALE PLAN DETECTED · VERSION INVALIDATION
                    </span>
                    <p className="text-xs font-black">
                      PLAN UPDATED TO V{activePlanVersion} — YOU ARE VIEWING V{userAckVersion}. REFRESH & RE-ACKNOWLEDGE.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReAcknowledge}
                  disabled={submitting}
                  className="px-4 py-2 bg-white text-[#B42332] hover:bg-rose-50 rounded-xl text-xs font-black shadow-md active:scale-98 transition-all shrink-0 cursor-pointer"
                >
                  {submitting ? 'Re-Acknowledging...' : `Refresh & Re-Acknowledge V${activePlanVersion}`}
                </button>
              </div>
            )}

            {/* INTEGRATED MULTI-DEPARTMENT CO-BLOCK STATUS (BLK-2026-DLI-04) */}
            <div className="p-6 rounded-2xl card-warm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E5AA8] flex items-center justify-center border border-blue-200">
                    <Users size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      Integrated Multi-Department Co-Block Status
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Active Possession Window: <span className="font-bold text-slate-800">BLK-2026-DLI-04</span> (3 Bundled Tasks)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                    allPartnersComplete 
                      ? 'bg-[#EAF6F0] text-[#16805C] border border-[#16805C]/30' 
                      : 'bg-[#FFF7E6] text-[#D9901A] border border-[#D9901A]/30'
                  }`}>
                    {allPartnersComplete ? 'ALL 3 TASKS COMPLETE' : 'CO-BLOCK IN PROGRESS'}
                  </span>
                  {!allPartnersComplete && (
                    <button
                      type="button"
                      onClick={handleSimulatePartnerComplete}
                      className="px-2.5 py-1 text-[11px] font-bold text-[#1E5AA8] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RefreshCw size={12} />
                      Simulate Partner Completion
                    </button>
                  )}
                </div>
              </div>

              {/* 3-Column Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {coBlockTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all ${
                      task.status === 'COMPLETE'
                        ? 'bg-emerald-50/80 border-emerald-200/90 shadow-xs'
                        : 'bg-amber-50/80 border-amber-200/90 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        task.dept_short === 'ENG' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                        task.dept_short === 'TRD' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                        'bg-purple-100 text-purple-900 border border-purple-200'
                      }`}>
                        {task.department}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        task.status === 'COMPLETE' 
                          ? 'bg-emerald-200 text-emerald-950 border border-emerald-300' 
                          : 'bg-amber-200 text-amber-950 border border-amber-300'
                      }`}>
                        {task.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-snug min-h-[40px]">
                      {task.task_title}
                    </h4>

                    <div className="flex items-center justify-between text-xs text-slate-600 mt-3 pt-2.5 border-t border-slate-200/70">
                      <span className="font-mono text-[11px] font-bold text-slate-500">{task.task_code}</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 truncate max-w-[170px]" title={task.lead_in_charge}>
                        <Users size={12} className="text-slate-400 shrink-0" />
                        {task.lead_in_charge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Feedback Banner */}
            {statusMsg && (
              <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 shadow-sm ${
                statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                {statusMsg.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <AlertTriangle size={18} className="text-rose-600 shrink-0" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            {/* Statutory Safety Disclaimer */}
            {safetyDisclaimer && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-300 text-xs text-blue-900 leading-relaxed font-semibold flex items-start gap-2.5">
                <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase tracking-wider block mb-0.5">Statutory Railway Line Restoration Notice:</span>
                  {safetyDisclaimer}
                </div>
              </div>
            )}

            {/* Stepper + Task Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Task Selector */}
              <div className="p-5 rounded-2xl card-warm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3.5">
                  Assigned Track Tasks ({tasks.length})
                </h3>
                <div className="space-y-2.5">
                  {tasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTask(t);
                        setCurrentStepIdx(0);
                        setTimestamps({});
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedTask?.id === t.id
                          ? 'bg-blue-50/90 border-[#1E5AA8] ring-2 ring-[#1E5AA8]/30 shadow-sm'
                          : 'bg-[#FCFBF8] hover:bg-slate-50 border-[#D9E0E8]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-slate-900">{t.task_code}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {t.department}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-semibold mt-1 truncate">{t.work_type}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 metric-mono">KM {t.km_from}–{t.km_to} • {t.estimated_duration_minutes}m</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5-Step Execution Lifecycle */}
              <div className="lg:col-span-2 p-6 rounded-2xl card-warm flex flex-col justify-between">
                {selectedTask ? (
                  <div>
                    <div className="p-5 rounded-2xl card-midnight text-white mb-6 shadow-xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] px-2.5 py-0.5 rounded bg-[#1E5AA8] text-white font-black uppercase tracking-wider">
                            {selectedTask.lane}
                          </span>
                          <h2 className="text-lg font-black mt-2">{selectedTask.task_code}: {selectedTask.work_type}</h2>
                          <p className="text-xs text-slate-300 mt-1 font-medium">
                            Chainage: KM {selectedTask.km_from} to {selectedTask.km_to} • Dept: {selectedTask.department}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Possession</p>
                          <p className="text-2xl font-black text-cyan-400 metric-mono">{selectedTask.estimated_duration_minutes}m</p>
                        </div>
                      </div>
                    </div>

                    {/* Stepper Timeline */}
                    <div className="space-y-4 mb-8">
                      {LIFECYCLE_STEPS.map((step, idx) => {
                        const done = idx < currentStepIdx;
                        const active = idx === currentStepIdx;
                        const isHandbackStep = step.key === 'HANDBACK';
                        const isStartStep = step.key === 'START';

                        return (
                          <div key={step.key} className="flex items-center gap-3.5">
                            <div className="flex flex-col items-center">
                              {done ? (
                                <CheckCircle2 size={26} className="text-emerald-500" />
                              ) : (
                                <Circle size={26} className={active ? 'text-blue-600 fill-blue-50' : 'text-slate-300'} />
                              )}
                            </div>
                            <div className={`flex-1 flex items-center justify-between p-4 rounded-xl border transition-all ${
                              done 
                                ? 'bg-emerald-50/80 border-emerald-200' 
                                : active 
                                ? 'bg-blue-50/80 border-blue-300 shadow-sm' 
                                : 'bg-slate-50 border-slate-200'
                            }`}>
                              <div>
                                <p className={`text-xs font-black ${done ? 'text-emerald-900' : (active ? 'text-blue-900' : 'text-slate-400')}`}>
                                  {step.label}
                                </p>
                                {timestamps[step.key] && (
                                  <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5 metric-mono">
                                    <Clock size={11} /> Recorded at {timestamps[step.key]}
                                  </p>
                                )}
                                {active && isStartStep && isStalePlan && (
                                  <p className="text-[10px] text-rose-600 font-bold mt-1">
                                    Locked: Re-acknowledge V{activePlanVersion} first.
                                  </p>
                                )}
                                {active && isHandbackStep && !allPartnersComplete && (
                                  <p className="text-[10px] text-amber-700 font-bold mt-1 flex items-center gap-1">
                                    <Lock size={10} />
                                    Locked: Waiting for TRD/S&T co-block completion.
                                  </p>
                                )}
                              </div>

                              {done && (
                                <span className="text-[10px] font-black text-emerald-800 bg-emerald-200/80 px-2.5 py-0.5 rounded">
                                  CONFIRMED
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Button */}
                    {!isFinished && !showLossModal && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={handleExecuteStep}
                          disabled={isButtonDisabled()}
                          className={`w-full min-h-[56px] text-white rounded-2xl text-sm font-black shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            isButtonDisabled()
                              ? 'bg-slate-400 cursor-not-allowed text-slate-200'
                              : (currentStep?.key === 'HANDBACK' && !allPartnersComplete
                                  ? 'bg-slate-900 hover:bg-slate-800 border-2 border-amber-500/60 active:scale-98 shadow-amber-900/20'
                                  : `${currentStep?.color} active:scale-98`)
                          }`}
                        >
                          {currentStep?.key === 'HANDBACK' && !allPartnersComplete && (
                            <Lock size={16} className="text-amber-400 shrink-0" />
                          )}
                          {submitting ? 'Recording Timestamp...' : currentStep?.label}
                        </button>

                        {currentStep?.key === 'HANDBACK' && !allPartnersComplete && (
                          <p className="text-[11px] text-amber-700 font-bold text-center flex items-center justify-center gap-1">
                            <Lock size={12} />
                            Joint Handback Locked: Click to view lockout barrier &amp; co-block partner status.
                          </p>
                        )}
                      </div>
                    )}

                    {isFinished && (
                      <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                        <CheckCircle2 size={48} className="text-emerald-600 mx-auto mb-2.5" />
                        <h3 className="text-base font-black text-emerald-950">Block Handback Completed</h3>
                        <p className="text-xs text-emerald-800 mt-1 font-medium">
                          Track handed back to Section Control. Multi-department clearance verified.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Select a task to begin field execution.</p>
                )}

                {/* Delay Loss Reason Modal */}
                {showLossModal && (
                  <div className="mt-4 p-5 rounded-2xl bg-white border border-amber-300 shadow-xl">
                    <h4 className="text-xs font-black text-slate-900 mb-1.5 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-amber-600" />
                      Was there any operational delay during this block possession?
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-3.5 font-medium">
                      Select standard Indian Railways delay loss reason code or skip if executed on schedule.
                    </p>
                    
                    <div className="space-y-2 mb-3.5 max-h-52 overflow-y-auto">
                      {LOSS_CODES.map((lc) => (
                        <button
                          key={lc.value}
                          type="button"
                          onClick={() => setSelectedLossCode(lc.value)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                            selectedLossCode === lc.value
                              ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {lc.label}
                        </button>
                      ))}
                    </div>

                    <textarea
                      placeholder="Additional supervisor field notes (optional)"
                      value={lossNotes}
                      onChange={(e) => setLossNotes(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 mb-3.5 focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />

                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={handleLossSubmit}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-98 transition-all cursor-pointer"
                      >
                        {selectedLossCode ? 'Submit Delay Reason' : 'Skip (Completed on Schedule)'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* JOINT HANDBACK LOCKOUT SAFETY FEEDBACK MODAL */}
      {showHandbackLockoutModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowHandbackLockoutModal(false)}
        >
          <div 
            className="bg-white rounded-3xl border border-amber-300 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/5 border-b border-amber-200/80 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/30 shrink-0">
                  <Lock size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    Operational Safety Barrier
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1 font-sans">
                    Joint Handback Lockout (Integrated Block)
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHandbackLockoutModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-black transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">
                  Cannot hand back line. Co-block partners (e.g. TRD / S&amp;T) are still actively working in this window. All bundled works must be marked COMPLETE first.
                </p>
              </div>

              {/* Co-Block Partner Departments Status */}
              <div className="space-y-2">
                <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                  Active Bundled Partner Tasks
                </p>
                <div className="space-y-2">
                  {coBlockTasks.map(partner => (
                    <div 
                      key={partner.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        partner.is_complete 
                          ? 'bg-emerald-50/70 border-emerald-200' 
                          : 'bg-rose-50/70 border-rose-200 ring-1 ring-rose-300/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                          partner.is_complete ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                        }`}>
                          {partner.dept_short}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{partner.task_title}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{partner.lead_in_charge}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
                        partner.is_complete ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white animate-pulse'
                      }`}>
                        {partner.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Static Statutory Notice */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-700 uppercase tracking-wider">
                  <ShieldCheck size={14} className="text-blue-600" />
                  Statutory Notice
                </div>
                <p className="text-[11px] leading-relaxed font-medium">
                  Prototype integrity barrier. Official track restoration follows Indian Railways G&amp;SR and Station Master authorization.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSimulatePartnerComplete();
                    setShowHandbackLockoutModal(false);
                  }}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={14} /> Simulate Partners Complete
                </button>
                <button
                  type="button"
                  onClick={() => setShowHandbackLockoutModal(false)}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Acknowledge Lockout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
