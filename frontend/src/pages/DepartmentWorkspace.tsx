import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar, useSidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { 
  Users, 
  Clock, 
  Lock, 
  Sliders, 
  RefreshCw,
  Search
} from 'lucide-react';
import { getTasks } from '../services/railwayApi';
import { Task } from '../types';

type DeptTab = 'ALL' | 'ENG' | 'TRD' | 'SNT';

export const DepartmentWorkspace: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DeptTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // 100-Point Readiness Diagnostic State (Normalized 0-100)
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

  // Filter tasks by active tab and search
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const deptStr = String(t.department);
      const matchesDept = 
        activeTab === 'ALL' || 
        (activeTab === 'ENG' && (deptStr === 'ENG' || deptStr === 'ENGINEERING')) ||
        (activeTab === 'TRD' && deptStr === 'TRD') ||
        (activeTab === 'SNT' && (deptStr === 'SNT' || deptStr === 'S_AND_T'));

      const matchesSearch = 
        t.task_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.work_type.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesDept && matchesSearch;
    });
  }, [tasks, activeTab, searchQuery]);

  const selectedTask = useMemo(() => {
    return tasks.find(t => t.id === selectedTaskId) || tasks[0] || null;
  }, [tasks, selectedTaskId]);

  // Sync readiness scores when selecting a task
  useEffect(() => {
    if (selectedTask) {
      setMachineScore(selectedTask.worksite_ready ? 100 : 40);
      setGangScore(100);
      setMaterialScore(selectedTask.material_ready ? 100 : 35);
      setPtwScore(selectedTask.ptw_ready ? 100 : 25);
      setWeatherScore(selectedTask.weather_suitable ? 100 : 50);
    }
  }, [selectedTaskId]);

  // Mathematical 100-Point Readiness Calculation:
  // Readiness = (0.25 * Machine) + (0.20 * Gang) + (0.20 * Material) + (0.20 * PTW) + (0.15 * SiteWeather)
  const computedScore = useMemo(() => {
    const raw = (0.25 * machineScore) + (0.20 * gangScore) + (0.20 * materialScore) + (0.20 * ptwScore) + (0.15 * weatherScore);
    return Math.round(raw * 10) / 10;
  }, [machineScore, gangScore, materialScore, ptwScore, weatherScore]);

  // Determine decision band
  const decisionBand = useMemo(() => {
    if (computedScore >= 80) {
      return {
        band: 'PLAN_A_ELIGIBLE',
        title: 'PLAN A ELIGIBLE (P50 OPTIMAL)',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        textColor: 'text-emerald-800',
        borderColor: 'border-emerald-200',
        bgColor: 'bg-emerald-50/80',
        recommendation: 'Eligible for optimal median possession window (P50). Highest track availability.'
      };
    } else if (computedScore >= 60) {
      return {
        band: 'PLAN_B_MANDATORY',
        title: 'PLAN B MANDATORY (60–79 BAND)',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        textColor: 'text-amber-800',
        borderColor: 'border-amber-200',
        bgColor: 'bg-amber-50/80',
        recommendation: 'Enforce mandatory uncertainty buffer (+45m). Do not permit Plan A. Readiness moderate.'
      };
    } else {
      return {
        band: 'HIGH_RISK_DEFERRAL',
        title: 'HIGH RISK DEFERRAL (< 60 BAND)',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
        textColor: 'text-rose-800',
        borderColor: 'border-rose-200',
        bgColor: 'bg-rose-50/80',
        recommendation: 'Possession window blocked. Readiness deficient. Reschedule after resources confirmed.'
      };
    }
  }, [computedScore]);

  const isSelectedReadOnly = Boolean(
    selectedTask && ((selectedTask as any).read_only || (selectedTask as any).co_block_partner)
  );

  return (
    <div className="flex flex-1 bg-[#F7F8F5]">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 flex flex-col ${isCollapsed ? 'ml-20' : 'ml-[260px]'}`}>
        <Header 
          title="Department Supervisor Maintenance Workspace" 
          subtitle="100-Point Readiness Gate, Cross-Department Coordination & Co-Block Visibility" 
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Workspace Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl card-warm">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#EAF6F0] text-[#16805C] border border-[#16805C]/20 uppercase tracking-wider flex items-center gap-1">
                  <Users size={12} className="text-[#16805C]" />
                  SSE Maintenance Supervisor
                </span>
                <span className="text-xs text-slate-500 font-semibold">• 5-Pillar Readiness Engine</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#1E5AA8] border border-blue-200">
                  G&SR Joint Blocks
                </span>
              </div>
              <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
                Corridor Maintenance Task Queue & Readiness Verification
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Inspect task prerequisites, verify gang/plant availability, and review co-block integrated possessions before controller sanction.
              </p>
            </div>

            <button
              onClick={fetchTasks}
              className="px-3.5 py-2 rounded-xl bg-[#102A43] text-white text-xs font-bold flex items-center gap-2 hover:bg-[#1E5AA8] transition-all shadow-sm active:scale-98 shrink-0 cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh Queue
            </button>
          </div>

          {/* Department Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl card-warm">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === 'ALL'
                    ? 'bg-[#1E5AA8] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                All Tasks ({tasks.length})
              </button>
              <button
                onClick={() => setActiveTab('ENG')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'ENG'
                    ? 'bg-[#16805C] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                Engineering (P.Way)
              </button>
              <button
                onClick={() => setActiveTab('TRD')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'TRD'
                    ? 'bg-[#D9901A] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-200"></span>
                Electrical (TRD)
              </button>
              <button
                onClick={() => setActiveTab('SNT')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'SNT'
                    ? 'bg-[#7456B8] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-300"></span>
                S&T Signalling
              </button>
            </div>

            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by code or work..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#D9E0E8] text-xs focus:ring-2 focus:ring-[#1E5AA8] bg-[#FCFBF8]"
              />
            </div>
          </div>

          {/* Main Content Split: Task List + 100-Point Diagnostic Gate */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Task List (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Showing {filteredTasks.length} Registered Tasks
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">Click task to inspect readiness</span>
              </div>

              <div className="space-y-3 max-h-[660px] overflow-y-auto pr-1">
                {filteredTasks.map((t) => {
                  const isSelected = selectedTask?.id === t.id;
                  const isReadOnlyPartner = (t as any).read_only || (t as any).co_block_partner;

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTaskId(t.id)}
                      className={`card-warm rounded-xl p-4 transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'ring-2 ring-[#1E5AA8] border-[#1E5AA8] bg-blue-50/40 shadow-md'
                          : 'hover:border-[#1E5AA8]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Task Code */}
                          <span className="text-sm font-bold text-slate-900">{t.task_code}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {t.department}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            t.lane === 'LANE_A' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            t.lane === 'LANE_B2' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}>
                            {t.lane}
                          </span>

                          {/* READ-ONLY CO-BLOCK PARTNER BADGE */}
                          {isReadOnlyPartner && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 uppercase tracking-wider">
                              <Lock size={9} />
                              READ-ONLY PARTNER
                            </span>
                          )}
                        </div>

                        {/* Location Metadata */}
                        <span className="text-xs font-medium text-slate-500 font-mono">
                          KM {t.km_from}–{t.km_to}
                        </span>
                      </div>

                      {/* Task Title */}
                      <p className="text-base font-semibold text-slate-800 tracking-tight mt-2">{t.work_type}</p>

                      {/* Metadata row */}
                      <div className="flex items-center justify-between mt-3 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400" />
                          {t.estimated_duration_minutes}m Duration
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono">Readiness: {t.readiness_score || 85}%</span>
                          <span className={`w-2 h-2 rounded-full ${
                            (t.readiness_score || 85) >= 80 ? 'bg-emerald-500' :
                            (t.readiness_score || 85) >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 100-Point Readiness Gate Diagnostic Panel (Right Column) */}
            <div className="lg:col-span-5">
              <div className="card-warm rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#D9E0E8] pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pillar Diagnostics</span>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <Sliders size={16} className="text-[#1E5AA8]" />
                      100-Point Readiness Gate
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Composite Score</span>
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

                {/* If selected task is read-only co-block partner, show warning */}
                {isSelectedReadOnly && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-900 flex items-center gap-2">
                    <Lock size={14} className="text-amber-700 shrink-0" />
                    <span>Co-Block Partner Task: Read-only cross-department visibility. Adjustments restricted to owning supervisor.</span>
                  </div>
                )}

                {/* 5 Pillar Interactive Controls with Sleek 6px Progress Bars */}
                <div className="space-y-4 pt-1">
                  {/* Pillar 1: Machine (25%) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>1. Machine & Tamping Stabling (25%)</span>
                      <span className="font-mono text-slate-900 font-bold">{machineScore}%</span>
                    </div>
                    {/* Sleek 6px Progress Bar */}
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

                  {/* Pillar 2: Gang Availability (20%) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>2. Maintenance Gang Mobilization (20%)</span>
                      <span className="font-mono text-slate-900 font-bold">{gangScore}%</span>
                    </div>
                    {/* Sleek 6px Progress Bar */}
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

                  {/* Pillar 3: Material Availability (20%) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>3. Track Material & Spares at Depot (20%)</span>
                      <span className="font-mono text-slate-900 font-bold">{materialScore}%</span>
                    </div>
                    {/* Sleek 6px Progress Bar */}
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
                      <span>4. PTW & S&T Disconnection Notice (20%)</span>
                      <span className="font-mono text-slate-900 font-bold">{ptwScore}%</span>
                    </div>
                    {/* Sleek 6px Progress Bar */}
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

                  {/* Pillar 5: Site Weather (15%) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>5. Site Weather & Track Visibility (15%)</span>
                      <span className="font-mono text-slate-900 font-bold">{weatherScore}%</span>
                    </div>
                    {/* Sleek 6px Progress Bar */}
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

                {/* Formula Note */}
                <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                  Formula: (0.25 × Machine) + (0.20 × Gang) + (0.20 × Material) + (0.20 × PTW) + (0.15 × Weather)
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
