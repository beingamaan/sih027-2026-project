import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Loading } from '../components/common/Loading';
import { api } from '../services/api';
import { AlertTriangle, ZoomIn, Clock, Train } from 'lucide-react';

const STATIONS = [
  { name: 'Station A', km: 0 },
  { name: 'Station B', km: 20 },
  { name: 'Station C', km: 42 },
  { name: 'Station D', km: 58 },
];

const MOCK_TRAINS = Array.from({ length: 24 }, (_, h) => ([
  { id: `EXP-${h}01`, cls: 'EXPRESS', dir: 'UP', startKm: 0, endKm: 58, startH: h, endH: h + 1.2, color: '#3b82f6' },
  { id: `FRT-${h}02`, cls: 'FREIGHT', dir: 'DOWN', startKm: 58, endKm: 0, startH: h + 0.25, endH: h + 1.8, color: '#64748b' },
  { id: `PAS-${h}03`, cls: 'PASSENGER', dir: 'UP', startKm: 0, endKm: 42, startH: h + 0.5, endH: h + 1.5, color: '#10b981' },
  { id: `EXP-${h}04`, cls: 'EXPRESS', dir: 'DOWN', startKm: 58, endKm: 20, startH: h + 0.75, endH: h + 1.6, color: '#3b82f6' },
])).flat();

const MOCK_BLOCKS = [
  { id: 'BLK-001', section: 'SEC_AB', kmStart: 0, kmEnd: 20, startH: 2, endH: 5, type: 'TRAFFIC_POWER', tasks: 3 },
  { id: 'BLK-002', section: 'SEC_BC', kmStart: 20, kmEnd: 42, startH: 3, endH: 5.5, type: 'INTEGRATED', tasks: 2 },
  { id: 'BLK-003', section: 'SEC_CD', kmStart: 42, kmEnd: 58, startH: 1.5, endH: 4, type: 'TRAFFIC_LINE', tasks: 1 },
];

const MOCK_TSR = [
  { kmStart: 10, kmEnd: 11, speed: 30, label: 'TSR 30 km/h' },
  { kmStart: 29.5, kmEnd: 30.5, speed: 50, label: 'TSR 50 km/h' },
];

