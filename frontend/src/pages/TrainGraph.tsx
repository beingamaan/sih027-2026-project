import React, { useState, useEffect } from 'react';
import { Sidebar, useSidebar } from '../components/layout/Sidebar';
import { Train, RefreshCw, ZoomIn, Clock, Compass, Layers, Calendar, CheckCircle2 } from 'lucide-react';
import { getTrains, getCorridorState, getPlans } from '../services/railwayApi';
import { TrainPath, CorridorState, Plan } from '../types';
import { CALIBRATED_CORRIDOR_TRAINS, parseTimeToHours } from '../components/charts/MareyChart';

export const TrainGraph: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [trains, setTrains] = useState<TrainPath[]>([]);
  const [corridor, setCorridor] = useState<CorridorState | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlanType, setActivePlanType] = useState<'PLAN_A' | 'PLAN_B'>('PLAN_A');
  const [timeRange, setTimeRange] = useState<number>(6);
  const [hoveredTrain, setHoveredTrain] = useState<string | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trnRes, corRes, plnRes] = await Promise.all([
        getTrains(),
        getCorridorState(),
        getPlans()
      ]);
      setTrains(trnRes);
      setCorridor(corRes);
      setPlans(plnRes);
    } catch (e) {
      console.error("Failed to load train graph data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const displayTrains = (trains && trains.length > 0) ? trains : CALIBRATED_CORRIDOR_TRAINS;

  const chartW = 980;
  const chartH = 480;
  const padL = 95;
  const padR = 30;
  const padT = 35;
  const padB = 45;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const minKm = 100.0;
  const maxKm = 158.0;
  const kmSpan = maxKm - minKm;

  const timeToX = (hours: number) => padL + (Math.max(0, Math.min(hours, timeRange)) / timeRange) * plotW;
  const kmToY = (km: number) => padT + ((Math.max(minKm, Math.min(km, maxKm)) - minKm) / kmSpan) * plotH;

  // Scheduled Possession Windows on Section STB (KM 120) to STC (KM 140)
  const blockY1 = kmToY(120.0);
  const blockY2 = kmToY(140.0);
  const blockH = blockY2 - blockY1;

  // Plan A: 02:00 to 04:00 (120 min duration)
  const planAX1 = timeToX(2.0);
  const planAX2 = timeToX(4.0);
  const planAW = planAX2 - planAX1;

  // Plan B: 02:00 to 04:45 (165 min duration)
  const planBX1 = timeToX(2.0);
  const planBX2 = timeToX(4.75);
  const planBW = planBX2 - planBX1;

  // Conflict Point: BCN-91021 intersects block at ~02:52.5, KM 130.0
  const conflictX = timeToX(2.875);
  const conflictY = kmToY(130.0);

  return (
    <div className="flex min-h-screen bg-[#F7F8F5]">
      <Sidebar />
      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-[260px]'} p-6 relative z-10 overflow-x-hidden`}>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-elevated mb-6 border border-white/90">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 uppercase tracking-wider glow-blue">
                Time-Distance Marey Diagram
              </span>
              <span className="text-xs text-slate-500 font-semibold">• 58 km Corridor (KM 100.0 – 158.0)</span>
            </div>
            <h1 className="text-2xl font-black text-[#0B1220] tracking-tight">
              Time-Distance Train Graph & Track Occupancy
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Precision graphical chart mapping scheduled train trajectories alongside sanctioned joint block windows.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Plan A / Plan B Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setActivePlanType('PLAN_A')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activePlanType === 'PLAN_A' 
                    ? 'bg-blue-600 text-white shadow-md glow-blue' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Plan A Overlay (120m)
              </button>
              <button
                onClick={() => setActivePlanType('PLAN_B')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activePlanType === 'PLAN_B' 
                    ? 'bg-amber-600 text-white shadow-md glow-amber' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Plan B Overlay (165m)
              </button>
            </div>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="text-xs font-bold border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 shadow-xs"
            >
              <option value={6}>6 Hours Horizon (00:00 - 06:00)</option>
              <option value={12}>12 Hours Horizon (00:00 - 12:00)</option>
              <option value={24}>24 Hours Horizon (Full Day)</option>
            </select>

            <button
              onClick={loadData}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-98"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Chart SVG Canvas */}
        <div className="p-6 rounded-2xl glass-panel-elevated">
          <div className="bg-white rounded-xl border border-slate-200 p-5 overflow-x-auto shadow-sm relative">
            <svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
              {/* Station Grid Reference Lines for STA, STB, STC, STD */}
              {corridor?.stations.map(st => {
                const y = kmToY(st.chainage_km);
                return (
                  <g key={st.station_code}>
                    <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#f1f5f9" strokeWidth="2" />
                    <text x={padL - 12} y={y + 4} textAnchor="end" className="text-[11px] font-black fill-[#0B1220]">{st.name.split(' ')[0]}</text>
                    <text x={padL - 12} y={y + 16} textAnchor="end" className="text-[9px] font-bold fill-slate-400 metric-mono">KM {st.chainage_km}</text>
                  </g>
                );
              })}

              {/* Time divisions */}
              {Array.from({ length: timeRange + 1 }, (_, i) => {
                const x = timeToX(i);
                return (
                  <g key={`t-${i}`}>
                    <line x1={x} y1={padT} x2={x} y2={chartH - padB} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4,4" />
                    <text x={x} y={chartH - padB + 18} textAnchor="middle" className="text-[10px] font-black fill-slate-600 metric-mono">
                      {String(i % 24).padStart(2, '0')}:00
                    </text>
                  </g>
                );
              })}

              {/* Scheduled Maintenance Possession Block on Section STB (KM 120) to STC (KM 140) */}
              {activePlanType === 'PLAN_A' ? (
                <g 
                  onMouseEnter={() => setHoveredBlock('Plan A (02:00 - 04:00 • STB-STC 120m)')}
                  onMouseLeave={() => setHoveredBlock(null)}
                  className="cursor-pointer transition-opacity"
                >
                  <rect
                    x={planAX1}
                    y={blockY1}
                    width={planAW}
                    height={blockH}
                    fill="rgba(37, 99, 235, 0.22)"
                    stroke="#2563EB"
                    strokeWidth="2"
                    rx="6"
                    style={{ filter: 'drop-shadow(0 4px 12px rgba(37, 99, 235, 0.12))' }}
                  />
                  <rect
                    x={planAX1 + 8}
                    y={blockY1 + 10}
                    width={Math.min(planAW - 16, 380)}
                    height="22"
                    fill="rgba(37, 99, 235, 0.9)"
                    rx="4"
                  />
                  <text x={planAX1 + 14} y={blockY1 + 25} className="text-[10px] font-black fill-white">
                    Joint Maintenance Possession — Plan A (120m) [ENG + TRD + S&T]
                  </text>
                  <text x={planAX1 + 14} y={blockY1 + 46} className="text-[9px] font-extrabold fill-blue-900 metric-mono">
                    SEC STB–STC (KM 120.0–140.0) • 02:00 – 04:00 Window
                  </text>
                </g>
              ) : (
                <g 
                  onMouseEnter={() => setHoveredBlock('Plan B (02:00 - 04:45 • STB-STC 165m)')}
                  onMouseLeave={() => setHoveredBlock(null)}
                  className="cursor-pointer transition-opacity"
                >
                  <rect
                    x={planBX1}
                    y={blockY1}
                    width={planBW}
                    height={blockH}
                    fill="rgba(217, 119, 6, 0.25)"
                    stroke="#D97706"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    rx="6"
                    style={{ filter: 'drop-shadow(0 4px 12px rgba(217, 119, 6, 0.15))' }}
                  />
                  <rect
                    x={planBX1 + 8}
                    y={blockY1 + 10}
                    width={Math.min(planBW - 16, 340)}
                    height="22"
                    fill="rgba(217, 119, 6, 0.9)"
                    rx="4"
                  />
                  <text x={planBX1 + 14} y={blockY1 + 25} className="text-[10px] font-black fill-white">
                    P90 Robust Buffer Possession — Plan B (165m)
                  </text>
                  <text x={planBX1 + 14} y={blockY1 + 46} className="text-[9px] font-extrabold fill-amber-950 metric-mono">
                    SEC STB–STC (KM 120.0–140.0) • 02:00 – 04:45 Window (+45m Buffer)
                  </text>
                </g>
              )}

              {/* Diagonal Train Paths Trajectories with Identity Pills */}
              {displayTrains.filter(t => parseTimeToHours(t.scheduled_start) <= timeRange).map((t, idx) => {
                const startH = parseTimeToHours(t.scheduled_start);
                const endH = parseTimeToHours(t.scheduled_end);
                const x1 = timeToX(startH);
                const x2 = timeToX(Math.min(endH, timeRange));
                const y1 = kmToY(t.start_km);
                const y2 = kmToY(t.end_km);

                const isHovered = hoveredTrain === t.train_number;
                const strokeColor = t.train_class === 'PREMIUM_EXPRESS' ? '#e11d48' : (t.train_class === 'SUPERFAST' ? '#2563eb' : '#475569');

                let labelName = t.train_number.includes('Rajdhani') ? 'Rajdhani Exp' : 
                  (t.train_number.includes('Shatabdi') ? 'Shatabdi Exp' : 
                  (t.train_number.includes('Freight') || t.train_number.includes('Rake') ? 'Goods Freight' : t.train_number.split(' ')[0]));

                return (
                  <g 
                    key={`tr-${idx}`} 
                    onMouseEnter={() => setHoveredTrain(t.train_number)}
                    onMouseLeave={() => setHoveredTrain(null)}
                    className="cursor-pointer transition-opacity"
                    opacity={hoveredTrain && !isHovered ? 0.25 : 1}
                  >
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isHovered ? '#f59e0b' : strokeColor} strokeWidth={isHovered ? 3.5 : 2.5} />
                    <rect x={x1 + 4} y={y1 - 9} width="72" height="17" fill="#ffffff" stroke={strokeColor} strokeWidth="1.2" rx="4" className="shadow-xs" />
                    <text x={x1 + 8} y={y1 + 3} className="text-[8px] font-black fill-slate-900 metric-mono">
                      {labelName}
                    </text>
                  </g>
                );
              })}

              {/* Pulsing Red Conflict Marker at Intersecting Path with TSR Regulation Chip */}
              <g transform={`translate(${conflictX}, ${conflictY})`} className="cursor-pointer">
                <circle cx="0" cy="0" r="14" fill="#e11d48" opacity="0.25" className="animate-ping" />
                <circle cx="0" cy="0" r="8" fill="#e11d48" opacity="0.5" />
                <circle cx="0" cy="0" r="4.5" fill="#ffffff" stroke="#e11d48" strokeWidth="2" />
                
                {/* TSR Regulation Imposed Chip */}
                <rect x="12" y="-12" width="132" height="24" rx="5" fill="#0b1220" stroke="#f43f5e" strokeWidth="1.2" className="shadow-lg" />
                <text x="20" y="3" className="text-[9px] font-black fill-rose-300">
                  ⚠️ TSR Regulation Imposed
                </text>
              </g>
            </svg>

            {/* Tooltip */}
            <div className="h-8 mt-2 flex items-center justify-center">
              {hoveredTrain && (
                <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold inline-flex items-center gap-2 shadow-md">
                  <Train size={14} className="text-cyan-400" />
                  <span>{hoveredTrain}</span>
                  <span className="text-slate-400">| Scheduled Path</span>
                </div>
              )}
              {hoveredBlock && (
                <div className="px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold inline-flex items-center gap-2 shadow-md">
                  <Clock size={14} className="text-blue-600" />
                  <span>{hoveredBlock}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-medium px-2 flex-wrap gap-2">
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-1 bg-rose-600 rounded"></span> Premium Express (Rajdhani)</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-1 bg-blue-600 rounded"></span> Superfast (Shatabdi)</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-1 bg-slate-600 rounded"></span> Goods Freight Service</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-200 border border-blue-600 rounded-xs"></span> Plan A Possession (02:00–04:00)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-200 border border-amber-600 rounded-xs"></span> Plan B Possession (02:00–04:45)</span>
          </div>
        </div>

        {/* Compliance Screen Footer */}
        <footer className="mt-8 pt-5 pb-3 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
          <p className="font-semibold text-slate-700">
            Advisory-only decision support. Final block grant authorization remains with authorized Section Controllers.
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Lane A/B = workflow lane · UP/DOWN = physical line · All delay detentions scored strictly in Weighted Train-Minutes (WTM)
          </p>
        </footer>

      </main>
    </div>
  );
};
