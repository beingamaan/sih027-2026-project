import React, { useState, useEffect } from 'react';
import { Sidebar, useSidebar } from '../components/layout/Sidebar';
import { 
  Cpu, CheckCircle2, ShieldAlert, ArrowRight, 
  Clock, ShieldCheck, Sparkles, AlertCircle, RefreshCw 
} from 'lucide-react';
import { generateDualPlans, getPlans, approvePlan, overridePlan } from '../services/railwayApi';
import { Plan, DualPlanResponse } from '../types';

export const Planning: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [plans, setPlans] = useState<DualPlanResponse | null>(null);
  const [planList, setPlanList] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadPlans = async () => {
    try {
      const list = await getPlans();
      setPlanList(list);
      if (list.length > 0 && !selectedPlanId) {
        setSelectedPlanId(list[0].id);
      }
    } catch (e) {
      console.error("Failed to load plans", e);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setActionMessage(null);
    try {
      const res = await generateDualPlans();
      setPlans(res);
      setSelectedPlanId(res.plan_a_id);
      await loadPlans();
      setActionMessage("Dual Plans generated successfully. Evaluated P50 & P90 duration matrices.");
    } catch (e) {
      console.error("Plan generation error", e);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const res = await approvePlan(id);
      setActionMessage(res.message);
      await loadPlans();
    } catch (e) {
      console.error("Approve failed", e);
    }
  };

  const handleOverride = async (id: number) => {
    try {
      const res = await overridePlan(id, "SECTION_CONTROLLER_TRAFFIC_DEMAND");
      setActionMessage(res.message);
      await loadPlans();
    } catch (e) {
      console.error("Override failed", e);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const activePlan = planList.find(p => p.id === selectedPlanId) || planList[0];

  return (
    <div className="flex min-h-screen bg-[#F7F8F5]">
      <Sidebar />
      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-[260px]'} p-6 relative z-10`}>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-elevated mb-6 border border-white/90">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 uppercase tracking-wider glow-blue">
                Explainable Rule & CP-SAT Engine
              </span>
              <span className="text-xs text-slate-500 font-semibold">• 58 km Horizon</span>
            </div>
            <h1 className="text-2xl font-black text-[#0B1220] tracking-tight">
              Dual-Plan Automatic Generation & Sanction Portal
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Formulates Plan A (Lowest weighted train-minute cost) and Plan B (Alternate robust window with P90 buffer).
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all active:scale-98"
          >
            <Cpu size={16} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Optimizing Corridor Matrix...' : 'Generate Dual Plans'}
          </button>
        </div>

        {actionMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 mb-6 flex items-center gap-2.5 shadow-sm glow-teal">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            {actionMessage}
          </div>
        )}

        {/* Dual Plan Cards Comparison */}
        {planList.length >= 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Plan A Card */}
            <div className={`p-6 rounded-2xl border transition-all cursor-pointer ${
              activePlan?.plan_type === 'PLAN_A' 
                ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-400 shadow-xl glow-blue' 
                : 'glass-panel hover:border-slate-300'
            }`} onClick={() => setSelectedPlanId(planList.find(p => p.plan_type === 'PLAN_A')?.id || planList[0].id)}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                    Plan A (Recommended)
                  </span>
                  <h3 className="text-lg font-black text-[#0B1220] mt-1.5">{planList.find(p => p.plan_type === 'PLAN_A')?.plan_code}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detention Penalty</p>
                  <p className="text-2xl font-black text-blue-700 metric-mono">
                    {planList.find(p => p.plan_type === 'PLAN_A')?.total_cost ?? 1243} WTM
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                Least-cost feasible option based on P50 baseline duration & minimum passenger traffic headway delay.
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200/80 font-semibold">
                <span>Status: <strong className="text-slate-900">{planList.find(p => p.plan_type === 'PLAN_A')?.approval_status}</strong></span>
                <span>Horizon: 7 Days (Lookahead)</span>
              </div>
            </div>

            {/* Plan B Card */}
            <div className={`p-6 rounded-2xl border transition-all cursor-pointer ${
              activePlan?.plan_type === 'PLAN_B' 
                ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400 shadow-xl glow-amber' 
                : 'glass-panel hover:border-slate-300'
            }`} onClick={() => setSelectedPlanId(planList.find(p => p.plan_type === 'PLAN_B')?.id || planList[1]?.id)}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider">
                    Plan B (Alternate Robust)
                  </span>
                  <h3 className="text-lg font-black text-[#0B1220] mt-1.5">{planList.find(p => p.plan_type === 'PLAN_B')?.plan_code}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detention Penalty</p>
                  <p className="text-2xl font-black text-amber-700 metric-mono">
                    {planList.find(p => p.plan_type === 'PLAN_B')?.total_cost ?? 1554} WTM
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                Robust alternate option with conservative P90 buffers (+25% allowance) to protect against unexpected machine transit delays.
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200/80 font-semibold">
                <span>Status: <strong className="text-slate-900">{planList.find(p => p.plan_type === 'PLAN_B')?.approval_status}</strong></span>
                <span>Horizon: 7 Days (Lookahead)</span>
              </div>
            </div>
          </div>
        )}

        {/* Active Plan Tasks Table & Actions */}
        {activePlan && (
          <div className="p-6 rounded-2xl glass-panel-elevated">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-sm font-black text-[#0B1220]">
                  Plan Block Window Assignments: {activePlan.plan_code} ({activePlan.plan_type})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Total Penalty Score: {activePlan.total_cost} Weighted Train-Minutes · Regulation Delay: {activePlan.train_impact_cost}m
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleApprove(activePlan.id)}
                  disabled={activePlan.approval_status === 'APPROVED'}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md glow-teal active:scale-98"
                >
                  <CheckCircle2 size={15} />
                  {activePlan.approval_status === 'APPROVED' ? 'Approved & Sanctioned' : 'Approve & Sanction Plan'}
                </button>
                <button
                  onClick={() => handleOverride(activePlan.id)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-98"
                >
                  <ShieldAlert size={15} />
                  Override with Log
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Task Code</th>
                    <th className="p-3.5">Dept</th>
                    <th className="p-3.5">Corridor Section</th>
                    <th className="p-3.5">KM Span</th>
                    <th className="p-3.5">Window</th>
                    <th className="p-3.5">Duration</th>
                    <th className="p-3.5">Readiness</th>
                    <th className="p-3.5">Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 bg-white">
                  {activePlan.tasks?.map((t: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-black text-[#0B1220]">{t.task_code}</td>
                      <td className="p-3.5 text-slate-600 font-bold">{t.department}</td>
                      <td className="p-3.5 text-slate-800 font-medium">{t.section_name}</td>
                      <td className="p-3.5 text-slate-700 metric-mono font-bold">KM {t.km_from}–{t.km_to}</td>
                      <td className="p-3.5 text-blue-700 font-black metric-mono">{t.planned_start} – {t.planned_end}</td>
                      <td className="p-3.5 text-slate-600 metric-mono">{t.work_minutes}m work (+{t.setup_minutes + t.clearance_minutes + t.handback_minutes}m aux)</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[10px] glow-teal">
                          {t.readiness_score} pts
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px] max-w-xs truncate font-medium">{t.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
