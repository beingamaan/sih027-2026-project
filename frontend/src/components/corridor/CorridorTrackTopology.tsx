import React, { useState } from 'react';
import { Train, Wrench, ShieldCheck, Activity, Info } from 'lucide-react';

export interface StationTelemetry {
  code: string;
  name: string;
  km: string;
  platforms: number;
  interlocking: string;
  type: string;
}

export interface CorridorTrainTelemetry {
  trainNo: string;
  name: string;
  priority: string;
  speed: string;
  status: string;
  section: string;
  lineType: string;
  telemetryText: string;
}

interface CorridorTrackTopologyProps {
  variant?: 'full' | 'engineering' | 'yard' | 'field';
  onInspectBlock?: () => void;
  className?: string;
}

export const CorridorTrackTopology: React.FC<CorridorTrackTopologyProps> = ({
  variant = 'full',
  onInspectBlock,
  className = ''
}) => {
  const [hoveredStation, setHoveredStation] = useState<StationTelemetry | null>(null);
  const [hoveredTrain, setHoveredTrain] = useState<CorridorTrainTelemetry | null>(null);
  const [hoveredWorkZone, setHoveredWorkZone] = useState<boolean>(false);

  const getHeaderInfo = () => {
    switch (variant) {
      case 'engineering':
        return {
          title: 'Multi-Department Engineering Co-Location Topology',
          badge: 'ENGINEERING STAGING VIEW',
          badgeColor: 'text-amber-800 bg-amber-50 border-amber-300',
          subtitle: 'Active Joint Block GZB–ANVR (KM 100–120) · Machine Staging & Cross-Dept Safety Separation (≥500m)',
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
          subtitle: 'Loop Siding Stabling & Turnout Interlock Detection · G&SR Rule 4.14 Advisory (Non-Controlling)',
          legends: [
            { label: 'Main Running Lines', color: 'bg-[#2563EB]', border: 'border-slate-200' },
            { label: 'Goods Loop Siding (PF-0)', color: 'bg-slate-500', border: 'border-slate-300' },
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
          subtitle: 'KM 100.000 to KM 120.000 Work Limits · 500m Safety Buffer Overlaps · Handback Verification Pegs',
          legends: [
            { label: 'Authorized Ground Possession', color: 'bg-amber-500', border: 'border-amber-300' },
            { label: '500m Safety Overlap Buffer', color: 'bg-amber-400', border: 'border-amber-300' },
            { label: 'Red Stop Board Peg (KM 100 / 120)', color: 'bg-rose-600', border: 'border-rose-300' },
            { label: 'G&SR Handback Pegs', color: 'bg-emerald-600', border: 'border-emerald-300' },
          ]
        };
      default:
        return {
          title: 'Corridor Physical Track Topology',
          badge: 'LIVE TRACK STRIP',
          badgeColor: 'text-blue-600 bg-blue-50 border-blue-200/80',
          subtitle: '58 km corridor · Stations GZB, ANVR, ALJN, TDL · Northern Railway Delhi Division',
          legends: [
            { label: 'Double Main (UP)', color: 'bg-[#2563EB]', border: 'border-slate-200' },
            { label: 'Double Main (DOWN)', color: 'bg-[#0284C7]', border: 'border-slate-200' },
            { label: 'Single Line (ALJN–TDL)', color: 'bg-[#7C3AED]', border: 'border-slate-200' },
            { label: 'Joint Block Zone', color: 'bg-amber-500 animate-pulse', border: 'border-amber-300' },
          ]
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className={`p-6 nova-card ${className}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
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

        {/* Legend Chips */}
        <div className="flex items-center gap-2.5 text-[10px] text-slate-600 font-bold flex-wrap">
          {headerInfo.legends.map((leg, idx) => (
            <span key={idx} className={`flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border shadow-2xs ${leg.border}`}>
              <span className={`w-3.5 h-1.5 rounded-xs ${leg.color}`}></span> {leg.label}
            </span>
          ))}
        </div>
      </div>

      {/* Dynamic Track Strip Canvas with 420px Height & Spaced Geometry */}
      <div className="bg-gradient-to-b from-slate-50/90 to-blue-50/30 p-5 rounded-2xl border border-slate-200/90 overflow-x-auto shadow-xs relative min-h-[420px] flex items-center justify-center">
        <svg
          width="1000"
          height="420"
          viewBox="0 0 1000 240"
          className="w-full min-h-[420px] select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Diagonal Caution Hazard Stripes Pattern */}
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

            <linearGradient id="workZoneAmberGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#EFF6FF" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0.75" />
            </linearGradient>

            {/* Headlamp Beam Glow Gradients */}
            <linearGradient id="vbHeadlamp" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#38BDF8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="rajdhaniHeadlamp" x1="100%" y1="0%" x2="0%" y2="0%">
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

          {/* 0. SCHEMATIC GEOGRAPHIC MAP UNDERLAY (Restored River, Terrain Contours & Route Grid) */}
          <g id="geographicMapUnderlay" className="pointer-events-none select-none">
            {/* Coordinate Grid Lines */}
            <line x1="0" y1="18" x2="1000" y2="18" stroke="#CBD5E1" strokeWidth="0.75" strokeDasharray="3,3" opacity="0.25" />
            <line x1="0" y1="148" x2="1000" y2="148" stroke="#CBD5E1" strokeWidth="0.75" strokeDasharray="3,3" opacity="0.25" />
            <line x1="200" y1="0" x2="200" y2="240" stroke="#CBD5E1" strokeWidth="0.75" strokeDasharray="3,3" opacity="0.25" />
            <line x1="550" y1="0" x2="550" y2="240" stroke="#CBD5E1" strokeWidth="0.75" strokeDasharray="3,3" opacity="0.25" />
            <line x1="820" y1="0" x2="820" y2="240" stroke="#CBD5E1" strokeWidth="0.75" strokeDasharray="3,3" opacity="0.25" />

            {/* GIS Latitude / Longitude Stamps */}
            <text x="45" y="14" fill="#64748B" opacity="0.55" fontSize="6.5" fontFamily="monospace" fontWeight="600">
              28°39'20"N · 77°25'48"E [GZB SECTOR]
            </text>
            <text x="345" y="14" fill="#64748B" opacity="0.55" fontSize="6.5" fontFamily="monospace" fontWeight="600">
              28°38'50"N · 77°18'54"E [ANVR SECTOR]
            </text>
            <text x="665" y="14" fill="#64748B" opacity="0.55" fontSize="6.5" fontFamily="monospace" fontWeight="600">
              27°53'44"N · 78°04'30"E [ALJN SECTOR]
            </text>
            <text x="875" y="14" fill="#64748B" opacity="0.55" fontSize="6.5" fontFamily="monospace" fontWeight="600">
              27°12'30"N · 78°14'22"E [TDL SECTOR]
            </text>

            {/* River Curve (Yamuna / Hindon Tributary Passing between ANVR and ALJN) */}
            <path 
              d="M 535 0 C 515 45, 555 80, 535 125 C 520 160, 550 200, 530 240 L 565 240 C 585 200, 555 160, 570 125 C 590 80, 550 45, 570 0 Z" 
              fill="#E0F2FE" 
              opacity="0.65" 
            />
            <path 
              d="M 550 0 C 530 45, 570 80, 550 125 C 535 160, 565 200, 545 240" 
              fill="none" 
              stroke="#BAE6FD" 
              strokeWidth="2.5" 
              opacity="0.8" 
              strokeDasharray="8 4" 
            />
            <text 
              x="562" 
              y="130" 
              fill="#0284C7" 
              opacity="0.6" 
              fontSize="6.5" 
              fontWeight="bold" 
              letterSpacing="1" 
              transform="rotate(-82 562 130)"
            >
              HINDON RIVER CANAL (BR. NO. 42)
            </text>

            {/* Railway Bridge Girder Truss Structure (crossing River at tracks) */}
            <line x1="525" y1="88" x2="575" y2="88" stroke="#475569" strokeWidth="1.8" opacity="0.45" />
            <line x1="525" y1="112" x2="575" y2="112" stroke="#475569" strokeWidth="1.8" opacity="0.45" />
            <line x1="530" y1="88" x2="540" y2="112" stroke="#64748B" strokeWidth="1" opacity="0.35" />
            <line x1="540" y1="88" x2="530" y2="112" stroke="#64748B" strokeWidth="1" opacity="0.35" />
            <line x1="540" y1="88" x2="550" y2="112" stroke="#64748B" strokeWidth="1" opacity="0.35" />
            <line x1="550" y1="88" x2="540" y2="112" stroke="#64748B" strokeWidth="1" opacity="0.35" />
            <line x1="550" y1="88" x2="560" y2="112" stroke="#64748B" strokeWidth="1" opacity="0.35" />
            <line x1="560" y1="88" x2="550" y2="112" stroke="#64748B" strokeWidth="1" opacity="0.35" />
            <line x1="560" y1="88" x2="570" y2="112" stroke="#64748B" strokeWidth="1" opacity="0.35" />
            <line x1="570" y1="88" x2="560" y2="112" stroke="#64748B" strokeWidth="1" opacity="0.35" />
            <text x="550" y="83" textAnchor="middle" fill="#475569" opacity="0.65" fontSize="6.5" fontWeight="bold">
              BR. NO. 42 (TRUSS GIRDER)
            </text>

            {/* Faint Dashed Topographical Contour Curves */}
            <path 
              d="M 0 46 C 200 36, 400 54, 600 40 C 760 26, 880 42, 1000 34" 
              stroke="#E2E8F0" 
              strokeWidth="1.5" 
              fill="none" 
              opacity="0.65" 
              strokeDasharray="4 4" 
            />
            <text x="25" y="44" fill="#94A3B8" opacity="0.55" fontSize="6.5" fontFamily="monospace">EL 214m</text>

            <path 
              d="M 0 145 C 240 155, 470 138, 680 150 C 820 158, 920 144, 1000 152" 
              stroke="#E2E8F0" 
              strokeWidth="1.5" 
              fill="none" 
              opacity="0.65" 
              strokeDasharray="4 4" 
            />
            <text x="860" y="152" fill="#94A3B8" opacity="0.55" fontSize="6.5" fontFamily="monospace">EL 188m</text>

            <path 
              d="M 0 190 C 220 180, 450 195, 700 185 C 850 178, 950 192, 1000 186" 
              stroke="#E2E8F0" 
              strokeWidth="1.5" 
              fill="none" 
              opacity="0.5" 
              strokeDasharray="4 4" 
            />
            <text x="450" y="183" fill="#94A3B8" opacity="0.5" fontSize="6.5" fontFamily="monospace">EL 196m (DELHI BASIN)</text>

            {/* Divisional Administrative Boundary Lines */}
            <path d="M 265 0 L 275 48 L 268 145 L 285 240" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="6,3,1.5,3" fill="none" opacity="0.35" />
            <text x="272" y="10" fill="#64748B" opacity="0.55" fontSize="6" fontWeight="bold" letterSpacing="1">
              DIST BORDER (NW-14 / CW-02)
            </text>

            <path d="M 640 0 L 628 60 L 646 145 L 632 240" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="6,3,1.5,3" fill="none" opacity="0.35" />
            <text x="635" y="234" fill="#64748B" opacity="0.55" fontSize="6" fontWeight="bold" letterSpacing="1">
              DIST BORDER (CW-02 / AL-01)
            </text>

            {/* Stylized Agricultural Land Parcels */}
            <polygon points="120,6 240,10 220,30 105,26" fill="#DCFCE7" opacity="0.25" stroke="#86EFAC" strokeWidth="0.8" strokeDasharray="3,2" />
            <polygon points="730,150 850,154 830,195 715,190" fill="#DCFCE7" opacity="0.25" stroke="#86EFAC" strokeWidth="0.8" strokeDasharray="3,2" />
          </g>

          {/* LAYER 1: SANCTIONED JOINT BLOCK WORK ZONE HIGHLIGHT (KM 104 to 125, X = 135 to 470) */}
          <g 
            id="jointBlockLayer"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredWorkZone(true)}
            onMouseLeave={() => setHoveredWorkZone(false)}
            onClick={() => onInspectBlock?.()}
          >
            <rect
              x="135"
              y="68"
              width="335"
              height="58"
              rx="8"
              fill="url(#jointBlockGrad)"
              stroke="#F59E0B"
              strokeWidth={hoveredWorkZone ? '2.5' : '1.8'}
              strokeDasharray="5,3"
              filter="drop-shadow(0 2px 4px rgba(245, 158, 11, 0.2))"
            />
            <rect x="135" y="68" width="335" height="58" rx="8" fill="url(#hazardStripes)" />

            {/* LEVEL 1: TOPMOST INSPECTION BLOCK BANNER (Y = 34) */}
            <g transform="translate(302, 34)">
              <rect x="-125" y="-10" width="250" height="20" rx="10" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.2" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.08))" />
              <circle cx="-112" cy="0" r="3.2" fill="#EF4444">
                <animate attributeName="r" values="2.8;4.5;2.8" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
              </circle>
              <text x="6" y="3" textAnchor="middle" className="text-[8.5px] font-black fill-amber-950 tracking-tight metric-mono">
                ⚡ CLICK TO INSPECT SANCTIONED BLOCK (GZB–ANVR)
              </text>
            </g>
          </g>

          {/* LAYER 2: REALISTIC PHYSICAL RAILWAY TRACK BED */}
          {/* 1. UP TRACK BED (GZB KM 100 to ALJN KM 140, Y = 94) */}
          <line x1="70" y1="94" x2="700" y2="94" stroke="#CBD5E1" strokeWidth="7" strokeDasharray="2,4" strokeLinecap="butt" opacity="0.8" />
          <line x1="70" y1="91.5" x2="700" y2="91.5" stroke="#2563EB" strokeWidth="1.2" opacity="0.9" strokeLinecap="round" />
          <line x1="70" y1="96.5" x2="700" y2="96.5" stroke="#2563EB" strokeWidth="1.2" opacity="0.9" strokeLinecap="round" />

          {/* 2. DOWN TRACK BED (GZB KM 100 to ALJN KM 140, Y = 106) */}
          <line x1="70" y1="106" x2="700" y2="106" stroke="#CBD5E1" strokeWidth="7" strokeDasharray="2,4" strokeLinecap="butt" opacity="0.8" />
          <line x1="70" y1="103.5" x2="700" y2="103.5" stroke="#0284C7" strokeWidth="1.2" opacity="0.9" strokeLinecap="round" />
          <line x1="70" y1="108.5" x2="700" y2="108.5" stroke="#0284C7" strokeWidth="1.2" opacity="0.9" strokeLinecap="round" />

          {/* 3. TURNOUT JUNCTION POINT (ALJN KM 140: Double Track to Single Line Transition) */}
          <path d="M 700 94 Q 705 97 710 100" stroke="#DDD6FE" strokeWidth="7" strokeDasharray="2,4" strokeLinecap="butt" opacity="0.8" fill="none" />
          <path d="M 700 106 Q 705 103 710 100" stroke="#DDD6FE" strokeWidth="7" strokeDasharray="2,4" strokeLinecap="butt" opacity="0.8" fill="none" />
          <path d="M 700 91.5 Q 705 94.5 710 97.5" stroke="#7C3AED" strokeWidth="1.4" opacity="0.9" fill="none" strokeLinecap="round" />
          <path d="M 700 108.5 Q 705 105.5 710 102.5" stroke="#7C3AED" strokeWidth="1.4" opacity="0.9" fill="none" strokeLinecap="round" />
          <line x1="695" y1="94" x2="710" y2="100" stroke="#7C3AED" strokeWidth="1.2" strokeDasharray="3,2" opacity="0.7" />
          <line x1="695" y1="106" x2="710" y2="100" stroke="#7C3AED" strokeWidth="1.2" strokeDasharray="3,2" opacity="0.7" />

          {/* 4. SINGLE-LINE TRACK BED (ALJN KM 140 to TDL KM 158, Y = 100) */}
          <line x1="710" y1="100" x2="920" y2="100" stroke="#DDD6FE" strokeWidth="7" strokeDasharray="2,4" strokeLinecap="butt" opacity="0.8" />
          <line x1="710" y1="97.5" x2="920" y2="97.5" stroke="#7C3AED" strokeWidth="1.4" opacity="0.9" strokeLinecap="round" />
          <line x1="710" y1="102.5" x2="920" y2="102.5" stroke="#7C3AED" strokeWidth="1.4" opacity="0.9" strokeLinecap="round" />

          {/* 5. ALJN GOODS LOOP SIDING (PF-0, Branching off UP Main at X=575, parallel at Y=64, crossover at X=755) */}
          <path 
            d="M 575 94 Q 595 94, 610 64 L 725 64 Q 740 64, 755 94" 
            fill="none" 
            stroke="#64748B" 
            strokeWidth="2" 
          />
          {/* Concrete Sleeper Ties on Siding Bed */}
          <line x1="610" y1="64" x2="725" y2="64" stroke="#CBD5E1" strokeWidth="6" strokeDasharray="2,3" opacity="0.85" />
          {/* Twin Steel Rails on Siding Bed */}
          <line x1="608" y1="62" x2="727" y2="62" stroke="#64748B" strokeWidth="1.2" />
          <line x1="608" y1="66" x2="727" y2="66" stroke="#64748B" strokeWidth="1.2" />
          {/* Turnout Points / Frogs */}
          <circle cx="575" cy="94" r="2.2" fill="#64748B" />
          <circle cx="755" cy="94" r="2.2" fill="#64748B" />

          {/* LEVEL 1: Siding Track Identification Label Tag (Y = 28) */}
          <g transform="translate(668, 28)">
            <rect x="-52" y="-7" width="104" height="14" rx="3.5" fill="#0F172A" stroke="#64748B" strokeWidth="1" opacity="0.95" />
            <text x="0" y="3" textAnchor="middle" className="text-[7px] font-black fill-slate-200 tracking-wider metric-mono">
              PF-0 GOODS SIDING
            </text>
          </g>

          {/* LAYER 3: SECTION INDICATORS (Y = 142) */}
          <g transform="translate(230, 142)">
            <rect x="-70" y="-9" width="140" height="18" rx="4" fill="rgba(239, 246, 255, 0.95)" stroke="#BFDBFE" />
            <text x="0" y="3.5" textAnchor="middle" className="text-[8.5px] font-extrabold fill-blue-700 metric-mono">
              SEC GZB–ANVR (20 km • Double)
            </text>
          </g>

          <g transform="translate(550, 142)">
            <rect x="-70" y="-9" width="140" height="18" rx="4" fill="rgba(239, 246, 255, 0.95)" stroke="#BFDBFE" />
            <text x="0" y="3.5" textAnchor="middle" className="text-[8.5px] font-extrabold fill-blue-700 metric-mono">
              SEC ANVR–ALJN (20 km • Double)
            </text>
          </g>

          <g transform="translate(815, 142)">
            <rect x="-75" y="-9" width="150" height="18" rx="4" fill="rgba(245, 243, 255, 0.95)" stroke="#DDD6FE" />
            <text x="0" y="3.5" textAnchor="middle" className="text-[8.5px] font-extrabold fill-purple-700 metric-mono">
              SEC ALJN–TDL (18 km • Single Line)
            </text>
          </g>

          {/* LAYER 4: REALISTIC LIVE TRAINS */}

          {/* TRAIN 1: Train 22436 Vande Bharat Exp (UP Line at Y = 94) */}
          <g 
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredTrain({
              trainNo: '22436',
              name: 'Vande Bharat Express',
              priority: 'P1 (Semi-High Speed Vande Bharat)',
              speed: '128 km/h',
              status: 'ON TIME',
              section: 'SEC GZB–ANVR (KM 100–120 UP Line)',
              lineType: 'UP Track (Double Line)',
              telemetryText: 'Current: KM 112.4 · Speed: 128 km/h · Next: ANVR in 6 min · Status: ON TIME'
            })}
            onMouseLeave={() => setHoveredTrain(null)}
          >
            <animateMotion 
              dur="18s" 
              repeatCount="indefinite" 
              path="M 85 94 L 700 94" 
            />

            {/* Glowing White/Blue Headlamp Beam */}
            <polygon points="26,0 56,-8 56,8" fill="url(#vbHeadlamp)" />

            {/* Vande Bharat Aerodynamic Nose Cone (White with Navy/Orange accents) */}
            <path d="M 8 -5.5 L 23 -4.8 Q 27 0 23 4.8 L 8 5.5 Z" fill="#F8FAFC" stroke="#0F172A" strokeWidth="0.8" />
            {/* Aerodynamic Windshield Visor */}
            <path d="M 17 -3.5 Q 22 0 17 3.5 Z" fill="#0F172A" />
            {/* Saffron & Navy Dual Racing Stripes */}
            <line x1="8" y1="-1" x2="22" y2="-1" stroke="#F97316" strokeWidth="0.8" />
            <line x1="8" y1="1" x2="22" y2="1" stroke="#1E3A8A" strokeWidth="0.8" />
            {/* High-speed Pantograph Lines */}
            <path d="M 12 0 L 14 -2.5 L 16 0 L 14 2.5 Z" fill="none" stroke="#64748B" strokeWidth="0.8" />

            {/* Coupler 1 */}
            <rect x="5.5" y="-1" width="3" height="2" rx="0.5" fill="#0F172A" />

            {/* Vande Bharat Coach 1 (White & Blue Modern EMU Car) */}
            <rect x="-14" y="-5.2" width="19.5" height="10.4" rx="1.5" fill="#F8FAFC" stroke="#0F172A" strokeWidth="0.8" />
            <line x1="-12" y1="0" x2="4" y2="0" stroke="#1E3A8A" strokeWidth="2.5" />
            <rect x="-11" y="-1.5" width="6" height="3" rx="0.5" fill="#0F172A" />

            {/* Coupler 2 */}
            <rect x="-17" y="-1" width="3" height="2" rx="0.5" fill="#0F172A" />

            {/* Vande Bharat Coach 2 */}
            <rect x="-37" y="-5.2" width="20" height="10.4" rx="1.5" fill="#F8FAFC" stroke="#0F172A" strokeWidth="0.8" />
            <line x1="-35" y1="0" x2="-19" y2="0" stroke="#1E3A8A" strokeWidth="2.5" />
            <rect x="-34" y="-1.5" width="6" height="3" rx="0.5" fill="#0F172A" />

            {/* Glowing Tail Pulse */}
            <circle cx="-42" cy="0" r="3.5" fill="#3B82F6" opacity="0.9">
              <animate attributeName="r" values="2.5;5;2.5" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.25;0.9" dur="1.2s" repeatCount="indefinite" />
            </circle>

            {/* Micro Floating Identification Badge */}
            <g transform="translate(-8, -14)">
              <rect x="-18" y="-6.5" width="36" height="13" rx="4" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))" />
              <text x="0" y="2.5" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="800" fontFamily="ui-monospace, monospace">
                22436 VB ▶
              </text>
            </g>
          </g>

          {/* TRAIN 2: Train 12424 DBRT Rajdhani (DOWN Line at Y = 106) */}
          <g 
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredTrain({
              trainNo: '12424',
              name: 'DBRT Rajdhani Express',
              priority: 'P1 (Superfast Premium Rajdhani)',
              speed: '30 km/h (TSR Active)',
              status: 'REGULATED (Bridge No. 42)',
              section: 'SEC ANVR–ALJN (KM 132.8 DOWN Line)',
              lineType: 'DOWN Track (Double Line)',
              telemetryText: 'Current: KM 132.8 · Regulated at Bridge No. 42 · Speed: 30 km/h (TSR Active)'
            })}
            onMouseLeave={() => setHoveredTrain(null)}
          >
            <animateMotion 
              dur="25s" 
              repeatCount="indefinite" 
              path="M 700 106 L 85 106" 
            />

            {/* Headlamp Beam glowing forward (to the left) */}
            <polygon points="-26,0 -52,-7 -52,7" fill="url(#rajdhaniHeadlamp)" />

            {/* Locomotive WAP-7 Engine (Red & Cream Rajdhani Livery) */}
            <path d="M -8 -5.5 L -22 -5 Q -26 0 -22 5 L -8 5.5 Z" fill="#B91C1C" stroke="#0F172A" strokeWidth="0.8" />
            <path d="M -18 -3.5 Q -22 0 -18 3.5 Z" fill="#0F172A" />
            <line x1="-8" y1="0" x2="-22" y2="0" stroke="#FEF08A" strokeWidth="1" />
            <rect x="-13.5" y="-3" width="4" height="6" rx="0.5" fill="#450A0A" />

            {/* Coupler 1 */}
            <rect x="-8.5" y="-1" width="3" height="2" rx="0.5" fill="#0F172A" />

            {/* Coupled Bogie Coach 1 (AC First / 2-Tier LHB Coach) */}
            <rect x="-5.5" y="-5" width="19.5" height="10" rx="1.5" fill="#991B1B" stroke="#0F172A" strokeWidth="0.8" />
            <rect x="-2" y="-2" width="6" height="4" rx="0.5" fill="#FEF08A" opacity="0.9" />

            {/* Coupler 2 */}
            <rect x="14" y="-1" width="3" height="2" rx="0.5" fill="#0F172A" />

            {/* Coupled Bogie Coach 2 (AC 3-Tier LHB Coach) */}
            <rect x="17" y="-5" width="20" height="10" rx="1.5" fill="#991B1B" stroke="#0F172A" strokeWidth="0.8" />
            <rect x="23" y="-2" width="6" height="4" rx="0.5" fill="#FEF08A" opacity="0.9" />

            {/* Glowing Tail Pulse */}
            <circle cx="42" cy="0" r="3.5" fill="#EF4444" opacity="0.85">
              <animate attributeName="r" values="2.5;5;2.5" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.25;0.9" dur="1.2s" repeatCount="indefinite" />
            </circle>

            {/* Micro Floating Identification Badge */}
            <g transform="translate(8, -14)">
              <rect x="-18" y="-6.5" width="36" height="13" rx="4" fill="#0F172A" stroke="#EF4444" strokeWidth="1" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))" />
              <text x="0" y="2.5" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="800" fontFamily="ui-monospace, monospace">
                ◀ 12424 RAJ
              </text>
            </g>
          </g>

          {/* TRAIN 3: Train BCN-91 Freight (Snapped directly onto ALJN Goods Loop Siding at Y=64) */}
          <g 
            transform="translate(668, 64)"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredTrain({
              trainNo: 'BCN-91',
              name: 'BCN-91 Freight Rake',
              priority: 'P4 (Freight Goods Traffic)',
              speed: '0 km/h (Stabled)',
              status: 'STABLED / PRE-EMPTED',
              section: 'ALJN Goods Loop Siding (PF-0 · KM 140.0)',
              lineType: 'Goods Loop Siding Line',
              telemetryText: 'Stabled on ALJN Goods Loop Siding (PF-0) · Pre-empted for Priority Traffic'
            })}
            onMouseLeave={() => setHoveredTrain(null)}
          >
            {/* Freight Headlamp */}
            <polygon points="24,0 48,-6 48,6" fill="url(#freightHeadlamp)" />

            {/* Heavy Freight Locomotive (WAG-9 Blue Livery) */}
            <rect x="7" y="-5" width="16" height="10" rx="1.5" fill="#0284C7" stroke="#0F172A" strokeWidth="0.8" />
            <rect x="18" y="-3" width="4" height="6" fill="#0F172A" />

            {/* Coupler 1 */}
            <rect x="5" y="-1.2" width="3" height="2.4" rx="0.5" fill="#0F172A" />

            {/* Freight Container Wagon 1 (BCN Covered Wagon) */}
            <rect x="-15" y="-5.5" width="20" height="11" rx="1" fill="#475569" stroke="#0F172A" strokeWidth="0.8" />
            <rect x="-14" y="-5" width="2" height="2" fill="#F97316" />
            <rect x="2" y="-5" width="2" height="2" fill="#F97316" />

            {/* Coupler 2 */}
            <rect x="-18" y="-1.2" width="3" height="2.4" rx="0.5" fill="#0F172A" />

            {/* Freight Container Wagon 2 */}
            <rect x="-38" y="-5.5" width="20" height="11" rx="1" fill="#334155" stroke="#0F172A" strokeWidth="0.8" />
            <rect x="-37" y="-5" width="2" height="2" fill="#F97316" />
            <rect x="-21" y="-5" width="2" height="2" fill="#F97316" />

            {/* LEVEL 3: Micro Stabled Marker Badge (Y = 52, above siding Y = 64) */}
            {variant !== 'yard' && (
              <g transform="translate(0, -12)">
                <rect x="-42" y="-6" width="84" height="12" rx="3" fill="#0F172A" stroke="#F97316" strokeWidth="0.9" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))" />
                <text x="0" y="2.5" textAnchor="middle" fill="#FFEDD5" fontSize="5.5" fontWeight="800" fontFamily="ui-monospace, monospace">
                  BCN-91 [STABLED]
                </text>
              </g>
            )}
          </g>

          {/* LEVEL 2 & 4: ROLE VARIANT LAYER: ENGINEERING (CO-LOCATION & MACHINE STAGING) */}
          {variant === 'engineering' && (
            <g id="engineeringVariantLayer">
              {/* Clean Machine Auto-Spacing & Demarcation Buffers */}
              <line x1="227" y1="54" x2="227" y2="86" stroke="#93C5FD" strokeWidth="1" strokeDasharray="2,2" opacity="0.75" />
              <text x="227" y="73" textAnchor="middle" fill="#1D4ED8" fontSize="4.5" fontWeight="900" fontFamily="monospace">≥500m</text>

              <line x1="302" y1="54" x2="302" y2="86" stroke="#93C5FD" strokeWidth="1" strokeDasharray="2,2" opacity="0.75" />
              <text x="302" y="73" textAnchor="middle" fill="#1D4ED8" fontSize="4.5" fontWeight="900" fontFamily="monospace">≥500m</text>

              <line x1="377" y1="54" x2="377" y2="86" stroke="#93C5FD" strokeWidth="1" strokeDasharray="2,2" opacity="0.75" />
              <text x="377" y="73" textAnchor="middle" fill="#1D4ED8" fontSize="4.5" fontWeight="900" fontFamily="monospace">≥500m</text>

              {/* Machine 1: BCM-340 (ENG · KM 104.2) - Level 2 Tag at Y = 60 */}
              <g transform="translate(190, 60)">
                <rect x="-22" y="-6.5" width="44" height="13" rx="3" fill="#451A03" stroke="#F59E0B" strokeWidth="0.9" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))" />
                <text x="0" y="2.5" textAnchor="middle" fill="#FEF3C7" fontSize="6" fontWeight="900" fontFamily="monospace">BCM-340</text>
              </g>
              {/* Machine 1 Chassis on Up Track (Y = 94) */}
              <g transform="translate(190, 94)">
                <line x1="0" y1="-27" x2="0" y2="-7" stroke="#F59E0B" strokeWidth="1" strokeDasharray="1,1" opacity="0.7" />
                <rect x="-12" y="-6" width="24" height="11" rx="1.5" fill="#D97706" stroke="#78350F" strokeWidth="1" />
                <rect x="12" y="-3" width="6" height="5" rx="1" fill="#451A03" />
                <circle cx="-5" cy="5" r="1.6" fill="#1E293B" />
                <circle cx="5" cy="5" r="1.6" fill="#1E293B" />
              </g>

              {/* Machine 2: CSM-09 (ENG · KM 108.5) - Level 2 Tag at Y = 60 */}
              <g transform="translate(265, 60)">
                <rect x="-22" y="-6.5" width="44" height="13" rx="3" fill="#78350F" stroke="#FDE68A" strokeWidth="0.9" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))" />
                <text x="0" y="2.5" textAnchor="middle" fill="#FEF3C7" fontSize="6" fontWeight="900" fontFamily="monospace">CSM-09</text>
              </g>
              {/* Machine 2 Chassis on Up Track (Y = 94) */}
              <g transform="translate(265, 94)">
                <line x1="0" y1="-27" x2="0" y2="-7" stroke="#FDE68A" strokeWidth="1" strokeDasharray="1,1" opacity="0.7" />
                <rect x="-12" y="-6" width="24" height="11" rx="1.5" fill="#F59E0B" stroke="#92400E" strokeWidth="1" />
                <line x1="-5" y1="5" x2="-5" y2="8" stroke="#78350F" strokeWidth="1.5" />
                <line x1="5" y1="5" x2="5" y2="8" stroke="#78350F" strokeWidth="1.5" />
                <circle cx="-7" cy="5" r="1.6" fill="#1E293B" />
                <circle cx="7" cy="5" r="1.6" fill="#1E293B" />
              </g>

              {/* Machine 3: RU-44 OHE (TRD · KM 112.0) - Level 2 Tag at Y = 60 */}
              <g transform="translate(340, 60)">
                <rect x="-20" y="-6.5" width="40" height="13" rx="3" fill="#4C1D95" stroke="#C4B5FD" strokeWidth="0.9" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))" />
                <text x="0" y="2.5" textAnchor="middle" fill="#EDE9FE" fontSize="6" fontWeight="900" fontFamily="monospace">RU-44</text>
              </g>
              {/* Machine 3 Chassis on Up Track (Y = 94) */}
              <g transform="translate(340, 94)">
                <line x1="0" y1="-27" x2="0" y2="-7" stroke="#C4B5FD" strokeWidth="1" strokeDasharray="1,1" opacity="0.7" />
                <rect x="-12" y="-6" width="24" height="11" rx="1.5" fill="#7C3AED" stroke="#4C1D95" strokeWidth="1" />
                <path d="M -5 -6 L 0 -10 L 5 -6" fill="none" stroke="#DDD6FE" strokeWidth="1.2" />
                <circle cx="-6" cy="5" r="1.6" fill="#1E293B" />
                <circle cx="6" cy="5" r="1.6" fill="#1E293B" />
              </g>

              {/* Machine 4: S&T-02 (S&T · KM 116.5) - Level 2 Tag at Y = 60 */}
              <g transform="translate(415, 60)">
                <rect x="-20" y="-6.5" width="40" height="13" rx="3" fill="#134E4A" stroke="#5EEAD4" strokeWidth="0.9" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))" />
                <text x="0" y="2.5" textAnchor="middle" fill="#CCFBF1" fontSize="6" fontWeight="900" fontFamily="monospace">S&amp;T-02</text>
              </g>
              {/* Machine 4 Chassis on Up Track (Y = 94) */}
              <g transform="translate(415, 94)">
                <line x1="0" y1="-27" x2="0" y2="-7" stroke="#5EEAD4" strokeWidth="1" strokeDasharray="1,1" opacity="0.7" />
                <rect x="-11" y="-5.5" width="22" height="11" rx="1.5" fill="#0D9488" stroke="#134E4A" strokeWidth="1" />
                <circle cx="-4" cy="-1" r="1.5" fill="#99F6E4" />
                <circle cx="-5" cy="5.5" r="1.6" fill="#1E293B" />
                <circle cx="5" cy="5.5" r="1.6" fill="#1E293B" />
              </g>

              {/* LEVEL 4: Physical Clearance Verification Badge (Y = 126, +32px below track) */}
              <g transform="translate(302, 126)">
                <rect x="-120" y="-7" width="240" height="14" rx="3.5" fill="#064E3B" stroke="#34D399" strokeWidth="0.9" />
                <text x="0" y="3" textAnchor="middle" fill="#A7F3D0" fontSize="5.5" fontWeight="900" fontFamily="monospace">
                  PHYSICAL CLEARANCE: ALL DEPTS VERIFIED (G&amp;SR 4.14)
                </text>
              </g>
            </g>
          )}

          {/* LEVEL 2 & 4: ROLE VARIANT LAYER: YARD (DECLUTTERED: NO MACHINE BUFFERS) */}
          {variant === 'yard' && (
            <g id="yardVariantLayer">
              {/* Turnout Status Badges positioned clear of track labels */}
              <g transform="translate(105, 80)">
                <rect x="-24" y="-6" width="48" height="12" rx="3" fill="#065F46" stroke="#34D399" strokeWidth="0.8" />
                <text x="0" y="2.5" textAnchor="middle" fill="#ECFDF5" fontSize="5.5" fontWeight="900" fontFamily="monospace">T-101A: NORMAL</text>
              </g>

              {/* T-102A at ALJN Main Turnout Point */}
              <g transform="translate(575, 108)">
                <rect x="-25" y="-6" width="50" height="12" rx="3" fill="#065F46" stroke="#34D399" strokeWidth="0.8" />
                <text x="0" y="2.5" textAnchor="middle" fill="#ECFDF5" fontSize="5.5" fontWeight="900" fontFamily="monospace">T-102A: NORMAL</text>
              </g>

              {/* T-102B at Siding Reverse Switch (Y=48, well clear of PF-0 GOODS SIDING at Y=28) */}
              <g transform="translate(600, 48)">
                <rect x="-26" y="-6" width="52" height="12" rx="3" fill="#581C87" stroke="#C084FC" strokeWidth="0.8" />
                <text x="0" y="2.5" textAnchor="middle" fill="#FAF5FF" fontSize="5.5" fontWeight="900" fontFamily="monospace">T-102B: REVERSE</text>
              </g>

              {/* T-102C at Siding Crossover Merge */}
              <g transform="translate(755, 108)">
                <rect x="-25" y="-6" width="50" height="12" rx="3" fill="#065F46" stroke="#34D399" strokeWidth="0.8" />
                <text x="0" y="2.5" textAnchor="middle" fill="#ECFDF5" fontSize="5.5" fontWeight="900" fontFamily="monospace">T-102C: NORMAL</text>
              </g>

              {/* Dwell Advisory Badge on Stabled Freight Rake (Level 2.5, Y = 50) */}
              <g transform="translate(668, 50)">
                <rect x="-56" y="-6" width="112" height="12" rx="3" fill="#1E293B" stroke="#F97316" strokeWidth="0.9" />
                <text x="0" y="2.5" textAnchor="middle" fill="#FFEDD5" fontSize="5.5" fontWeight="900" fontFamily="monospace">
                  BCN-91 [STABLED · DWELL 1h 42m]
                </text>
              </g>

              {/* Level 5: Station Master Statutory Compliance Ribbon */}
              <g transform="translate(500, 230)">
                <rect x="-330" y="-8" width="660" height="16" rx="4" fill="#FEF2F2" stroke="#EF4444" strokeWidth="1" />
                <text x="0" y="3.5" textAnchor="middle" fill="#991B1B" fontSize="6.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.5">
                  ⚠️ G&amp;SR RULE 4.14 ADVISORY DISPLAY — NO SIGNAL/POINT CONTROLS EN ROUTE · STATION MASTER ADVISORY ONLY
                </text>
              </g>
            </g>
          )}

          {/* LEVEL 2 & 4: ROLE VARIANT LAYER: FIELD (DECLUTTERED: ONLY BOUNDARY STOP BOARDS) */}
          {variant === 'field' && (
            <g id="fieldVariantLayer">
              {/* 500m Safety Buffer Overlap Zones */}
              <rect x="45" y="80" width="25" height="40" fill="rgba(245, 158, 11, 0.18)" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="2,2" />
              <text x="57" y="76" textAnchor="middle" fill="#B45309" fontSize="5" fontWeight="900" fontFamily="monospace">500m BUFFER</text>

              <rect x="390" y="80" width="25" height="40" fill="rgba(245, 158, 11, 0.18)" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="2,2" />
              <text x="402" y="76" textAnchor="middle" fill="#B45309" fontSize="5" fontWeight="900" fontFamily="monospace">500m BUFFER</text>

              {/* Field Crew Geofenced Work Perimeter Box */}
              <rect x="68" y="70" width="324" height="60" rx="6" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeDasharray="5,3" opacity="0.9" />

              {/* LEVEL 2: Red Stop Board Flag / Handback Peg 1 at KM 100.000 */}
              <g transform="translate(70, 56)">
                <rect x="-14" y="-12" width="28" height="12" rx="2" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1" />
                <line x1="-14" y1="-6" x2="14" y2="-6" stroke="#FFFFFF" strokeWidth="3" />
                <line x1="0" y1="0" x2="0" y2="38" stroke="#7F1D1D" strokeWidth="2" />
                <text x="0" y="-15" textAnchor="middle" fill="#991B1B" fontSize="5.5" fontWeight="900" fontFamily="monospace">STOP KM 100.000</text>
                <text x="0" y="48" textAnchor="middle" fill="#1E293B" fontSize="5" fontWeight="900" fontFamily="monospace">G&amp;SR PEG #1</text>
              </g>

              {/* LEVEL 2: Red Stop Board Flag / Handback Peg 2 at KM 120.000 */}
              <g transform="translate(390, 56)">
                <rect x="-14" y="-12" width="28" height="12" rx="2" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1" />
                <line x1="-14" y1="-6" x2="14" y2="-6" stroke="#FFFFFF" strokeWidth="3" />
                <line x1="0" y1="0" x2="0" y2="38" stroke="#7F1D1D" strokeWidth="2" />
                <text x="0" y="-15" textAnchor="middle" fill="#991B1B" fontSize="5.5" fontWeight="900" fontFamily="monospace">STOP KM 120.000</text>
                <text x="0" y="48" textAnchor="middle" fill="#1E293B" fontSize="5" fontWeight="900" fontFamily="monospace">G&amp;SR PEG #2</text>
              </g>

              {/* LEVEL 4: Physical Clearance Verification Badge (Y = 126) */}
              <g transform="translate(230, 126)">
                <rect x="-120" y="-7" width="240" height="14" rx="3.5" fill="#064E3B" stroke="#34D399" strokeWidth="0.9" />
                <text x="0" y="3" textAnchor="middle" fill="#A7F3D0" fontSize="5.5" fontWeight="900" fontFamily="monospace">
                  PHYSICAL CLEARANCE: ALL DEPTS VERIFIED (G&amp;SR 4.14)
                </text>
              </g>
            </g>
          )}

          {/* LAYER 5: AUTHENTIC NORTHERN RAILWAY STATIONS (GZB, ANVR, ALJN, TDL) */}
          <line x1="70" y1="116" x2="70" y2="165" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.7" />
          <line x1="390" y1="116" x2="390" y2="165" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.7" />
          <line x1="710" y1="116" x2="710" y2="165" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.7" />
          <line x1="920" y1="116" x2="920" y2="165" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.7" />

          {/* GZB (Ghaziabad Jn - KM 100.0) */}
          <g 
            className="cursor-pointer"
            onMouseEnter={() => setHoveredStation({
              code: 'GZB',
              name: 'Ghaziabad Junction',
              km: 'KM 100.0',
              platforms: 6,
              interlocking: 'Route Relay Interlocking (RRI) · Electronic Interlocking Phase-2',
              type: 'Major Junction & Locomotive Shed · Delhi Division Main Hub'
            })}
            onMouseLeave={() => setHoveredStation(null)}
          >
            <circle cx="70" cy="170" r="18" fill="transparent" />
            <circle cx="70" cy="170" r="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.1))" />
            <circle cx="70" cy="170" r="4" fill="#2563EB" />
            <text x="70" y="196" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0F172A">
              GZB (Ghaziabad Jn)
            </text>
            <text x="70" y="212" textAnchor="middle" fontSize="11" fontWeight="500" fill="#64748B" className="metric-mono">
              KM 100.0 • 6 PF
            </text>
          </g>

          {/* ANVR (Anand Vihar - KM 120.0) */}
          <g 
            className="cursor-pointer"
            onMouseEnter={() => setHoveredStation({
              code: 'ANVR',
              name: 'Anand Vihar Terminal',
              km: 'KM 120.0',
              platforms: 7,
              interlocking: 'Solid State Electronic Interlocking (EI) · Central Traffic Control',
              type: 'Mega Passenger Terminal · Double Track Corridor Gateway'
            })}
            onMouseLeave={() => setHoveredStation(null)}
          >
            <circle cx="390" cy="170" r="18" fill="transparent" />
            <circle cx="390" cy="170" r="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.1))" />
            <circle cx="390" cy="170" r="4" fill="#2563EB" />
            <text x="390" y="196" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0F172A">
              ANVR (Anand Vihar)
            </text>
            <text x="390" y="212" textAnchor="middle" fontSize="11" fontWeight="500" fill="#64748B" className="metric-mono">
              KM 120.0 • 7 PF
            </text>
          </g>

          {/* ALJN (Aligarh Jn - KM 140.0) */}
          <g 
            className="cursor-pointer"
            onMouseEnter={() => setHoveredStation({
              code: 'ALJN',
              name: 'Aligarh Junction',
              km: 'KM 140.0',
              platforms: 7,
              interlocking: 'Electronic Interlocking (EI) · Dual Section Axle Counters',
              type: 'Major Junction & Goods Siding Yard · Double to Single Transition'
            })}
            onMouseLeave={() => setHoveredStation(null)}
          >
            <circle cx="710" cy="170" r="18" fill="transparent" />
            <circle cx="710" cy="170" r="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.1))" />
            <circle cx="710" cy="170" r="4" fill="#7C3AED" />
            <text x="710" y="196" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0F172A">
              ALJN (Aligarh Jn)
            </text>
            <text x="710" y="212" textAnchor="middle" fontSize="11" fontWeight="500" fill="#64748B" className="metric-mono">
              KM 140.0 • 7 PF
            </text>
          </g>

          {/* TDL (Tundla Jn - KM 158.0) */}
          <g 
            className="cursor-pointer"
            onMouseEnter={() => setHoveredStation({
              code: 'TDL',
              name: 'Tundla Junction',
              km: 'KM 158.0',
              platforms: 5,
              interlocking: 'Route Relay Interlocking · Automatic Block Signalling Terminal',
              type: 'Division Terminal Station · Crew Changing & Freight Yard'
            })}
            onMouseLeave={() => setHoveredStation(null)}
          >
            <circle cx="920" cy="170" r="18" fill="transparent" />
            <circle cx="920" cy="170" r="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.1))" />
            <circle cx="920" cy="170" r="4" fill="#7C3AED" />
            <text x="920" y="196" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0F172A">
              TDL (Tundla Jn)
            </text>
            <text x="920" y="212" textAnchor="middle" fontSize="11" fontWeight="500" fill="#64748B" className="metric-mono">
              KM 158.0 • 5 PF
            </text>
          </g>
        </svg>
      </div>

      {/* 5. INTERACTIVE GLASS TELEMETRY POPOVER / READOUT BAR */}
      <div className="mt-3">
        {hoveredStation ? (
          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-blue-200 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xs">
                {hoveredStation.code}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">{hoveredStation.name}</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {hoveredStation.km}
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    {hoveredStation.platforms} Platforms
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {hoveredStation.type}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-bold text-slate-700">Interlocking:</span>
              <span className="font-semibold text-slate-900">{hoveredStation.interlocking}</span>
            </div>
          </div>
        ) : hoveredTrain ? (
          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-emerald-200 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs">
                <Train className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">
                    Train {hoveredTrain.trainNo} · {hoveredTrain.name}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {hoveredTrain.priority}
                  </span>
                  <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {hoveredTrain.speed}
                  </span>
                </div>
                <div className="text-[11px] font-mono font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                  <Activity size={12} className="text-blue-600 shrink-0" />
                  <span>{hoveredTrain.telemetryText}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-lg border border-emerald-200 font-bold shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></div>
              <span>{hoveredTrain.status}</span>
            </div>
          </div>
        ) : hoveredWorkZone ? (
          <div className="bg-amber-50/95 backdrop-blur-md p-3.5 rounded-xl border border-amber-300 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-200/80 flex items-center justify-center text-amber-900 font-black text-xs">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-950">Active Joint Block Containment Zone</span>
                  <span className="text-[10px] font-extrabold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                    KM 104.00 – KM 125.00 (21 km)
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
            <div className="text-[10px] text-amber-900 bg-white/80 px-3 py-1.5 rounded-lg border border-amber-300 font-bold">
              Signal Interlock: Section Block Absolute Protection Active
            </div>
          </div>
        ) : (
          <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500">
            <div className="flex items-center gap-3 font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Automatic Interlocking &amp; Absolute Block: Active
              </span>
              <span>•</span>
              <span>Track Circuit Detection: Normal (0 Failures)</span>
              <span>•</span>
              <span className="text-blue-600 font-bold">Hover over any station or train for live telemetry</span>
            </div>
            <div className="font-mono text-slate-400">
              G&amp;SR § 4.12 Compliant
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorridorTrackTopology;
