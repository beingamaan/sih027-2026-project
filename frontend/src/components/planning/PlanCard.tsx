import React from 'react';
import { Plan } from '../../types';
import { Badge } from '../common/Badge';
import { Calendar, CheckCircle2 } from 'lucide-react';

interface PlanCardProps {
  plan: Plan;
  selected?: boolean;
  onSelect?: () => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, selected, onSelect }) => {
  const isRecommended = plan.plan_type === 'PLAN_A';

  return (
    <div
      onClick={onSelect}
      className={`p-6 bg-white rounded-xl border transition-all cursor-pointer ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
          : 'border-slate-200 hover:border-slate-300 shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-500">{plan.plan_code}</span>
            {isRecommended && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                <CheckCircle2 size={12} /> RECOMMENDED
              </span>
            )}
          </div>
          <h4 className="text-lg font-bold text-slate-900 mt-1">
            {plan.plan_type === 'PLAN_A' ? 'Plan A (Optimized Horizon)' : 'Plan B (Alternative Schedule)'}
          </h4>
        </div>

        <Badge
          variant={
            plan.solver_status === 'OPTIMAL'
              ? 'green'
              : plan.solver_status === 'FEASIBLE'
              ? 'blue'
              : 'amber'
          }
        >
          {plan.solver_status}
        </Badge>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-slate-500">Train Impact:</span>
          <p className="font-bold text-slate-800 mt-0.5">{plan.estimated_train_impact_minutes || 45} mins</p>
        </div>
        <div>
          <span className="text-slate-500">Estimated Cost:</span>
          <p className="font-bold text-slate-800 mt-0.5">₹ {(plan.total_estimated_cost || 42500).toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          <Calendar size={13} className="text-blue-600" />
          7-Day Window: {new Date(plan.horizon_start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {new Date(plan.horizon_end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
        <span className="font-semibold text-slate-600 uppercase">{plan.approval_status || 'PENDING'}</span>
      </div>
    </div>
  );
};
