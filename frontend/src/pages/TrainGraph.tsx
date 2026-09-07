import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Loading } from '../components/common/Loading';
import { api } from '../services/api';
import { AlertTriangle, ZoomIn, Clock, Train } from 'lucide-react';

const MAX_KM = 150;

const STATIONS = [
  { name: 'New Delhi (NDLS)', km: 0 },
  { name: 'Ghaziabad (GZB)', km: 30 },
  { name: 'Moradabad (MB)', km: 90 },
  { name: 'Bareilly (BE)', km: MAX_KM },
];

// Drastically reduce mock trains to make the graph easier to read (avoid spaghetti effect)
const MOCK_TRAINS = Array.from({ length: 6 }, (_, i) => {
  const h = i * 4; // Only generate trains every 4 hours instead of every hour
  return [
    { id: `EXP-${h}01`, cls: 'EXPRESS', dir: 'UP', startKm: 0, endKm: MAX_KM, startH: h, endH: h + 3.2, color: '#3b82f6' },
    { id: `FRT-${h}02`, cls: 'FREIGHT', dir: 'DOWN', startKm: MAX_KM, endKm: 0, startH: h + 1.5, endH: h + 5.0, color: '#64748b' },
    { id: `PAS-${h}03`, cls: 'PASSENGER', dir: 'UP', startKm: 0, endKm: 90, startH: h + 2.0, endH: h + 4.5, color: '#10b981' },
  ];
}).flat();

const MOCK_TSR = [
  { kmStart: 15, kmEnd: 18, speed: 30, label: 'TSR 30 km/h' },
  { kmStart: 85, kmEnd: 88, speed: 50, label: 'TSR 50 km/h' },
];

