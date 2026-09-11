import React, { useState } from 'react';
import { Sidebar, useSidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { OccupancyView } from '../components/charts/OccupancyView';
import { Train, RefreshCw } from 'lucide-react';
import { optimizeCorridor, OptimizerResult } from '../services/railwayApi';

export const TrainGraphPage: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [selectedPlan, setSelectedPlan] = useState<'PLAN_A' | 'PLAN_B'>('PLAN_A');
  const [solverTelemetry, setSolverTelemetry] = useState<OptimizerResult | null>(null);
  const [optimizing, setOptimizing] = useState<boolean>(false);

  const handleReoptimize = async () => {
    setOptimizing(true);
    try {
      const res = await optimizeCorridor();
      if (res && res.solve_time_ms !== undefined) {
        setSolverTelemetry(res);
      }
    } catch (e) {
      console.error('Failed to reoptimize:', e);
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F7F8F5] text-slate-800">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col transition-all duration-300">
        <Header />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Top Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#1E5AA8]/10 text-[#1E5AA8] text-[11px] font-black uppercase tracking-wider border border-[#1E5AA8]/20">
                  Operations Planning &amp; Analytics
                </span>
                <span className="text-xs text-slate-500 font-bold">• Section Controller Mandate</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#102A43] tracking-tight flex items-center gap-3">
                <Train className="w-7 h-7 text-[#B42332]" />
                Corridor Occupancy &amp; Marey Train Graph
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                58 km Northern Corridor (Station Alpha KM 100.0 → Station Delta KM 158.0) · 24-Hour Timetable &amp; Possession Simulation
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {solverTelemetry && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-900/10 border border-emerald-500/30 rounded-full text-xs font-mono text-emerald-800 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>⚡ Solved via {solverTelemetry.solver_engine} in {solverTelemetry.solve_time_ms}ms · Status: {solverTelemetry.status}</span>
                </div>
              )}

              <button
                onClick={handleReoptimize}
                disabled={optimizing}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={15} className={optimizing ? 'animate-spin' : ''} />
                <span>{optimizing ? 'Re-optimising...' : 'Re-optimise Corridor'}</span>
              </button>
            </div>
          </div>

          {/* Quick KPIs */}
          <div className="flex items-stretch gap-2.5 flex-wrap">
              {/* CORRIDOR NODES */}
              <div className="px-3.5 py-2 bg-white rounded-xl border border-slate-200 shadow-2xs text-center flex flex-col justify-center min-w-[110px]">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CORRIDOR NODES</div>
                <div className="text-base font-black text-[#102A43] metric-mono mt-0.5">7 Stations</div>
              </div>

              {/* ACTIVE CONFLICTS */}
              <div className="px-3.5 py-2 bg-white rounded-xl border border-slate-200 shadow-2xs text-center flex flex-col justify-center min-w-[130px]">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">ACTIVE CONFLICTS</div>
                <div className={`text-base font-black metric-mono mt-0.5 ${
                  selectedPlan === 'PLAN_A' ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {selectedPlan === 'PLAN_A' ? '1 Critical · 2 Minor' : '3 Critical · 1 Minor'}
                </div>
              </div>

              {/* PASSENGER DELAY */}
              <div className="px-3.5 py-2 bg-white rounded-xl border border-slate-200 shadow-2xs text-center flex flex-col justify-center min-w-[190px]">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">PASSENGER DELAY</div>
                <div className="flex items-center justify-center mt-0.5">
                  <span className={`px-2 py-0.5 rounded-md text-xs border ${
                    selectedPlan === 'PLAN_A'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200 font-bold animate-pulse'
                  }`}>
                    {selectedPlan === 'PLAN_A' ? '+25 Min Delay' : '+77 Min Delay'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  {selectedPlan === 'PLAN_A'
                    ? 'Rajdhani Clear · Shatabdi +15m'
                    : 'Rajdhani +25m · Shatabdi +30m · Unchahar +22m'}
                </div>
              </div>

              {/* TOTAL WTM IMPACT */}
              <div className="px-3.5 py-2 bg-white rounded-xl border border-slate-200 shadow-2xs text-center flex flex-col justify-center min-w-[120px]">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">TOTAL WTM IMPACT</div>
                <div className={`text-base mt-0.5 ${
                  selectedPlan === 'PLAN_A'
                    ? 'text-slate-800 font-mono'
                    : 'text-rose-700 font-mono font-bold'
                }`}>
                  {selectedPlan === 'PLAN_A' ? '410.0 WTM' : '698.0 WTM'}
                </div>
              </div>
            </div>

          {/* Full-Page Dual-Mode Occupancy Component */}
          <OccupancyView
            initialPlanMode={selectedPlan}
            activePlanMode={selectedPlan}
            onPlanModeChange={setSelectedPlan}
          />
        </main>
      </div>
    </div>
  );
};

export default TrainGraphPage;
