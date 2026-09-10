import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sidebar, useSidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { HeroBanner } from '../components/layout/HeroBanner';
import { useRole } from '../context/RoleContext';
import { RoleSwitcher } from '../components/layout/RoleSwitcher';
import { 
  Activity, AlertTriangle, CheckCircle2, Clock, 
  Cpu, Train, Sliders, Shield, Zap, Sparkles, RefreshCw,
  Radio, Layers, Compass, ArrowUpRight, ShieldCheck, ShieldAlert, Info,
  AlertCircle, Wrench, Users, HardHat, FileCheck, CloudSun,
  X, FileText, Calendar, MapPin, ChevronDown, ChevronUp, Check,
  Award, Smartphone, CheckSquare, Square, CornerDownRight, ArrowRight,
  Filter, FileSpreadsheet, Eye, TrendingUp, Sun, ListTodo
} from 'lucide-react';
import { 
  getDashboardSummary, getCorridorState, getTrains, getTasks, 
  generateDualPlans, evaluateWhatIf, approvePlan, overridePlan, getAuditLogs 
} from '../services/railwayApi';
import { CorridorState, TrainPath, Task, DualPlanResponse, WhatIfResponse, DashboardSummary, AuditLog } from '../types';
import { MareyChart } from '../components/charts/MareyChart';
import { OccupancyView } from '../components/charts/OccupancyView';
import { WAP7LocomotiveArtwork } from '../components/dashboard/WAP7LocomotiveArtwork';
import { ScenicTrainHeroArtwork } from '../components/dashboard/ScenicTrainHeroArtwork';
import { CorridorDiagnosticsAndEvents } from '../components/dashboard/CorridorDiagnosticsAndEvents';
import { CorridorTrackTopology } from '../components/corridor/CorridorTrackTopology';

interface ReadinessInfo {
  score: number;
  status: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  label: string;
  badgeClass: string;
  recommendationTag: string;
  recommendationClass: string;
  breakdown: {
    gang: number;
    machine: number;
    material: number;
    ptw_disconnection: number;
    weather: number;
  };
  reasons: string[];
}