export const TrainGraph: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(24);
  const [hoveredTrain, setHoveredTrain] = useState<string | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  useEffect(() => { setTimeout(() => setLoading(false), 600); }, []);

  if (loading) {
    return <PageContainer title="Train Graph" subtitle="Time-Distance Visualization"><Loading message="Loading train paths..." /></PageContainer>;
  }

  const chartW = 900;
  const chartH = 400;
  const padL = 80, padR = 20, padT = 30, padB = 40;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const timeToX = (h: number) => padL + (h / timeRange) * plotW;
  const kmToY = (km: number) => padT + (km / 58) * plotH;

  const visibleTrains = MOCK_TRAINS.filter(t => t.startH < timeRange);

  return (
    <PageContainer title="Train Graph" subtitle="Time-Distance Visualization">
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium text-slate-700">Time Range:</label>
        <select value={timeRange} onChange={e => setTimeRange(Number(e.target.value))} className="text-sm border border-slate-300 rounded-lg px-3 py-1.5">
          <option value={6}>6 hours</option>
          <option value={12}>12 hours</option>
          <option value={24}>24 hours</option>
        </select>
        <div className="flex items-center gap-2 ml-auto text-xs text-slate-500">
          <ZoomIn size={14} /> <span>Hover trains/blocks for details</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block"></span> Express</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-slate-500 inline-block"></span> Freight</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 inline-block"></span> Passenger</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-100 border border-blue-400 inline-block rounded-sm"></span> Block Window</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-400 inline-block rounded-sm"></span> TSR Zone</span>
        <span className="flex items-center gap-1 text-red-600 font-semibold"><AlertTriangle size={12} /> Emergency (Lane A)</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 overflow-x-auto">
        <svg width={chartW} height={chartH} className="w-full" viewBox={`0 0 ${chartW} ${chartH}`}>
          {/* Grid */}
          {STATIONS.map(s => (
            <g key={s.name}>
              <line x1={padL} y1={kmToY(s.km)} x2={chartW - padR} y2={kmToY(s.km)} stroke="#e2e8f0" strokeDasharray="4,4" />
              <text x={padL - 8} y={kmToY(s.km) + 4} textAnchor="end" className="text-[10px] fill-slate-500">{s.name}</text>
              <text x={padL - 8} y={kmToY(s.km) + 14} textAnchor="end" className="text-[9px] fill-slate-400">{s.km} km</text>
            </g>
          ))}
          {Array.from({ length: timeRange + 1 }, (_, i) => (
            <g key={`t-${i}`}>
              <line x1={timeToX(i)} y1={padT} x2={timeToX(i)} y2={chartH - padB} stroke="#f1f5f9" />
              <text x={timeToX(i)} y={chartH - padB + 16} textAnchor="middle" className="text-[10px] fill-slate-400">{String(i % 24).padStart(2, '0')}:00</text>
            </g>
          ))}

          {/* TSR zones */}
          {MOCK_TSR.map((tsr, i) => (
            <rect key={`tsr-${i}`} x={padL} y={kmToY(tsr.kmStart)} width={plotW} height={kmToY(tsr.kmEnd) - kmToY(tsr.kmStart)} fill="#fef2f2" stroke="#fca5a5" strokeDasharray="4,2" rx={2} />
          ))}

          {/* Block windows */}
          {MOCK_BLOCKS.map(b => (
            <g key={b.id} onMouseEnter={() => setHoveredBlock(b.id)} onMouseLeave={() => setHoveredBlock(null)} className="cursor-pointer">
              <rect x={timeToX(b.startH)} y={kmToY(b.kmStart)} width={timeToX(b.endH) - timeToX(b.startH)} height={kmToY(b.kmEnd) - kmToY(b.kmStart)} fill={hoveredBlock === b.id ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.1)'} stroke="#3b82f6" strokeWidth={hoveredBlock === b.id ? 2 : 1} rx={4} />
              <text x={timeToX(b.startH) + 4} y={kmToY(b.kmStart) + 14} className="text-[9px] fill-blue-700 font-semibold">{b.id}</text>
              <text x={timeToX(b.startH) + 4} y={kmToY(b.kmStart) + 24} className="text-[8px] fill-blue-500">{b.tasks} tasks</text>
            </g>
          ))}

          {/* Train paths */}
          {visibleTrains.map((t, i) => (
            <line key={`tr-${i}`} x1={timeToX(t.startH)} y1={kmToY(t.startKm)} x2={timeToX(Math.min(t.endH, timeRange))} y2={kmToY(t.endKm)} stroke={hoveredTrain === t.id ? '#f59e0b' : t.color} strokeWidth={hoveredTrain === t.id ? 2.5 : 1} opacity={hoveredTrain && hoveredTrain !== t.id ? 0.2 : 0.7} className="cursor-pointer" onMouseEnter={() => setHoveredTrain(t.id)} onMouseLeave={() => setHoveredTrain(null)} />
          ))}
        </svg>

        {/* Hover tooltip */}
        {hoveredTrain && (
          <div className="mt-2 p-2 bg-slate-50 rounded-lg border text-xs inline-flex items-center gap-2">
            <Train size={14} className="text-blue-600" />
            <span className="font-semibold">{hoveredTrain}</span>
            <span className="text-slate-500">| {MOCK_TRAINS.find(t => t.id === hoveredTrain)?.cls} | {MOCK_TRAINS.find(t => t.id === hoveredTrain)?.dir}</span>
          </div>
        )}
        {hoveredBlock && (
          <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200 text-xs inline-flex items-center gap-2">
            <Clock size={14} className="text-blue-600" />
            <span className="font-semibold">{hoveredBlock}</span>
            <span className="text-blue-700">| {MOCK_BLOCKS.find(b => b.id === hoveredBlock)?.type} | {MOCK_BLOCKS.find(b => b.id === hoveredBlock)?.tasks} bundled tasks</span>
          </div>
        )}
      </div>

      {/* Lane A Warning */}
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
        <AlertTriangle size={16} className="text-red-600" />
        <span className="text-xs text-red-800 font-medium">Emergency / Safety Critical (Lane A) — Existing authorized Railway procedure applies. These tasks are not scheduled by the optimizer.</span>
      </div>

      <div className="mt-4 text-center text-[11px] text-slate-400">Prototype demonstration using synthetic data. Not for live Railway operations.</div>
    </PageContainer>
  );
};
