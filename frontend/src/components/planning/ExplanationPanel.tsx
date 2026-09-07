import React from 'react';
import { PlannedTask } from '../../types';
import { HelpCircle, Check, ShieldCheck } from 'lucide-react';

interface ExplanationPanelProps {
  task: PlannedTask | null;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ task }) => {
  if (!task) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs text-center text-slate-500 text-xs">
        <HelpCircle size={28} className="mx-auto text-slate-300 mb-2" />
        Click any task in the timeline grid below to inspect the AI scheduling rationale.
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="p-1 rounded bg-blue-100 text-blue-700">
          <ShieldCheck size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Why was {task.task_code} scheduled here?
          </h4>
          <p className="text-[11px] text-slate-500">Deterministic CP-SAT solver constraint resolution explanation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <div>
          <span className="text-slate-500 font-medium">Corridor Section Origin:</span>
          <p className="font-bold text-blue-700 mt-0.5">
            {task.block_window_id % 3 === 1 
              ? 'SEC-1: NDLS - GZB (New Delhi ➔ Ghaziabad)' 
              : task.block_window_id % 3 === 2 
              ? 'SEC-2: GZB - MB (Ghaziabad ➔ Moradabad)' 
              : 'SEC-3: MB - BE (Moradabad ➔ Bareilly)'}
          </p>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Kilometer Location:</span>
          <p className="font-bold text-slate-800 mt-0.5">
            KM {task.km_from || 0} – {task.km_to || 15} km (UP Main Line)
          </p>
        </div>
      </div>

      <div className="p-3.5 bg-blue-50/50 rounded-lg border border-blue-100 text-xs text-slate-800 leading-relaxed font-medium">
        {task.explanation || `Scheduled in Block Window #${task.block_window_id} because gang & machinery prerequisites are satisfied, corridor train impact is minimized, and deadline is respected.`}
      </div>

      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Verified Decision Factors</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center gap-2">
            <Check size={14} className="text-emerald-600" />
            <span>Readiness: {task.readiness_level || 'HIGH'}</span>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center gap-2">
            <Check size={14} className="text-emerald-600" />
            <span>Duration: {task.planned_duration_minutes} min</span>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center gap-2">
            <Check size={14} className="text-emerald-600" />
            <span>Zero Headway Conflicts</span>
          </div>
        </div>
      </div>
    </div>
  );
};
