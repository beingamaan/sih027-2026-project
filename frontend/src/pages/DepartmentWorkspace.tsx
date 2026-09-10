import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sidebar, useSidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { HeroBanner } from '../components/layout/HeroBanner';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Clock, 
  Lock, 
  Sliders, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  Calendar, 
  CalendarDays,
  Layers, 
  Shield, 
  FileSpreadsheet, 
  Gauge, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Wrench, 
  GitBranch, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { getTasks } from '../services/railwayApi';
import { Task } from '../types';
import { PWayPanel } from '../components/department/PWayPanel';
import { TRDPanel } from '../components/department/TRDPanel';
import { SNTPanel } from '../components/department/SNTPanel';
import { RecommendationCard } from '../components/cards/RecommendationCard';
import { TaskCard } from '../components/cards/TaskCard';
import { PlanningHorizonTabs, PlanningHorizon } from '../components/planning/PlanningHorizonTabs';
import { CorridorTrackTopology } from '../components/corridor/CorridorTrackTopology';

type DeptView = 'ENG' | 'TRD' | 'SNT';

export const DepartmentWorkspace: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const { userProfile, activeRole } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Bind active view directly to URL query parameter 'tab'
  const rawTab = (searchParams.get('tab') || 'overview').toLowerCase();
  const activeTab: 'overview' | 'horizons' | 'readiness' | 'assigned' = 
    (['overview', 'horizons', 'readiness', 'assigned'].includes(rawTab) ? rawTab : 'overview') as any;

  // Detect user initial department or fallback to ENG
  const defaultDept = useMemo((): DeptView => {
    const d = (userProfile?.department || '').toUpperCase();
    if (d.includes('TRD')) return 'TRD';
    if (d.includes('SNT') || d.includes('SIG') || d.includes('S_AND_T')) return 'SNT';
    return 'ENG';
  }, [userProfile]);

  const [activeDept, setActiveDept] = useState<DeptView>(defaultDept);
  const [planningHorizon, setPlanningHorizon] = useState<PlanningHorizon>('TODAY');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [ackToast, setAckToast] = useState<string | null>(null);

  // 100-Point Readiness Diagnostic State (0-100)
  const [machineScore, setMachineScore] = useState<number>(100);
  const [gangScore, setGangScore] = useState<number>(100);
  const [materialScore, setMaterialScore] = useState<number>(100);
  const [ptwScore, setPtwScore] = useState<number>(100);
  const [weatherScore, setWeatherScore] = useState<number>(100);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await getTasks();
      setTasks(data);
      if (data.length > 0 && selectedTaskId === null) {
        setSelectedTaskId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load department tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Update default department when auth profile loads
  useEffect(() => {
    setActiveDept(defaultDept);
  }, [defaultDept]);

  // Department Styling Accents
  const deptTheme = useMemo(() => {
    switch (activeDept) {
      case 'ENG':
        return {
          code: 'ENG',
          name: 'Engineering (Permanent Way)',
          accentHex: '#D9A05B',
          borderAccent: 'border-l-[#D9A05B]',
          badgeBg: 'bg-[#D9A05B]/15 text-[#7D4D15] border-[#D9A05B]/30',
          icon: Wrench
        };
      case 'TRD':
        return {
          code: 'TRD',
          name: 'Electrical Traction (OHE/TRD)',
          accentHex: '#8B7CF6',
          borderAccent: 'border-l-[#8B7CF6]',
          badgeBg: 'bg-[#8B7CF6]/15 text-[#5442A8] border-[#8B7CF6]/30',
          icon: Zap
        };
      case 'SNT':
        return {
          code: 'SNT',
          name: 'Signalling & Telecommunication (S&T)',
          accentHex: '#2DD4BF',
          borderAccent: 'border-l-[#2DD4BF]',
          badgeBg: 'bg-[#2DD4BF]/15 text-[#0E685C] border-[#2DD4BF]/30',
          icon: GitBranch
        };
    }
  }, [activeDept]);

  // Filter tasks for active department
  const departmentTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchDept = t.department === activeDept || (activeDept === 'SNT' && (t.department as string) === 'S&T');
      if (!matchDept) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.task_code?.toLowerCase().includes(q) ||
        t.work_type?.toLowerCase().includes(q) ||
        t.lane?.toLowerCase().includes(q)
      );
    });
  }, [tasks, activeDept, searchQuery]);

  const selectedTask = useMemo(() => {
    return tasks.find(t => t.id === selectedTaskId) || departmentTasks[0] || null;
  }, [tasks, selectedTaskId, departmentTasks]);

  // Handle task readiness sync
  useEffect(() => {
    if (selectedTask) {
      setMachineScore(selectedTask.worksite_ready ? 100 : 80);
      setGangScore(selectedTask.material_ready ? 100 : 75);
      setMaterialScore(selectedTask.material_ready ? 100 : 70);
      setPtwScore(selectedTask.ptw_ready ? 100 : 60);
      setWeatherScore(selectedTask.weather_suitable ? 100 : 90);
    }
  }, [selectedTaskId]);

  // Calculate Weighted 100-Point Score
  const computedScore = useMemo(() => {
    const raw = (machineScore * 0.25) +
                (gangScore * 0.20) +
                (materialScore * 0.20) +
                (ptwScore * 0.20) +
                (weatherScore * 0.15);
    return Math.round(raw);
  }, [machineScore, gangScore, materialScore, ptwScore, weatherScore]);

  // Decision band based on computed score
  const decisionBand = useMemo(() => {
    if (computedScore >= 80) {
      return {
        band: 'GREEN',
        title: 'PASS (Score >= 80) — Unconditional Corridor Sanction',
        recommendation: 'Eligible for Plan A execution. All prerequisite safety gates satisfied.',
        bgColor: 'bg-emerald-50/60',
        borderColor: 'border-emerald-300',
        textColor: 'text-emerald-900',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      };
    } else if (computedScore >= 60) {
      return {
        band: 'AMBER',
        title: 'CONDITIONAL (60 <= Score < 80) — Require Plan B (+25% Machine Buffer)',
        recommendation: 'Requires supervisor verification. Automatic contingency buffer allocated to absorb transit delay.',
        bgColor: 'bg-amber-50/60',
        borderColor: 'border-amber-300',
        textColor: 'text-amber-900',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
      };
    } else {
      return {
        band: 'RED',
        title: 'REJECT (Score < 60) — Statutory Handback / Execution Hazard',
        recommendation: 'Task blocked from corridor entry. Material or PTW prerequisites unfulfilled. Returned to Task Pool.',
        bgColor: 'bg-rose-50/60',
        borderColor: 'border-rose-300',
        textColor: 'text-rose-900',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300'
      };
    }
  }, [computedScore]);

  const handleAcknowledgeTask = (taskCode: string) => {
    setAckToast(`✓ Task ${taskCode} formally acknowledged by ${deptTheme.name} Supervisor.`);
    setTimeout(() => setAckToast(null), 3500);
  };

  const isSelectedReadOnly = useMemo(() => {
    if (!selectedTask) return false;
    return selectedTask.department !== activeDept && !(activeDept === 'SNT' && (selectedTask.department as string) === 'S&T');
  }, [selectedTask, activeDept]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Work Area */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <Navbar 
          title="Department Supervisor Maintenance Workspace" 
          subtitle="Engineering Gates, 100-Point Readiness & Cross-Department Co-Block Possession" 
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto overflow-y-auto">
          {/* REUSABLE HERO BANNER */}
          <HeroBanner 
            title="Department Maintenance Workspace" 
            subtitle="Infrastructure Verification, TSR & Resource Readiness" 
            sectionTag="DEPT SUPERVISOR · P.WAY (ENG) · A. K. VERMA · IR-ENG-0891"
          />

          {/* Toast Notification */}
          {ackToast && (
            <div className="p-3.5 rounded-xl bg-[#0C2138] border border-emerald-500/40 text-white text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in duration-200">
              <span className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>{ackToast}</span>
              </span>
              <button
                onClick={() => setAckToast(null)}
                className="text-slate-400 hover:text-white p-1 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Top Banner with Department Identity & Switcher */}
          <div className={`bg-white border border-slate-200/80 ${deptTheme.borderAccent} border-l-4 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4`}>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider flex items-center gap-1.5 ${deptTheme.badgeBg}`}>
                  <deptTheme.icon size={12} />
                  {deptTheme.name}
                </span>
                <span className="text-xs text-slate-700 font-semibold">• Supervisor: A. K. Verma</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  IR-ENG-0891 · DEPT SUPERVISOR · P.WAY (ENG)
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Department Possession &amp; Maintenance Workspace
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Monitor live track infrastructure, verify 100-point readiness prerequisites, and coordinate cross-department joint possessions.
              </p>
            </div>

            {/* Department Quick Switcher & Sync Button */}
            <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setActiveDept('ENG')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeDept === 'ENG'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#D9A05B]"></span>
                  ENG (P-Way)
                </button>
                <button
                  onClick={() => setActiveDept('TRD')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeDept === 'TRD'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#8B7CF6]"></span>
                  TRD (OHE)
                </button>
                <button
                  onClick={() => setActiveDept('SNT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeDept === 'SNT'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#2DD4BF]"></span>
                  S&amp;T (Signal)
                </button>
              </div>

              <button
                onClick={fetchTasks}
                title="Sync and refresh live section tasks"
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin text-blue-600' : ''} />
                <span>Sync</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: DEPARTMENT OVERVIEW (DEFAULT tab === 'overview') */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Multi-Department Co-Location Topology */}
              <CorridorTrackTopology variant="engineering" />

              {/* Mounted Department Signature Panel (TSR Register, Stabling Sidings, etc.) */}
              {activeDept === 'ENG' && <PWayPanel />}
              {activeDept === 'TRD' && <TRDPanel />}
              {activeDept === 'SNT' && <SNTPanel />}

              {/* Six-Gate Compatibility Engine & Dual-Plan Recommendation */}
              <RecommendationCard 
                onToast={(msg) => {
                  setAckToast(msg);
                  setTimeout(() => setAckToast(null), 5000);
                }} 
              />
            </div>
          )}

          {/* VIEW 2: PLANNING HORIZONS & MEGA-BLOCK QUOTA (tab === 'horizons') */}
          {activeTab === 'horizons' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Master Capacity Envelope</span>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <CalendarDays size={18} className="text-blue-700" />
                      Planning Horizons &amp; Mega-Block Quota Capacity
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Evaluate maintenance slot utilization across 24h Tactical, 7-Day Rolling, and 30-Day Master quotas for Northern Railway HDN-04 corridor.
                    </p>
                  </div>
                </div>

                <PlanningHorizonTabs
                  activeHorizon={planningHorizon}
                  onChangeHorizon={setPlanningHorizon}
                  departmentFilter={activeDept}
                >
                  <div className="space-y-4 pt-2">
                    {/* Search & Filter Bar */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search by task code, section, or work description..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 bg-white"
                        />
                      </div>
                      <span className="text-xs font-mono text-slate-500 self-center">
                        Showing {departmentTasks.length} candidate tasks
                      </span>
                    </div>

                    {/* Task Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {departmentTasks.map((t) => (
                        <TaskCard
                          key={t.id}
                          task={t}
                          isSelected={selectedTask?.id === t.id}
                          onAcknowledge={handleAcknowledgeTask}
                          onInspectReadiness={(id) => {
                            setSelectedTaskId(id);
                            navigate('/department?tab=readiness');
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </PlanningHorizonTabs>
              </div>
            </div>
          )}

          {/* VIEW 3: 100-POINT READINESS BOARD (tab === 'readiness') */}
          {activeTab === 'readiness' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
              {/* Task Selector & Summary (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Selected Subject Task</span>
                  {selectedTask ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900">{selectedTask.task_code}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {selectedTask.department}
                        </span>
                        {isSelectedReadOnly && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Lock size={9} /> READ-ONLY
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mt-1">{selectedTask.work_type}</h3>
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Location:</span>
                          <span className="font-mono font-bold text-slate-700">KM {selectedTask.km_from} – {selectedTask.km_to}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Duration:</span>
                          <span className="font-mono font-bold text-slate-700">{selectedTask.estimated_duration_minutes} min</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No task selected.</p>
                  )}
                </div>

                {/* Task List Selector */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Switch Task for Diagnostic
                  </h4>
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {departmentTasks.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedTask?.id === t.id
                            ? 'ring-2 ring-[#102A43] bg-blue-50/30 border-blue-200'
                            : 'bg-slate-50 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-900">{t.task_code}</span>
                          <span className="text-[10px] font-mono font-bold text-slate-500">{t.estimated_duration_minutes}m</span>
                        </div>
                        <p className="text-xs text-slate-600 truncate mt-0.5">{t.work_type}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 100-Point Diagnostic Simulator (7 cols) */}
              <div className="lg:col-span-7">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pillar Diagnostics</span>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Sliders size={16} className="text-[#1E5AA8]" />
                        100-Point Readiness Diagnostic Gate
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Composite Score</span>
                      <p className="text-2xl font-black font-mono text-slate-900">{computedScore} <span className="text-xs font-semibold text-slate-400">/ 100</span></p>
                    </div>
                  </div>

                  {/* Decision Band Display Banner */}
                  <div className={`p-4 rounded-xl border ${decisionBand.borderColor} ${decisionBand.bgColor}`}>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${decisionBand.badgeColor}`}>
                      {decisionBand.title}
                    </span>
                    <p className={`text-xs font-bold ${decisionBand.textColor} mt-2 leading-relaxed`}>
                      {decisionBand.recommendation}
                    </p>
                  </div>

                  {/* 5 Pillar Sliders */}
                  <div className="space-y-4 pt-1">
                    {/* Pillar 1: Machine (25%) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-800">
                        <span>1. Machine &amp; Tamping Stabling (25%)</span>
                        <span className="font-mono text-slate-900 font-bold">{machineScore}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${machineScore >= 80 ? 'bg-emerald-600' : (machineScore >= 60 ? 'bg-amber-500' : 'bg-rose-500')}`}
                          style={{ width: `${machineScore}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        disabled={isSelectedReadOnly}
                        value={machineScore}
                        onChange={(e) => setMachineScore(Number(e.target.value))}
                        className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Pillar 2: Gang (20%) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-800">
                        <span>2. Maintenance Gang Mobilization (20%)</span>
                        <span className="font-mono text-slate-900 font-bold">{gangScore}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${gangScore >= 80 ? 'bg-emerald-600' : (gangScore >= 60 ? 'bg-amber-500' : 'bg-rose-500')}`}
                          style={{ width: `${gangScore}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        disabled={isSelectedReadOnly}
                        value={gangScore}
                        onChange={(e) => setGangScore(Number(e.target.value))}
                        className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Pillar 3: Material (20%) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-800">
                        <span>3. Track Material &amp; Spares at Depot (20%)</span>
                        <span className="font-mono text-slate-900 font-bold">{materialScore}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${materialScore >= 80 ? 'bg-emerald-600' : (materialScore >= 60 ? 'bg-amber-500' : 'bg-rose-500')}`}
                          style={{ width: `${materialScore}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        disabled={isSelectedReadOnly}
                        value={materialScore}
                        onChange={(e) => setMaterialScore(Number(e.target.value))}
                        className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Pillar 4: PTW / Disconnection (20%) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-800">
                        <span>4. PTW &amp; S&amp;T Disconnection Notice (20%)</span>
                        <span className="font-mono text-slate-900 font-bold">{ptwScore}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${ptwScore >= 80 ? 'bg-emerald-600' : (ptwScore >= 60 ? 'bg-amber-500' : 'bg-rose-500')}`}
                          style={{ width: `${ptwScore}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        disabled={isSelectedReadOnly}
                        value={ptwScore}
                        onChange={(e) => setPtwScore(Number(e.target.value))}
                        className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Pillar 5: Weather (15%) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-800">
                        <span>5. Site Weather &amp; Track Visibility (15%)</span>
                        <span className="font-mono text-slate-900 font-bold">{weatherScore}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${weatherScore >= 80 ? 'bg-emerald-600' : (weatherScore >= 60 ? 'bg-amber-500' : 'bg-rose-500')}`}
                          style={{ width: `${weatherScore}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        disabled={isSelectedReadOnly}
                        value={weatherScore}
                        onChange={(e) => setWeatherScore(Number(e.target.value))}
                        className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                    Diagnostic Model: (0.25 × Machine) + (0.20 × Gang) + (0.20 × Material) + (0.20 × PTW) + (0.15 × Weather)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: ASSIGNED BLOCKS (CO-BLOCK) (tab === 'assigned') */}
          {activeTab === 'assigned' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Block Header Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black text-slate-900">BLK-2026-DLI-04</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        SANCTIONED DUAL-PLAN
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Section: <strong className="text-slate-800">Ghaziabad – Anand Vihar (UP Line)</strong> • Chainage: <strong className="text-slate-800">KM 100.0 – 120.0</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-sans uppercase">Window Time</span>
                      <p className="font-bold text-slate-800">02:00 – 04:00 hrs (120m)</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-sans uppercase">Co-Block Departments</span>
                      <p className="font-bold text-slate-800">ENG + TRD + S&amp;T</p>
                    </div>
                  </div>
                </div>

                {/* Co-Block Joint Possession Tasks Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Co-Block Joint Possession Bundled Tasks
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Own tasks: full control • Partner tasks: read-only visibility
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TaskCard
                      task={{
                        id: 991,
                        task_code: 'TSK_ENG_04',
                        work_type: 'Deep Screening & Tamping',
                        department: 'ENG',
                        lane: 'LANE_B1',
                        block_section_id: 1,
                        km_from: 119.2,
                        km_to: 121.0,
                        estimated_duration_minutes: 120,
                        duration_buffer_minutes: 15,
                        material_ready: 1,
                        ptw_ready: 1,
                        power_ready: 1,
                        disconnection_ready: 1,
                        worksite_ready: 1,
                        weather_suitable: 1,
                        overdue_days: 0,
                        readiness_score: 85,
                        status: 'SCHEDULED',
                        is_co_block_partner: activeDept !== 'ENG',
                        co_block_partner: activeDept !== 'ENG',
                        read_only: activeDept !== 'ENG',
                        can_edit: activeDept === 'ENG',
                        can_verify: activeDept === 'ENG',
                        requires_line_block: 1,
                        requires_power_block: 0,
                        requires_disconnection: 0
                      }}
                      onAcknowledge={handleAcknowledgeTask}
                      onInspectReadiness={(id) => {
                        setSelectedTaskId(id);
                        navigate('/department?tab=readiness');
                      }}
                    />

                    <TaskCard
                      task={{
                        id: 992,
                        task_code: 'TSK_TRD_03',
                        work_type: 'OHE Cantilever Replacement',
                        department: 'TRD',
                        lane: 'LANE_B1',
                        block_section_id: 1,
                        km_from: 119.5,
                        km_to: 120.8,
                        estimated_duration_minutes: 90,
                        duration_buffer_minutes: 10,
                        material_ready: 1,
                        ptw_ready: 1,
                        power_ready: 1,
                        disconnection_ready: 1,
                        worksite_ready: 1,
                        weather_suitable: 1,
                        overdue_days: 0,
                        readiness_score: 90,
                        status: 'SCHEDULED',
                        is_co_block_partner: activeDept !== 'TRD',
                        co_block_partner: activeDept !== 'TRD',
                        read_only: activeDept !== 'TRD',
                        can_edit: activeDept === 'TRD',
                        can_verify: activeDept === 'TRD',
                        requires_line_block: 1,
                        requires_power_block: 1,
                        requires_disconnection: 0
                      }}
                      onAcknowledge={handleAcknowledgeTask}
                      onInspectReadiness={(id) => {
                        setSelectedTaskId(id);
                        navigate('/department?tab=readiness');
                      }}
                    />

                    <TaskCard
                      task={{
                        id: 993,
                        task_code: 'TSK_SNT_04',
                        work_type: 'Point Machine 102A Renewal',
                        department: 'SNT',
                        lane: 'LANE_B1',
                        block_section_id: 1,
                        km_from: 119.2,
                        km_to: 119.2,
                        estimated_duration_minutes: 75,
                        duration_buffer_minutes: 10,
                        material_ready: 1,
                        ptw_ready: 1,
                        power_ready: 1,
                        disconnection_ready: 1,
                        worksite_ready: 1,
                        weather_suitable: 1,
                        overdue_days: 0,
                        readiness_score: 82,
                        status: 'SCHEDULED',
                        is_co_block_partner: activeDept !== 'SNT',
                        co_block_partner: activeDept !== 'SNT',
                        read_only: activeDept !== 'SNT',
                        can_edit: activeDept === 'SNT',
                        can_verify: activeDept === 'SNT',
                        requires_line_block: 1,
                        requires_power_block: 0,
                        requires_disconnection: 1
                      }}
                      onAcknowledge={handleAcknowledgeTask}
                      onInspectReadiness={(id) => {
                        setSelectedTaskId(id);
                        navigate('/department?tab=readiness');
                      }}
                    />
                  </div>
                </div>

                {/* Safety Protocol Verification Strip */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900">Joint Safety Protocol Signed (G&amp;SR Rule 4.12)</span>
                      <p className="text-slate-500 mt-0.5">All 3 departments have confirmed track protection, flagmen deployment, and speed restriction boards.</p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-800 shrink-0">
                    PROTOCOL VERIFIED
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
export default DepartmentWorkspace;
