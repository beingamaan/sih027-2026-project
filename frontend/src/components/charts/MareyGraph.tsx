import React, { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Train, Compass, Clock } from 'lucide-react';

export interface MareyGraphProps {
  activePlan?: 'PLAN_A' | 'PLAN_B';
  onPlanChange?: (plan: 'PLAN_A' | 'PLAN_B') => void;
  className?: string;
  height?: number;
}

export interface CorridorStation {
  code: string;
  name: string;
  chainage_km: number;
}

export const CORRIDOR_STATIONS: CorridorStation[] = [
  { code: 'STA', name: 'Station Alpha', chainage_km: 100.0 },
  { code: 'ANVR', name: 'Anandpur', chainage_km: 108.4 },
  { code: 'BRHN', name: 'Barhan Jn', chainage_km: 119.2 },
  { code: 'CHL', name: 'Chamrola', chainage_km: 128.5 },
  { code: 'STD', name: 'Station Delta', chainage_km: 158.0 },
];

export const MareyGraph: React.FC<MareyGraphProps> = ({
  activePlan: controlledPlan,
  onPlanChange,
  className = '',
  height = 500
}) => {
  const [internalPlan, setInternalPlan] = useState<'PLAN_A' | 'PLAN_B'>('PLAN_A');
  const [hoveredTrain, setHoveredTrain] = useState<string | null>(null);

  const activePlan = controlledPlan || internalPlan;
  const isPlanB = activePlan === 'PLAN_B';

  const handleSelectPlan = (plan: 'PLAN_A' | 'PLAN_B') => {
    if (onPlanChange) {
      onPlanChange(plan);
    } else {
      setInternalPlan(plan);
    }
  };

  // SVG ViewBox dimensions
  const viewW = 960;
  const viewH = 480;
  const padL = 140;
  const padR = 40;
  const padT = 30;
  const padB = 45;
  const plotW = viewW - padL - padR; // 780
  const plotH = viewH - padT - padB; // 405

  // Coordinate scales: Time 00:00 to 06:00 (0 to 360m), Chainage KM 100.0 to KM 158.0 (span: 58km)
  const minToX = (min: number) => padL + (Math.max(0, Math.min(min, 360)) / 360) * plotW;
  const kmToY = (km: number) => padT + ((km - 100.0) / 58.0) * plotH;

  // Block possession boundaries: KM 120.0 to KM 140.0
  const blockY1 = kmToY(120.0);
  const blockY2 = kmToY(140.0);
  const blockH = blockY2 - blockY1;

  // Plan A: 02:00 - 04:00 (120m to 240m)
  // Plan B: 02:00 - 04:45 (120m to 285m)
  const blockX1 = minToX(120);
  const blockX2 = minToX(isPlanB ? 285 : 240);
  const blockW = blockX2 - blockX1;

  const hoursTicks = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm ${className}`}>
      {/* Top Header Controls */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Deterministic Marey Time-Distance Graph
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
              HDN-04 Corridor
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            Delhi - Aligarh Section (KM 100.0 Station Alpha → KM 158.0 Station Delta) · 00:00 – 06:00
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap text-[11px] font-bold">
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-4 h-1 bg-blue-600 rounded-full" />
            Vande Bharat (22436)
          </span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-500" />
            BOXN-881 (Looped at CHL)
          </span>
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="w-4 h-1 bg-rose-700 rounded-full" />
            Rajdhani / Shatabdi
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="p-2 sm:p-4 overflow-x-auto">
        <svg viewBox={`0 0 ${viewW} ${viewH}`} className="w-full min-w-[760px] h-auto select-none font-sans">
          <defs>
            {/* Orange diagonal hatched pattern for maintenance block */}
            <pattern id="mareyOrangeHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#F59E0B" strokeWidth="2.5" opacity="0.85" />
            </pattern>
            {/* Red hazard glow */}
            <filter id="hazardGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#B91C1C" />
            </filter>
          </defs>

          {/* Background */}
          <rect x={padL} y={padT} width={plotW} height={plotH} fill="#FAFBFD" />

          {/* Horizontal Station Grid Lines & Chainage Labels */}
          {CORRIDOR_STATIONS.map((stn) => {
            const y = kmToY(stn.chainage_km);
            const isBlockStation = stn.code === 'BRHN' || stn.code === 'CHL';
            return (
              <g key={stn.code}>
                <line 
                  x1={padL} 
                  y1={y} 
                  x2={padL + plotW} 
                  y2={y} 
                  stroke={isBlockStation ? '#CBD5E1' : '#E2E8F0'} 
                  strokeWidth={isBlockStation ? 1.5 : 1}
                  strokeDasharray={stn.code === 'CHL' ? '4,3' : undefined}
                />
                <text 
                  x={padL - 10} 
                  y={y + 3.5} 
                  textAnchor="end" 
                  fontSize="10" 
                  fontWeight="bold"
                  fill="#334155"
                >
                  {stn.code} · {stn.name} ({stn.chainage_km.toFixed(1)}k)
                </text>
              </g>
            );
          })}

          {/* Vertical Hourly Time Grid Lines */}
          {hoursTicks.map((hr) => {
            const x = minToX(hr * 60);
            return (
              <g key={hr}>
                <line x1={x} y1={padT} x2={x} y2={padT + plotH} stroke="#E2E8F0" strokeWidth="1" />
                <text 
                  x={x} 
                  y={padT + plotH + 20} 
                  textAnchor="middle" 
                  fontSize="11" 
                  fontFamily="ui-monospace, monospace"
                  fontWeight="bold"
                  fill="#64748B"
                >
                  {String(hr).padStart(2, '0')}:00
                </text>
              </g>
            );
          })}

          {/* ========================================================================= */}
          {/* ORANGE HATCHED POSSESSION BLOCK (KM 120.0 - KM 140.0)                     */}
          {/* ========================================================================= */}
          <g>
            {/* Soft amber background tint */}
            <rect 
              x={blockX1} 
              y={blockY1} 
              width={blockW} 
              height={blockH} 
              fill="#FEF3C7" 
              fillOpacity="0.55" 
            />
            {/* Hatched overlay */}
            <rect 
              x={blockX1} 
              y={blockY1} 
              width={blockW} 
              height={blockH} 
              fill="url(#mareyOrangeHatch)" 
              fillOpacity="0.35" 
              stroke="#D97706" 
              strokeWidth="2" 
              strokeDasharray="5,3" 
            />

            {/* Block Header Badge */}
            <g transform={`translate(${blockX1 + 10}, ${blockY1 + 12})`}>
              <rect 
                x="0" 
                y="0" 
                width={isPlanB ? 215 : 180} 
                height="24" 
                rx="6" 
                fill="#92400E" 
                opacity="0.95" 
              />
              <text x="8" y="16" fill="#FEF3C7" fontSize="10" fontWeight="bold">
                ⚡ Possession: {isPlanB ? 'Plan B (02:00–04:45)' : 'Plan A (02:00–04:00)'}
              </text>
            </g>

            {/* Handback boundary line at right edge */}
            <line 
              x1={blockX2} 
              y1={blockY1 - 8} 
              x2={blockX2} 
              y2={blockY2 + 8} 
              stroke="#D97706" 
              strokeWidth="2" 
            />
            <text 
              x={blockX2 + 4} 
              y={blockY1 + 14} 
              fontSize="9" 
              fontWeight="black" 
              fill="#B45309"
            >
              Handback {isPlanB ? '04:45' : '04:00'}
            </text>
          </g>

          {/* ========================================================================= */}
          {/* TRAIN TRAJECTORIES                                                        */}
          {/* ========================================================================= */}

          {/* 1. BLUE PATH: Vande Bharat 22436 (00:30 - 01:15, Down Main, Clears Before Block) */}
          <g 
            onMouseEnter={() => setHoveredTrain('22436')} 
            onMouseLeave={() => setHoveredTrain(null)}
            className="cursor-pointer"
          >
            <polyline 
              points={`
                ${minToX(30)},${kmToY(100.0)} 
                ${minToX(38)},${kmToY(108.4)} 
                ${minToX(48)},${kmToY(119.2)} 
                ${minToX(56)},${kmToY(128.5)} 
                ${minToX(75)},${kmToY(158.0)}
              `}
              fill="none"
              stroke="#2563EB"
              strokeWidth={hoveredTrain === '22436' ? '4' : '2.5'}
              strokeLinecap="round"
            />
            {/* Train badge */}
            <text 
              x={minToX(32)} 
              y={kmToY(100.0) - 8} 
              fontSize="9" 
              fontFamily="ui-monospace, monospace" 
              fontWeight="bold" 
              fill="#1D4ED8"
            >
              22436 Vande Bharat (ON-TIME)
            </text>
          </g>

          {/* 2. GREY DASHED PATH: Freight BOXN-881 (UP Line, Flattens at Chamrola Siding) */}
          <g 
            onMouseEnter={() => setHoveredTrain('BOXN-881')} 
            onMouseLeave={() => setHoveredTrain(null)}
            className="cursor-pointer"
          >
            <polyline 
              points={`
                ${minToX(70)},${kmToY(158.0)} 
                ${minToX(110)},${kmToY(128.5)} 
                ${minToX(190)},${kmToY(128.5)} 
                ${minToX(202)},${kmToY(119.2)} 
                ${minToX(212)},${kmToY(108.4)} 
                ${minToX(220)},${kmToY(100.0)}
              `}
              fill="none"
              stroke="#64748B"
              strokeWidth={hoveredTrain === 'BOXN-881' ? '3.5' : '2'}
              strokeDasharray="6,4"
              strokeLinecap="round"
            />
            {/* Flat loop label at Chamrola siding */}
            <rect 
              x={minToX(115)} 
              y={kmToY(128.5) - 16} 
              width="145" 
              height="15" 
              rx="3" 
              fill="#F1F5F9" 
              stroke="#94A3B8" 
              strokeWidth="0.8" 
            />
            <text 
              x={minToX(120)} 
              y={kmToY(128.5) - 5} 
              fontSize="8.5" 
              fontWeight="bold" 
              fill="#475569"
            >
              BOXN-881 (Looped at CHL siding)
            </text>
          </g>

          {/* 3. CRIMSON BOLD PATH: 12004 LKO Shatabdi (01:45 - 02:40/03:10) */}
          <g 
            onMouseEnter={() => setHoveredTrain('12004')} 
            onMouseLeave={() => setHoveredTrain(null)}
            className="cursor-pointer"
          >
            <polyline 
              points={
                isPlanB
                  ? `${minToX(105)},${kmToY(100.0)} ${minToX(115)},${kmToY(108.4)} ${minToX(125)},${kmToY(119.2)} ${minToX(155)},${kmToY(128.5)} ${minToX(190)},${kmToY(158.0)}`
                  : `${minToX(105)},${kmToY(100.0)} ${minToX(115)},${kmToY(108.4)} ${minToX(125)},${kmToY(119.2)} ${minToX(142)},${kmToY(128.5)} ${minToX(175)},${kmToY(158.0)}`
              }
              fill="none"
              stroke="#B91C1C"
              strokeWidth={hoveredTrain === '12004' ? '4' : '2.5'}
              strokeLinecap="round"
            />
            <text 
              x={minToX(105)} 
              y={kmToY(100.0) - 8} 
              fontSize="9" 
              fontFamily="ui-monospace, monospace" 
              fontWeight="bold" 
              fill="#B91C1C"
            >
              12004 Shatabdi (+{isPlanB ? '30m' : '15m'})
            </text>
          </g>

          {/* 4. UNCHAHAR EXPRESS 14218 (03:15 - 04:30) */}
          <g 
            onMouseEnter={() => setHoveredTrain('14218')} 
            onMouseLeave={() => setHoveredTrain(null)}
            className="cursor-pointer"
          >
            <polyline 
              points={`
                ${minToX(195)},${kmToY(100.0)} 
                ${minToX(210)},${kmToY(108.4)} 
                ${minToX(230)},${kmToY(119.2)} 
                ${minToX(250)},${kmToY(128.5)} 
                ${minToX(270)},${kmToY(158.0)}
              `}
              fill="none"
              stroke="#D97706"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <text 
              x={minToX(195)} 
              y={kmToY(100.0) - 6} 
              fontSize="8.5" 
              fontFamily="ui-monospace, monospace" 
              fontWeight="bold" 
              fill="#B45309"
            >
              14218 Unchahar (+{isPlanB ? '22m' : '10m'})
            </text>
          </g>

          {/* 5. CRIMSON BOLD PATH: 12301 HWH Rajdhani (VISUAL PROOF: Safe Miss vs Direct Collision) */}
          <g 
            onMouseEnter={() => setHoveredTrain('12301')} 
            onMouseLeave={() => setHoveredTrain(null)}
            className="cursor-pointer"
          >
            {/* Trajectory */}
            <polyline 
              points={
                isPlanB
                  ? `
                    ${minToX(225)},${kmToY(100.0)} 
                    ${minToX(235)},${kmToY(108.4)} 
                    ${minToX(245)},${kmToY(120.0)} 
                    ${minToX(270)},${kmToY(120.0)} 
                    ${minToX(288)},${kmToY(128.5)} 
                    ${minToX(315)},${kmToY(158.0)}
                  `
                  : `
                    ${minToX(225)},${kmToY(100.0)} 
                    ${minToX(235)},${kmToY(108.4)} 
                    ${minToX(245)},${kmToY(120.0)} 
                    ${minToX(258)},${kmToY(128.5)} 
                    ${minToX(290)},${kmToY(158.0)}
                  `
              }
              fill="none"
              stroke={isPlanB ? '#B91C1C' : '#1D4ED8'}
              strokeWidth={hoveredTrain === '12301' ? '4.5' : '3.5'}
              strokeLinecap="round"
              filter={isPlanB ? 'url(#hazardGlow)' : undefined}
            />

            {/* Entry Point Marker at KM 120 (04:05) */}
            <circle 
              cx={minToX(245)} 
              cy={kmToY(120.0)} 
              r={isPlanB ? '6' : '4.5'} 
              fill={isPlanB ? '#B91C1C' : '#1D4ED8'} 
              stroke="#FFFFFF" 
              strokeWidth="1.5" 
            />

            {/* Visual Proof Badge: PLAN A (Safe Miss) vs PLAN B (Direct Conflict) */}
            {!isPlanB ? (
              // Plan A: Safe Miss after 04:00
              <g transform={`translate(${minToX(245) + 8}, ${kmToY(120.0) - 20})`}>
                <rect x="0" y="0" width="190" height="22" rx="4" fill="#065F46" opacity="0.95" />
                <text x="6" y="15" fill="#ECFDF5" fontSize="9.5" fontWeight="black">
                  ✓ 12301 Rajdhani: ON-TIME (Entry 04:05)
                </text>
              </g>
            ) : (
              // Plan B: Direct collision with extended block (04:05 is inside 02:00-04:45)
              <g transform={`translate(${minToX(245) + 8}, ${kmToY(120.0) - 24})`}>
                <rect x="0" y="0" width="220" height="24" rx="4" fill="#7F1D1D" stroke="#EF4444" strokeWidth="1" />
                <text x="6" y="16" fill="#FEE2E2" fontSize="9.5" fontWeight="black">
                  ⚠️ CONFLICT: Intersects Block (+25m)
                </text>
                {/* Animated pulsing ripple circle */}
                <circle cx="-8" cy="12" r="10" fill="none" stroke="#EF4444" strokeWidth="1.5" opacity="0.8">
                  <animate attributeName="r" values="6;16;6" dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0.1;0.9" dur="1.4s" repeatCount="indefinite" />
                </circle>
              </g>
            )}
          </g>

          {/* 6. ALIGARH MEMU 64102 (04:50 - 05:35, ON-TIME in both) */}
          <g 
            onMouseEnter={() => setHoveredTrain('64102')} 
            onMouseLeave={() => setHoveredTrain(null)}
            className="cursor-pointer"
          >
            <polyline 
              points={`
                ${minToX(290)},${kmToY(100.0)} 
                ${minToX(302)},${kmToY(108.4)} 
                ${minToX(314)},${kmToY(119.2)} 
                ${minToX(324)},${kmToY(128.5)} 
                ${minToX(335)},${kmToY(158.0)}
              `}
              fill="none"
              stroke="#7E22CE"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <text 
              x={minToX(292)} 
              y={kmToY(100.0) - 6} 
              fontSize="8.5" 
              fontFamily="ui-monospace, monospace" 
              fontWeight="bold" 
              fill="#6B21A8"
            >
              64102 Aligarh MEMU (ON-TIME)
            </text>
          </g>
        </svg>
      </div>

      {/* Proof Explanatory Callout Banner */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <Compass className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            {isPlanB ? (
              <span className="text-rose-800 font-bold">
                Plan B Extended Block (02:00–04:45) visually intersects 12301 Rajdhani (04:05 entry), triggering holding penalty.
              </span>
            ) : (
              <span className="text-emerald-800 font-bold">
                Plan A Window closes at 04:00. 12301 Rajdhani enters safely at 04:05 on clear track with zero delay.
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSelectPlan('PLAN_A')}
            className={`px-2.5 py-1 rounded text-xs font-black transition-all cursor-pointer ${
              !isPlanB ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-300'
            }`}
          >
            Plan A (Optimal)
          </button>
          <button
            onClick={() => handleSelectPlan('PLAN_B')}
            className={`px-2.5 py-1 rounded text-xs font-black transition-all cursor-pointer ${
              isPlanB ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-300'
            }`}
          >
            Plan B (Robust)
          </button>
        </div>
      </div>
    </div>
  );
};
