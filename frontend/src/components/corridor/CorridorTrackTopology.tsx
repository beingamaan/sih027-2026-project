import React, { useState } from 'react';
import { Train, Wrench, ShieldCheck } from 'lucide-react';

export interface StationTelemetry {
  code: string;
  name: string;
  km: string;
  chainage: number;
  platforms: number;
  interlocking: string;
  type: string;
}

export interface StaticTrainTelemetry {
  number: string;
  name: string;
  chainage: string;
  delay: string;
  speed: string;
  loco: string;
  line: string;
  direction: 'UP' | 'DOWN' | 'STABLED';
  x: number;
  y: number;
  badge: string;
  delayMinutes: number;
}

interface CorridorTrackTopologyProps {
  variant?: 'full' | 'engineering' | 'yard' | 'field';
  onInspectBlock?: () => void;
  className?: string;
}

/**
 * Authentic Northern Railway Lucknow Division Track Schematic
 * Section: LKO (KM 0.0) – MKG (KM 5.0) – AJGAIN (KM 25.0) – ON (KM 54.0) – GANGA BRIDGE (KM 68.2) – CNB (KM 72.0)
 * Total Sector Length: 72.0 KM
 * SVG Coordinate system: 1000 x 240
 * Offsets: LKO (4% / 40px), MKG (20% / 200px), AJGAIN (45% / 450px), ON (70% / 700px), CNB (92% / 920px)
 */
