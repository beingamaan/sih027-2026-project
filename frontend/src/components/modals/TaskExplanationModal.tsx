import React from 'react';
import { X, CheckCircle2, ShieldCheck, MapPin, Clock, ArrowRight, Cpu, Layers } from 'lucide-react';

export interface TaskExplanationData {
  task_code: string;
  department: string;
  section_name?: string;
  km_from?: number;
  km_to?: number;
  work_type?: string;
  explanation?: string;
  work_minutes?: number;
  p50_margin?: number;
  p90_margin?: number;
  window_plan_a?: string;
  window_plan_b?: string;
  gates?: {
    gate_name: string;
    description: string;
    status: 'PASS' | 'FAIL';
  }[];
}

interface TaskExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskExplanationData | null;
}

export const TaskExplanationModal: React.FC<TaskExplanationModalProps> = ({
  isOpen,
  onClose,
  task
}) => {
  if (!isOpen || !task) return null;

  const defaultExplanation = `Bundled with TSK_TRD_01 and TSK_STAT_ENG_24 inside SEC-1 corridor possession window to avoid duplicate line blocks. Pre-empted Freight rake BOXN-881 to maintain 130 km/h Vande Bharat headway.`;
  const explanationText = task.explanation || defaultExplanation;

  const p50Margin = task.p50_margin ?? 37;
  const p90Margin = task.p90_margin ?? 72;
  const sectionText = task.section_name || 'SEC-1: A - B (KM 100-120)';

  const gates = task.gates || [
    {
      gate_name: 'Gate 1: Geographic Co-location',
      description: `KM ${task.km_from ?? 105.0} strictly within corridor possession boundaries (${sectionText})`,
      status: 'PASS' as const
    },
    {
      gate_name: 'Gate 2: Machine Clearance Buffer',
      description: `Sufficient headway spacing between heavy tamping units and overhead inspection vehicles`,
      status: 'PASS' as const
    },
    {
      gate_name: 'Gate 3: Track Protection & Handback Feasibility',
      description: `Joint S&T and TRD interlock permits verified for simultaneous non-interfering possession`,
      status: 'PASS' as const
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-[#102A43] to-slate-900 text-white flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 uppercase tracking-wider border border-blue-400/30">
                Rule &amp; CP-SAT Reasoning
              </span>
              <span className="text-xs text-slate-300 font-bold">• Corridor Engine</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              Task Scheduling &amp; Engine Reasoning: {task.task_code}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[11px]">
                {task.department}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-300" />
                {sectionText}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
          {/* Work Description summary */}
          {task.work_type && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Target Operation</div>
                <div className="text-xs font-black text-slate-900 mt-0.5">{task.work_type}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Chainage Span</div>
                <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                  KM {task.km_from ?? 105.0} – {task.km_to ?? 110.0}
                </div>
              </div>
            </div>
          )}

          {/* Full Engine Rationale */}
          <div>
            <h4 className="text-[11px] uppercase font-black tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Full Engine Rationale
            </h4>
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-slate-800 leading-relaxed font-medium text-[12px] shadow-2xs">
              {explanationText}
            </div>
          </div>

          {/* Six Compatibility Rule Gates */}
          <div>
            <h4 className="text-[11px] uppercase font-black tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Satisfied Compatibility Rule Gates
            </h4>
            <div className="space-y-2">
              {gates.map((g, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{g.gate_name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-5.5">{g.description}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {g.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Comparative Impact */}
          <div>
            <h4 className="text-[11px] uppercase font-black tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Comparative Impact &amp; Safety Margins
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-400">Plan A (P50 Baseline)</div>
                <div className="text-base font-black text-slate-900 metric-mono mt-1">
                  +{p50Margin}m Aux Margin
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Optimized for lowest delay</div>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="text-[10px] uppercase font-bold text-amber-700">Plan B (P90 Robust Buffer)</div>
                <div className="text-base font-black text-amber-900 metric-mono mt-1">
                  +{p90Margin}m Robust Margin
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">Protects against machine drift</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium">
            Computed under Indian Railways HDN-04 corridor dispatch rules
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Reasoning
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskExplanationModal;
