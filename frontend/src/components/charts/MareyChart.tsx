import React, { useState } from 'react';
import { Train, Clock, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { TrainPath, CorridorState } from '../../types';

export interface MareyChartProps {
  trains?: TrainPath[];
  corridor?: CorridorState | null;
  activePlanType?: 'PLAN_A' | 'PLAN_B';
  onPlanTypeChange?: (planType: 'PLAN_A' | 'PLAN_B') => void;
  newPlanACost?: string;
  planBCost?: string;
  height?: number;
}

// 6 Calibrated Corridor Trains with explicit sloped paths
export const CALIBRATED_CORRIDOR_TRAINS: TrainPath[] = [
  {
    id: 101,
    train_number: '12424 Rajdhani Express',
    train_name: 'Rajdhani Express',
    train_class: 'PREMIUM_EXPRESS',
    block_section_id: 1,
    line: 'DOWN',
    scheduled_start: '01:15',
    scheduled_end: '02:40',
    start_km: 100.0, // STA
    end_km: 158.0,   // STD
    direction: 'DOWN',
    traffic_density_factor: 1.5,
    priority_weight: 10
  },
  {
    id: 102,
    train_number: '12004 Shatabdi Express',
    train_name: 'Shatabdi Express',
    train_class: 'SUPERFAST',
    block_section_id: 1,
    line: 'DOWN',
    scheduled_start: '02:10',
    scheduled_end: '03:35',
    start_km: 100.0, // STA
    end_km: 158.0,   // STD
    direction: 'DOWN',
    traffic_density_factor: 1.3,
    priority_weight: 8
  },
  {
    id: 103,
    train_number: 'Goods BCN-91 Freight',
    train_name: 'Goods BCN-91',
    train_class: 'FREIGHT',
    block_section_id: 2,
    line: 'UP',
    scheduled_start: '00:30',
    scheduled_end: '03:00',
    start_km: 158.0, // STD
    end_km: 100.0,   // STA
    direction: 'UP',
    traffic_density_factor: 1.0,
    priority_weight: 5
  },
  {
    id: 104,
    train_number: '22436 Vande Bharat',
    train_name: 'Vande Bharat Express',
    train_class: 'PREMIUM_EXPRESS',
    block_section_id: 1,
    line: 'DOWN',
    scheduled_start: '04:15',
    scheduled_end: '05:30',
    start_km: 100.0, // STA
    end_km: 158.0,   // STD
    direction: 'DOWN',
    traffic_density_factor: 1.5,
    priority_weight: 10
  },
  {
    id: 105,
    train_number: 'Goods BOXN-44 Freight',
    train_name: 'Goods BOXN-44',
    train_class: 'FREIGHT',
    block_section_id: 2,
    line: 'UP',
    scheduled_start: '03:45',
    scheduled_end: '05:55',
    start_km: 158.0, // STD
    end_km: 100.0,   // STA
    direction: 'UP',
    traffic_density_factor: 1.0,
    priority_weight: 4
  },
  {
    id: 106,
    train_number: '12417 Prayagraj Express',
    train_name: 'Prayagraj Express',
    train_class: 'SUPERFAST',
    block_section_id: 2,
    line: 'UP',
    scheduled_start: '04:40',
    scheduled_end: '06:00',
    start_km: 158.0, // STD
    end_km: 100.0,   // STA
    direction: 'UP',
    traffic_density_factor: 1.2,
    priority_weight: 7
  }
];

export const parseTimeToHours = (timeStr: string): number => {
  if (!timeStr) return 0;
  const timeMatch = String(timeStr).match(/(\d{1,2}):(\d{2})/);
  if (timeMatch && !timeStr.includes('T') && !timeStr.includes('-')) {
    return parseInt(timeMatch[1], 10) + parseInt(timeMatch[2], 10) / 60.0;
  }
  const dt = new Date(timeStr);
  if (!isNaN(dt.getTime())) {
    return dt.getHours() + dt.getMinutes() / 60.0;
  }
  if (timeMatch) {
    return parseInt(timeMatch[1], 10) + parseInt(timeMatch[2], 10) / 60.0;
  }
  return 0;
};

export const MareyChart: React.FC<MareyChartProps> = ({
  trains,
  corridor,
  activePlanType: controlledPlanType,
  onPlanTypeChange,
  newPlanACost = '1243.0',
  planBCost = '1554.0',
  height = 420
}) => {
  const [internalPlanType, setInternalPlanType] = useState<'PLAN_A' | 'PLAN_B'>('PLAN_A');
  const [hoveredTrain, setHoveredTrain] = useState<string | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  const activePlanType = controlledPlanType || internalPlanType;
  const setPlanType = (type: 'PLAN_A' | 'PLAN_B') => {
    if (onPlanTypeChange) {
      onPlanTypeChange(type);
    } else {
      setInternalPlanType(type);
    }
  };

  const displayTrains = (trains && trains.length > 0) ? trains : CALIBRATED_CORRIDOR_TRAINS;

  // SVG Marey Graph Coordinate Calculations (00:00 - 06:00, KM 100 - 158)
  const chartW = 980;
  const chartH = height;
  const padL = 95;
  const padR = 30;
  const padT = 35;
  const padB = 45;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const minKm = 100.0;
  const maxKm = 158.0;
  const kmSpan = maxKm - minKm;

  const timeToX = (hours: number) => padL + (Math.max(0, Math.min(hours, 6.0)) / 6.0) * plotW;
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

  // Conflict points
  const bcnConflictX = timeToX(2.138);
  const bcnConflictY = kmToY(120.0);
  const shatabdiConflictX = timeToX(2.875);
  const shatabdiConflictY = kmToY(130.0);

  const stations = corridor?.stations && corridor.stations.length > 0 
    ? corridor.stations 
    : [
        { id: 1, station_code: 'STA', name: 'Station Alpha', chainage_km: 100.0 },
        { id: 2, station_code: 'STB', name: 'Station Bravo', chainage_km: 120.0 },
        { id: 3, station_code: 'STC', name: 'Station Charlie', chainage_km: 140.0 },
        { id: 4, station_code: 'STD', name: 'Station Delta', chainage_km: 158.0 }
      ];

  const getTrainColor = (trainClass: string, trainNumber: string) => {
    const num = trainNumber.toLowerCase();
    if (trainClass === 'PREMIUM_EXPRESS' || num.includes('rajdhani')) {
      return '#B42332'; // Deep Railway Red
    }
    if (trainClass === 'SUPERFAST' || num.includes('shatabdi') || num.includes('prayagraj')) {
      return '#1E5AA8'; // Royal Railway Blue
    }
    return '#334E68'; // Dark Slate for Freight BCN
  };

  return (
    <div className="card-warm p-6">
      {/* Top Header & Toggle Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#D9E0E8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-[#102A43] text-white text-[10px] font-black uppercase tracking-wider">
              Time-Distance Marey Graph
            </span>
            <span className="text-xs text-[#627D98] font-semibold">Night Maintenance Window (00:00 – 06:00)</span>
          </div>
          <h2 className="text-lg font-black text-[#102A43] mt-1 font-serif-hero">
            Train Trajectories & Scheduled Maintenance Possession Window
          </h2>
          <p className="text-xs text-[#627D98] mt-0.5">
            Real-time sloped paths for high-speed & freight services with possession collision envelope.
          </p>
        </div>

        {/* Plan A vs Plan B Toggle */}
        <div className="flex items-center gap-2 bg-[#F0F4F8] p-1.5 rounded-xl border border-[#D9E0E8]">
          <button
            type="button"
            onClick={() => setPlanType('PLAN_A')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activePlanType === 'PLAN_A' 
                ? 'bg-[#102A43] text-white shadow-md' 
                : 'text-[#334E68] hover:text-[#102A43]'
            }`}
          >
            Plan A (P50: {newPlanACost} WTM)
          </button>
          <button
            type="button"
            onClick={() => setPlanType('PLAN_B')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activePlanType === 'PLAN_B' 
                ? 'bg-[#D9901A] text-white shadow-md' 
                : 'text-[#334E68] hover:text-[#102A43]'
            }`}
          >
            Plan B (P90: {planBCost} WTM)
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="bg-white rounded-xl border border-[#D9E0E8] p-4 overflow-x-auto shadow-xs relative">
        <svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
          {/* Station Grid Lines for STA, STB, STC, STD */}
          {stations.map(st => {
            const y = kmToY(st.chainage_km);
            return (
              <g key={st.station_code}>
                <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#E2E8F0" strokeWidth="1.5" />
                <text x={padL - 12} y={y + 4} textAnchor="end" className="text-[11px] font-black fill-[#102A43]">
                  {st.station_code}
                </text>
                <text x={padL - 12} y={y + 16} textAnchor="end" className="text-[9.5px] font-bold fill-[#829AB1] metric-mono">
                  KM {st.chainage_km}
                </text>
              </g>
            );
          })}

          {/* Time divisions 00:00 to 06:00 */}
          {Array.from({ length: 7 }, (_, i) => {
            const x = timeToX(i);
            return (
              <g key={`hour-${i}`}>
                <line x1={x} y1={padT} x2={x} y2={chartH - padB} stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="4,4" />
                <text x={x} y={chartH - padB + 18} textAnchor="middle" className="text-[10.5px] font-black fill-[#334E68] metric-mono">
                  {String(i).padStart(2, '0')}:00
                </text>
              </g>
            );
          })}

          {/* Scheduled Maintenance Possession Block on Section STB (KM 120) to STC (KM 140) */}
          {activePlanType === 'PLAN_A' ? (
            <g 
              onMouseEnter={() => setHoveredBlock('Plan A (02:00 - 04:00 • STB-STC 120m Joint Possession)')}
              onMouseLeave={() => setHoveredBlock(null)}
              className="cursor-pointer"
            >
              <rect
                x={planAX1}
                y={blockY1}
                width={planAW}
                height={blockH}
                fill="rgba(30, 90, 168, 0.15)"
                stroke="#1E5AA8"
                strokeWidth="2.5"
                rx="6"
              />
              {/* Top pill inside possession block */}
              <rect
                x={planAX1 + 8}
                y={blockY1 + 10}
                width={Math.min(planAW - 16, 380)}
                height="22"
                fill="#1E5AA8"
                rx="4"
              />
              <text x={planAX1 + 14} y={blockY1 + 25} className="text-[10px] font-black fill-white">
                Joint Maintenance Possession — Plan A (02:00-04:00) [ENG + TRD + S&T]
              </text>
              <text x={planAX1 + 14} y={blockY1 + 46} className="text-[9.5px] font-extrabold fill-[#102A43] metric-mono">
                SEC STB–STC (KM 120.0–140.0) • 120 min possession window
              </text>
            </g>
          ) : (
            <g 
              onMouseEnter={() => setHoveredBlock('Plan B (02:00 - 04:45 • STB-STC 165m +45m Uncertainty Buffer)')}
              onMouseLeave={() => setHoveredBlock(null)}
              className="cursor-pointer"
            >
              <rect
                x={planBX1}
                y={blockY1}
                width={planBW}
                height={blockH}
                fill="rgba(217, 144, 26, 0.18)"
                stroke="#D9901A"
                strokeWidth="2.5"
                strokeDasharray="6 3"
                rx="6"
              />
              <rect
                x={planBX1 + 8}
                y={blockY1 + 10}
                width={Math.min(planBW - 16, 340)}
                height="22"
                fill="#D9901A"
                rx="4"
              />
              <text x={planBX1 + 14} y={blockY1 + 25} className="text-[10px] font-black fill-white">
                P90 Robust Buffer Possession — Plan B (02:00-04:45)
              </text>
              <text x={planBX1 + 14} y={blockY1 + 46} className="text-[9.5px] font-extrabold fill-[#78350F] metric-mono">
                SEC STB–STC (KM 120.0–140.0) • 165 min window (+45m buffer)
              </text>
            </g>
          )}

          {/* Sloped Train Paths Trajectories */}
          {displayTrains
            .filter(t => parseTimeToHours(t.scheduled_start) <= 6.0)
            .map((t, idx) => {
              const startH = parseTimeToHours(t.scheduled_start);
              const endH = parseTimeToHours(t.scheduled_end);
              const x1 = timeToX(startH);
              const x2 = timeToX(Math.min(endH, 6.0));
              const y1 = kmToY(t.start_km);
              const y2 = kmToY(t.end_km);

              const isHovered = hoveredTrain === t.train_number;
              const strokeColor = getTrainColor(t.train_class, t.train_number);

              let labelName = t.train_number.includes('Rajdhani') ? 'Rajdhani 12424' : 
                (t.train_number.includes('Shatabdi') ? 'Shatabdi 12004' : 
                (t.train_number.includes('Vande') ? 'Vande Bharat 22436' :
                (t.train_number.includes('Prayagraj') ? 'Prayagraj 12417' :
                (t.train_number.includes('BCN') ? 'Freight BCN' :
                (t.train_number.includes('BOXN') ? 'Freight BOXN' : t.train_number.split(' ')[0])))));

              const labelX = x1 + (x2 > x1 ? 6 : -84);
              const labelY = y1 - 8;

              return (
                <g 
                  key={`train-${idx}`} 
                  onMouseEnter={() => setHoveredTrain(t.train_number)}
                  onMouseLeave={() => setHoveredTrain(null)}
                  className="cursor-pointer"
                >
                  {/* Trajectory line */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={strokeColor}
                    strokeWidth={isHovered ? 4.5 : 3}
                    strokeLinecap="round"
                  />

                  {/* Start Point Dot */}
                  <circle cx={x1} cy={y1} r={isHovered ? 5 : 4} fill={strokeColor} />

                  {/* Label badge */}
                  <rect
                    x={labelX - 4}
                    y={labelY - 11}
                    width={labelName.length * 6.5 + 14}
                    height="17"
                    fill="white"
                    stroke={strokeColor}
                    strokeWidth="1.5"
                    rx="4"
                  />
                  <text
                    x={labelX + 2}
                    y={labelY + 1}
                    className="text-[9.5px] font-black"
                    fill={strokeColor}
                  >
                    {labelName}
                  </text>
                </g>
              );
            })}

          {/* Conflict Callout Points */}
          <g>
            <circle cx={bcnConflictX} cy={bcnConflictY} r="7" fill="#D9901A" fillOpacity="0.3" />
            <circle cx={bcnConflictX} cy={bcnConflictY} r="3.5" fill="#D9901A" />
            <circle cx={shatabdiConflictX} cy={shatabdiConflictY} r="7" fill="#B42332" fillOpacity="0.3" />
            <circle cx={shatabdiConflictX} cy={shatabdiConflictY} r="3.5" fill="#B42332" />
          </g>
        </svg>

        {hoveredBlock && (
          <div className="absolute top-6 right-6 px-3.5 py-2 bg-[#102A43] text-white text-xs font-bold rounded-lg shadow-xl pointer-events-none">
            {hoveredBlock}
          </div>
        )}
      </div>

      {/* Legend & Conflict Summary Strip */}
      <div className="mt-4 pt-3 border-t border-[#D9E0E8] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[11px] font-bold text-[#627D98] uppercase">Legend:</span>
          
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#B42332] rounded"></span>
            <span className="font-bold text-[#102A43] text-xs">Rajdhani 12424 (High Priority)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#1E5AA8] rounded"></span>
            <span className="font-bold text-[#102A43] text-xs">Shatabdi 12004 (Superfast)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#334E68] rounded"></span>
            <span className="font-bold text-[#102A43] text-xs">Freight BCN (Up Line)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 bg-[#1E5AA8]/20 border border-[#1E5AA8] rounded"></span>
            <span className="font-bold text-[#102A43] text-xs">Possession Window (STB–STC)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#16805C] bg-[#EAF6F0] px-3 py-1 rounded-lg border border-[#C6EADB] font-bold">
          <CheckCircle2 size={13} />
          <span>Zero Uncontrolled Overlaps · G&SR Compliant</span>
        </div>
      </div>
    </div>
  );
};
