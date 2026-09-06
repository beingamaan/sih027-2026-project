import React from 'react';
import { Plan } from '../../types';
import { Badge } from '../common/Badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface PlanComparisonProps {
  planA: Plan;
  planB: Plan;
}

export const PlanComparison: React.FC<PlanComparisonProps> = ({ planA, planB }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Plan Comparison Matrix (7-Day Horizon)</h3>
          <p className="text-xs text-slate-500">Side-by-side trade-off analysis between primary optimization and alternative</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        {/* Plan A Column */}
        <div className="p-6 bg-blue-50/20">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-blue-900">PLAN A (Recommended)</h4>
              <CheckCircle2 size={18} className="text-blue-600" />
            </div>
            <Badge variant={planA.solver_status === 'OPTIMAL' ? 'green' : 'amber'}>
              {planA.solver_status}
            </Badge>
          </div>

          <div className="divide-y divide-slate-100 text-xs mt-3">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Estimated Total Cost</span>
              <span className="font-mono font-bold text-slate-900">₹ {(planA.total_estimated_cost || 38200).toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Train Detention Impact</span>
              <span className="font-mono font-bold text-emerald-700">{planA.estimated_train_impact_minutes || 45} mins</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">TSR Delay Cost</span>
              <span className="font-mono font-bold text-slate-800">₹ {(planA.estimated_tsr_cost || 12000).toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Late Completion Risk</span>
              <span className="font-semibold text-emerald-700">VERY LOW</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Primary Optimizer</span>
              <span className="font-medium text-slate-700">Google OR-Tools CP-SAT</span>
            </div>
          </div>
        </div>

        {/* Plan B Column */}
        <div className="p-6 bg-slate-50/30">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-slate-800">PLAN B (Alternative Heuristic)</h4>
              <AlertCircle size={18} className="text-amber-600" />
            </div>
            <Badge variant={planB.solver_status === 'OPTIMAL' ? 'green' : 'amber'}>
              {planB.solver_status}
            </Badge>
          </div>

          <div className="divide-y divide-slate-100 text-xs mt-3">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Estimated Total Cost</span>
              <span className="font-mono font-bold text-slate-900">₹ {(planB.total_estimated_cost || 54100).toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Train Detention Impact</span>
              <span className="font-mono font-bold text-amber-700">{planB.estimated_train_impact_minutes || 90} mins</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">TSR Delay Cost</span>
              <span className="font-mono font-bold text-slate-800">₹ {(planB.estimated_tsr_cost || 18500).toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Late Completion Risk</span>
              <span className="font-semibold text-amber-700">MODERATE</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Secondary Engine</span>
              <span className="font-medium text-slate-700">Deterministic Greedy Fallback</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