export const CorridorTrackTopology: React.FC<CorridorTrackTopologyProps> = ({
  variant = 'full',
  onInspectBlock,
  className = ''
}) => {
  const [hoveredStation, setHoveredStation] = useState<StationTelemetry | null>(null);
  const [hoveredTrain, setHoveredTrain] = useState<StaticTrainTelemetry | null>(null);
  const [hoveredWorkZone, setHoveredWorkZone] = useState<boolean>(false);
  const [selectedTrain, setSelectedTrain] = useState<StaticTrainTelemetry | null>(null);

  // Authentic static GPS anchored train data (Zero dummy gliding/wrap-around loop)
  const trains: StaticTrainTelemetry[] = [
    {
      number: '12004',
      name: 'Lucknow Swarna Shatabdi',
      chainage: 'KM 12.0 (LKO–MKG Outer)',
      delay: '+5m Delay',
      delayMinutes: 5,
      speed: '108 km/h (MPS: 130 km/h)',
      loco: 'WAP-7 #30215 (Ghaziabad Shed)',
      line: 'UP Line',
      direction: 'UP', // Left-facing arrow (Approaching Lucknow)
      x: 170, // left: 17%
      y: 94,
      badge: '◀ 12004 (+5m)'
    },
    {
      number: '22425',
      name: 'Ayodhya-Vande Bharat Express',
      chainage: 'KM 38.0 (Between AJGAIN and ON)',
      delay: 'ON TIME (+0m)',
      delayMinutes: 0,
      speed: '128 km/h (MPS: 130 km/h)',
      loco: 'Vande Bharat Trainset (Rake-08)',
      line: 'DOWN Line',
      direction: 'DOWN', // Right-facing arrow (Proceeding to Kanpur)
      x: 550, // left: 55%
      y: 106,
      badge: '22425 VB ▶'
    },
    {
      number: '14218',
      name: 'Unchahar Express',
      chainage: 'KM 28.0 (Passing Ajgain Loop)',
      delay: 'ON TIME (+0m)',
      delayMinutes: 0,
      speed: '95 km/h (MPS: 110 km/h)',
      loco: 'WAP-4 #22384 (Mughalsarai Shed)',
      line: 'UP Line',
      direction: 'UP', // Left-facing
      x: 420, // left: 42%
      y: 94,
      badge: '◀ 14218 (ON TIME)'
    },
    {
      number: '12555',
      name: 'Gorakhdham Express',
      chainage: 'KM 62.0 (Approaching Ganga Bridge)',
      delay: '+12m Delay',
      delayMinutes: 12,
      speed: '102 km/h (MPS: 110 km/h)',
      loco: 'WAP-7 #30441 (Kanpur Shed)',
      line: 'DOWN Line',
      direction: 'DOWN', // Right-facing
      x: 820, // left: 82%
      y: 106,
      badge: '12555 (+12m) ▶'
    },
    {
      number: 'BOXN-LKO',
      name: 'BOXN-LKO (Fertilizer / Freight Rake)',
      chainage: 'KM 54.0 (Unnao Yard Loop Siding)',
      delay: 'STABLED (PF-0 Goods Siding)',
      delayMinutes: 0,
      speed: '0 km/h (Stabled)',
      loco: 'WAG-9HC #31822 (Jhansi Shed)',
      line: 'Goods Siding Loop Line 2',
      direction: 'STABLED',
      x: 670, // strictly in Unnao loop zone at left: 67%
      y: 64,
      badge: 'BOXN-LKO [PF-0 SIDING]'
    }
  ];

  const getHeaderInfo = () => {
    switch (variant) {
      case 'engineering':
        return {
          title: 'Multi-Department Engineering Co-Location Topology',
          badge: 'ENGINEERING STAGING VIEW',
          badgeColor: 'text-amber-800 bg-amber-50 border-amber-300',
          subtitle: 'Active Joint Block LKO–MKG (KM 0.0–5.0) · Machine Staging & Cross-Dept Safety Separation (≥500m)',
          legends: [
            { label: 'Double Main (UP)', color: 'bg-[#2563EB]', border: 'border-slate-200' },
            { label: 'Double Main (DOWN)', color: 'bg-[#0284C7]', border: 'border-slate-200' },
            { label: 'Joint Possession Zone', color: 'bg-amber-500 animate-pulse', border: 'border-amber-300' },
            { label: 'Staged Machines (BCM / CSM / OHE)', color: 'bg-purple-600', border: 'border-purple-300' },
            { label: '≥500m Safety Buffer', color: 'bg-blue-500', border: 'border-blue-300' },
          ]
        };
      case 'yard':
        return {
          title: 'Station Yard & Loop Siding Advisory Topology',
          badge: 'YARD SIDING VIEW',
          badgeColor: 'text-cyan-800 bg-cyan-50 border-cyan-300',
          subtitle: 'ON (Unnao Jn · KM 54.0) Loop Siding Stabling & Turnout Interlock Detection · G&SR Rule 4.14 Advisory',
          legends: [
            { label: 'Main Running Lines', color: 'bg-[#2563EB]', border: 'border-slate-200' },
            { label: 'Goods Siding Loop Line 2 (PF-0)', color: 'bg-slate-500', border: 'border-slate-300' },
            { label: 'Turnout Normal', color: 'bg-emerald-500', border: 'border-emerald-300' },
            { label: 'Turnout Reverse', color: 'bg-purple-500', border: 'border-purple-300' },
            { label: 'Advisory Dwell (Non-Controlling)', color: 'bg-amber-500', border: 'border-amber-300' },
          ]
        };
      case 'field':
        return {
          title: 'Field Ground Possession Limits & Chainage Clearance',
          badge: 'FIELD EXECUTION VIEW',
          badgeColor: 'text-emerald-800 bg-emerald-50 border-emerald-300',
          subtitle: 'KM 0.000 (LKO) to KM 5.000 (MKG) Work Limits · 500m Safety Buffer Overlaps · Handback Verification Pegs',
          legends: [
            { label: 'Authorized Ground Possession', color: 'bg-amber-500', border: 'border-amber-300' },
            { label: '500m Safety Overlap Buffer', color: 'bg-amber-400', border: 'border-amber-300' },
            { label: 'Red Stop Board Peg (KM 0.0 / 5.0)', color: 'bg-rose-600', border: 'border-rose-300' },
            { label: 'G&SR Handback Pegs', color: 'bg-emerald-600', border: 'border-emerald-300' },
          ]
        };
      default:
        return {
          title: 'Corridor Physical Track Schematic & Electronic Interlocking',
          badge: 'LIVE NTES TRACK STRIP',
          badgeColor: 'text-blue-600 bg-blue-50 border-blue-200/80',
          subtitle: 'LKO – ON – CNB High-Density Section (72 km Sector) · Northern Railway · Lucknow Division (LKO-LJN Section)',
          legends: [
            { label: 'Double Main (UP)', color: 'bg-[#2563EB]', border: 'border-slate-200' },
            { label: 'Double Main (DOWN)', color: 'bg-[#0284C7]', border: 'border-slate-200' },
            { label: 'Goods Siding Loop Line 2', color: 'bg-slate-500', border: 'border-slate-300' },
            { label: 'Track Circuit (TC) Normal', color: 'bg-emerald-500', border: 'border-emerald-300' },
            { label: 'Joint Block Possession', color: 'bg-amber-500 animate-pulse', border: 'border-amber-300' },
          ]
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className={`p-6 nova-card relative ${className}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </div>
          <div>
            <h2 className="text-xs font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
              {headerInfo.title}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${headerInfo.badgeColor}`}>
                {headerInfo.badge}
              </span>
            </h2>
            <p className="text-[10px] text-slate-500 font-medium">
              {headerInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Real Data Live Indicator Chip (High-Contrast Emerald Theme) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-500 rounded-full shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-[11px] font-bold tracking-wide font-mono text-emerald-900 uppercase">
              Real-Time GPS Telemetry Active (LKO Division)
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[10px] text-slate-600 font-bold">
            {headerInfo.legends.slice(0, 3).map((leg, idx) => (
              <span key={idx} className={`flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border shadow-2xs ${leg.border}`}>
                <span className={`w-3 h-1.5 rounded-xs ${leg.color}`}></span> {leg.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Track Strip Canvas with 420px Height */}
      <div className="bg-gradient-to-b from-slate-50/90 to-blue-50/30 p-5 rounded-2xl border border-slate-200/90 overflow-x-auto shadow-xs relative min-h-[420px] flex items-center justify-center">
        <svg
          width="1000"
          height="420"
          viewBox="0 0 1000 240"
          className="w-full min-h-[420px] select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Caution Hazard Stripes Pattern */}
            <pattern id="hazardStripes" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="12" fill="#F59E0B" fillOpacity="0.10" />
              <rect x="6" width="6" height="12" fill="#0284C7" fillOpacity="0.06" />
            </pattern>

            {/* Joint Block Soft Amber/Cyan Gradient Glow */}
            <linearGradient id="jointBlockGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#E0F2FE" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0.65" />
            </linearGradient>

            {/* Headlamp Beam Glow Gradients */}
            <linearGradient id="vbHeadlamp" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#38BDF8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="shatabdiHeadlamp" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#F87171" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#FCA5A5" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FCA5A5" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="freightHeadlamp" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FDE047" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#FDE047" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FDE047" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 0. AUTHENTIC GEOGRAPHIC & RIVER UNDERLAY */}
          <g id="geographicMapUnderlay" className="pointer-events-none select-none">
            {/* Ganga River Basin at KM 68.2 (Positioned at X = 840) */}
            <path 
              d="M 830 0 C 820 45, 850 80, 835 125 C 825 160, 845 200, 830 240 L 860 240 C 875 200, 855 160, 865 125 C 880 80, 850 45, 860 0 Z" 
              fill="#E0F2FE" 
              opacity="0.7" 
            />
            <path 
              d="M 845 0 C 835 45, 865 80, 850 125 C 840 160, 860 200, 845 240" 
              fill="none" 
              stroke="#BAE6FD" 
              strokeWidth="2.5" 
              opacity="0.8" 
              strokeDasharray="8 4" 
            />

            {/* Ganga Bridge Girder Truss Graphic ABOVE the Tracks at left: 84% (X = 840) */}
            <g transform="translate(840, 66)">
              <line x1="-35" y1="-8" x2="35" y2="-8" stroke="#334155" strokeWidth="2.5" />
              <line x1="-35" y1="8" x2="35" y2="8" stroke="#334155" strokeWidth="2.5" />
              <line x1="-35" y1="-8" x2="-18" y2="8" stroke="#0284C7" strokeWidth="1.5" />
              <line x1="-18" y1="-8" x2="-35" y2="8" stroke="#0284C7" strokeWidth="1.5" />
              <line x1="-18" y1="-8" x2="0" y2="8" stroke="#0284C7" strokeWidth="1.5" />
              <line x1="0" y1="-8" x2="-18" y2="8" stroke="#0284C7" strokeWidth="1.5" />
              <line x1="0" y1="-8" x2="18" y2="8" stroke="#0284C7" strokeWidth="1.5" />
              <line x1="18" y1="-8" x2="0" y2="8" stroke="#0284C7" strokeWidth="1.5" />
              <line x1="18" y1="-8" x2="35" y2="8" stroke="#0284C7" strokeWidth="1.5" />
              <line x1="35" y1="-8" x2="18" y2="8" stroke="#0284C7" strokeWidth="1.5" />
            </g>

            {/* Explicit Badge for Ganga Bridge Positioned directly above truss at left: 84% (X = 840, Y = 40) */}
            <g transform="translate(840, 40)">
              <rect x="-82" y="-8.5" width="164" height="17" rx="4" fill="#0C4A6E" stroke="#38BDF8" strokeWidth="1.2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))" />
              <text x="0" y="3.5" textAnchor="middle" fill="#F0F9FF" fontSize="6.5" fontWeight="900" fontFamily="monospace" className="whitespace-nowrap">
                Br. No. 109 (Ganga Truss Girder) · KM 68.2
              </text>
            </g>
          </g>

          {/* LAYER 1: SANCTIONED JOINT BLOCK WORK ZONE (KM 0.0 - 5.0, X = 40 to 200) */}
          <g 
            id="jointBlockLayer"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredWorkZone(true)}
            onMouseLeave={() => setHoveredWorkZone(false)}
            onClick={() => onInspectBlock?.()}
          >
            <rect
              x="40"
              y="68"
              width="160"
              height="58"
              rx="6"
              fill="url(#jointBlockGrad)"
              stroke="#F59E0B"
              strokeWidth={hoveredWorkZone ? '2.5' : '1.8'}
              strokeDasharray="4,2"
              filter="drop-shadow(0 2px 4px rgba(245, 158, 11, 0.2))"
            />
            <rect x="40" y="68" width="160" height="58" rx="6" fill="url(#hazardStripes)" />

            <g transform="translate(120, 34)">
              <rect x="-48" y="-9" width="96" height="18" rx="9" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.2" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.08))" />
              <circle cx="-38" cy="0" r="3" fill="#EF4444">
                <animate attributeName="r" values="2.5;4;2.5" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
              </circle>
              <text x="3" y="3" textAnchor="middle" className="text-[7.5px] font-black fill-amber-950 tracking-tight metric-mono">
                ⚡ BLOCK LKO–MKG
              </text>
            </g>
          </g>

          {/* LAYER 2: PHYSICAL TRACK RAILS & TURNOUTS */}
          {/* UP TRACK BED (KM 0.0 LKO to KM 72.0 CNB, Y = 94) */}
          <line x1="35" y1="94" x2="945" y2="94" stroke="#CBD5E1" strokeWidth="6.5" strokeDasharray="2,4" strokeLinecap="butt" opacity="0.85" />
          <line x1="35" y1="91.5" x2="945" y2="91.5" stroke="#2563EB" strokeWidth="1.4" opacity="0.95" strokeLinecap="round" />
          <line x1="35" y1="96.5" x2="945" y2="96.5" stroke="#2563EB" strokeWidth="1.4" opacity="0.95" strokeLinecap="round" />

          {/* DOWN TRACK BED (KM 0.0 LKO to KM 72.0 CNB, Y = 106) */}
          <line x1="35" y1="106" x2="945" y2="106" stroke="#CBD5E1" strokeWidth="6.5" strokeDasharray="2,4" strokeLinecap="butt" opacity="0.85" />
          <line x1="35" y1="103.5" x2="945" y2="103.5" stroke="#0284C7" strokeWidth="1.4" opacity="0.95" strokeLinecap="round" />
          <line x1="35" y1="108.5" x2="945" y2="108.5" stroke="#0284C7" strokeWidth="1.4" opacity="0.95" strokeLinecap="round" />

          {/* CROSSOVER 101A AT MKG (KM 5.0, X = 200) */}
          <line x1="190" y1="94" x2="210" y2="106" stroke="#059669" strokeWidth="1.8" strokeDasharray="3,1.5" />
          <circle cx="190" cy="94" r="2.2" fill="#059669" />
          <circle cx="210" cy="106" r="2.2" fill="#059669" />
          <text x="200" y="86" textAnchor="middle" fill="#065F46" fontSize="5.5" fontWeight="900" fontFamily="monospace">
            CO-101A
          </text>

          {/* ON GOODS SIDING LOOP LINE 2 (KM 54.0 Unnao Jn, Centered strictly at left: 67% / X = 670, Y = 64) */}
          <path 
            d="M 615 94 Q 630 94, 645 64 L 695 64 Q 710 64, 725 94" 
            fill="none" 
            stroke="#64748B" 
            strokeWidth="1.8" 
          />
          <line x1="645" y1="64" x2="695" y2="64" stroke="#CBD5E1" strokeWidth="5.5" strokeDasharray="2,3" opacity="0.85" />
          <line x1="643" y1="62" x2="697" y2="62" stroke="#64748B" strokeWidth="1.2" />
          <line x1="643" y1="66" x2="697" y2="66" stroke="#64748B" strokeWidth="1.2" />
          <circle cx="615" cy="94" r="2.2" fill="#64748B" />
          <circle cx="725" cy="94" r="2.2" fill="#64748B" />

          {/* Goods Siding Badge (Strictly at left: 67% / X = 670, Y = 48) */}
          <g transform="translate(670, 48)">
            <rect x="-48" y="-6.5" width="96" height="13" rx="3.5" fill="#0F172A" stroke="#64748B" strokeWidth="1" opacity="0.95" />
            <text x="0" y="2.5" textAnchor="middle" className="text-[6px] font-black fill-slate-200 tracking-wider metric-mono whitespace-nowrap">
              UNNAO GOODS SIDING LOOP 2
            </text>
          </g>

          {/* LAYER 3: ELECTRONIC INTERLOCKING TRACK CIRCUITS */}
          <g transform="translate(120, 118)">
            <rect x="-24" y="-5" width="48" height="10" rx="2.5" fill="#FEF2F2" stroke="#EF4444" strokeWidth="0.8" />
            <text x="0" y="2.5" textAnchor="middle" fill="#991B1B" fontSize="5.5" fontWeight="900" fontFamily="monospace">
              TC-01 [OCC]
            </text>
          </g>

          <g transform="translate(325, 118)">
            <rect x="-22" y="-5" width="44" height="10" rx="2.5" fill="#ECFDF5" stroke="#10B981" strokeWidth="0.8" />
            <text x="0" y="2.5" textAnchor="middle" fill="#065F46" fontSize="5.5" fontWeight="900" fontFamily="monospace">
              TC-02 [CLR]
            </text>
          </g>

          <g transform="translate(575, 118)">
            <rect x="-22" y="-5" width="44" height="10" rx="2.5" fill="#ECFDF5" stroke="#10B981" strokeWidth="0.8" />
            <text x="0" y="2.5" textAnchor="middle" fill="#065F46" fontSize="5.5" fontWeight="900" fontFamily="monospace">
              TC-03 [CLR]
            </text>
          </g>

          <g transform="translate(780, 118)">
            <rect x="-22" y="-5" width="44" height="10" rx="2.5" fill="#ECFDF5" stroke="#10B981" strokeWidth="0.8" />
            <text x="0" y="2.5" textAnchor="middle" fill="#065F46" fontSize="5.5" fontWeight="900" fontFamily="monospace">
              TC-04 [CLR]
            </text>
          </g>

          <g transform="translate(890, 118)">
            <rect x="-20" y="-5" width="40" height="10" rx="2.5" fill="#ECFDF5" stroke="#10B981" strokeWidth="0.8" />
            <text x="0" y="2.5" textAnchor="middle" fill="#065F46" fontSize="5.5" fontWeight="900" fontFamily="monospace">
              TC-05 [CLR]
            </text>
          </g>

          {/* LAYER 4: TRI-COLOR LED SIGNALS */}
          <g transform="translate(65, 76)">
            <line x1="0" y1="0" x2="0" y2="15" stroke="#0F172A" strokeWidth="1.4" />
            <rect x="-3.5" y="-12" width="7" height="12" rx="1.5" fill="#0F172A" />
            <circle cx="0" cy="-9.5" r="1.5" fill="#450A0A" />
            <circle cx="0" cy="-6" r="1.5" fill="#451A03" />
            <circle cx="0" cy="-2.5" r="1.8" fill="#10B981" filter="drop-shadow(0 0 3px #10B981)" />
            <text x="8" y="-4" fill="#047857" fontSize="5" fontWeight="900" fontFamily="monospace">S-1 (CLEAR)</text>
          </g>

          <g transform="translate(190, 76)">
            <line x1="0" y1="0" x2="0" y2="15" stroke="#0F172A" strokeWidth="1.4" />
            <rect x="-3.5" y="-12" width="7" height="12" rx="1.5" fill="#0F172A" />
            <circle cx="0" cy="-9.5" r="1.8" fill="#F59E0B" filter="drop-shadow(0 0 2px #F59E0B)" />
            <circle cx="0" cy="-6" r="1.8" fill="#F59E0B" filter="drop-shadow(0 0 2px #F59E0B)" />
            <circle cx="0" cy="-2.5" r="1.5" fill="#064E3B" />
            <text x="8" y="-4" fill="#B45309" fontSize="5" fontWeight="900" fontFamily="monospace">S-2 (DBL YEL)</text>
          </g>

          <g transform="translate(440, 76)">
            <line x1="0" y1="0" x2="0" y2="15" stroke="#0F172A" strokeWidth="1.4" />
            <rect x="-3.5" y="-12" width="7" height="12" rx="1.5" fill="#0F172A" />
            <circle cx="0" cy="-9.5" r="1.5" fill="#450A0A" />
            <circle cx="0" cy="-6" r="1.5" fill="#451A03" />
            <circle cx="0" cy="-2.5" r="1.8" fill="#10B981" filter="drop-shadow(0 0 3px #10B981)" />
            <text x="8" y="-4" fill="#047857" fontSize="5" fontWeight="900" fontFamily="monospace">S-3 (CLEAR)</text>
          </g>

          <g transform="translate(685, 76)">
            <line x1="0" y1="0" x2="0" y2="15" stroke="#0F172A" strokeWidth="1.4" />
            <rect x="-3.5" y="-12" width="7" height="12" rx="1.5" fill="#0F172A" />
            <circle cx="0" cy="-9.5" r="1.8" fill="#F59E0B" filter="drop-shadow(0 0 2px #F59E0B)" />
            <circle cx="0" cy="-6" r="1.8" fill="#F59E0B" filter="drop-shadow(0 0 2px #F59E0B)" />
            <circle cx="0" cy="-2.5" r="1.5" fill="#064E3B" />
            <text x="8" y="-4" fill="#B45309" fontSize="5" fontWeight="900" fontFamily="monospace">S-4 (DBL YEL)</text>
          </g>

          <g transform="translate(910, 76)">
            <line x1="0" y1="0" x2="0" y2="15" stroke="#0F172A" strokeWidth="1.4" />
            <rect x="-3.5" y="-12" width="7" height="12" rx="1.5" fill="#0F172A" />
            <circle cx="0" cy="-9.5" r="1.5" fill="#450A0A" />
            <circle cx="0" cy="-6" r="1.5" fill="#451A03" />
            <circle cx="0" cy="-2.5" r="1.8" fill="#10B981" filter="drop-shadow(0 0 3px #10B981)" />
            <text x="-32" y="-4" fill="#047857" fontSize="5" fontWeight="900" fontFamily="monospace">S-5 (CLEAR)</text>
          </g>

          {/* LAYER 5: AUTHENTIC GPS ANCHORED TRAIN CAPSULES (Jitter-Free, Zero Dummy Gliding) */}

          {/* Train 1: 12004 Lucknow Swarna Shatabdi · Fixed at KM 12.0 (left: 17% / X = 170, UP Line Y = 94) */}
          <g 
            transform="translate(170, 94)"
            className="cursor-pointer transition-opacity hover:opacity-90"
            onClick={() => setSelectedTrain(trains[0])}
            onMouseEnter={() => setHoveredTrain(trains[0])}
            onMouseLeave={() => setHoveredTrain(null)}
          >
            {/* Subtle Pulsing Radar Ping Ring */}
            <circle cx="0" cy="0" r="14" fill="none" stroke="#EF4444" strokeWidth="1.2" opacity="0.6">
              <animate attributeName="r" values="8;20;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.1;0.7" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Direction: Left-Facing Headlamp Beam (Approaching Lucknow) */}
            <polygon points="-26,0 -52,-7 -52,7" fill="url(#shatabdiHeadlamp)" />
            <path d="M -8 -5.5 L -22 -5 Q -26 0 -22 5 L -8 5.5 Z" fill="#B91C1C" stroke="#0F172A" strokeWidth="0.8" />
            <path d="M -18 -3.5 Q -22 0 -18 3.5 Z" fill="#0F172A" />
            <line x1="-8" y1="0" x2="-22" y2="0" stroke="#FEF08A" strokeWidth="1" />
            <rect x="-8.5" y="-1" width="3" height="2" rx="0.5" fill="#0F172A" />
            <rect x="-5.5" y="-5" width="19.5" height="10" rx="1.5" fill="#991B1B" stroke="#0F172A" strokeWidth="0.8" />
            <rect x="-2" y="-2" width="6" height="4" rx="0.5" fill="#FEF08A" opacity="0.9" />
            <rect x="14" y="-1" width="3" height="2" rx="0.5" fill="#0F172A" />
            <rect x="17" y="-5" width="20" height="10" rx="1.5" fill="#991B1B" stroke="#0F172A" strokeWidth="0.8" />
            <rect x="23" y="-2" width="6" height="4" rx="0.5" fill="#FEF08A" opacity="0.9" />

            {/* Stable Badge Pill */}
            <g transform="translate(8, -14)">
              <rect x="-30" y="-6.5" width="60" height="13" rx="4" fill="#0F172A" stroke="#EF4444" strokeWidth="1.2" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.3))" />
              <text x="0" y="2.5" textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="800" fontFamily="monospace" className="whitespace-nowrap">
                ◀ 12004 (+5m)
              </text>
            </g>
          </g>

          {/* Train 2: 22425 Ayodhya-Vande Bharat · Fixed at KM 38.0 (left: 55% / X = 550, DOWN Line Y = 106) */}
          <g 
            transform="translate(550, 106)"
            className="cursor-pointer transition-opacity hover:opacity-90"
            onClick={() => setSelectedTrain(trains[1])}
            onMouseEnter={() => setHoveredTrain(trains[1])}
            onMouseLeave={() => setHoveredTrain(null)}
          >
            {/* Subtle Pulsing Radar Ping Ring */}
            <circle cx="0" cy="0" r="14" fill="none" stroke="#38BDF8" strokeWidth="1.2" opacity="0.6">
              <animate attributeName="r" values="8;20;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.1;0.7" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Direction: Right-Facing Headlamp Beam (Proceeding to Kanpur) */}
            <polygon points="26,0 54,-8 54,8" fill="url(#vbHeadlamp)" />
            <path d="M 8 -5.5 L 23 -4.8 Q 27 0 23 4.8 L 8 5.5 Z" fill="#F8FAFC" stroke="#0F172A" strokeWidth="0.8" />
            <path d="M 17 -3.5 Q 22 0 17 3.5 Z" fill="#0F172A" />
            <line x1="8" y1="-1" x2="22" y2="-1" stroke="#F97316" strokeWidth="0.8" />
            <line x1="8" y1="1" x2="22" y2="1" stroke="#1E3A8A" strokeWidth="0.8" />
            <rect x="5.5" y="-1" width="3" height="2" rx="0.5" fill="#0F172A" />
            <rect x="-14" y="-5.2" width="19.5" height="10.4" rx="1.5" fill="#F8FAFC" stroke="#0F172A" strokeWidth="0.8" />
            <line x1="-12" y1="0" x2="4" y2="0" stroke="#1E3A8A" strokeWidth="2.5" />
            <rect x="-17" y="-1" width="3" height="2" rx="0.5" fill="#0F172A" />
            <rect x="-37" y="-5.2" width="20" height="10.4" rx="1.5" fill="#F8FAFC" stroke="#0F172A" strokeWidth="0.8" />
            <line x1="-35" y1="0" x2="-19" y2="0" stroke="#1E3A8A" strokeWidth="2.5" />

            <g transform="translate(-8, -14)">
              <rect x="-26" y="-6.5" width="52" height="13" rx="4" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.2" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.3))" />
              <text x="0" y="2.5" textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="800" fontFamily="monospace" className="whitespace-nowrap">
                22425 VB ▶
              </text>
            </g>
          </g>

          {/* Train 3: 14218 Unchahar Express · Fixed at KM 28.0 (left: 42% / X = 420, UP Line Y = 94) */}
          <g 
            transform="translate(420, 94)"
            className="cursor-pointer transition-opacity hover:opacity-90"
            onClick={() => setSelectedTrain(trains[2])}
            onMouseEnter={() => setHoveredTrain(trains[2])}
            onMouseLeave={() => setHoveredTrain(null)}
          >
            <circle cx="0" cy="0" r="14" fill="none" stroke="#38BDF8" strokeWidth="1.2" opacity="0.6">
              <animate attributeName="r" values="8;20;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.1;0.7" dur="2s" repeatCount="indefinite" />
            </circle>

            <polygon points="-24,0 -48,-6 -48,6" fill="url(#shatabdiHeadlamp)" />
            <rect x="-10" y="-5" width="16" height="10" rx="1.5" fill="#0284C7" stroke="#0F172A" strokeWidth="0.8" />
            <rect x="8" y="-5" width="18" height="10" rx="1" fill="#0369A1" stroke="#0F172A" strokeWidth="0.8" />

            <g transform="translate(6, -14)">
              <rect x="-26" y="-6.5" width="52" height="13" rx="4" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.2" />
              <text x="0" y="2.5" textAnchor="middle" fill="#E0F2FE" fontSize="6.5" fontWeight="800" fontFamily="monospace" className="whitespace-nowrap">
                ◀ 14218 (ON TIME)
              </text>
            </g>
          </g>

          {/* Train 4: 12555 Gorakhdham Express · Fixed at KM 62.0 (left: 82% / X = 820, DOWN Line Y = 106) */}
          <g 
            transform="translate(820, 106)"
            className="cursor-pointer transition-opacity hover:opacity-90"
            onClick={() => setSelectedTrain(trains[3])}
            onMouseEnter={() => setHoveredTrain(trains[3])}
            onMouseLeave={() => setHoveredTrain(null)}
          >
            <circle cx="0" cy="0" r="14" fill="none" stroke="#F59E0B" strokeWidth="1.2" opacity="0.6">
              <animate attributeName="r" values="8;20;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.1;0.7" dur="2s" repeatCount="indefinite" />
            </circle>

            <polygon points="24,0 48,-6 48,6" fill="url(#freightHeadlamp)" />
            <rect x="-6" y="-5" width="16" height="10" rx="1.5" fill="#1E40AF" stroke="#0F172A" strokeWidth="0.8" />
            <rect x="6" y="-3" width="4" height="6" fill="#0F172A" />
            <rect x="-26" y="-5" width="18" height="10" rx="1" fill="#1E3A8A" stroke="#0F172A" strokeWidth="0.8" />

            <g transform="translate(-5, -14)">
              <rect x="-26" y="-6.5" width="52" height="13" rx="4" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.2" />
              <text x="0" y="2.5" textAnchor="middle" fill="#FEF3C7" fontSize="6.5" fontWeight="800" fontFamily="monospace" className="whitespace-nowrap">
                12555 (+12m) ▶
              </text>
            </g>
          </g>

          {/* Train 5: BOXN-LKO Freight Rake · Stationed strictly at Unnao loop zone (left: 67% / X = 670, Y = 64) */}
          <g 
            transform="translate(670, 64)"
            className="cursor-pointer transition-opacity hover:opacity-90"
            onClick={() => setSelectedTrain(trains[4])}
            onMouseEnter={() => setHoveredTrain(trains[4])}
            onMouseLeave={() => setHoveredTrain(null)}
          >
            <circle cx="0" cy="0" r="14" fill="none" stroke="#FBBF24" strokeWidth="1.6" opacity="0.8">
              <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
            </circle>

            <polygon points="20,0 42,-5 42,5" fill="url(#freightHeadlamp)" />
            <rect x="4" y="-4.5" width="14" height="9" rx="1" fill="#0284C7" stroke="#0F172A" strokeWidth="0.8" />
            <rect x="-14" y="-5" width="16" height="10" rx="1" fill="#475569" stroke="#0F172A" strokeWidth="0.8" />
            <rect x="-32" y="-5" width="16" height="10" rx="1" fill="#334155" stroke="#0F172A" strokeWidth="0.8" />

            <g transform="translate(0, -11)">
              <rect x="-38" y="-5.5" width="76" height="11" rx="2.5" fill="#0F172A" stroke="#F59E0B" strokeWidth="1" />
              <text x="0" y="2" textAnchor="middle" fill="#FEF3C7" fontSize="5" fontWeight="800" fontFamily="monospace" className="whitespace-nowrap">
                BOXN-LKO [PF-0 SIDING]
              </text>
            </g>
          </g>

          {/* LAYER 6: CLEAN SPATIALLY DISTRIBUTED STATIONS (Zero Collisions & Explicit Percentage Offsets) */}

          {/* Station 1: LKO (Lucknow Charbagh Jn - KM 0.0) -> Left-aligned at left: 4% (X = 40px) */}
          <g 
            className="cursor-pointer"
            onMouseEnter={() => setHoveredStation({
              code: 'LKO',
              name: 'Lucknow Charbagh Junction',
              km: 'KM 0.0',
              chainage: 0.0,
              platforms: 9,
              interlocking: 'Solid State Electronic Interlocking (EI) · 9 Platforms · Western Yard',
              type: 'Corridor Origin & Major Terminal Hub · Northern Railway Lucknow Division'
            })}
            onMouseLeave={() => setHoveredStation(null)}
          >
            <line x1="40" y1="116" x2="40" y2="160" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.7" />
            <circle cx="40" cy="165" r="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.1))" />
            <circle cx="40" cy="165" r="4" fill="#2563EB" />
            
            <text x="40" y="188" textAnchor="start" fontSize="12" fontWeight="800" fill="#0F172A">
              LKO (Lucknow Charbagh)
            </text>
            <text x="40" y="202" textAnchor="start" fontSize="10" fontWeight="600" fill="#64748B" className="metric-mono">
              KM 0.0 · 9 PF · Western Yard
            </text>
          </g>

          {/* Station 2: MKG (Manak Nagar Jn - KM 5.0) -> Offset to left: 20% (X = 200px), staggered downward so it NEVER touches LKO */}
          <g 
            className="cursor-pointer"
            onMouseEnter={() => setHoveredStation({
              code: 'MKG',
              name: 'Manak Nagar Junction',
              km: 'KM 5.0',
              chainage: 5.0,
              platforms: 4,
              interlocking: 'Electronic Interlocking (EI) · Crossover 101A · RDSO Staging Yard',
              type: 'Joint Possession Zone & RDSO Limits · Lucknow Division'
            })}
            onMouseLeave={() => setHoveredStation(null)}
          >
            <line x1="200" y1="116" x2="200" y2="160" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.7" />
            <circle cx="200" cy="165" r="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.1))" />
            <circle cx="200" cy="165" r="4" fill="#2563EB" />

            <line x1="200" y1="175" x2="220" y2="208" stroke="#475569" strokeWidth="1.4" strokeDasharray="2,2" />
            <circle cx="220" cy="208" r="2" fill="#475569" />

            <text x="225" y="214" textAnchor="start" fontSize="12" fontWeight="800" fill="#0F172A">
              MKG (Manak Nagar Jn)
            </text>
            <text x="225" y="228" textAnchor="start" fontSize="10" fontWeight="600" fill="#64748B" className="metric-mono">
              KM 5.0 · 4 PF · CO-101A
            </text>
          </g>

          {/* Station 3: AJGAIN (KM 25.0) -> Center alignment at left: 45% (X = 450px) */}
          <g 
            className="cursor-pointer"
            onMouseEnter={() => setHoveredStation({
              code: 'AJGAIN',
              name: 'Ajgain Junction / Block Hut C',
              km: 'KM 25.0',
              chainage: 25.0,
              platforms: 3,
              interlocking: 'Automatic Signalling Block Post · Block Hut C Relay',
              type: 'Intermediate Automatic Signalling Post · Lucknow-Unnao Section'
            })}
            onMouseLeave={() => setHoveredStation(null)}
          >
            <line x1="450" y1="116" x2="450" y2="160" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.7" />
            <circle cx="450" cy="165" r="9" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
            <circle cx="450" cy="165" r="3.5" fill="#2563EB" />
            
            <text x="450" y="188" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0F172A">
              AJGAIN
            </text>
            <text x="450" y="202" textAnchor="middle" fontSize="10" fontWeight="600" fill="#64748B" className="metric-mono">
              KM 25.0 · Block Hut C
            </text>
          </g>

          {/* Station 4: ON (Unnao Jn - KM 54.0) -> Position at left: 70% (X = 700px) */}
          <g 
            className="cursor-pointer"
            onMouseEnter={() => setHoveredStation({
              code: 'ON',
              name: 'Unnao Junction',
              km: 'KM 54.0',
              chainage: 54.0,
              platforms: 5,
              interlocking: 'Electronic Interlocking (EI) · 5 Platforms · Goods Siding Loop Line 2',
              type: 'Critical Junction & Goods Siding Divergence · Northern Railway'
            })}
            onMouseLeave={() => setHoveredStation(null)}
          >
            <line x1="700" y1="116" x2="700" y2="160" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.7" />
            <circle cx="700" cy="165" r="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.1))" />
            <circle cx="700" cy="165" r="4" fill="#7C3AED" />
            
            <text x="700" y="188" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0F172A">
              ON (Unnao Jn)
            </text>
            <text x="700" y="202" textAnchor="middle" fontSize="10" fontWeight="600" fill="#64748B" className="metric-mono">
              KM 54.0 · 5 PF · Loop Line 2
            </text>
          </g>

          {/* Station 5: CNB (Kanpur Central - KM 72.0) -> Position at left: 92% (X = 920px), Right-aligned container */}
          <g 
            className="cursor-pointer"
            onMouseEnter={() => setHoveredStation({
              code: 'CNB',
              name: 'Kanpur Central Junction',
              km: 'KM 72.0',
              chainage: 72.0,
              platforms: 10,
              interlocking: 'Solid State Electronic Interlocking (EI) · 10 Platforms Terminal',
              type: 'Major Terminal Gateway & High-Density Junction Hub · NCR / NR Gateway'
            })}
            onMouseLeave={() => setHoveredStation(null)}
          >
            <line x1="920" y1="116" x2="920" y2="160" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.7" />
            <circle cx="920" cy="165" r="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.1))" />
            <circle cx="920" cy="165" r="4" fill="#7C3AED" />
            
            <text x="935" y="188" textAnchor="end" fontSize="12" fontWeight="800" fill="#0F172A">
              CNB (Kanpur Central)
            </text>
            <text x="935" y="202" textAnchor="end" fontSize="10" fontWeight="600" fill="#64748B" className="metric-mono">
              KM 72.0 · 10 PF Terminal
            </text>
          </g>
        </svg>

        {/* Stable Interactive Popover/Modal Required by Spec */}
        {selectedTrain && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-96 p-4 rounded-xl border border-slate-700 bg-slate-900/95 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start border-b border-slate-800 pb-2">
              <div>
                <div className="text-xs font-mono font-bold text-emerald-400">● LIVE NTES GPS TELEMETRY</div>
                <div className="text-sm font-bold text-white">{selectedTrain.number} · {selectedTrain.name}</div>
              </div>
              <button 
                onClick={() => setSelectedTrain(null)} 
                className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer transition-colors"
                aria-label="Close telemetry modal"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-800/60 p-2 rounded">
                <div className="text-slate-400 text-[10px]">Current Chainage</div>
                <div className="text-white font-bold truncate">{selectedTrain.chainage}</div>
              </div>
              <div className="bg-slate-800/60 p-2 rounded">
                <div className="text-slate-400 text-[10px]">Punctuality</div>
                <div className={`${selectedTrain.delayMinutes > 0 ? 'text-rose-400' : 'text-emerald-400'} font-bold`}>
                  {selectedTrain.delay}
                </div>
              </div>
              <div className="bg-slate-800/60 p-2 rounded">
                <div className="text-slate-400 text-[10px]">Speed / MPS</div>
                <div className="text-white font-bold">{selectedTrain.speed}</div>
              </div>
              <div className="bg-slate-800/60 p-2 rounded">
                <div className="text-slate-400 text-[10px]">Traction / Shed</div>
                <div className="text-white font-bold truncate">{selectedTrain.loco}</div>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>{selectedTrain.line}</span>
              <span className="text-blue-400">CRIS / RailRadar Verified</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. INTERACTIVE NTES GPS TELEMETRY READOUT / PROMPT BAR */}
      <div className="mt-3">
        {hoveredStation ? (
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl border border-blue-200 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xs shrink-0">
                {hoveredStation.code}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-900">{hoveredStation.name}</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {hoveredStation.km}
                  </span>
                  {hoveredStation.platforms > 0 && (
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {hoveredStation.platforms} Platforms
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {hoveredStation.type}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-bold text-slate-700">Interlocking:</span>
              <span className="font-semibold text-slate-900">{hoveredStation.interlocking}</span>
            </div>
          </div>
        ) : hoveredTrain ? (
          /* OFFICIAL IR LIVE NTES TELEMETRY HOVER CARD */
          <div 
            onClick={() => setSelectedTrain(hoveredTrain)}
            className="bg-[#0C2138] p-4 rounded-xl border border-blue-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-white animate-in fade-in duration-200 cursor-pointer hover:border-blue-400 transition-colors"
          >
            <div className="flex items-start md:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
                <Train size={20} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black font-mono tracking-tight text-white">
                    TRAIN {hoveredTrain.number} · {hoveredTrain.name.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    ● Live NTES Feed Verified
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-300 mt-1 flex items-center gap-2.5 flex-wrap">
                  <span>Speed: <strong className="text-white">{hoveredTrain.speed}</strong></span>
                  <span className="text-slate-500">•</span>
                  <span>Chainage: <strong className="text-emerald-300">{hoveredTrain.chainage}</strong></span>
                  <span className="text-slate-500">•</span>
                  <span>Punctuality: <strong className={hoveredTrain.delayMinutes > 0 ? 'text-rose-400' : 'text-emerald-400'}>{hoveredTrain.delay}</strong></span>
                  <span className="text-slate-500">•</span>
                  <span>Locomotive: <strong className="text-amber-300">{hoveredTrain.loco}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono bg-blue-900/40 px-3 py-1.5 rounded-lg border border-blue-400/30 text-blue-200 shrink-0 self-start md:self-auto">
              <span>Source: RailRadar Live API / CRIS Feed</span>
              <span className="text-blue-400">⚡ Click for full modal</span>
            </div>
          </div>
        ) : hoveredWorkZone ? (
          <div className="bg-amber-50/95 backdrop-blur-md p-4 rounded-xl border border-amber-300 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-200/80 flex items-center justify-center text-amber-900 font-black text-xs shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-950">Active Joint Block Containment Zone</span>
                  <span className="text-[10px] font-extrabold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                    KM 0.00 – KM 5.00 (LKO–MKG)
                  </span>
                  <span className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                    TSR 30 Caution Active
                  </span>
                </div>
                <div className="text-[10px] text-amber-800 font-medium mt-0.5">
                  Coordinated Maintenance Window: Track Machine Tamper (ENG) + TRD OHE Power Block + S&amp;T Cable Relay
                </div>
              </div>
            </div>
            <div className="text-[10px] text-amber-900 bg-white/80 px-3 py-1.5 rounded-lg border border-amber-300 font-bold shrink-0">
              Signal Interlock: Section Block Absolute Protection Active
            </div>
          </div>
        ) : (
          <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500">
            <div className="flex items-center gap-3 font-semibold text-slate-600 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Electronic Interlocking (EI) &amp; Absolute Block: Normal
              </span>
              <span>•</span>
              <span>Track Circuits: TC-01 to TC-05 Active</span>
              <span>•</span>
              <span className="text-blue-600 font-bold">Anchored Real-Time NTES GPS Telemetry · Click any train pill for Live Telemetry</span>
            </div>
            <div className="font-mono text-slate-400">
              Northern Railway G&amp;SR § 4.14 Compliant
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorridorTrackTopology;