export const TrainGraph: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(24);
  const [hoveredTrain, setHoveredTrain] = useState<string | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  
  // Layer Toggles to reduce clutter
  const [showTrains, setShowTrains] = useState(true);
  const [showBlocks, setShowBlocks] = useState(true);
  const [showTSRs, setShowTSRs] = useState(false); // Hidden by default for simplicity
  
  const [blocks, setBlocks] = useState<any[]>([]);
  const [currentTimeH, setCurrentTimeH] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const plansRes = await api.get('/api/plans');
        const plans = plansRes.data;
        if (plans && plans.length > 0) {
          const latestPlan = plans[plans.length - 1];
          const planDetailRes = await api.get(`/api/plans/${latestPlan.id}`);
          const tasks = planDetailRes.data.tasks || [];
          
          const parsedBlocks = tasks.map((t: any) => {
            const parseTime = (tStr: string) => {
              if (!tStr) return 0;
              const parts = tStr.split(':');
              if (parts.length === 2) {
                return parseInt(parts[0]) + parseInt(parts[1]) / 60;
              }
              const dt = new Date(tStr);
              if (!isNaN(dt.getTime())) return dt.getHours() + dt.getMinutes() / 60;
              return 0;
            };
            
            return {
              id: t.task_code,
              section: t.section_name,
              kmStart: t.km_from || 0,
              kmEnd: t.km_to || 10,
              startH: parseTime(t.planned_start),
              endH: parseTime(t.planned_end),
              type: t.lane,
              tasks: 1,
              department: t.department
            };
          });
          setBlocks(parsedBlocks);
        }
      } catch (e) {
        console.error("Failed to load graph data", e);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();

    const updateTime = () => {
      const now = new Date();
      setCurrentTimeH(now.getHours() + now.getMinutes() / 60);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <PageContainer title="Train Graph" subtitle="Time-Distance Visualization"><Loading message="Loading train paths & blocks..." /></PageContainer>;
  }

  const chartW = 900;
  const chartH = 400;
  const padL = 90, padR = 20, padT = 30, padB = 40;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const timeToX = (h: number) => padL + (Math.max(0, Math.min(h, timeRange)) / timeRange) * plotW;
  const kmToY = (km: number) => padT + (Math.max(0, Math.min(km, MAX_KM)) / MAX_KM) * plotH;

  const visibleTrains = MOCK_TRAINS.filter(t => t.startH < timeRange);

  return (
    <PageContainer title="Train Graph" subtitle="Time-Distance Visualization">
      
      {/* Controls panel: greatly simplifies user experience */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              Time Range:
              <select value={timeRange} onChange={e => setTimeRange(Number(e.target.value))} className="text-sm font-normal border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500">
                <option value={6}>6 hours (Zoomed In)</option>
                <option value={12}>12 hours (Standard)</option>
                <option value={24}>24 hours (Full Day)</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Display Layers:</span>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer hover:text-blue-600 transition-colors">
              <input type="checkbox" checked={showBlocks} onChange={e => setShowBlocks(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <div className="w-3 h-3 bg-blue-100 border border-blue-400 rounded-sm"></div>
              Tasks
            </label>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer hover:text-blue-600 transition-colors">
              <input type="checkbox" checked={showTrains} onChange={e => setShowTrains(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <div className="w-4 h-0.5 bg-blue-500"></div>
              Trains
            </label>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer hover:text-blue-600 transition-colors">
              <input type="checkbox" checked={showTSRs} onChange={e => setShowTSRs(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <div className="w-3 h-3 bg-red-100 border border-red-400 rounded-sm"></div>
              Speed Restrictions
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 overflow-x-auto shadow-sm">
        <svg width={chartW} height={chartH} className="w-full" viewBox={`0 0 ${chartW} ${chartH}`}>

          {/* Background Grid */}
          {STATIONS.map(s => (
            <g key={s.name}>
              <line x1={padL} y1={kmToY(s.km)} x2={chartW - padR} y2={kmToY(s.km)} stroke="#f1f5f9" strokeWidth="2" />
              <text x={padL - 10} y={kmToY(s.km) + 4} textAnchor="end" className="text-[11px] font-semibold fill-slate-600">{s.name}</text>
              <text x={padL - 10} y={kmToY(s.km) + 16} textAnchor="end" className="text-[9px] fill-slate-400">{s.km} km</text>
            </g>
          ))}
          {Array.from({ length: timeRange + 1 }, (_, i) => (
            <g key={`t-${i}`}>
              <line x1={timeToX(i)} y1={padT} x2={timeToX(i)} y2={chartH - padB} stroke="#f8fafc" strokeWidth="1.5" />
              {(i % 2 === 0 || timeRange <= 12) && (
                <text x={timeToX(i)} y={chartH - padB + 18} textAnchor="middle" className="text-[10px] font-medium fill-slate-500">
                  {String(i % 24).padStart(2, '0')}:00
                </text>
              )}
            </g>
          ))}

          {/* TSR zones */}
          {showTSRs && MOCK_TSR.map((tsr, i) => (
            <rect key={`tsr-${i}`} x={padL} y={kmToY(tsr.kmStart)} width={plotW} height={kmToY(tsr.kmEnd) - kmToY(tsr.kmStart)} fill="#fef2f2" stroke="#fca5a5" strokeDasharray="4,2" rx={2} />
          ))}

          {/* Block windows (Real Tasks) */}
          {showBlocks && blocks.map(b => {
             // Only draw if task starts before our timeRange ends
             if (b.startH >= timeRange) return null;
             
             const cappedKmStart = Math.min(b.kmStart, MAX_KM);
             const cappedKmEnd = Math.min(b.kmEnd, MAX_KM) > cappedKmStart ? Math.min(b.kmEnd, MAX_KM) : cappedKmStart + 5;
             const startX = timeToX(b.startH);
             const endX = timeToX(Math.min(b.endH, timeRange)); // clamp right side
             const w = Math.max(endX - startX, 4); // ensure min width
             const h = Math.max(kmToY(cappedKmEnd) - kmToY(cappedKmStart), 18);
             
             return (
              <g key={b.id} onMouseEnter={() => setHoveredBlock(b.id)} onMouseLeave={() => setHoveredBlock(null)} className="cursor-pointer transition-all duration-300">
                {/* Modern Solid Block Zone */}
                <rect 
                  x={startX} y={kmToY(cappedKmStart)} width={w} height={h} 
                  fill={hoveredBlock === b.id ? 'rgba(219, 234, 254, 0.95)' : 'rgba(239, 246, 255, 0.85)'} 
                  stroke={hoveredBlock === b.id ? '#3b82f6' : '#93c5fd'} 
                  strokeWidth={hoveredBlock === b.id ? 2 : 1.5} rx={6} 
                  style={{ filter: hoveredBlock === b.id ? 'drop-shadow(0px 4px 6px rgba(37, 99, 235, 0.15))' : 'drop-shadow(0px 2px 4px rgba(0,0,0,0.05))' }}
                />
                
                {/* Responsive Label - Always visible */}
                {w > 45 ? (
                  // Inside the block if wide enough
                  <g transform={`translate(${startX + 6}, ${kmToY(cappedKmStart) + (h/2 - 5)})`}>
                    <circle cx="3" cy="5" r="3" fill={hoveredBlock === b.id ? '#2563eb' : '#60a5fa'} />
                    <text x="12" y="8" className="text-[10px] font-bold fill-blue-900 tracking-wide">{b.id}</text>
                  </g>
                ) : (
                  // Above the block if too narrow
                  <g transform={`translate(${startX}, ${kmToY(cappedKmStart) - 10})`}>
                    <text x="0" y="6" className="text-[9px] font-bold fill-blue-800 tracking-wide" style={{ textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff' }}>{b.id}</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Train paths */}
          {showTrains && visibleTrains.map((t, i) => {
            if (t.startH >= timeRange) return null;
            const startX = timeToX(t.startH);
            const startY = kmToY(t.startKm);
            const endX = timeToX(Math.min(t.endH, timeRange));
            const endY = kmToY(t.endKm);
            
            const isHovered = hoveredTrain === t.id;
            const trainColor = isHovered ? '#f59e0b' : t.color;
            
            const getStationAbbr = (km: number) => {
              if (km <= 15) return 'NDLS';
              if (km <= 60) return 'GZB';
              if (km <= 120) return 'MB';
              return 'BE';
            };
            const origin = getStationAbbr(t.startKm);
            const dest = getStationAbbr(t.endKm);
            
            return (
              <g 
                key={`tr-${i}`} 
                className="cursor-pointer transition-opacity duration-200"
                opacity={hoveredTrain && !isHovered ? 0.1 : 0.8}
                onMouseEnter={() => setHoveredTrain(t.id)} 
                onMouseLeave={() => setHoveredTrain(null)}
              >
                {/* Main Train Line */}
                <line x1={startX} y1={startY} x2={endX} y2={endY} stroke={trainColor} strokeWidth={isHovered ? 3 : 2} />
                
                {/* Train Logo Wrapper */}
                <circle cx={startX} cy={startY} r="11" fill="white" stroke={trainColor} strokeWidth="1.5" className="shadow-sm" />
                
                {/* Train Icon */}
                <g transform={`translate(${startX - 7}, ${startY - 7})`}>
                  <Train size={14} color={trainColor} strokeWidth={2.5} />
                </g>

                {/* Direction Indicator (Tiny Arrow) */}
                {t.dir === 'DOWN' ? (
                  <path d={`M ${startX} ${startY+11} L ${startX-3} ${startY+16} L ${startX+3} ${startY+16} Z`} fill={trainColor} />
                ) : (
                  <path d={`M ${startX} ${startY-11} L ${startX-3} ${startY-16} L ${startX+3} ${startY-16} Z`} fill={trainColor} />
                )}

                {/* Permanent Route Label */}
                <text x={startX + 16} y={startY + 3} className="text-[10px] font-bold fill-slate-700" style={{ textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff' }}>
                  {origin} → {dest}
                </text>

                {/* ID Label on Hover */}
                {isHovered && (
                  <text x={startX + 16} y={startY - 9} className="text-[11px] font-black fill-amber-600" style={{ textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff' }}>
                    {t.id}
                  </text>
                )}
              </g>
            );
          })}

          {/* LIVE TRACKING LINE */}
          {currentTimeH < timeRange && (
            <g className="live-tracker">
              <line x1={timeToX(currentTimeH)} y1={padT} x2={timeToX(currentTimeH)} y2={chartH - padB} stroke="#ef4444" strokeWidth="2.5" strokeDasharray="6,4" />
              <rect x={timeToX(currentTimeH) - 25} y={8} width={50} height={18} fill="#ef4444" rx="4" className="shadow-sm" />
              <text x={timeToX(currentTimeH)} y={20} fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">
                LIVE
              </text>
            </g>
          )}
        </svg>

        {/* Hover Tooltips */}
        <div className="h-10 mt-2 flex items-center justify-center">
          {hoveredTrain && (
            <div className="px-3 py-1.5 bg-slate-800 text-white rounded-lg border text-sm inline-flex items-center gap-2 shadow-md animate-fade-in">
              <Train size={16} className="text-blue-400" />
              <span className="font-bold">{hoveredTrain}</span>
              <span className="text-slate-300">| {MOCK_TRAINS.find(t => t.id === hoveredTrain)?.cls} ({MOCK_TRAINS.find(t => t.id === hoveredTrain)?.dir})</span>
            </div>
          )}
          {hoveredBlock && (
            <div className="px-3 py-1.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-sm inline-flex items-center gap-2 shadow-md animate-fade-in">
              <Clock size={16} className="text-blue-600" />
              <span className="font-bold">{hoveredBlock}</span>
              <span className="text-blue-700">| {blocks.find(b => b.id === hoveredBlock)?.department} | {blocks.find(b => b.id === hoveredBlock)?.section}</span>
            </div>
          )}
          {!hoveredTrain && !hoveredBlock && (
            <div className="text-xs text-slate-400 flex items-center gap-1"><ZoomIn size={14} /> Hover over a train line or block window for details</div>
          )}
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
          <Clock size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900 mb-1">How to read this chart</h4>
          <p className="text-xs text-blue-800 leading-relaxed">
            The <strong>Red Dashed Line</strong> represents the current actual time. Everything to the left is in the past; everything to the right is in the future. 
            <strong> Blue Rectangles</strong> are scheduled maintenance tasks. <strong>Diagonal Lines</strong> are trains passing through the stations. Use the toggles above to hide layers and reduce clutter.
          </p>
        </div>
      </div>
    </PageContainer>
  );
};
