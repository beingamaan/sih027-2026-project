import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { ArrowLeft, Clock, MapPin, Layers, Wrench, Users, Zap, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

const DEMO_BLOCK = {
  id: 'BLK-2026-0147',
  section: 'SEC_AB',
  sectionName: 'Station A — Station B',
  line: 'UP',
  kmStart: 10.0,
  kmEnd: 15.0,
  startTime: '02:00',
  endTime: '05:00',
  blockType: 'TRAFFIC_POWER',
  setup: 15,
  work: 120,
  clearance: 20,
  handback: 10,
  totalMinutes: 165,
  tasks: [
    { code: 'TSK_ENG_2', dept: 'ENGINEERING', type: 'Track Tamping', lane: 'B1_PLANNED' },
    { code: 'TSK_ENG_4', dept: 'ENGINEERING', type: 'Rail Grinding', lane: 'B1_PLANNED' },
    { code: 'TSK_TRD_1', dept: 'TRD', type: 'OHE Mast Repair', lane: 'B2_STATUTORY' },
  ],
  departments: ['ENGINEERING', 'TRD'],
  trainImpact: 52,
  costBreakdown: { train_impact: 200, tsr: 50, failure_risk: 50, late_completion: 0, instability: 0, total: 300 },
  readiness: { machine: true, gang: true, material: true, ptw: true, level: 'HIGH' as const },
  planVersion: 3,
  explanation: 'Selected because compatible Engineering + TRD tasks can be combined, readiness is high, and estimated train-impact cost is lower than alternative windows.',
};

export const BlockDetails: React.FC = () => {
  const { id } = useParams();
  const block = DEMO_BLOCK;
  const durationParts = [
    { label: 'Setup', value: block.setup, color: 'bg-slate-400' },
    { label: 'Work', value: block.work, color: 'bg-blue-500' },
    { label: 'Clearance', value: block.clearance, color: 'bg-amber-400' },
    { label: 'Handback', value: block.handback, color: 'bg-emerald-400' },
  ];

  return (
    <PageContainer title="Block Details" subtitle={block.id}>
      <Link to="/planning" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4">
        <ArrowLeft size={16} /> Back to Planning
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{block.id}</h2>
            <p className="text-sm text-slate-600 mt-1">{block.sectionName}</p>
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Plan V{block.planVersion}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm"><MapPin size={14} className="text-slate-400" /> <span>{block.kmStart}–{block.kmEnd} km</span></div>
          <div className="flex items-center gap-2 text-sm"><Clock size={14} className="text-slate-400" /> <span>{block.startTime}–{block.endTime}</span></div>
          <div className="flex items-center gap-2 text-sm"><Layers size={14} className="text-slate-400" /> <span>Line: {block.line}</span></div>
          <div className="flex items-center gap-2 text-sm"><Zap size={14} className="text-slate-400" /> <span>{block.blockType}</span></div>
        </div>
      </div>

      {/* Duration Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Duration Breakdown ({block.totalMinutes} min)</h3>
        <div className="flex rounded-full overflow-hidden h-6">
          {durationParts.map(p => (
            <div key={p.label} className={`${p.color} flex items-center justify-center text-[10px] text-white font-semibold`} style={{ width: `${(p.value / block.totalMinutes) * 100}%` }}>
              {p.value}m
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {durationParts.map(p => (
            <span key={p.label} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className={`w-2.5 h-2.5 rounded-full ${p.color}`}></span>{p.label}: {p.value} min
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bundled Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Bundled Tasks ({block.tasks.length})</h3>
          <div className="space-y-2">
            {block.tasks.map(t => (
              <div key={t.code} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-sm font-semibold text-slate-800">{t.code}</span>
                  <span className="text-xs text-slate-500 ml-2">{t.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-200 text-slate-700">{t.dept}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${t.lane === 'B2_STATUTORY' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{t.lane === 'B1_PLANNED' ? 'B1' : 'B2'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Cost Breakdown (train-minute-equivalent)</h3>
          <div className="space-y-2">
            {Object.entries(block.costBreakdown).filter(([k]) => k !== 'total').map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 capitalize">{k.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-slate-800">{v}</span>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-sm font-bold">
              <span>Total</span>
              <span className="text-blue-700">{block.costBreakdown.total}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Prototype synthetic assumption values.</p>
        </div>
      </div>

      {/* Readiness & Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Readiness</h3>
          <div className="space-y-2">
            {[
              { label: 'Machine', ready: block.readiness.machine },
              { label: 'Gang', ready: block.readiness.gang },
              { label: 'Material', ready: block.readiness.material },
              { label: 'PTW / Power / Disconnection', ready: block.readiness.ptw },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={16} className={r.ready ? 'text-emerald-500' : 'text-red-400'} />
                <span className={r.ready ? 'text-slate-700' : 'text-red-600'}>{r.label}: {r.ready ? 'Ready' : 'Not Ready'}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 inline-flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">Readiness: {block.readiness.level}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText size={16} /> Explanation</h3>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">{block.explanation}</p>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            <span className="font-semibold">Departments:</span> {block.departments.join(', ')} &nbsp;|&nbsp;
            <span className="font-semibold">Train impact:</span> {block.trainImpact} min
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
        <p className="text-[11px] text-amber-800">Advisory Decision Support — Final block sanction and railway safety procedures remain with authorized Railway personnel.</p>
      </div>
      <p className="mt-3 text-center text-[11px] text-slate-400">Prototype demonstration using synthetic data. Not for live Railway operations.</p>
    </PageContainer>
  );
};
