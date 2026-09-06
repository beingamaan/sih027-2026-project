import React from 'react';

interface TaskFiltersProps {
  department: string;
  lane: string;
  priority: string;
  status: string;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  department,
  lane,
  priority,
  status,
  onChange,
  onReset,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-wrap items-center gap-3">
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
        <select
          value={department}
          onChange={(e) => onChange('department', e.target.value)}
          className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
        >
          <option value="">All Departments</option>
          <option value="ENGINEERING">Engineering</option>
          <option value="TRD">TRD (Traction)</option>
          <option value="S&T">S&T (Signals)</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lane</label>
        <select
          value={lane}
          onChange={(e) => onChange('lane', e.target.value)}
          className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
        >
          <option value="">All Lanes</option>
          <option value="LANE_A">LANE A (Emergency)</option>
          <option value="LANE_B1">LANE B1 (Planned)</option>
          <option value="LANE_B2">LANE B2 (Statutory)</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
        <select
          value={priority}
          onChange={(e) => onChange('priority', e.target.value)}
          className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => onChange('status', e.target.value)}
          className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="PLANNED">Planned</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="READY">Ready</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="ml-auto self-end">
        <button
          onClick={onReset}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};
