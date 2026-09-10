import React, { useState, useEffect } from 'react';
import { Sidebar, useSidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { RegisterTaskModal } from '../components/forms/RegisterTaskModal';
import { 
  ListTodo, Plus, Filter, CheckCircle2, AlertTriangle, ShieldCheck, 
  Layers, Search, Wrench, RefreshCw 
} from 'lucide-react';
import { getTasks } from '../services/railwayApi';
import { Task } from '../types';

export const DEFAULT_CORRIDOR_TASKS: Task[] = [
  {
    id: 1,
    task_code: 'TSK_ENG_01',
    department: 'ENG',
    dept: 'ENG',
    work_type: 'Track Tamping',
    block_section_id: 1,
    km_from: 104.2,
    km_to: 104.8,
    start_km: 104.2,
    end_km: 104.8,
    lane: 'LANE_A',
    workflow_lane: 'LANE_A',
    priority_score: 98.5,
    priority_pts: 98.5,
    readiness_score: 100,
    readiness_pts: 100,
    estimated_duration_minutes: 90,
    duration_min: 90,
    requires_line_block: 1,
    requires_power_block: 0,
    requires_disconnection: 0,
    duration_buffer_minutes: 15,
    material_ready: 1,
    ptw_ready: 1,
    power_ready: 1,
    disconnection_ready: 1,
    worksite_ready: 1,
    weather_suitable: 1,
    overdue_days: 0,
    status: 'ELIGIBLE'
  },
  {
    id: 2,
    task_code: 'TSK_ENG_02',
    department: 'ENG',
    dept: 'ENG',
    work_type: 'Deep Screening',
    block_section_id: 1,
    km_from: 110.0,
    km_to: 112.5,
    start_km: 110.0,
    end_km: 112.5,
    lane: 'LANE_B1',
    workflow_lane: 'LANE_B1',
    priority_score: 88.0,
    priority_pts: 88.0,
    readiness_score: 100,
    readiness_pts: 100,
    estimated_duration_minutes: 120,
    duration_min: 120,
    requires_line_block: 1,
    requires_power_block: 0,
    requires_disconnection: 0,
    duration_buffer_minutes: 15,
    material_ready: 1,
    ptw_ready: 1,
    power_ready: 1,
    disconnection_ready: 1,
    worksite_ready: 1,
    weather_suitable: 1,
    overdue_days: 0,
    status: 'ELIGIBLE'
  },
  {
    id: 3,
    task_code: 'TSK_ENG_03',
    department: 'ENG',
    dept: 'ENG',
    work_type: 'Rail Clamping',
    block_section_id: 1,
    km_from: 118.4,
    km_to: 118.4,
    start_km: 118.4,
    end_km: 118.4,
    lane: 'LANE_B1',
    workflow_lane: 'LANE_B1',
    priority_score: 85.0,
    priority_pts: 85.0,
    readiness_score: 100,
    readiness_pts: 100,
    estimated_duration_minutes: 150,
    duration_min: 150,
    requires_line_block: 1,
    requires_power_block: 0,
    requires_disconnection: 1,
    duration_buffer_minutes: 15,
    material_ready: 1,
    ptw_ready: 1,
    power_ready: 1,
    disconnection_ready: 1,
    worksite_ready: 1,
    weather_suitable: 1,
    overdue_days: 0,
    status: 'ELIGIBLE'
  },
  {
    id: 4,
    task_code: 'TSK_TRD_01',
    department: 'TRD',
    dept: 'TRD',
    work_type: 'OHE Bracket Overhaul KM 118-124',
    block_section_id: 1,
    km_from: 118.0,
    km_to: 124.0,
    start_km: 118.0,
    end_km: 124.0,
    lane: 'LANE_B1',
    workflow_lane: 'LANE_B1',
    priority_score: 95.0,
    priority_pts: 95.0,
    readiness_score: 100,
    readiness_pts: 100,
    estimated_duration_minutes: 120,
    duration_min: 120,
    requires_line_block: 1,
    requires_power_block: 1,
    requires_disconnection: 0,
    duration_buffer_minutes: 15,
    material_ready: 1,
    ptw_ready: 1,
    power_ready: 1,
    disconnection_ready: 1,
    worksite_ready: 1,
    weather_suitable: 1,
    overdue_days: 0,
    status: 'ELIGIBLE'
  },
  {
    id: 5,
    task_code: 'TSK_TRD_02',
    department: 'TRD',
    dept: 'TRD',
    work_type: 'Catenary Wire Dropper Inspection',
    block_section_id: 1,
    km_from: 114.0,
    km_to: 117.0,
    start_km: 114.0,
    end_km: 117.0,
    lane: 'LANE_B2',
    workflow_lane: 'LANE_B2',
    priority_score: 80.0,
    priority_pts: 80.0,
    readiness_score: 94,
    readiness_pts: 94,
    estimated_duration_minutes: 90,
    duration_min: 90,
    requires_line_block: 1,
    requires_power_block: 0,
    requires_disconnection: 0,
    duration_buffer_minutes: 15,
    material_ready: 1,
    ptw_ready: 1,
    power_ready: 1,
    disconnection_ready: 1,
    worksite_ready: 1,
    weather_suitable: 1,
    overdue_days: 0,
    status: 'VERIFIED'
  },
  {
    id: 6,
    task_code: 'TSK_SNT_01',
    department: 'SNT',
    dept: 'SNT',
    work_type: 'Electronic Interlocking Axle Counter Test at Barhan',
    block_section_id: 1,
    km_from: 105.0,
    km_to: 105.0,
    start_km: 105.0,
    end_km: 105.0,
    lane: 'LANE_B1',
    workflow_lane: 'LANE_B1',
    priority_score: 100.0,
    priority_pts: 100.0,
    readiness_score: 100,
    readiness_pts: 100,
    estimated_duration_minutes: 90,
    duration_min: 90,
    requires_line_block: 1,
    requires_power_block: 0,
    requires_disconnection: 1,
    duration_buffer_minutes: 15,
    material_ready: 1,
    ptw_ready: 1,
    power_ready: 1,
    disconnection_ready: 1,
    worksite_ready: 1,
    weather_suitable: 1,
    overdue_days: 0,
    status: 'ELIGIBLE'
  },
  {
    id: 7,
    task_code: 'TSK_SNT_02',
    department: 'SNT',
    dept: 'SNT',
    work_type: 'Point Machine Lubrication',
    block_section_id: 1,
    km_from: 111.0,
    km_to: 113.0,
    start_km: 111.0,
    end_km: 113.0,
    lane: 'LANE_B2',
    workflow_lane: 'LANE_B2',
    priority_score: 88.0,
    priority_pts: 88.0,
    readiness_score: 94,
    readiness_pts: 94,
    estimated_duration_minutes: 100,
    duration_min: 100,
    requires_line_block: 0,
    requires_power_block: 0,
    requires_disconnection: 1,
    duration_buffer_minutes: 15,
    material_ready: 1,
    ptw_ready: 1,
    power_ready: 1,
    disconnection_ready: 1,
    worksite_ready: 1,
    weather_suitable: 1,
    overdue_days: 0,
    status: 'VERIFIED'
  }
];

export const TaskRegister: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_CORRIDOR_TASKS);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedLane, setSelectedLane] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await getTasks();
      if (Array.isArray(data) && data.length > 0) {
        setTasks(data);
      } else {
        setTasks(DEFAULT_CORRIDOR_TASKS);
      }
    } catch (err) {
      console.warn('Using deterministic corridor task fallback:', err);
      setTasks(DEFAULT_CORRIDOR_TASKS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
    setToastMessage('Maintenance Task Registered Successfully');
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filter logic strictly meeting user specifications:
  // 1. selectedDept === 'ALL' || !selectedDept || task.dept === selectedDept || task.department === selectedDept
  // 2. selectedLane === 'ALL' || !selectedLane || task.workflow_lane === selectedLane || task.lane === selectedLane
  const filteredTasks = tasks.filter((task) => {
    const matchesDept =
      selectedDept === 'ALL' ||
      !selectedDept ||
      task.dept === selectedDept ||
      task.department === selectedDept ||
      (selectedDept === 'ENG' && (task.department === 'ENGINEERING' || task.dept === 'ENGINEERING')) ||
      (selectedDept === 'SNT' && (task.department === 'S_AND_T' || task.dept === 'S_AND_T'));

    const matchesLane =
      selectedLane === 'ALL' ||
      !selectedLane ||
      task.workflow_lane === selectedLane ||
      task.lane === selectedLane ||
      (selectedLane === 'LANE_A' && (task.lane === 'A_EMERGENCY' || task.workflow_lane === 'A_EMERGENCY')) ||
      (selectedLane === 'LANE_B1' && (task.lane === 'B1_PLANNED' || task.workflow_lane === 'B1_PLANNED')) ||
      (selectedLane === 'LANE_B2' && (task.lane === 'B2_STATUTORY' || task.workflow_lane === 'B2_STATUTORY'));

    const matchesSearch =
      !searchQuery.trim() ||
      task.task_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.work_type?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDept && matchesLane && matchesSearch;
  });

  const deptCounts = {
    ENG: tasks.filter((t) => t.department === 'ENG' || t.dept === 'ENG' || t.department === 'ENGINEERING').length,
    TRD: tasks.filter((t) => t.department === 'TRD' || t.dept === 'TRD').length,
    SNT: tasks.filter((t) => t.department === 'SNT' || t.dept === 'SNT' || t.department === 'S_AND_T').length
  };

  return (
    <div className="flex min-h-screen bg-[#F7F8F5] text-slate-800">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col transition-all duration-300">
        <Header />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed top-20 right-8 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl shadow-emerald-600/30 border border-emerald-500 animate-in fade-in slide-in-from-top-4 duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-100" />
              <span className="text-xs font-bold tracking-wide">{toastMessage}</span>
            </div>
          )}

          {/* Top Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#1E5AA8]/10 text-[#1E5AA8] text-[11px] font-black uppercase tracking-wider border border-[#1E5AA8]/20">
                  Corridor Task Pool
                </span>
                <span className="text-xs text-slate-500 font-bold">• 100-Point Statutory Readiness Register</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#102A43] tracking-tight flex items-center gap-3">
                <ListTodo className="w-7 h-7 text-[#1E5AA8]" />
                Maintenance Task Register
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Multi-disciplinary task registry across Track Engineering (ENG), OHE Traction (TRD), and Signalling &amp; Telecom (S&amp;T).
              </p>
            </div>

            {/* Quick Actions & KPIs */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-3.5 py-2 bg-white rounded-xl border border-slate-200 shadow-2xs text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Pool</div>
                <div className="text-base font-black text-[#102A43] metric-mono">{tasks.length} Tasks</div>
              </div>
              <div className="px-3.5 py-2 bg-blue-50 rounded-xl border border-blue-200 shadow-2xs text-center">
                <div className="text-[10px] uppercase font-bold text-blue-700">ENG / TRD / S&amp;T</div>
                <div className="text-base font-black text-blue-950 metric-mono">
                  {deptCounts.ENG} / {deptCounts.TRD} / {deptCounts.SNT}
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 bg-[#1E5AA8] hover:bg-[#154687] text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>Register Maintenance Task</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                <Filter size={15} />
                <span>Filters:</span>
              </div>

              {/* Department Filter */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs font-bold border border-slate-300 rounded-xl px-3.5 py-2 bg-white text-slate-800 shadow-2xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                <option value="ENG">Engineering (P-Way)</option>
                <option value="TRD">Electrical Traction (TRD)</option>
                <option value="SNT">Signalling &amp; Telecom (S&amp;T)</option>
              </select>

              {/* Workflow Lane Filter */}
              <select
                value={selectedLane}
                onChange={(e) => setSelectedLane(e.target.value)}
                className="text-xs font-bold border border-slate-300 rounded-xl px-3.5 py-2 bg-white text-slate-800 shadow-2xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Workflow Lanes</option>
                <option value="LANE_A">LANE_A (Emergency Critical)</option>
                <option value="LANE_B1">LANE_B1 (Planned / Preventive)</option>
                <option value="LANE_B2">LANE_B2 (Statutory Due)</option>
              </select>
            </div>

            {/* Search & Refresh */}
            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              <div className="relative w-full md:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search code or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <button
                onClick={fetchTasks}
                disabled={loading}
                title="Refresh tasks"
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Task Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Task Code</th>
                    <th className="p-3.5">Dept</th>
                    <th className="p-3.5">Work Description</th>
                    <th className="p-3.5">KM Span</th>
                    <th className="p-3.5">Workflow Lane</th>
                    <th className="p-3.5">Duration</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5">Readiness</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                        No maintenance tasks match the selected department or workflow lane filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((t) => {
                      const deptCode = t.dept || (t.department === 'ENGINEERING' ? 'ENG' : t.department === 'S_AND_T' ? 'SNT' : t.department);
                      const laneCode = t.workflow_lane || (t.lane === 'A_EMERGENCY' ? 'LANE_A' : t.lane === 'B1_PLANNED' ? 'LANE_B1' : t.lane === 'B2_STATUTORY' ? 'LANE_B2' : t.lane);
                      const priorityScore = t.priority_pts ?? t.priority_score ?? 80;
                      const readinessScore = t.readiness_pts ?? t.readiness_score ?? 100;
                      const durationMinutes = t.duration_min ?? t.estimated_duration_minutes ?? 90;
                      const startKm = t.start_km ?? t.km_from;
                      const endKm = t.end_km ?? t.km_to;

                      return (
                        <tr key={t.id || t.task_code} className="hover:bg-slate-50/70 transition-colors">
                          {/* Task Code */}
                          <td className="p-3.5 font-mono font-black text-slate-900">
                            {t.task_code}
                          </td>

                          {/* Dept Badge */}
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide ${
                              deptCode === 'ENG'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : deptCode === 'TRD'
                                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                : 'bg-purple-100 text-purple-900 border border-purple-200'
                            }`}>
                              {deptCode}
                            </span>
                          </td>

                          {/* Work Type */}
                          <td className="p-3.5 font-bold text-slate-800 max-w-xs truncate">
                            {t.work_type}
                          </td>

                          {/* KM Span */}
                          <td className="p-3.5 font-mono text-slate-600 font-medium whitespace-nowrap">
                            KM {startKm?.toFixed(1)} – {endKm?.toFixed(1)}
                          </td>

                          {/* Workflow Lane */}
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                              laneCode === 'LANE_A'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : laneCode === 'LANE_B2'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {laneCode}
                            </span>
                          </td>

                          {/* Duration */}
                          <td className="p-3.5 font-mono text-slate-700 font-medium">
                            {durationMinutes}m
                          </td>

                          {/* Priority */}
                          <td className="p-3.5 font-mono font-black text-slate-800">
                            {priorityScore} pts
                          </td>

                          {/* Readiness */}
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                              readinessScore >= 95
                                ? 'bg-emerald-100 text-emerald-800'
                                : readinessScore >= 80
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {readinessScore} pts
                            </span>
                          </td>

                          {/* Status */}
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                              {t.status || 'ELIGIBLE'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal for Creating New Task */}
      <RegisterTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTaskCreated}
      />
    </div>
  );
};

export default TaskRegister;
