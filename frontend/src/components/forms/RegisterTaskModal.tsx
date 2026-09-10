import React, { useState } from 'react';
import { X, Plus, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Task } from '../../types';

interface RegisterTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTask: Task) => void;
}

export const RegisterTaskModal: React.FC<RegisterTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [department, setDepartment] = useState<'ENG' | 'TRD' | 'SNT'>('ENG');
  const [taskCode, setTaskCode] = useState<string>('');
  const [workType, setWorkType] = useState<string>('');
  const [startKm, setStartKm] = useState<number>(110.0);
  const [endKm, setEndKm] = useState<number>(115.0);
  const [durationMin, setDurationMin] = useState<number>(90);
  const [priorityPts, setPriorityPts] = useState<number>(85);
  const [workflowLane, setWorkflowLane] = useState<'LANE_B1' | 'LANE_B2' | 'LANE_A'>('LANE_B1');
  const [readinessPts, setReadinessPts] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const generatedCode = taskCode.trim() || `TSK_${department}_${Math.floor(10 + Math.random() * 90)}`;

    const payload = {
      task_code: generatedCode,
      department: department,
      work_type: workType.trim(),
      start_km: Number(startKm),
      end_km: Number(endKm),
      km_from: Number(startKm),
      km_to: Number(endKm),
      duration_min: Number(durationMin),
      estimated_duration_minutes: Number(durationMin),
      priority_pts: Number(priorityPts),
      priority_score: Number(priorityPts),
      workflow_lane: workflowLane,
      lane: workflowLane,
      readiness_pts: Number(readinessPts),
      readiness_score: Number(readinessPts),
      status: 'ELIGIBLE',
      block_section_id: 1,
      requires_line_block: 1,
      requires_power_block: department === 'TRD' ? 1 : 0,
      requires_disconnection: department === 'SNT' ? 1 : 0,
      safety_protocol_acknowledged: workflowLane === 'LANE_A'
    };

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || `Task creation failed (${response.status})`);
      }

      const newTask: Task = await response.json();
      onSuccess(newTask);
      onClose();
    } catch (err: any) {
      console.error('Failed to create task:', err);
      setError(err.message || 'Failed to register maintenance task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#FCFBF8]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
              <Plus size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Register Maintenance Task</h3>
              <p className="text-[11px] text-slate-500 font-medium">Add task to 58km corridor readiness registry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span className="text-[11px] font-semibold">{error}</span>
            </div>
          )}

          {/* Department & Lane */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Department *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="ENG">Engineering (P-Way)</option>
                <option value="TRD">Electrical Traction (TRD)</option>
                <option value="SNT">Signalling & Telecom (S&T)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Workflow Lane *</label>
              <select
                value={workflowLane}
                onChange={(e) => setWorkflowLane(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="LANE_B1">LANE_B1 (Planned / Preventive)</option>
                <option value="LANE_B2">LANE_B2 (Statutory Due)</option>
                <option value="LANE_A">LANE_A (Emergency Critical)</option>
              </select>
            </div>
          </div>

          {/* Task Code (Optional) & Work Type */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="font-bold text-slate-700 block mb-1">Task Code</label>
              <input
                type="text"
                placeholder={`TSK_${department}_...`}
                value={taskCode}
                onChange={(e) => setTaskCode(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Work Description *</label>
              <input
                type="text"
                required
                placeholder="e.g. Continuous Track Tamping & Packing"
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* KM Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Start Chainage (KM) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={startKm}
                onChange={(e) => setStartKm(parseFloat(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">End Chainage (KM) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={endKm}
                onChange={(e) => setEndKm(parseFloat(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Duration & Priority & Readiness */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Duration (min)</label>
              <input
                type="number"
                min="15"
                step="5"
                required
                value={durationMin}
                onChange={(e) => setDurationMin(parseInt(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Priority (pts)</label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={priorityPts}
                onChange={(e) => setPriorityPts(parseFloat(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Readiness (pts)</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={readinessPts}
                onChange={(e) => setReadinessPts(parseFloat(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-600 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-[#1E5AA8] hover:bg-[#154687] text-white font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Register Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
