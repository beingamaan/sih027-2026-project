import React from 'react';
import { Task } from '../../types';
import { Lock, Clock, CheckCircle2, Sliders } from 'lucide-react';

export interface TaskCardProps {
  task: Task;
  onAcknowledge?: (taskCode: string) => void;
  onInspectReadiness?: (taskId: number) => void;
  onVerify?: (task: Task) => void;
  isSelected?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onAcknowledge,
  onInspectReadiness,
  onVerify,
  isSelected = false
}) => {
  const isCoBlockPartner = Boolean(
    task.is_co_block_partner || task.co_block_partner || task.read_only
  );

  const getLaneBadge = (lane: string) => {
    switch (lane) {
      case 'LANE_A':
      case 'A_EMERGENCY':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'LANE_B2':
      case 'B2_STATUTORY':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDeptBadge = (dept: string) => {
    const d = (dept || '').toUpperCase();
    if (d.includes('ENG')) return 'bg-amber-50 text-amber-900 border-amber-200';
    if (d.includes('TRD')) return 'bg-purple-50 text-purple-900 border-purple-200';
    if (d.includes('SNT') || d.includes('SIG')) return 'bg-teal-50 text-teal-900 border-teal-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div
      className={`rounded-2xl p-5 transition-all ${
        isCoBlockPartner
          ? 'border-dashed border-slate-400 bg-slate-50/70 shadow-xs'
          : `border border-slate-200/90 bg-white hover:border-slate-300 shadow-xs hover:shadow-sm ${
              isSelected ? 'ring-2 ring-[#102A43] border-[#102A43]' : ''
            }`
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-black text-slate-900">
            {task.task_code}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getDeptBadge(
              task.department
            )}`}
          >
            {task.department}
          </span>
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${getLaneBadge(
              task.lane
            )}`}
          >
            {task.lane}
          </span>

          {/* Neutral chip with Lock icon for co-block partner tasks */}
          {isCoBlockPartner && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 uppercase tracking-wider">
              <Lock size={11} className="text-slate-600" />
              CO-BLOCK PARTNER (READ ONLY)
            </span>
          )}
        </div>

        <span className="font-mono text-xs text-slate-500 font-semibold">
          KM {task.km_from}–{task.km_to}
        </span>
      </div>

      {/* Work Description */}
      <h4 className="text-sm font-bold text-slate-900 mt-2.5 leading-snug">
        {task.work_type}
      </h4>

      {/* Meta details */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
        <span className="flex items-center gap-1.5 font-mono">
          <Clock size={13} className="text-slate-400" />
          {task.estimated_duration_minutes}m duration
        </span>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-slate-700">
            Readiness: {task.readiness_score || 85}%
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              (task.readiness_score || 85) >= 80
                ? 'bg-emerald-500'
                : (task.readiness_score || 85) >= 60
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
          />
        </div>
      </div>

      {/* Footer Controls / Read-Only Notice */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <span className="text-[10px] font-mono text-slate-400">
          Status: <strong className="text-slate-700 font-bold">{task.status}</strong>
        </span>

        {/* Co-Block Partner: Completely omit/disable all edit, verify, readiness buttons */}
        {isCoBlockPartner ? (
          <span className="text-[11px] text-slate-400 italic flex items-center gap-1 font-medium select-none">
            <Lock size={12} className="text-slate-400" />
            Non-editable partner task
          </span>
        ) : (
          /* Own Department: Full action controls enabled */
          <div className="flex items-center gap-2">
            {onAcknowledge && (
              <button
                type="button"
                onClick={() => onAcknowledge(task.task_code)}
                className="px-3 py-1.5 rounded-lg bg-[#102A43] hover:bg-[#1E5AA8] text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1"
              >
                <CheckCircle2 size={12} />
                Acknowledge
              </button>
            )}
            {onInspectReadiness && (
              <button
                type="button"
                onClick={() => onInspectReadiness(task.id)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
              >
                <Sliders size={12} />
                Inspect Readiness
              </button>
            )}
            {onVerify && (
              <button
                type="button"
                onClick={() => onVerify(task)}
                className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
              >
                Verify
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
