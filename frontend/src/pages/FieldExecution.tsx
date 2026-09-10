import React, { useState, useEffect } from 'react';
import { Sidebar, useSidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { HeroBanner } from '../components/layout/HeroBanner';
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
  Info,
  WifiOff,
  UploadCloud,
  Check,
  X,
  ShieldAlert
} from 'lucide-react';
import { 
  getFieldTasks, 
  getPlans, 
  submitBlockFieldEvent 
} from '../services/railwayApi';
import { Task, LOSS_CODES } from '../types';
import { CorridorTrackTopology } from '../components/corridor/CorridorTrackTopology';

export interface CoBlockTask {
  id: number;
  task_code: string;
  department: string;
  dept_short: 'ENG' | 'TRD' | 'SNT';
  task_title: string;
  status: 'COMPLETE' | 'IN_PROGRESS';
  lead_in_charge: string;
  location_km: string;
  is_complete: boolean;
}

interface QueuedEvent {
  id: string;
  block_id: number;
  task_id: number;
  step_event: string;
  plan_version: number;
  loss_code?: string;
  remarks?: string;
  timestamp: string;
}

const LIFECYCLE_STEPS = [
  { key: 'ACK', label: '1. ACKNOWLEDGE', fullLabel: '1. Acknowledge Sanctioned Plan', color: 'bg-blue-600 hover:bg-blue-700' },
  { key: 'READY', label: '2. READY AT SITE', fullLabel: '2. Confirm Site Readiness & Machine Arrival', color: 'bg-indigo-600 hover:bg-indigo-700' },
  { key: 'START', label: '3. START WORK', fullLabel: '3. Start Maintenance Work Window', color: 'bg-amber-600 hover:bg-amber-700' },
  { key: 'COMPLETE', label: '4. WORK COMPLETE', fullLabel: '4. Complete Work & Clear Track', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { key: 'HANDBACK', label: '5. HAND BACK', fullLabel: '5. Hand Back Line Possession', color: 'bg-slate-900 hover:bg-slate-800' },
];

export const FieldExecution: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [timestamps, setTimestamps] = useState<Record<string, string>>({});
  const [showLossModal, setShowLossModal] = useState(false);
  const [selectedLossCode, setSelectedLossCode] = useState<string>('');
  const [lossNotes, setLossNotes] = useState('');
  const [showSafetyInterlockModal, setShowSafetyInterlockModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Version Control & Re-Acknowledgement State
  const [activePlanId, setActivePlanId] = useState<number>(1);
  const [activePlanCode, setActivePlanCode] = useState<string>('BLK-2026-DLI-04');
  const [activePlanVersion, setActivePlanVersion] = useState<number>(2);
  const [userAckVersion, setUserAckVersion] = useState<number>(1); // Simulating an un-re-acknowledged version initially

  // Offline Event Queue State
  const [offlineQueue, setOfflineQueue] = useState<QueuedEvent[]>(() => {
    try {
      const saved = localStorage.getItem('sih_field_offline_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 3 Bundled Co-Block Tasks for BLK-2026-DLI-04
  const [coBlockTasks, setCoBlockTasks] = useState<CoBlockTask[]>([
    {
      id: 1,
      task_code: 'TSK_ENG_04',
      department: 'Engineering (P.Way)',
      dept_short: 'ENG',
      task_title: 'ENG Tamping: Track Tamping & Alignment Renewal',
      status: 'COMPLETE',
      lead_in_charge: 'V. K. Meena, SSE (P.Way)',
      location_km: 'KM 119.2 – 121.0',
      is_complete: true
    },
    {
      id: 2,
      task_code: 'TSK_TRD_03',
      department: 'Traction (TRD / OHE)',
      dept_short: 'TRD',
      task_title: 'TRD OHE: Cantilever Inspection & Power Isolation (OHE Ladder gang active)',
      status: 'IN_PROGRESS',
      lead_in_charge: 'P. Kulkarni, SSE (TRD)',
      location_km: 'KM 119.5 – 120.8',
      is_complete: false
    },
    {
      id: 3,
      task_code: 'TSK_SNT_04',
      department: 'Signalling (S&T)',
      dept_short: 'SNT',
      task_title: 'S&T Cable: Point Machine 102A Testing & Signal Recalibration',
      status: 'COMPLETE',
      lead_in_charge: 'N. Srinivasan, SSE (S&T)',
      location_km: 'KM 119.2 – 119.2',
      is_complete: true
    }
  ]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync offline queue to localStorage
  useEffect(() => {
    localStorage.setItem('sih_field_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  const loadTasksAndPlan = async () => {
    try {
      const [fieldTasks, plans] = await Promise.all([
        getFieldTasks().catch(() => []),
        getPlans().catch(() => [])
      ]);

      if (plans.length > 0) {
        const latestPlan = plans[0];
        setActivePlanId(latestPlan.id);
        setActivePlanCode((latestPlan as any).plan_code || 'BLK-2026-DLI-04');
        const ver = latestPlan.plan_version || 2;
        setActivePlanVersion(ver);
      }

      const assignedTasks = fieldTasks.filter(t => 
        (t.km_from >= 104 && t.km_to <= 125) || 
        t.task_code === 'TSK_ENG_04' ||
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
  const incompletePartner = coBlockTasks.find(p => !p.is_complete);

  // Manual Offline Sync Handler
  const handleSyncOfflineEvents = async () => {
    if (offlineQueue.length === 0) return;
    setSubmitting(true);
    setStatusMsg(null);
    let syncedCount = 0;
    const remaining: QueuedEvent[] = [];

    for (const item of offlineQueue) {
      try {
        await submitBlockFieldEvent(item.block_id, {
          task_id: item.task_id,
          step_event: item.step_event,
          plan_version: item.plan_version,
          loss_code: item.loss_code,
          remarks: item.remarks
        });
        syncedCount++;
      } catch (err) {
        remaining.push(item);
      }
    }

    setOfflineQueue(remaining);
    setSubmitting(false);
    if (syncedCount > 0) {
      setStatusMsg({
        type: 'success',
        text: `✓ Successfully synced ${syncedCount} queued field events to the railway audit ledger.`
      });
    }
  };

  // Re-acknowledge updated plan version
  const handleReAcknowledge = async () => {
    setSubmitting(true);
    setStatusMsg(null);
    try {
      setUserAckVersion(activePlanVersion);
      if (selectedTask) {
        await submitBlockFieldEvent(activePlanId, {
          task_id: selectedTask.id,
          step_event: 'ACK',
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

  const handleSimulatePartnerComplete = () => {
    setCoBlockTasks(prev => 
      prev.map(p => ({ ...p, is_complete: true, status: 'COMPLETE' }))
    );
    setStatusMsg({
      type: 'success',
      text: 'Simulated: All bundled co-block tasks (ENG, TRD & SNT) marked COMPLETE. Handback gate unlocked.'
    });
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
      setShowSafetyInterlockModal(true);
      const partnerName = incompletePartner ? incompletePartner.dept_short : 'co-block';
      setStatusMsg({
        type: 'error',
        text: `Joint Handback Locked: Partner department tasks (${partnerName}) are still in progress. All bundled departments must finish work before handback.`
      });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Offline mode: queue locally
    if (!navigator.onLine) {
      const queuedItem: QueuedEvent = {
        id: `ev_${Date.now()}`,
        block_id: activePlanId,
        task_id: selectedTask.id,
        step_event: step.key,
        plan_version: userAckVersion,
        remarks: `Offline field event: ${step.key}`,
        timestamp: timeStr
      };
      setOfflineQueue(prev => [...prev, queuedItem]);
      setTimestamps(prev => ({ ...prev, [step.key]: `${timeStr} (Offline Queued)` }));
      setCurrentStepIdx(prev => prev + 1);
      setSubmitting(false);
      setStatusMsg({
        type: 'success',
        text: `Network offline: Event ${step.key} queued locally. Will sync when connectivity returns.`
      });
      if (step.key === 'COMPLETE') setShowLossModal(true);
      return;
    }

    try {
      const res = await submitBlockFieldEvent(activePlanId, {
        task_id: selectedTask.id,
        step_event: step.key,
        plan_version: userAckVersion,
        remarks: `Field Lead executed ${step.key}`
      });

      setTimestamps(prev => ({ ...prev, [step.key]: timeStr }));
      setCurrentStepIdx(prev => prev + 1);
      setStatusMsg({
        type: 'success',
        text: `Field event ${step.key} formally committed to railway audit ledger.`
      });

      if (step.key === 'COMPLETE') {
        setShowLossModal(true);
      }
    } catch (e: any) {
      console.error("Event record error", e);
      // Fallback queueing on network connection failure
      if (!e?.response) {
        const queuedItem: QueuedEvent = {
          id: `ev_${Date.now()}`,
          block_id: activePlanId,
          task_id: selectedTask.id,
          step_event: step.key,
          plan_version: userAckVersion,
          remarks: `Offline fallback: ${step.key}`,
          timestamp: timeStr
        };
        setOfflineQueue(prev => [...prev, queuedItem]);
        setTimestamps(prev => ({ ...prev, [step.key]: `${timeStr} (Queued)` }));
        setCurrentStepIdx(prev => prev + 1);
        setStatusMsg({
          type: 'success',
          text: `Connection lost: Event ${step.key} safely queued locally.`
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: e?.response?.data?.detail || "Failed to record event to backend."
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLossSubmit = async () => {
    if (selectedLossCode && selectedTask) {
      try {
        await submitBlockFieldEvent(activePlanId, {
          task_id: selectedTask.id,
          step_event: 'COMPLETE',
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

  // Determine button label and disabled status
  const isButtonDisabled = () => {
    if (submitting) return true;
    if (currentStep?.key === 'START' && isStalePlan) return true;
    return false;
  };

  const getActionButtonText = () => {
    if (submitting) return 'Recording Timestamp...';
    if (currentStep?.key === 'HANDBACK' && !allPartnersComplete) {
      return '5. Hand Back Line (Safety Interlock Active)';
    }
    return currentStep?.fullLabel || 'Next Step';
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8F5]">
      <div className="flex flex-1 min-h-screen">
        <Sidebar />
        <div className="flex-1 min-w-0 transition-all duration-300 flex flex-col">
          <Header 
            title="Field Possession Lifecycle & Joint Handback" 
            subtitle="Real-Time Timestamps, Re-Ack Cycle & Integrated Multi-Department Barrier" 
          />

          <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
            {/* REUSABLE HERO BANNER */}
            <HeroBanner 
              title="Field Execution & Handback Terminal" 
              subtitle="Offline Ground Progress & Joint Clearance Gate" 
            />

            {/* Offline Event Queue Banner */}
            {offlineQueue.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500 text-slate-950 shadow-md flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <WifiOff size={20} className="text-slate-950 shrink-0" />
                  <div>
                    <span className="font-black text-xs uppercase tracking-wider block">
                      OFFLINE — {offlineQueue.length} events queued
                    </span>
                    <span className="text-xs font-semibold">
                      Events cached securely on device. Will automatically sync to control server when online.
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleSyncOfflineEvents}
                  disabled={submitting}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-950 text-white hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <UploadCloud size={13} className={submitting ? 'animate-spin' : ''} />
                  Sync Now
                </button>
              </div>
            )}

            {/* Top Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl card-warm">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#EAF6F0] text-[#16805C] border border-[#16805C]/20 uppercase tracking-wider flex items-center gap-1">
                    <Smartphone size={12} className="text-[#16805C]" />
                    Mobile Field Execution Lead (JE / SSE)
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">• 56px Touch Stepper</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#D9901A] flex items-center gap-1">
                    <MapPin size={11} className="text-[#D9901A]" />
                    Block: {activePlanCode} (KM 119.2 – 122.5)
                  </span>
                </div>
                <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
                  Field Maintenance Block Possession &amp; Joint Handback
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

            {/* GROUND POSSESSION LIMITS & CHAINAGE CLEARANCE TOPOLOGY */}
            <CorridorTrackTopology variant="field" />

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
                      PLAN UPDATED TO V{activePlanVersion} — YOU ARE VIEWING V{userAckVersion}. REFRESH &amp; RE-ACKNOWLEDGE.
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
            <div className="p-6 rounded-2xl card-warm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E5AA8] flex items-center justify-center border border-blue-200">
                    <Users size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      Integrated Multi-Department Co-Block Status
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Active Possession Window: <span className="font-bold text-slate-800">{activePlanCode}</span> (3 Bundled Tasks)
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {coBlockTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all ${
                      task.status === 'COMPLETE'
                        ? 'bg-emerald-50/80 border-emerald-200 shadow-xs'
                        : 'bg-amber-50/80 border-amber-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        task.dept_short === 'ENG' ? 'bg-[#D9A05B]/20 text-[#7D4D15]' :
                        task.dept_short === 'TRD' ? 'bg-[#8B7CF6]/20 text-[#5442A8]' :
                        'bg-[#2DD4BF]/20 text-[#0E685C]'
                      }`}>
                        {task.dept_short}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        task.status === 'COMPLETE' 
                          ? 'bg-emerald-200 text-emerald-950 border border-emerald-300' 
                          : 'bg-amber-200 text-amber-950 border border-amber-300'
                      }`}>
                        {task.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 tracking-tight leading-snug min-h-[36px]">
                      {task.task_title}
                    </h4>

                    <div className="flex items-center justify-between text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200/70">
                      <span className="font-mono text-[11px] font-bold text-slate-500">{task.task_code}</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[150px]" title={task.lead_in_charge}>
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
                    <div className="p-5 rounded-2xl bg-slate-900 text-white mb-6 shadow-xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] px-2.5 py-0.5 rounded bg-blue-600 text-white font-black uppercase tracking-wider">
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

                    {/* Touch-Optimized 5-Step Stepper Header */}
                    <div className="grid grid-cols-5 gap-2 mb-6">
                      {LIFECYCLE_STEPS.map((step, idx) => {
                        const done = idx < currentStepIdx;
                        const active = idx === currentStepIdx;

                        return (
                          <div 
                            key={step.key}
                            className={`p-2 rounded-xl text-center border transition-all ${
                              done ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
                              active ? 'bg-blue-50 border-blue-400 text-blue-900 font-black shadow-xs ring-1 ring-blue-400' :
                              'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                          >
                            <span className="text-[10px] font-black block truncate">{step.label}</span>
                            <div className="flex items-center justify-center mt-1">
                              {done ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Circle size={14} className={active ? 'text-blue-600 fill-blue-100' : 'text-slate-300'} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Stepper Timeline Rows */}
                    <div className="space-y-3 mb-8">
                      {LIFECYCLE_STEPS.map((step, idx) => {
                        const done = idx < currentStepIdx;
                        const active = idx === currentStepIdx;
                        const isHandbackStep = step.key === 'HANDBACK';
                        const isStartStep = step.key === 'START';

                        return (
                          <div key={step.key} className="flex items-center gap-3">
                            <div className={`flex-1 flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                              done 
                                ? 'bg-emerald-50/80 border-emerald-200' 
                                : active 
                                ? 'bg-blue-50/80 border-blue-300 shadow-sm' 
                                : 'bg-slate-50 border-slate-200'
                            }`}>
                              <div>
                                <p className={`text-xs font-black ${done ? 'text-emerald-900' : (active ? 'text-blue-900' : 'text-slate-400')}`}>
                                  {step.fullLabel}
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
                                    Locked: Waiting for {incompletePartner?.dept_short || 'partner'} completion.
                                  </p>
                                )}
                              </div>

                              {done && (
                                <span className="text-[10px] font-black text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded">
                                  CONFIRMED
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Button: Touch-Optimized 56px Target */}
                    {!isFinished && !showLossModal && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={handleExecuteStep}
                          disabled={isButtonDisabled()}
                          className={`w-full min-h-[56px] text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            isButtonDisabled()
                              ? 'bg-slate-300 cursor-not-allowed text-slate-500 border border-slate-300'
                              : `${currentStep?.color} active:scale-98`
                          }`}
                        >
                          {currentStep?.key === 'HANDBACK' && !allPartnersComplete && (
                            <Lock size={16} className="text-slate-500 shrink-0" />
                          )}
                          {getActionButtonText()}
                        </button>
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
                  <div className="mt-4 p-5 rounded-2xl bg-white border border-amber-300 shadow-xl space-y-3">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-amber-600" />
                      Operational Delay Accounting (Loss Code Required)
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Select standard Indian Railways delay loss code or skip if completed on schedule.
                    </p>
                    
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {LOSS_CODES.map((lc) => (
                        <button
                          key={lc.value}
                          type="button"
                          onClick={() => setSelectedLossCode(lc.value)}
                          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
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
                      placeholder="Additional field supervisor notes..."
                      value={lossNotes}
                      onChange={(e) => setLossNotes(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
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

            {/* JOINT HANDBACK SAFETY INTERLOCK MODAL (G&SR COMPLIANCE) */}
            {showSafetyInterlockModal && (
              <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white rounded-2xl max-w-lg w-full border-2 border-rose-600 shadow-2xl p-6 relative">
                  <button
                    type="button"
                    onClick={() => setShowSafetyInterlockModal(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                  >
                    <X size={20} />
                  </button>

                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="p-3 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                      <ShieldAlert size={26} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                        G&amp;SR MANDATORY STATUTORY INTERLOCK
                      </span>
                      <h3 className="text-lg font-black text-slate-900 leading-snug">
                        Joint Handback Safety Interlock (G&amp;SR Compliance)
                      </h3>
                      <p className="text-xs font-bold text-rose-900 mt-1">
                        Track cannot be certified fit for traffic restoration.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 my-4">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Partner Status Checklist:
                    </p>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Engineering (P.Way)</p>
                          <p className="text-[11px] text-slate-500 font-medium">Track tamping &amp; gauge alignment verified</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded bg-emerald-200 text-emerald-950">
                        COMPLETE
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-300">
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Traction (TRD / OHE)</p>
                          <p className="text-[11px] text-amber-950 font-semibold">Amber Warning · OHE Ladder gang active</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded bg-amber-200 text-amber-950">
                        IN PROGRESS
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Signalling (S&amp;T)</p>
                          <p className="text-[11px] text-slate-500 font-medium">Point machines &amp; signals certified and locked</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded bg-emerald-200 text-emerald-950">
                        COMPLETE
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs font-medium leading-relaxed my-4">
                    <p className="font-bold text-[10px] uppercase tracking-wider text-rose-900 mb-1 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-rose-700" />
                      STATUTORY REGULATORY CLAUSE
                    </p>
                    "Under Indian Railways General Rules, an integrated block possession cannot be relinquished until all bundled department supervisors formally hand back their respective charge."
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      disabled
                      className="w-full py-3.5 px-4 rounded-xl bg-slate-200 text-slate-500 border border-slate-300 font-black text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2 shadow-none"
                    >
                      <Lock size={16} className="text-slate-400" />
                      [Awaiting Co-Block Department Clearance]
                    </button>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setShowSafetyInterlockModal(false)}
                        className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                      >
                        Return to Field Console
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSimulatePartnerComplete();
                          setShowSafetyInterlockModal(false);
                        }}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1"
                      >
                        <RefreshCw size={12} />
                        Simulate TRD Clearance
                      </button>
                    </div>
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
