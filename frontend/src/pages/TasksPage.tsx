import React, { useState, useEffect } from 'react';
import { Sidebar, useSidebar } from '../components/layout/Sidebar';
import { ListTodo, Plus, CheckCircle2, ShieldAlert, Sparkles, Filter, Layers } from 'lucide-react';
import { getTasks, createTask } from '../services/railwayApi';
import { Task } from '../types';

export const TasksPage: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterLane, setFilterLane] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [department, setDepartment] = useState<'ENGINEERING' | 'TRD' | 'S_AND_T'>('ENGINEERING');
  const [workType, setWorkType] = useState('');
  const [blockSectionId, setBlockSectionId] = useState(1);
  const [kmFrom, setKmFrom] = useState(105.0);
  const [kmTo, setKmTo] = useState(110.0);
  const [lane, setLane] = useState<'B1_PLANNED' | 'B2_STATUTORY'>('B1_PLANNED');
  const [duration, setDuration] = useState(90);

  const loadTasks = async () => {
    try {
      const res = await getTasks();
      setTasks(res);
    } catch (e) {
      console.error("Failed to load tasks", e);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask({
        department,
        work_type: workType,
        block_section_id: blockSectionId,
        km_from: kmFrom,
        km_to: kmTo,
        lane,
        estimated_duration_minutes: duration,
        requires_line_block: 1,
        requires_power_block: department === 'TRD' ? 1 : 0,
        requires_disconnection: department === 'S_AND_T' ? 1 : 0
      });
      setShowCreateModal(false);
      setWorkType('');
      await loadTasks();
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterDept !== 'ALL' && t.department !== filterDept) return false;
    if (filterLane !== 'ALL' && t.lane !== filterLane) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-[#F7F8F5]">
      <Sidebar />
      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-[260px]'} p-6 relative z-10`}>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-elevated mb-6 border border-white/90">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800 uppercase tracking-wider glow-teal">
                Corridor Maintenance Pool
              </span>
              <span className="text-xs text-slate-500 font-semibold">• 58 km Register</span>
            </div>
            <h1 className="text-2xl font-black text-[#0B1220] tracking-tight">
              Maintenance Task Pool & 100-Point Readiness Register
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Track Engineering, TRD OHE, and S&T signaling requirements across the 58km corridor.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all active:scale-98"
          >
            <Plus size={16} /> Register Maintenance Task
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3.5 mb-6 p-4.5 rounded-2xl glass-panel-elevated">
          <Filter size={16} className="text-slate-400" />
          <span className="text-xs font-black text-[#0B1220]">Filter By:</span>

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="text-xs font-bold border border-slate-300 rounded-xl px-3.5 py-2 bg-white text-slate-800 shadow-xs"
          >
            <option value="ALL">All Departments</option>
            <option value="ENGINEERING">Engineering (P-Way)</option>
            <option value="TRD">TRD (OHE Traction)</option>
            <option value="S_AND_T">S&T (Signals & Telecom)</option>
          </select>

          <select
            value={filterLane}
            onChange={(e) => setFilterLane(e.target.value)}
            className="text-xs font-bold border border-slate-300 rounded-xl px-3.5 py-2 bg-white text-slate-800 shadow-xs"
          >
            <option value="ALL">All Workflow Lanes</option>
            <option value="A_EMERGENCY">Lane A (Emergency Protocol)</option>
            <option value="B1_PLANNED">Lane B1 (Planned)</option>
            <option value="B2_STATUTORY">Lane B2 (Statutory Due)</option>
          </select>
        </div>

        {/* Task Table */}
        <div className="p-6 rounded-2xl glass-panel-elevated">
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Task Code</th>
                  <th className="p-3.5">Dept</th>
                  <th className="p-3.5">Work Type</th>
                  <th className="p-3.5">KM Span</th>
                  <th className="p-3.5">Workflow Lane</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Readiness</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 bg-white">
                {filteredTasks.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-black text-[#0B1220]">{t.task_code}</td>
                    <td className="p-3.5 text-slate-600 font-bold">{t.department}</td>
                    <td className="p-3.5 text-slate-800 font-bold">{t.work_type}</td>
                    <td className="p-3.5 text-slate-700 metric-mono font-bold">KM {t.km_from}–{t.km_to}</td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded ${
                        t.lane === 'A_EMERGENCY' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        (t.lane === 'B2_STATUTORY' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-blue-100 text-blue-800 border border-blue-300')
                      }`}>
                        {t.lane}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 metric-mono">{t.estimated_duration_minutes}m</td>
                    <td className="p-3.5 font-black text-[#0B1220] metric-mono">{t.priority_score ?? 50} pts</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[10px] glow-teal">
                        {t.readiness_score ?? 100} pts
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-600">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Creating Task */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
              <h3 className="text-base font-black text-[#0B1220] mb-4">Register New Corridor Work Item</h3>
              <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e: any) => setDepartment(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="ENGINEERING">Engineering (P-Way)</option>
                    <option value="TRD">TRD (OHE Traction)</option>
                    <option value="S_AND_T">S&T (Signals & Telecom)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Work Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Continuous Tamping & Track Packing"
                    value={workType}
                    onChange={e => setWorkType(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Start KM</label>
                    <input
                      type="number"
                      step="0.1"
                      value={kmFrom}
                      onChange={e => setKmFrom(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-xl metric-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">End KM</label>
                    <input
                      type="number"
                      step="0.1"
                      value={kmTo}
                      onChange={e => setKmTo(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-xl metric-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Workflow Lane</label>
                    <select
                      value={lane}
                      onChange={(e: any) => setLane(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                    >
                      <option value="B1_PLANNED">B1 Planned</option>
                      <option value="B2_STATUTORY">B2 Statutory</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Estimated Duration (m)</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-xl metric-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md transition-all active:scale-98"
                  >
                    Save Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