export const CommandCenter: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const { activeRole, currentProfile } = useRole();
  const navigate = useNavigate();

  const isController = activeRole === 'SECTION_CONTROLLER' || (activeRole as string) === 'CONTROLLER';
  const isSupervisor = activeRole === 'DEPT_SUPERVISOR' || (activeRole as string) === 'SUPERVISOR';
  const isFieldWorker = activeRole === 'FIELD_EXEC_LEAD' || (activeRole as string) === 'FIELD_WORKER';
  const isDivisionalOfficer = activeRole === 'DIVISIONAL_OFFICER';
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [corridor, setCorridor] = useState<CorridorState | null>(null);
  const [trains, setTrains] = useState<TrainPath[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plans, setPlans] = useState<DualPlanResponse | null>(null);
  const [activePlanType, setActivePlanType] = useState<'PLAN_A' | 'PLAN_B'>('PLAN_A');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [hoveredTrain, setHoveredTrain] = useState<string | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  // Corridor Physical Track Strip Interactive States
  const [hoveredStation, setHoveredStation] = useState<{
    code: string;
    name: string;
    km: string;
    platforms: number;
    interlocking: string;
    type: string;
  } | null>(null);
  const [hoveredCorridorTrain, setHoveredCorridorTrain] = useState<{
    trainNo: string;
    name: string;
    priority: string;
    speed: string;
    status: string;
    section: string;
    lineType: string;
  } | null>(null);
  const [hoveredWorkZone, setHoveredWorkZone] = useState<boolean>(false);
  const [isBlockDetailOpen, setIsBlockDetailOpen] = useState<boolean>(false);

  // What-If Sandbox State
  const [machineDelay, setMachineDelay] = useState<number>(0);
  const [weatherCondition, setWeatherCondition] = useState<'CLEAR' | 'RAIN'>('CLEAR');
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLaneAModal, setShowLaneAModal] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [commandTab, setCommandTab] = useState<'TOPOLOGY' | 'MAREY' | 'WHATIF'>('MAREY');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Dual-Plan Engine Decision States
  const [isAuditReportExpanded, setIsAuditReportExpanded] = useState<boolean>(true);
  const [sanctionConfirmModal, setSanctionConfirmModal] = useState<{
    isOpen: boolean;
    planType: 'PLAN_A' | 'PLAN_B';
    title: string;
    duration: string;
    cost: string;
  } | null>(null);
  const [sanctionedPlanAlert, setSanctionedPlanAlert] = useState<string | null>(null);

  // Role 2 (Department Supervisor) States: Department Filter & 100-Point Overrides
  const [deptFilter, setDeptFilter] = useState<'ALL' | 'ENGINEERING' | 'TRD' | 'S_AND_T'>('ALL');
  const [taskReadinessOverrides, setTaskReadinessOverrides] = useState<Record<string, {
    gang?: boolean;
    machine?: boolean;
    material?: boolean;
    ptw?: boolean;
  }>>({
    'TSK_ENG_02': { gang: true, machine: true, material: true, ptw: true },
    'TSK_ENG_03': { gang: true, machine: true, material: false, ptw: false },
    'TSK_ENG_04': { gang: true, machine: false, material: true, ptw: true },
    'TSK_TRD_02': { gang: false, machine: true, material: true, ptw: false },
    'TSK_SNT_01': { gang: true, machine: true, material: true, ptw: true }
  });

  // Role 3 (Field Execution Lead) States: 5-Step Action Lifecycle
  const [fieldStepIdx, setFieldStepIdx] = useState<number>(0);
  const [fieldStepTimestamps, setFieldStepTimestamps] = useState<Record<string, string>>({});

  // Role 4 (Divisional Railway Officer) States: Executive Governance & Overrides
  const [divisionalAuditLogs, setDivisionalAuditLogs] = useState<AuditLog[]>([]);
  const [overrideModalOpen, setOverrideModalOpen] = useState<boolean>(false);
  const [selectedOverrideReason, setSelectedOverrideReason] = useState<string>('');
  const [overrideNotes, setOverrideNotes] = useState<string>('');
  const [isSanctioningPlan, setIsSanctioningPlan] = useState<boolean>(false);

  // Task readiness lookup and 5-point breakdown generator (factor in supervisor overrides)
  const getTaskReadiness = (task: Task): ReadinessInfo => {
    const override = taskReadinessOverrides[task.task_code] || taskReadinessOverrides[String(task.id)];

    let gang = 20;
    let machine = 25;
    let material = 20;
    let ptw = 20;
    let weather = 15;

    if (override) {
      gang = override.gang !== false ? 20 : 0;
      machine = override.machine !== false ? 25 : 0;
      material = override.material !== false ? 20 : 0;
      ptw = override.ptw !== false ? 20 : 0;
    } else {
      if (task.lane === 'A_EMERGENCY' || task.task_code === 'TSK_ENG_01') {
        gang = 20; machine = 25; material = 20; ptw = 20;
      } else if (task.task_code === 'TSK_ENG_02') {
        gang = 20; machine = 25; material = 20; ptw = 20;
      } else if (task.task_code === 'TSK_ENG_03') {
        gang = 15; machine = 25; material = 0; ptw = 0;
      } else if (task.task_code === 'TSK_ENG_04') {
        gang = 20; machine = 10; material = 20; ptw = 10;
      } else if (task.task_code === 'TSK_TRD_02') {
        gang = 5; machine = 25; material = 20; ptw = 0;
      } else if (task.task_code === 'TSK_SNT_01') {
        gang = 20; machine = 25; material = 20; ptw = 10;
      } else {
        const mod = (task.id || 1) % 4;
        if (mod === 1) gang = 15;
        else if (mod === 2) ptw = 15;
        else if (mod === 3) machine = 20;
      }
    }

    const total = gang + machine + material + ptw + weather;
    const isEligible = total >= 80;
    const isBuffered = total >= 60 && total < 80;

    const reasons: string[] = [];
    if (gang < 20) reasons.push('Gang allocation constrained: requires mobilizing additional linemen/gang');
    if (machine < 25) reasons.push('Machinery verification pending: siding inspection or transit required');
    if (material < 20) reasons.push('Material deficit at site: depot dispatch verification pending');
    if (ptw < 20) reasons.push('Operating Dept line block PTW permit pending formal clearance');
    if (!reasons.length) reasons.push('All 100-Point Readiness Prerequisites Verified');

    return {
      score: total,
      status: total >= 80 ? 'HIGH' : (total >= 60 ? 'MEDIUM' : 'LOW'),
      label: `${total} pts · ${isEligible ? 'Ready' : (isBuffered ? 'Buffer Imposed' : 'Deferred')}`,
      badgeClass: total >= 80 
        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 glow-teal' 
        : (total >= 60 ? 'bg-amber-50 text-amber-800 border-amber-300 glow-amber' : 'bg-rose-50 text-rose-800 border-rose-300 glow-rose'),
      recommendationTag: isEligible ? 'Plan A Eligible' : (isBuffered ? 'Extra Buffer Imposed' : 'Plan B / Deferred'),
      recommendationClass: isEligible ? 'bg-emerald-600 text-white' : (isBuffered ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'),
      breakdown: { gang, machine, material, ptw_disconnection: ptw, weather },
      reasons
    };
  };

  const toggleReadinessItem = (taskIdentifier: string, item: 'gang' | 'machine' | 'material' | 'ptw', currentVal: boolean) => {
    setTaskReadinessOverrides(prev => {
      const existing = prev[taskIdentifier] || {};
      return {
        ...prev,
        [taskIdentifier]: {
          ...existing,
          [item]: !currentVal
        }
      };
    });
  };

  const loadData = async () => {
    try {
      const [sumRes, corRes, trnRes, tskRes, auditRes] = await Promise.all([
        getDashboardSummary(),
        getCorridorState(),
        getTrains(),
        getTasks(),
        getAuditLogs()
      ]);
      setSummary(sumRes);
      setCorridor(corRes);
      setTrains(trnRes);
      setTasks(tskRes);
      setDivisionalAuditLogs(auditRes || []);
      if (tskRes.length > 0) {
        setSelectedTask(tskRes[0]);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Failed to load command center telemetry", e);
    }
  };

  const handleGeneratePlans = async () => {
    setIsGenerating(true);
    try {
      const res = await generateDualPlans();
      setPlans(res);
      setActivePlanType('PLAN_A');
    } catch (e) {
      console.error("Failed to generate dual plans", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunWhatIf = async (delayVal: number, weatherVal: 'CLEAR' | 'RAIN') => {
    setIsSimulating(true);
    const extra = delayVal + (weatherVal === 'RAIN' ? 25 : 0);
    if (extra > 20) {
      setActivePlanType('PLAN_B');
    } else {
      setActivePlanType('PLAN_A');
    }
    try {
      const scenarioName = weatherVal === 'RAIN' ? 'Weather Unsuitable' : (delayVal > 0 ? 'Machine Delayed' : 'Baseline Schedule');
      const res = await evaluateWhatIf(scenarioName, delayVal);
      setWhatIfResult(res);
    } catch (e) {
      console.error("What-If simulation failed", e);
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    loadData();
    handleGeneratePlans();
  }, []);

  // Automatic routing if role is Field Execution Lead
  useEffect(() => {
    if (activeRole === 'FIELD_EXEC_LEAD') {
      navigate('/field');
    }
  }, [activeRole, navigate]);

  // What-If Dynamic Calculation
  const extraDelay = machineDelay + (weatherCondition === 'RAIN' ? 25 : 0);
  const addedWTM = Math.round(extraDelay * 1.6);
  const newPlanACost = (1243.0 + addedWTM).toFixed(1);
  const planBCost = (1554.0).toFixed(1);

  // SVG Marey Graph Coordinate Calculations (00:00 - 06:00, KM 100 - 158)
  const chartW = 960;
  const chartH = 430;
  const padL = 95;
  const padR = 30;
  const padT = 35;
  const padB = 45;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const minKm = 100.0;
  const maxKm = 158.0;
  const kmSpan = maxKm - minKm;

  const timeToX = (hours: number) => padL + (Math.max(0, Math.min(hours, 6.0)) / 6.0) * plotW;
  const kmToY = (km: number) => padT + ((Math.max(minKm, Math.min(km, maxKm)) - minKm) / kmSpan) * plotH;

  const parseTimeToHours = (isoStr: string) => {
    const dt = new Date(isoStr);
    if (isNaN(dt.getTime())) return 0;
    return dt.getHours() + dt.getMinutes() / 60.0;
  };

  // Scheduled Possession Windows on Section STB (KM 120) to STC (KM 140)
  const blockY1 = kmToY(120.0);
  const blockY2 = kmToY(140.0);
  const blockH = blockY2 - blockY1;

  // Plan A: 02:00 to 04:00 (120 min duration)
  const planAX1 = timeToX(2.0);
  const planAX2 = timeToX(4.0);
  const planAW = planAX2 - planAX1;

  // Plan B: 02:00 to 04:45 (165 min duration)
  const planBX1 = timeToX(2.0);
  const planBX2 = timeToX(4.75);
  const planBW = planBX2 - planBX1;

  // Conflict Point: BCN-91021 intersects block at ~02:52.5, KM 130.0
  const conflictX = timeToX(2.875);
  const conflictY = kmToY(130.0);

  // Dynamic recommendation message
  const getDynamicRecommendation = () => {
    if (machineDelay === 0 && weatherCondition === 'CLEAR') {
      return "System operational on Plan A (P50 Optimal). All resources aligned within scheduled tolerances.";
    }
    return `🚨 Disruption Shock (+${extraDelay}m): Plan A buffer violated! System automatically triggers PLAN B (P90 Robust). Availability Loss increased by +${addedWTM} WTM. Machine window shifted to next viable gap.`;
  };

  const selectedReadiness = selectedTask ? getTaskReadiness(selectedTask) : null;

  const FIELD_STEPS = [
    { key: 'ACKNOWLEDGED', label: '1. Acknowledge Sanctioned Plan', color: 'bg-blue-600 hover:bg-blue-700' },
    { key: 'READY', label: '2. Confirm Site Readiness & Machine Arrival', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { key: 'WORK_STARTED', label: '3. Start Maintenance Work Window', color: 'bg-amber-600 hover:bg-amber-700' },
    { key: 'WORK_COMPLETED', label: '4. Complete Work & Clear Track', color: 'bg-emerald-600 hover:bg-emerald-700' },
    { key: 'LINE_HANDED_BACK', label: '5. Hand Back Line to Traffic Control', color: 'bg-slate-900 hover:bg-slate-800' }
  ];

  const handleFieldStepAdvance = (stepIdx: number) => {
    const step = FIELD_STEPS[stepIdx];
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setFieldStepTimestamps(prev => ({ ...prev, [step.key]: timeStr }));
    setFieldStepIdx(stepIdx + 1);
  };

  const handleDivisionalOfficialSanction = async () => {
    setIsSanctioningPlan(true);
    try {
      if (plans?.plan_a_id) {
        await approvePlan(plans.plan_a_id);
      }
      setSanctionedPlanAlert('Official Sanction Granted by Sr.DOM: Plan A (P50 Optimal) status updated to SANCTIONED in Immutable Audit Log.');
      const newLog: AuditLog = {
        id: (divisionalAuditLogs.length ? Math.max(...divisionalAuditLogs.map(l => l.id)) : 400) + 1,
        actor_id: 101,
        plan_id: plans?.plan_a_id || 1,
        role: 'Sr.DOM (Divisional Officer)',
        action: 'SANCTIONED',
        division: 'DELHI',
        reason_code: 'STATUTORY_AUTHORIZATION',
        reason_text: 'Official Executive Sanction for BLK-2026-DLI-04 (02:00 - 04:00 Window) granted under IR Safety Code.',
        created_at: new Date().toISOString()
      };
      setDivisionalAuditLogs(prev => [newLog, ...prev]);
    } catch (e) {
      console.error("Failed official sanction", e);
    } finally {
      setIsSanctioningPlan(false);
    }
  };

  const handleDivisionalOverrideSubmit = async () => {
    if (!selectedOverrideReason) return;
    try {
      if (plans?.plan_a_id) {
        await overridePlan(plans.plan_a_id, `${selectedOverrideReason}: ${overrideNotes || 'Executive Discretion'}`);
      }
      const newLog: AuditLog = {
        id: (divisionalAuditLogs.length ? Math.max(...divisionalAuditLogs.map(l => l.id)) : 400) + 1,
        actor_id: 101,
        plan_id: plans?.plan_a_id || 1,
        role: 'Sr.DOM (Divisional Officer)',
        action: 'OVERRIDE_RECORDED',
        division: 'DELHI',
        reason_code: selectedOverrideReason,
        reason_text: overrideNotes || `Executive override invoked under mandatory reason code: ${selectedOverrideReason}`,
        created_at: new Date().toISOString()
      };
      setDivisionalAuditLogs(prev => [newLog, ...prev]);
      setSanctionedPlanAlert(`Plan Override Recorded: Mandatory Reason Code [${selectedOverrideReason}] committed to immutable audit trail.`);
      setOverrideModalOpen(false);
      setSelectedOverrideReason('');
      setOverrideNotes('');
    } catch (e) {
      console.error("Failed override submit", e);
    }
  };

  const renderTaskQueueSection = (isHero: boolean = false) => {
    const defaultCalibratedTasks: Task[] = [
      {
        id: 1,
        task_code: 'TSK-ENG-02',
        work_type: 'Track Tamping & Alignment Renewal',
        department: 'ENGINEERING',
        lane: 'B1_PLANNED',
        priority_band: 'HIGH',
        km_from: 104.2,
        km_to: 124.8,
        block_section_id: 1,
        estimated_duration_minutes: 120,
        duration_buffer_minutes: 15,
        status: 'PENDING',
        requires_line_block: 1,
        requires_power_block: 0,
        requires_disconnection: 0,
        power_ready: 1,
        disconnection_ready: 1,
        overdue_days: 0,
        readiness_score: 95,
        worksite_ready: 1,
        material_ready: 1,
        ptw_ready: 1,
        weather_suitable: 1
      },
      {
        id: 2,
        task_code: 'TSK-ENG-01',
        work_type: 'Emergency Weld Defect Clamp & Ultrasonic Rail Test',
        department: 'ENGINEERING',
        lane: 'A_EMERGENCY',
        priority_band: 'HIGH',
        km_from: 112.5,
        km_to: 112.9,
        block_section_id: 1,
        estimated_duration_minutes: 60,
        duration_buffer_minutes: 10,
        status: 'PENDING',
        requires_line_block: 1,
        requires_power_block: 0,
        requires_disconnection: 0,
        power_ready: 1,
        disconnection_ready: 1,
        overdue_days: 0,
        readiness_score: 100,
        worksite_ready: 1,
        material_ready: 1,
        ptw_ready: 1,
        weather_suitable: 1
      },
      {
        id: 3,
        task_code: 'TSK-TRD-02',
        work_type: 'OHE Catenary Wire Sag Adjustment & Dropper Tuning',
        department: 'TRD',
        lane: 'B1_PLANNED',
        priority_band: 'MEDIUM',
        km_from: 120.0,
        km_to: 135.5,
        block_section_id: 2,
        estimated_duration_minutes: 90,
        duration_buffer_minutes: 15,
        status: 'PENDING',
        requires_line_block: 1,
        requires_power_block: 1,
        requires_disconnection: 0,
        power_ready: 1,
        disconnection_ready: 1,
        overdue_days: 0,
        readiness_score: 85,
        worksite_ready: 1,
        material_ready: 1,
        ptw_ready: 1,
        weather_suitable: 1
      },
      {
        id: 4,
        task_code: 'TSK-SNT-01',
        work_type: 'Axle Counter Head Calibration & Track Circuit Check',
        department: 'S_AND_T',
        lane: 'B2_STATUTORY',
        priority_band: 'HIGH',
        km_from: 138.0,
        km_to: 142.0,
        block_section_id: 3,
        estimated_duration_minutes: 75,
        duration_buffer_minutes: 10,
        status: 'PENDING',
        requires_line_block: 1,
        requires_power_block: 0,
        requires_disconnection: 1,
        power_ready: 1,
        disconnection_ready: 1,
        overdue_days: 0,
        readiness_score: 88,
        worksite_ready: 1,
        material_ready: 1,
        ptw_ready: 1,
        weather_suitable: 1
      },
      {
        id: 5,
        task_code: 'TSK-ENG-03',
        work_type: 'Deep Ballast Screening & Shoulder Ballast Consolidation',
        department: 'ENGINEERING',
        lane: 'B1_PLANNED',
        priority_band: 'MEDIUM',
        km_from: 144.0,
        km_to: 154.0,
        block_section_id: 4,
        estimated_duration_minutes: 150,
        duration_buffer_minutes: 20,
        status: 'PENDING',
        requires_line_block: 1,
        requires_power_block: 0,
        requires_disconnection: 0,
        power_ready: 1,
        disconnection_ready: 1,
        overdue_days: 0,
        readiness_score: 82,
        worksite_ready: 1,
        material_ready: 1,
        ptw_ready: 1,
        weather_suitable: 1
      },
      {
        id: 6,
        task_code: 'TSK-TRD-01',
        work_type: 'Isolator Inspection & Power Neutral Section Overhaul',
        department: 'TRD',
        lane: 'B2_STATUTORY',
        priority_band: 'HIGH',
        km_from: 118.0,
        km_to: 122.0,
        block_section_id: 2,
        estimated_duration_minutes: 60,
        duration_buffer_minutes: 10,
        status: 'PENDING',
        requires_line_block: 1,
        requires_power_block: 1,
        requires_disconnection: 0,
        power_ready: 1,
        disconnection_ready: 1,
        overdue_days: 0,
        readiness_score: 90,
        worksite_ready: 1,
        material_ready: 1,
        ptw_ready: 1,
        weather_suitable: 1
      }
    ];

    const displayTaskList = (tasks && tasks.length > 0) ? tasks : defaultCalibratedTasks;
    const currentActiveTask = selectedTask || displayTaskList[0];
    const readinessInfo = currentActiveTask ? getTaskReadiness(currentActiveTask) : null;
    const displayScore = readinessInfo ? readinessInfo.score : 88;

    return (
      <div id="task-queue-section" className={`space-y-4 ${isHero ? 'p-1' : ''}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* 5. CORRIDOR MAINTENANCE TASK QUEUE (Government Enterprise Table - 2 Cols) */}
          <div className="lg:col-span-2 card-warm p-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#D9E0E8]">
              <div>
                <h3 className="text-sm font-black text-[#102A43] uppercase tracking-wider font-sans flex items-center gap-2">
                  Corridor Maintenance Task Queue
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#102A43] text-white">
                    70 Active
                  </span>
                </h3>
                <p className="text-[11px] text-[#627D98] font-medium mt-0.5">
                  Lane A Emergency &amp; Lane B1/B2 Planned Matrix · Delhi Division Corridor
                </p>
              </div>

              {/* Action notice */}
              <span className="text-[11px] font-bold text-[#1E5AA8] bg-[#EAF2FF] border border-[#BFDBFE] px-2.5 py-1 rounded-lg">
                Click task row to inspect 100-Point Gate
              </span>
            </div>

            {/* Department Filter Tabs */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              {[
                { id: 'ALL', label: 'All (70)', count: 70 },
                { id: 'ENGINEERING', label: 'Engineering (P.Way)', count: 42, dot: 'bg-[#16805C]' },
                { id: 'TRD', label: 'Electrical (TRD)', count: 18, dot: 'bg-[#1E5AA8]' },
                { id: 'S_AND_T', label: 'S&T Signalling', count: 10, dot: 'bg-[#7456B8]' },
              ].map((tab) => {
                const isTabActive = deptFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDeptFilter(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                      isTabActive
                        ? 'bg-[#102A43] text-white shadow-sm'
                        : 'bg-[#F0F4F8] text-[#334E68] hover:bg-[#E2E8F0]'
                    }`}
                  >
                    {tab.dot && <span className={`w-2 h-2 rounded-full ${tab.dot}`}></span>}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Clean Zebra Government Enterprise Table */}
            <div className="border border-[#D9E0E8] rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto max-h-[460px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="gov-table-header">
                      <th className="py-2.5 px-3 w-10 text-center font-bold">#</th>
                      <th className="py-2.5 px-3 font-bold">Task ID</th>
                      <th className="py-2.5 px-4 font-bold">Work Description</th>
                      <th className="py-2.5 px-3 font-bold">Lane</th>
                      <th className="py-2.5 px-3 font-bold">KM Range</th>
                      <th className="py-2.5 px-3 font-bold">Duration</th>
                      <th className="py-2.5 px-3 font-bold">Status</th>
                      <th className="py-2.5 px-3 text-right font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayTaskList
                      .filter(t => {
                        if (deptFilter === 'ALL') return true;
                        if (deptFilter === 'ENGINEERING') return t.department === 'ENGINEERING' || (t.department as string) === 'ENG';
                        if (deptFilter === 'S_AND_T') return t.department === 'S_AND_T' || (t.department as string) === 'SNT';
                        return t.department === deptFilter;
                      })
                      .map((t, idx) => {
                        const isSelected = (currentActiveTask?.id === t.id) || (currentActiveTask?.task_code === t.task_code);
                        const isLaneA = t.lane === 'A_EMERGENCY';
                        
                        // Status dot calculation
                        let statusColor = '#16805C'; // Normal
                        let statusLabel = 'Normal';
                        if (isLaneA || t.priority_band === 'HIGH') {
                          statusColor = '#B42332';
                          statusLabel = 'High';
                        } else if (t.priority_band === 'MEDIUM') {
                          statusColor = '#D9901A';
                          statusLabel = 'Medium';
                        }

                        return (
                          <tr
                            key={t.id || idx}
                            onClick={() => setSelectedTask(t)}
                            className={`gov-table-row cursor-pointer transition-colors ${
                              isSelected ? 'bg-[#EBF3FC] border-l-4 border-[#1E5AA8]' : ''
                            }`}
                          >
                            <td className="py-3 px-3 text-center font-mono font-bold text-[#627D98]">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3 font-mono font-black text-[#102A43] whitespace-nowrap">
                              {t.task_code}
                            </td>
                            <td className="py-3 px-4 text-[#102A43] font-semibold max-w-[220px] truncate" title={t.work_type}>
                              {t.work_type}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                isLaneA ? 'pill-lane-a' : 'pill-lane-b'
                              }`}>
                                {isLaneA ? 'Lane A' : 'Lane B'}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-[#334E68] whitespace-nowrap">
                              KM {t.km_from} – {t.km_to}
                            </td>
                            <td className="py-3 px-3 font-mono text-[#334E68] whitespace-nowrap">
                              {t.estimated_duration_minutes}m
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 font-bold text-xs" style={{ color: statusColor }}>
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }}></span>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTask(t);
                                }}
                                className="px-3 py-1 bg-white hover:bg-[#F0F4F8] text-[#1E5AA8] border border-[#D9E0E8] hover:border-[#1E5AA8] font-bold rounded text-xs transition-colors cursor-pointer shadow-2xs"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between text-xs text-[#627D98] pt-2 border-t border-[#D9E0E8]">
              <span>Showing {displayTaskList.length} calibrated tasks across Section GZB–TDL</span>
              <span className="font-mono text-[11px] font-bold text-[#102A43]">
                G&SR Section 4.14 Compliant
              </span>
            </div>
          </div>

          {/* 6. 100-POINT READINESS GATE (Right-Side Midnight Navy Panel - 1 Col) */}
          <div 
            style={{ background: 'linear-gradient(180deg, #071A2F 0%, #102A43 100%)' }}
            className="card-midnight p-6 text-white flex flex-col justify-between"
          >
            <div>
              {/* Header with Title & Large Bold Score */}
              <div className="flex items-center justify-between pb-4 border-b border-[#1C3D5A]">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#ECC94B]">
                    Corridor Integrity Gate
                  </p>
                  <h3 className="text-base font-black text-white mt-0.5 font-sans">
                    100-Point Readiness Gate
                  </h3>
                </div>

                {/* Large Bold Score: 88 / 100 */}
                <div className="text-right">
                  <span className="text-3xl font-black text-white font-mono tracking-tight">
                    {displayScore}
                  </span>
                  <span className="text-sm font-bold text-[#A0AEC0] font-mono"> / 100</span>
                </div>
              </div>

              {/* Status Pill: Plan A Eligible */}
              <div className="my-4 p-2.5 rounded-xl bg-[#0A2540] border border-[#1E5AA8] flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#38BDF8] shrink-0" />
                <p className="text-xs font-bold text-[#E0F2FE] leading-tight">
                  ✓ Plan A Eligible (P50 Optimal) - Highest track availability.
                </p>
              </div>

              {/* 5 Pillar Progress Bars */}
              <div className="space-y-3.5">
                {/* 1. Machine & Tamping Stabling (25%) -> 100% */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#CBD5E0] font-semibold flex items-center gap-1.5">
                      <Wrench size={13} className="text-[#38BDF8]" />
                      1. Machine &amp; Tamping Stabling (25%)
                    </span>
                    <span className="font-mono font-bold text-white">100%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#34506B' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: '100%', backgroundColor: '#5B9BD5' }}></div>
                  </div>
                </div>

                {/* 2. Maintenance Gang Mobilization (20%) -> 100% */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#CBD5E0] font-semibold flex items-center gap-1.5">
                      <Users size={13} className="text-[#38BDF8]" />
                      2. Maintenance Gang Mobilization (20%)
                    </span>
                    <span className="font-mono font-bold text-white">100%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#34506B' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: '100%', backgroundColor: '#5B9BD5' }}></div>
                  </div>
                </div>

                {/* 3. Track Material & Spares at Depot (20%) -> 100% */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#CBD5E0] font-semibold flex items-center gap-1.5">
                      <HardHat size={13} className="text-[#38BDF8]" />
                      3. Track Material &amp; Spares at Depot (20%)
                    </span>
                    <span className="font-mono font-bold text-white">100%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#34506B' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: '100%', backgroundColor: '#5B9BD5' }}></div>
                  </div>
                </div>

                {/* 4. PTW & S&T Disconnection Notice (20%) -> 100% */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#CBD5E0] font-semibold flex items-center gap-1.5">
                      <FileCheck size={13} className="text-[#38BDF8]" />
                      4. PTW &amp; S&T Disconnection Notice (20%)
                    </span>
                    <span className="font-mono font-bold text-white">100%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#34506B' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: '100%', backgroundColor: '#5B9BD5' }}></div>
                  </div>
                </div>

                {/* 5. Site Weather & Track Visibility (15%) -> 92% */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#CBD5E0] font-semibold flex items-center gap-1.5">
                      <CloudSun size={13} className="text-[#ECC94B]" />
                      5. Site Weather &amp; Track Visibility (15%)
                    </span>
                    <span className="font-mono font-bold text-white">92%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#34506B' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: '92%', backgroundColor: '#5B9BD5' }}></div>
                  </div>
                </div>
              </div>

              {/* Supervisor Live Checklist Adjustments (Role-Aware) */}
              {isSupervisor && currentActiveTask && (
                <div className="mt-5 p-3 rounded-xl bg-[#071A2F] border border-[#1C3D5A]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-[#ECC94B] tracking-wider flex items-center gap-1.5">
                      <Sliders size={12} />
                      Supervisor Live Checklist
                    </span>
                    <span className="text-[9px] font-bold text-white bg-[#1E5AA8] px-2 py-0.5 rounded">
                      Interactive
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => toggleReadinessItem(currentActiveTask.task_code, 'gang', readinessInfo?.breakdown.gang === 20)}
                      className={`p-2 rounded-lg border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        readinessInfo?.breakdown.gang === 20 
                          ? 'bg-[#1E5AA8]/40 border-[#60A5FA] text-white' 
                          : 'bg-[#0A1C2E] border-[#1C3D5A] text-[#829AB1]'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {readinessInfo?.breakdown.gang === 20 ? <CheckSquare size={12} className="text-[#38BDF8]" /> : <Square size={12} />}
                        Gang Ready
                      </span>
                      <span className="font-mono text-[10px]">+20</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleReadinessItem(currentActiveTask.task_code, 'machine', readinessInfo?.breakdown.machine === 25)}
                      className={`p-2 rounded-lg border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        readinessInfo?.breakdown.machine === 25 
                          ? 'bg-[#1E5AA8]/40 border-[#60A5FA] text-white' 
                          : 'bg-[#0A1C2E] border-[#1C3D5A] text-[#829AB1]'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {readinessInfo?.breakdown.machine === 25 ? <CheckSquare size={12} className="text-[#38BDF8]" /> : <Square size={12} />}
                        Machine Ready
                      </span>
                      <span className="font-mono text-[10px]">+25</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleReadinessItem(currentActiveTask.task_code, 'material', readinessInfo?.breakdown.material === 20)}
                      className={`p-2 rounded-lg border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        readinessInfo?.breakdown.material === 20 
                          ? 'bg-[#1E5AA8]/40 border-[#60A5FA] text-white' 
                          : 'bg-[#0A1C2E] border-[#1C3D5A] text-[#829AB1]'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {readinessInfo?.breakdown.material === 20 ? <CheckSquare size={12} className="text-[#38BDF8]" /> : <Square size={12} />}
                        Material Staged
                      </span>
                      <span className="font-mono text-[10px]">+20</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleReadinessItem(currentActiveTask.task_code, 'ptw', readinessInfo?.breakdown.ptw_disconnection === 20)}
                      className={`p-2 rounded-lg border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        readinessInfo?.breakdown.ptw_disconnection === 20 
                          ? 'bg-[#1E5AA8]/40 border-[#60A5FA] text-white' 
                          : 'bg-[#0A1C2E] border-[#1C3D5A] text-[#829AB1]'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {readinessInfo?.breakdown.ptw_disconnection === 20 ? <CheckSquare size={12} className="text-[#38BDF8]" /> : <Square size={12} />}
                        PTW Cleared
                      </span>
                      <span className="font-mono text-[10px]">+20</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Re-run button */}
            <div className="mt-5 pt-3.5 border-t border-[#1C3D5A]">
              <button
                onClick={() => handleGeneratePlans()}
                className="w-full py-2.5 bg-[#1E5AA8] hover:bg-[#1A4C8E] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
                Re-Evaluate 100-Point Readiness
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F7F8F5]">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out">
        {/* GLOBAL TOP HEADER */}
        <Header />

        <main className="p-6 relative z-10 space-y-6 flex-1">
          {/* 4. HERO BANNER (Vande Bharat Authentic Banner) */}
          <HeroBanner 
            title="Operations Command Center" 
            subtitle="Decision Support & Capacity Preservation" 
          />

          {/* 4 STAT METRIC CARDS WITH SPARKLINE ACCENTS (Exact Reference Layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Active Tasks [70] | ▲ 12% (Blue Upward Sparkline) */}
            <div className="bg-[#FCFBF8] border border-[#E2E8F0] p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#627D98] uppercase tracking-wider">Active Tasks</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#1E5AA8] bg-[#EAF2FF] border border-[#BFDBFE] px-2 py-0.5 rounded-md">
                    ▲ 12%
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <p className="text-3xl font-black text-[#102A43] font-mono">
                    {summary?.total_tasks || 70}
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] text-[#1E5AA8] flex items-center justify-center">
                    <ListTodo size={20} />
                  </div>
                </div>
                <p className="text-[11px] text-[#829AB1] font-medium mt-1">
                  All scheduled &amp; pending corridor works
                </p>
              </div>
              {/* Blue Upward Sparkline */}
              <svg viewBox="0 0 200 36" className="w-full h-8 mt-3 -mb-1" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E5AA8" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#1E5AA8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0 30 Q 35 26 70 28 T 130 16 T 175 10 L 200 4 L 200 36 L 0 36 Z" fill="url(#sparkBlue)" />
                <path d="M 0 30 Q 35 26 70 28 T 130 16 T 175 10 L 200 4" stroke="#1E5AA8" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            {/* Card 2: Ready / On Track [58] | ▲ 8% (Green Upward Wave) */}
            <div className="bg-[#FCFBF8] border border-[#E2E8F0] p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#627D98] uppercase tracking-wider">Ready / On Track</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#16805C] bg-[#EAF6F0] border border-[#C6EADB] px-2 py-0.5 rounded-md">
                    ▲ 8%
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <p className="text-3xl font-black text-[#102A43] font-mono">
                    {summary?.open_tasks ? 58 : 58}
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-[#EAF6F0] text-[#16805C] flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                </div>
                <p className="text-[11px] text-[#829AB1] font-medium mt-1">
                  Pillar verified for Plan A possession
                </p>
              </div>
              {/* Green Upward Wave */}
              <svg viewBox="0 0 200 36" className="w-full h-8 mt-3 -mb-1" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16805C" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#16805C" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0 26 Q 40 30 80 20 T 150 12 L 200 4 L 200 36 L 0 36 Z" fill="url(#sparkGreen)" />
                <path d="M 0 26 Q 40 30 80 20 T 150 12 L 200 4" stroke="#16805C" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            {/* Card 3: At Risk [3] | ▲ 2% (Amber Warning Curve) */}
            <div className="bg-[#FCFBF8] border border-[#E2E8F0] p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#627D98] uppercase tracking-wider">At Risk</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#D9901A] bg-[#FFF7E6] border border-[#FFE7BA] px-2 py-0.5 rounded-md">
                    ▲ 2%
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <p className="text-3xl font-black text-[#102A43] font-mono">
                    {summary?.lane_b2_count ? 3 : 3}
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-[#FFF7E6] text-[#D9901A] flex items-center justify-center">
                    <AlertTriangle size={20} />
                  </div>
                </div>
                <p className="text-[11px] text-[#829AB1] font-medium mt-1">
                  Pending S&amp;T or material clearance
                </p>
              </div>
              {/* Amber Warning Curve */}
              <svg viewBox="0 0 200 36" className="w-full h-8 mt-3 -mb-1" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D9901A" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#D9901A" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0 20 Q 30 10 65 24 T 120 12 T 165 22 L 200 16 L 200 36 L 0 36 Z" fill="url(#sparkAmber)" />
                <path d="M 0 20 Q 30 10 65 24 T 120 12 T 165 22 L 200 16" stroke="#D9901A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            {/* Card 4: Delayed [2] | ▲ 1% (Red Critical Blip Curve) */}
            <div className="bg-[#FCFBF8] border border-[#E2E8F0] p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#627D98] uppercase tracking-wider">Delayed</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#B42332] bg-[#FFF0F1] border border-[#F8D7DA] px-2 py-0.5 rounded-md">
                    ▲ 1%
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <p className="text-3xl font-black text-[#102A43] font-mono">
                    {summary?.lane_a_count ? 2 : 2}
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0F1] text-[#B42332] flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                </div>
                <p className="text-[11px] text-[#829AB1] font-medium mt-1">
                  Lane A emergency / siding adjustment
                </p>
              </div>
              {/* Red Critical Blip Curve */}
              <svg viewBox="0 0 200 36" className="w-full h-8 mt-3 -mb-1" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B42332" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#B42332" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0 24 Q 40 24 70 22 L 90 8 L 105 30 L 120 16 L 150 23 L 200 22 L 200 36 L 0 36 Z" fill="url(#sparkRed)" />
                <path d="M 0 24 Q 40 24 70 22 L 90 8 L 105 30 L 120 16 L 150 23 L 200 22" stroke="#B42332" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* ACTIVE ROLE CONTEXT BANNER */}
          <div className="card-warm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#D9E0E8]">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs ${currentProfile.avatarBg}`}>
                {currentProfile.avatarInitials}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-[#102A43]">{currentProfile.title}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${currentProfile.badgeBg} ${currentProfile.badgeText} ${currentProfile.badgeBorder} uppercase tracking-wider`}>
                    {currentProfile.roleBadge}
                  </span>
                  <span className="text-[10px] text-[#627D98] font-semibold">• {currentProfile.department}</span>
                </div>
                <p className="text-[11px] text-[#486581] font-medium mt-0.5">
                  {currentProfile.operationalFocus}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeRole === 'DEPT_SUPERVISOR' && (
                <a 
                  href="#task-queue-section"
                  className="px-3.5 py-1.5 rounded-xl bg-[#16805C] hover:bg-[#126649] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckSquare size={13} /> Jump to Readiness Gate
                </a>
              )}
              {activeRole === 'FIELD_EXEC_LEAD' && (
                <Link 
                  to="/field"
                  className="px-3.5 py-1.5 rounded-xl bg-[#D9901A] hover:bg-[#B87A15] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Smartphone size={13} /> Open Mobile Field App
                </Link>
              )}
              {activeRole === 'DIVISIONAL_OFFICER' && (
                <a 
                  href="#governance-strip"
                  className="px-3.5 py-1.5 rounded-xl bg-[#7456B8] hover:bg-[#5E4496] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Award size={13} /> Jump to Executive Sanction Strip
                </a>
              )}
            </div>
          </div>

          {/* TOP-LEVEL SEGMENTED SUB-TAB BAR TO DECONGEST COMMAND CENTER */}
          <div className="card-warm p-1.5 border border-[#D9E0E8] rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setCommandTab('TOPOLOGY')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  commandTab === 'TOPOLOGY'
                    ? 'bg-[#9E1B28] text-white shadow-md shadow-[#9E1B28]/25 font-black'
                    : 'text-[#486581] hover:text-[#102A43] hover:bg-white/80 font-semibold'
                }`}
              >
                <Radio size={14} className={commandTab === 'TOPOLOGY' ? 'text-white animate-pulse' : 'text-[#627D98]'} />
                <span>🚆 Live Corridor Topology &amp; Strip Map</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  commandTab === 'TOPOLOGY' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}>
                  58 KM
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCommandTab('MAREY')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  commandTab === 'MAREY'
                    ? 'bg-[#9E1B28] text-white shadow-md shadow-[#9E1B28]/25 font-black'
                    : 'text-[#486581] hover:text-[#102A43] hover:bg-white/80 font-semibold'
                }`}
              >
                <TrendingUp size={14} className={commandTab === 'MAREY' ? 'text-white' : 'text-[#627D98]'} />
                <span>📈 Train Trajectories &amp; Marey Graph</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  commandTab === 'MAREY' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}>
                  00:00–06:00
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCommandTab('WHATIF')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  commandTab === 'WHATIF'
                    ? 'bg-[#9E1B28] text-white shadow-md shadow-[#9E1B28]/25 font-black'
                    : 'text-[#486581] hover:text-[#102A43] hover:bg-white/80 font-semibold'
                }`}
              >
                <Sliders size={14} className={commandTab === 'WHATIF' ? 'text-white' : 'text-[#627D98]'} />
                <span>⚡ What-If Sandbox &amp; Dual Plans</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  commandTab === 'WHATIF' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}>
                  P50 vs P90
                </span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-[#627D98] px-3 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-[11px] text-[#102A43] font-bold">
                {commandTab === 'TOPOLOGY' && '58 KM Live Track & Asset Geometry Active'}
                {commandTab === 'MAREY' && 'Marey Time-Distance Trajectories Active'}
                {commandTab === 'WHATIF' && 'Monte Carlo Disruption & Dual-Plan Engine'}
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: LIVE CORRIDOR TOPOLOGY & STRIP MAP (DEFAULT)                      */}
          {/* ========================================================================= */}
          {commandTab === 'TOPOLOGY' && (
            <div className="space-y-6">

          {/* ROLE 3: FIELD EXECUTION LEAD ASSIGNED WORKSITE CARD */}
          {isFieldWorker && (
            <div className="card-warm p-6 border-2 border-[#D9901A] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#FFE7BA] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#D9901A] text-white flex items-center justify-center font-black shadow-md">
                    <HardHat size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#FFF7E6] text-[#D9901A] border border-[#FFE7BA]">
                        Worksite In-Charge Active Assignment
                      </span>
                      <span className="text-xs text-[#102A43] font-bold metric-mono">BLK-2026-DLI-04</span>
                    </div>
                    <h3 className="text-base font-black text-[#102A43] mt-0.5 font-sans">
                      Sanctioned Joint Maintenance Block — Section A-B (KM 104.2 to 124.8, UP Track)
                    </h3>
                    <p className="text-xs text-[#627D98] font-medium mt-0.5">
                      Estimated section position / site verified • Assigned Task: Fractured Rail Replacement &amp; OHE Mast Bonding
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/field"
                    className="px-4 py-2 bg-[#D9901A] hover:bg-[#B87A15] text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <Smartphone size={14} /> Full Mobile Terminal (/field)
                  </Link>
                </div>
              </div>

              {/* Stepper Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {FIELD_STEPS.map((step, idx) => {
                  const isDone = idx < fieldStepIdx;
                  const isCurrent = idx === fieldStepIdx;
                  return (
                    <div
                      key={step.key}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isDone 
                          ? 'bg-[#EAF6F0] border-[#C6EADB] text-[#102A43]' 
                          : (isCurrent 
                              ? 'bg-[#FFF7E6] border-[#FFE7BA] ring-2 ring-[#D9901A]/30 text-[#102A43]' 
                              : 'bg-white border-[#D9E0E8] text-[#829AB1]')
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider">Step 0{idx + 1}</span>
                        {isDone ? (
                          <CheckCircle2 size={13} className="text-[#16805C]" />
                        ) : (
                          <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-[#D9901A] animate-pulse' : 'bg-slate-300'}`}></span>
                        )}
                      </div>
                      <p className="text-xs font-bold leading-tight line-clamp-2">{step.label.replace(/^\d+\.\s*/, '')}</p>
                      {fieldStepTimestamps[step.key] && (
                        <p className="text-[9px] font-mono text-[#627D98] mt-1 flex items-center gap-1">
                          <Clock size={10} /> {fieldStepTimestamps[step.key]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Target Button */}
              {fieldStepIdx < FIELD_STEPS.length ? (
                <button
                  onClick={() => handleFieldStepAdvance(fieldStepIdx)}
                  className={`w-full min-h-[50px] text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer ${FIELD_STEPS[fieldStepIdx].color}`}
                >
                  <CheckCircle2 size={16} />
                  Execute {FIELD_STEPS[fieldStepIdx].label}
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#EAF6F0] border border-[#C6EADB] text-center text-[#16805C] font-bold text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} className="text-[#16805C]" />
                  Track possession completed and handed back to Operating Control. Zero pending cautions.
                </div>
              )}
            </div>
          )}

          {/* MACRO-CORRIDOR WORKSPACE (Task Queue + Readiness Gate) */}
          {!isFieldWorker && renderTaskQueueSection(false)}


        {/* Lane A Emergency Protocol Banner */}
        <div className="p-5 nova-card border-rose-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider">
                  Lane A Emergency Protocol
                </span>
                <span className="text-xs font-black text-rose-950">Task TSK_ENG_01 · Emergency Fractured Rail Clamp Replacement</span>
              </div>
              <p className="text-xs text-rose-800 mt-0.5 font-medium">
                Location: KM 104.2 (SEC GZB–ANVR) · Excluded from automated scheduler. Handled via standard Indian Railways emergency safety rules.
              </p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              Lane A/B = workflow lane · UP/DOWN = physical line
            </span>
          </div>
        </div>

        <CorridorTrackTopology onInspectBlock={() => setIsBlockDetailOpen(true)} />



        {/* MODAL / GLASS INSPECTION DRAWER FOR SANCTIONED JOINT BLOCK */}
        {isBlockDetailOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsBlockDetailOpen(false)}
          >
            <div 
              className="bg-white/95 backdrop-blur-xl rounded-3xl border border-amber-300 shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-100/50 to-orange-500/10 border-b border-amber-200/80 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30 shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider">
                        ⚡ Sanctioned Joint Maintenance Block
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-slate-700 text-[10px] font-bold metric-mono">
                        BLK-2026-DLI-04
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      Sanctioned Joint Maintenance Block — BLK-2026-DLI-04
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => setIsBlockDetailOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/80 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
                {/* Location & Time Window */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-700 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location & Territory</div>
                      <div className="text-xs font-black text-slate-900 mt-0.5">
                        KM 104.2 to KM 124.8
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                        SEC GZB–ANVR (UP Track • Ghaziabad – Anand Vihar)
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-700 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scheduled Window</div>
                      <div className="text-xs font-black text-slate-900 mt-0.5">
                        02:00 to 04:00 (120 min duration)
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700 mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Plan A Primary Shadow Window
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bundled Departments & Work Reason */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Layers className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Bundled Departments & Work Reason
                    </span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                      Coordinated Multi-Disciplinary Block
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Engineering */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/70 to-orange-50/40 border border-amber-200 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-800 flex items-center justify-center font-black text-xs shrink-0">
                        ENG
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900">Engineering (P.Way)</span>
                          <span className="text-[10px] font-black text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded metric-mono">
                            TSK_ENG_02
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 font-medium mt-1">
                          Track Tamping & Deep Screening (TSK_ENG_02)
                        </div>
                      </div>
                    </div>

                    {/* Electrical (TRD) */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-sky-50/40 border border-blue-200 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-300 text-blue-800 flex items-center justify-center font-black text-xs shrink-0">
                        TRD
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900">Electrical (TRD)</span>
                          <span className="text-[10px] font-black text-blue-900 bg-blue-200/70 px-2 py-0.5 rounded metric-mono">
                            TSK_TRD_01
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 font-medium mt-1">
                          OHE Wire Contact Renewal & Power Block (TSK_TRD_01)
                        </div>
                      </div>
                    </div>

                    {/* Signalling (S&T) */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50/70 to-indigo-50/40 border border-purple-200 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-300 text-purple-800 flex items-center justify-center font-black text-xs shrink-0">
                        S&T
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900">Signalling (S&T)</span>
                          <span className="text-[10px] font-black text-purple-900 bg-purple-200/70 px-2 py-0.5 rounded metric-mono">
                            TSK_SNT_01
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 font-medium mt-1">
                          Point Machine Clamp Inspection & Disconnection (TSK_SNT_01)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resource Alignment */}
                <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Resource Alignment
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Tamping Machine</div>
                      <div className="font-black text-slate-900 mt-0.5">CSM-952</div>
                      <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">Ready at siding</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Track Gang</div>
                      <div className="font-black text-slate-900 mt-0.5">Gang #02</div>
                      <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">12 Men on site</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">OHE Equipment</div>
                      <div className="font-black text-slate-900 mt-0.5">Tower Wagon TW-04</div>
                      <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">Pre-staged at STB</div>
                    </div>
                  </div>
                </div>

                {/* Expected Train Impact */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-200/70 text-amber-900 mt-0.5 shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-black text-amber-950 uppercase tracking-wide">Expected Train Impact</span>
                      <span className="font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md metric-mono">
                        84 WTM
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium mt-1 leading-relaxed">
                      Regulation cost calculated as 84 WTM. Trains 12424 & 12004 regulated by 12 mins.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Operating Safety Envelope Active
                </div>
                <button
                  onClick={() => setIsBlockDetailOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Dismiss Inspection
                </button>
              </div>
            </div>
          </div>
        )}

          {/* Corridor Diagnostics (Track Geo, OHE, S&T, Structures) & Recent Event Stream */}
          <CorridorDiagnosticsAndEvents />
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* TAB 2: CORRIDOR OCCUPANCY & MAREY GRAPH                                   */}
      {/* ========================================================================= */}
      {commandTab === 'MAREY' && (
        <div className="space-y-6">
          <OccupancyView 
            initialPlanMode={activePlanType}
            onPlanModeChange={(mode) => setActivePlanType(mode)}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WHAT-IF SANDBOX & DUAL PLANS                                       */}
      {/* ========================================================================= */}
      {commandTab === 'WHATIF' && (
        <div className="space-y-6">
          {/* 6. INTERACTIVE WHAT-IF SANDBOX (Hidden for Department Supervisor) */}
          {!isSupervisor && (
          <div className="p-6 nova-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                <Sliders size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Disruption What-If Simulation Sandbox</h3>
                <p className="text-xs text-slate-500 font-medium">Simulate machine transit delays or monsoon weather shocks to evaluate Weighted Train-Minute loss</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <p className="text-[9px] text-slate-400 uppercase font-bold">Detention Delta</p>
                <p className="text-sm font-black text-amber-600 metric-mono">+{addedWTM} WTM (+{extraDelay}m)</p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <p className="text-[9px] text-slate-400 uppercase font-bold">Recommended Policy</p>
                <p className="text-xs font-black text-blue-700">
                  {extraDelay > 20 ? 'Switch to Plan B (P90)' : (extraDelay > 0 ? 'Plan A (Buffer Alert)' : 'Maintain Plan A')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/80 p-5 rounded-xl border border-slate-200">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Tamping / OHE Machine Delay:</span>
                <span className="text-amber-600 metric-mono font-black">{machineDelay} mins</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={machineDelay}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMachineDelay(val);
                  handleRunWhatIf(val, weatherCondition);
                }}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">Corridor Weather Condition:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setWeatherCondition('CLEAR');
                    handleRunWhatIf(machineDelay, 'CLEAR');
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    weatherCondition === 'CLEAR' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  CLEAR (Normal)
                </button>
                <button
                  onClick={() => {
                    setWeatherCondition('RAIN');
                    handleRunWhatIf(machineDelay, 'RAIN');
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    weatherCondition === 'RAIN' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  MONSOON / GALE
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-700 flex flex-col justify-center bg-white p-3.5 rounded-xl border border-slate-200">
              <p className="font-black text-slate-900 mb-1 flex items-center gap-1.5">
                <Sparkles size={13} className="text-blue-600" />
                Live Engine Recommendation:
              </p>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                {getDynamicRecommendation()}
              </p>
            </div>
          </div>
        </div>
        )}

        {/* 7. SIDE-BY-SIDE DUAL PLAN COMPARISON CARDS & OPERATIONAL AUDIT REPORT */}
        <div className="space-y-6">
          {/* Section Header with Live Sanction Alert Banner */}
          {sanctionedPlanAlert && (
            <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-300 shadow-sm flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <span className="text-xs font-black text-emerald-950">Block Authorization Active</span>
                  <p className="text-xs text-emerald-800 font-medium mt-0.5">{sanctionedPlanAlert}</p>
                </div>
              </div>
              <button
                onClick={() => setSanctionedPlanAlert(null)}
                className="w-7 h-7 rounded-lg bg-white text-slate-500 hover:text-slate-800 border border-emerald-200 flex items-center justify-center text-xs font-black transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ROLE 4: DIVISIONAL RAILWAY OFFICER EXECUTIVE GOVERNANCE & SANCTION STRIP */}
          {activeRole === 'DIVISIONAL_OFFICER' && (
            <div id="governance-strip" className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 via-purple-100/40 to-indigo-500/10 border-2 border-purple-300 shadow-lg space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-500/20">
                    <Award size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                        Executive Governance &amp; Sanction Strip
                      </span>
                      <span className="text-xs text-slate-500 font-bold">Sr.DOM / Review Mandate</span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">
                      Statutory Block Sanction Authority &amp; Reason-Coded Overrides
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Green Button: [Official Sanction Plan A] */}
                  <button
                    onClick={handleDivisionalOfficialSanction}
                    disabled={isSanctioningPlan}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/25 flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    {isSanctioningPlan ? 'Authorizing...' : 'Official Sanction Plan A'}
                  </button>

                  {/* Amber Button: [Override with Reason] */}
                  <button
                    onClick={() => setOverrideModalOpen(true)}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-amber-600/25 flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
                  >
                    <AlertTriangle size={16} />
                    Override with Reason
                  </button>
                </div>
              </div>

              {/* Read-Only View of the Immutable Audit Trail Entries */}
              <div className="pt-3 border-t border-purple-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet size={14} className="text-purple-700" />
                    Immutable Audit Trail Entries (Read-Only)
                  </span>
                  <Link 
                    to="/audit"
                    className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline flex items-center gap-1"
                  >
                    Open Full Audit Register <ArrowRight size={12} />
                  </Link>
                </div>

                <div className="overflow-x-auto rounded-xl border border-purple-200/90 bg-white/95">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-purple-50/80 text-purple-900 font-bold text-[10px] uppercase border-b border-purple-200/80">
                      <tr>
                        <th className="p-2.5">Log ID</th>
                        <th className="p-2.5">Actor / Role</th>
                        <th className="p-2.5">Action Event</th>
                        <th className="p-2.5">Reason Code</th>
                        <th className="p-2.5">Operational Details</th>
                        <th className="p-2.5">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(divisionalAuditLogs.length ? divisionalAuditLogs.slice(0, 4) : [
                        { id: 401, role: 'Sr.DOM (Review)', action: 'SANCTIONED', reason_code: 'STATUTORY_AUTHORIZATION', reason_text: 'Plan A verified and authorized under statutory possession rules.', created_at: new Date().toISOString() },
                        { id: 400, role: 'Section Controller', action: 'PLAN_GENERATED', reason_code: 'BASELINE_OPTIMIZATION', reason_text: 'Automated 120m dual-plan possession calculated for corridor.', created_at: new Date(Date.now() - 3600000).toISOString() }
                      ]).map((log: any) => (
                        <tr key={log.id} className="hover:bg-purple-50/40 transition-colors">
                          <td className="p-2.5 font-black text-slate-900 metric-mono">#{log.id}</td>
                          <td className="p-2.5 font-bold text-slate-800">{log.role}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-black text-[10px]">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-2.5 font-black text-slate-700 metric-mono text-[11px]">{log.reason_code || 'N/A'}</td>
                          <td className="p-2.5 text-slate-600 text-[11px] font-medium truncate max-w-xs">{log.reason_text}</td>
                          <td className="p-2.5 text-slate-400 metric-mono text-[10px]">{new Date(log.created_at).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 nova-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-2xs">
                  <Cpu size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                      Decision Support System
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">Dual-Plan Strategy Comparison</span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 mt-1">
                    Side-by-Side Dual Plan Engine &amp; Possession Sanctioning
                  </h2>
                </div>
              </div>

              {/* Active Plan Selection Indicator */}
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-bold px-2">Active Strategy:</span>
                <span className={`px-3 py-1 rounded-lg font-black ${activePlanType === 'PLAN_A' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-amber-600 text-white shadow-xs'}`}>
                  {activePlanType === 'PLAN_A' ? 'Plan A (P50 Optimal)' : 'Plan B (P90 Robust)'}
                </span>
              </div>
            </div>

            {/* SIDE-BY-SIDE DUAL PLAN COMPARISON CARDS (Grid 2-column) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* CARD 1: PLAN A (P50 Optimal — Median Window) */}
              <div className={`p-6 rounded-2xl bg-white transition-all border-2 flex flex-col justify-between ${
                activePlanType === 'PLAN_A' 
                  ? 'border-emerald-500 shadow-lg shadow-emerald-500/5 ring-4 ring-emerald-500/10' 
                  : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
              }`}>
                <div>
                  {/* Header Badge */}
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-3.5">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      P50 OPTIMAL • HIGHEST AVAILABILITY
                    </span>
                    {activePlanType === 'PLAN_A' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                        <Check size={11} strokeWidth={3} /> Selected by Engine
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-slate-900">
                    Plan A (P50 Optimal — Median Window)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 mb-5">
                    Zero-buffer scheduled window yielding maximum corridor train throughput.
                  </p>

                  {/* 4 Grid Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {/* Duration */}
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                        <Clock size={12} className="text-slate-500" />
                        Duration
                      </div>
                      <div className="text-base font-black text-slate-900 metric-mono mt-1">
                        120 Minutes
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                        02:00 – 04:00
                      </div>
                    </div>

                    {/* Regulation Cost */}
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                        <Activity size={12} className="text-emerald-600" />
                        Regulation Cost
                      </div>
                      <div className="text-base font-black text-emerald-700 metric-mono mt-1">
                        84 WTM
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                        Weighted Train-Minutes
                      </div>
                    </div>

                    {/* Stability Index */}
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Shield size={12} className="text-amber-600" />
                          Stability Index
                        </span>
                        <span className="metric-mono font-black text-amber-700">64%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '64%' }}></div>
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-1.5 leading-tight">
                        Risk of overrun under machine delay
                      </div>
                    </div>

                    {/* Bundled Tasks */}
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                        <Layers size={12} className="text-blue-600" />
                        Bundled Tasks
                      </div>
                      <div className="text-base font-black text-blue-700 metric-mono mt-1">
                        3 Works
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-0.5 leading-tight">
                        ENG Tamping, TRD OHE, S&T Point
                      </div>
                    </div>
                  </div>

                  {/* Operational Suitability Tag */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-xs text-slate-700 leading-relaxed font-medium mb-5">
                    <span className="font-extrabold text-emerald-950 block mb-0.5">Operational Suitability:</span>
                    Best For: Favorable weather, verified materials at depot, machine pre-stabled in siding.
                  </div>
                </div>

                {/* Action Button: Gated by RBAC (Only Sr.DOM / Divisional Officer has Sanction Authority) */}
                {isDivisionalOfficer ? (
                  <button
                    onClick={() => setSanctionConfirmModal({
                      isOpen: true,
                      planType: 'PLAN_A',
                      title: 'Plan A (P50 Optimal — Median Window)',
                      duration: '120 Minutes (02:00 – 04:00)',
                      cost: '84 WTM'
                    })}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                  >
                    <CheckCircle2 size={15} /> Sanction Plan A
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 font-bold text-[11px] text-center flex items-center justify-center gap-1.5">
                    <ShieldCheck size={14} className="text-slate-400" />
                    Official Sanction Authority: Sr.DOM / Divisional Officer
                  </div>
                )}
              </div>

              {/* CARD 2: PLAN B (P90 Robust — Extended Safe Buffer) */}
              <div className={`p-6 rounded-2xl bg-white transition-all border-2 flex flex-col justify-between ${
                activePlanType === 'PLAN_B' 
                  ? 'border-amber-500 shadow-lg shadow-amber-500/5 ring-4 ring-amber-500/10' 
                  : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
              }`}>
                <div>
                  {/* Header Badge */}
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-3.5">
                    <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      P90 CONSERVATIVE • HIGH RESILIENCE
                    </span>
                    {activePlanType === 'PLAN_B' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                        <Check size={11} strokeWidth={3} /> Selected by Engine
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-slate-900">
                    Plan B (P90 Robust — Extended Safe Buffer)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 mb-5">
                    High-resilience possession designed to insulate corridor from cascading delays.
                  </p>

                  {/* 4 Grid Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {/* Duration */}
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                        <Clock size={12} className="text-slate-500" />
                        Duration
                      </div>
                      <div className="text-base font-black text-slate-900 metric-mono mt-1">
                        165 Minutes
                      </div>
                      <div className="text-[10px] font-semibold text-amber-700 mt-0.5">
                        02:00 – 04:45 (+45m Buffer)
                      </div>
                    </div>

                    {/* Regulation Cost */}
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                        <Activity size={12} className="text-amber-600" />
                        Regulation Cost
                      </div>
                      <div className="text-base font-black text-amber-700 metric-mono mt-1">
                        126 WTM
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                        Weighted Train-Minutes
                      </div>
                    </div>

                    {/* Stability Index */}
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck size={12} className="text-emerald-600" />
                          Stability Index
                        </span>
                        <span className="metric-mono font-black text-emerald-700">91%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '91%' }}></div>
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-1.5 leading-tight">
                        Absorbs up to 35m transit &amp; weather shocks
                      </div>
                    </div>

                    {/* Bundled Tasks */}
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                        <Layers size={12} className="text-purple-600" />
                        Bundled Tasks
                      </div>
                      <div className="text-base font-black text-purple-700 metric-mono mt-1">
                        3 Works + Buffer
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-0.5 leading-tight">
                        Staged Clearance Window
                      </div>
                    </div>
                  </div>

                  {/* Operational Suitability Tag */}
                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-slate-700 leading-relaxed font-medium mb-5">
                    <span className="font-extrabold text-amber-950 block mb-0.5">Operational Suitability:</span>
                    Best For: Monsoon forecast, heavy fog, long-distance machine transit, or low gang readiness.
                  </div>
                </div>

                {/* Action Button: Gated by RBAC (Only Sr.DOM / Divisional Officer has Sanction Authority) */}
                {isDivisionalOfficer ? (
                  <button
                    onClick={() => setSanctionConfirmModal({
                      isOpen: true,
                      planType: 'PLAN_B',
                      title: 'Plan B (P90 Robust — Extended Safe Buffer)',
                      duration: '165 Minutes (02:00 – 04:45)',
                      cost: '126 WTM'
                    })}
                    className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                  >
                    <ShieldCheck size={15} /> Sanction Plan B (Fallback)
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 font-bold text-[11px] text-center flex items-center justify-center gap-1.5">
                    <ShieldCheck size={14} className="text-slate-400" />
                    Official Sanction Authority: Sr.DOM / Divisional Officer
                  </div>
                )}
              </div>
            </div>

            {/* 2. DYNAMIC OPERATIONAL EXPLANATION ACCORDION / REPORT PANEL */}
            <div className="mt-6 rounded-2xl border border-slate-200/90 overflow-hidden bg-slate-50/50">
              {/* Accordion Toggle Header */}
              <button
                onClick={() => setIsAuditReportExpanded(!isAuditReportExpanded)}
                className="w-full p-4 flex items-center justify-between gap-4 bg-white hover:bg-slate-50 text-left transition-colors cursor-pointer border-b border-slate-200/80"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-black shrink-0">
                    <FileText size={17} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        Why This Plan? Decision Explanation Report
                      </h4>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        Audit-Grade AI Rationale
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Operational audit synthesized across conflicting block paths, statutory windows, resource readiness, and shock thresholds
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-xs font-bold text-slate-600 hidden sm:inline">
                    {isAuditReportExpanded ? 'Collapse Report' : 'Expand Report'}
                  </span>
                  {isAuditReportExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {/* Accordion Expandable Content */}
              {isAuditReportExpanded && (
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                  {/* Conflict Analysis */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                          <CheckCircle2 size={15} />
                        </div>
                        <span className="text-xs font-black text-slate-900">Conflict Analysis</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Clear Route
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Zero conflicting blocks detected on Section A-B. Train 12424 Rajdhani regulated by 12 mins at Station A; Train 12004 Shatabdi accorded priority clearance.
                    </p>
                  </div>

                  {/* Statutory Due Check */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                          <Calendar size={15} />
                        </div>
                        <span className="text-xs font-black text-slate-900">Statutory Due Check</span>
                      </div>
                      <span className="text-[10px] font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Due in 4 Days
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Task TSK_ENG_03 (Turnout renewal) scheduled within statutory window (Due in 4 days). Zero silent deferrals.
                    </p>
                  </div>

                  {/* Readiness Summary */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
                          <ShieldCheck size={15} />
                        </div>
                        <span className="text-xs font-black text-slate-900">Readiness Summary</span>
                      </div>
                      <span className="text-[10px] font-black text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 metric-mono">
                        88/100 PTS
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Readiness score 88/100. Tamping machine confirmed at Anandpur siding; Gang 02 assembled.
                    </p>
                  </div>

                  {/* Switch Trigger Logic */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                          <AlertTriangle size={15} />
                        </div>
                        <span className="text-xs font-black text-slate-900">Switch Trigger Logic</span>
                      </div>
                      <span className="text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 metric-mono">
                        +20m Shock Limit
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      If execution shock exceeds +20 mins (e.g. Line Clear delay), system advises immediate fallback to Plan B to prevent cascading network congestion.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

        {/* CONFIRMATION MODAL FOR SANCTIONING PLAN */}
        {sanctionConfirmModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSanctionConfirmModal(null)}
          >
            <div 
              className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-slate-200 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md ${
                    sanctionConfirmModal.planType === 'PLAN_A' ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-amber-600 shadow-amber-600/30'
                  }`}>
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Authorization Order
                    </span>
                    <h3 className="text-base font-black text-slate-900">
                      Sanction {sanctionConfirmModal.planType === 'PLAN_A' ? 'Plan A (P50 Optimal)' : 'Plan B (P90 Robust)'}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSanctionConfirmModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-black transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-200/80">
                    <span className="text-slate-500 font-medium">Possession Window:</span>
                    <span className="font-bold text-slate-900 metric-mono">{sanctionConfirmModal.duration}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/80">
                    <span className="text-slate-500 font-medium">Regulation Cost:</span>
                    <span className="font-bold text-blue-700 metric-mono">{sanctionConfirmModal.cost}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/80">
                    <span className="text-slate-500 font-medium">Protected Corridor:</span>
                    <span className="font-bold text-slate-900">SEC A-B (KM 104.2 – 124.8, UP Track)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Permit Reference:</span>
                    <span className="font-bold text-emerald-700 metric-mono">BLK-2026-DLI-04</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 leading-relaxed font-medium">
                  <p className="font-bold mb-1">Controller Sanction Sign-Off:</p>
                  <p className="text-[11px] text-blue-900">
                    By confirming, the selected possession window will be locked into the interlocking safety envelope. Digital line possession permit will be issued to Station Masters at Anandpur and Bilaspur.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setSanctionConfirmModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setActivePlanType(sanctionConfirmModal.planType);
                    setSanctionedPlanAlert(`${sanctionConfirmModal.title} successfully authorized. Permit BLK-2026-DLI-04 transmitted to Station Masters.`);
                    setSanctionConfirmModal(null);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-white font-black text-xs shadow-md transition-all active:scale-98 cursor-pointer ${
                    sanctionConfirmModal.planType === 'PLAN_A' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' 
                      : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  }`}
                >
                  Confirm &amp; Sanction Block
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lane A Emergency Protocol Modal */}
        {showLaneAModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-lg p-6 rounded-2xl nova-card bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider">
                      Lane A Emergency Workflow
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">
                      TSK_ENG_01 · Fractured Rail Clamp Replacement
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowLaneAModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-black transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 space-y-2 text-xs text-rose-950 leading-relaxed font-medium">
                <p className="font-extrabold text-rose-900">
                  Protocol-led emergency response. Bypasses automated planning engine as per Railway Safety Code.
                </p>
                <p className="text-[11px] text-rose-800">
                  Location: KM 104.2 (SEC A-B) • Safety Class: CRITICAL. This work item was isolated from the combinatorial optimization pool to ensure immediate emergency mobilization under Section 167 Railway Safety Regulations.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500 font-medium">Mobilization Gang:</span>
                  <span className="font-bold text-slate-900">Unit 01 (Senior P-Way)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500 font-medium">Equipment:</span>
                  <span className="font-bold text-slate-900">Portable Hydraulic Rail Clamp & Welding Kit</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Caution Order Imposed:</span>
                  <span className="font-bold text-amber-700">TSR 30 km/h (KM 104.0 to 105.5)</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setShowLaneAModal(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md active:scale-98 transition-all cursor-pointer"
                >
                  Acknowledge Incident Protocol
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Divisional Officer Override Modal with Mandatory Railway Reason Codes */}
        {overrideModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-lg p-6 rounded-2xl nova-card bg-white/95 backdrop-blur-2xl border border-amber-200 shadow-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">
                      Divisional Executive Override
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">
                      Log Sanction Deviation / Exception
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setOverrideModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-black transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                As per Indian Railways Operating Code, any manual override of automated corridor sanction plans requires a mandatory railway reason code and officer rationale for the immutable audit register.
              </p>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600 tracking-wider block mb-1.5">
                  Mandatory Railway Reason Code <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { code: 'TRAFFIC_PRESSURE', label: 'TRAFFIC_PRESSURE', desc: 'Congestion / Priority rake clearance' },
                    { code: 'MACHINE_UNAVAILABLE', label: 'MACHINE_UNAVAILABLE', desc: 'Siding delay or mechanical breakdown' },
                    { code: 'MATERIAL_NOT_READY', label: 'MATERIAL_NOT_READY', desc: 'Rails/sleepers/OHE items in transit' },
                    { code: 'WEATHER', label: 'WEATHER', desc: 'Adverse weather / poor visibility' },
                    { code: 'SAFETY_PRIORITY', label: 'SAFETY_PRIORITY', desc: 'Track integrity or urgent emergency' },
                  ].map((r) => (
                    <button
                      key={r.code}
                      type="button"
                      onClick={() => setSelectedOverrideReason(r.code as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedOverrideReason === r.code
                          ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 metric-mono">{r.label}</span>
                        {selectedOverrideReason === r.code && (
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600 tracking-wider block mb-1">
                  Executive Rationale & Controller Instructions
                </label>
                <textarea
                  rows={3}
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="State reason for shifting schedule, train precedence order, or assigned gang redeployment..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                <span>This decision will be cryptographically hashed into the Immutable Audit Trail with your Sr.DOM credentials.</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDivisionalOverrideSubmit}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-98 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FileText size={14} /> Commit Override & Record in Audit Trail
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
      </div>
    </div>
  );
};
