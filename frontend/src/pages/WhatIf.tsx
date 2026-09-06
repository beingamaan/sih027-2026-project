import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { runWhatIf } from '../services/planApi';
import { Beaker, AlertTriangle, ArrowRight, TrendingUp, Clock } from 'lucide-react';

export const WhatIf: React.FC = () => {
  const [scenario, setScenario] = useState<string>('Machine Unavailable');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scenarios = [
    { label: 'Machine Unavailable', id: 'Machine Unavailable', desc: 'Simulates breakdown of Tamping Machine 01' },
    { label: 'Machine Delayed', id: 'Machine Delayed', desc: 'Simulates 60-min transit delay of BCM machine' },
    { label: 'Gang Unavailable', id: 'Gang Unavailable', desc: 'Track Gang G-101 unavailable due to emergency' },
    { label: 'Block Window Removed', id: 'Block Window Removed', desc: 'Section Controller cancels 02:00-05:00 window' },
    { label: 'Duration Increased', id: 'Duration Increased', desc: 'Task overrun probability increases by 50%' },
    { label: 'Train Volume Increased', id: 'Train Volume Increased', desc: 'Special passenger rakes inserted in corridor' },
    { label: 'Weather Unsuitable', id: 'Weather Unsuitable', desc: 'High gale winds prevent OHE tower wagon work' },
  ];

  const handleSimulate = async (sc: string) => {
    setScenario(sc);
    setLoading(true);
    setError(null);
    try {
      const data = await runWhatIf(1, sc);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError('Could not run scenario simulation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="What-If Scenario Sandbox" subtitle="Real-time disruption analysis & schedule recalculation">
      <p className="text-xs text-slate-500 mb-6">
        Simulate real-world disruptions (machinery breakdowns, severe weather, train priority changes) to assess downstream impact before committing to field orders.
      </p>

      {/* Scenario Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {scenarios.map((sc) => (
          <button
            key={sc.id}
            onClick={() => handleSimulate(sc.id)}
            className={`p-3 rounded-xl border text-left transition-all ${
              scenario === sc.id
                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Beaker size={14} className={scenario === sc.id ? 'text-blue-600' : 'text-slate-400'} />
              <span>{sc.label}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">{sc.desc}</p>
          </button>
        ))}
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Results Matrix */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original */}
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-900">ORIGINAL PLAN (Baseline)</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">OPTIMAL</span>
              </div>
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Train Detention Impact:</span>
                  <span className="font-bold text-slate-800">45 mins</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Total Corridor Delay Cost:</span>
                  <span className="font-bold text-slate-800">₹ 38,200</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Scheduled Task Yield:</span>
                  <span className="font-bold text-emerald-700">100% (22/22)</span>
                </div>
              </div>
            </div>

            {/* Revised */}
            <div className="p-6 bg-amber-50/20 rounded-xl border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-amber-100">
                <h4 className="text-sm font-bold text-amber-900">REVISED DISRUPTION MODEL ({scenario})</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">SIMULATED</span>
              </div>
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-amber-100/50">
                  <span className="text-slate-500">Net Train Impact Shift:</span>
                  <span className="font-bold text-rose-600">{result.train_impact_change}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-amber-100/50">
                  <span className="text-slate-500">Corridor Cost Shift:</span>
                  <span className="font-bold text-rose-600">{result.cost_change}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Rescheduled Tasks:</span>
                  <span className="font-bold text-slate-800">2 tasks shifted</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Impact Narrative */}
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Downstream Operational Assessment
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">{result.explanation}</p>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600" />
                Triggered Risk Warnings
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {(result.risks || []).map((r: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
