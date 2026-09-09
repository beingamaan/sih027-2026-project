import React from 'react';
import { 
  CheckCircle2, 
  Activity, 
  Clock, 
  ShieldCheck, 
  Radio, 
  Zap, 
  Sliders, 
  AlertTriangle 
} from 'lucide-react';

interface RecentEventItem {
  id: string;
  time: string;
  dotColor: string;
  title: string;
  category: string;
  details: string;
}

const DEFAULT_EVENTS: RecentEventItem[] = [
  {
    id: 'evt-1',
    time: '09:42',
    dotColor: 'bg-[#16805C]', // Railway Green
    title: 'Readiness Score Updated: 88 / 100',
    category: 'READINESS GATE',
    details: 'Plan A eligible (P50 optimal). Track availability validated across STB–STC.'
  },
  {
    id: 'evt-2',
    time: '09:38',
    dotColor: 'bg-[#1E5AA8]', // Royal Blue
    title: 'Machine Siding Staging Verified',
    category: 'PLASSER TAMPING',
    details: 'CSM-09 unit safely stabled on Loop 3 at Station Bravo (KM 120.0).'
  },
  {
    id: 'evt-3',
    time: '09:25',
    dotColor: 'bg-[#7456B8]', // Signal Violet
    title: 'S&T Joint Disconnection Notice Issued',
    category: 'S&T SIGNALLING',
    details: 'Axle counter & point machine isolation notice acknowledged by SSE (Sig/NDLS).'
  },
  {
    id: 'evt-4',
    time: '09:12',
    dotColor: 'bg-[#D9901A]', // Railway Amber
    title: 'Precautionary Speed Buffer Computed',
    category: 'TRAFFIC REGULATION',
    details: 'Goods BCN-91 assigned 15 min precedence hold at Station Alpha.'
  }
];

export const CorridorDiagnosticsAndEvents: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Corridor Diagnostics Card */}
      <div className="card-warm p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-[#D9E0E8]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EAF2FF] text-[#1E5AA8] flex items-center justify-center font-bold">
                <Activity size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#102A43] uppercase tracking-wider font-sans">
                  Corridor Diagnostics
                </h3>
                <p className="text-[11px] text-[#627D98] font-medium">
                  Delhi Division · Section KM 100.0 – 158.0 Real-time Health
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-[#EAF6F0] text-[#16805C] border border-[#C6EADB] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16805C] animate-pulse"></span>
              All Systems Normal
            </span>
          </div>

          {/* 4 Diagnostics Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {/* 1. Track Geo */}
            <div className="p-3.5 rounded-xl bg-white border border-[#D9E0E8] hover:border-[#BCC8D6] transition-colors shadow-[0_2px_6px_rgba(15,42,67,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#102A43]">Track Geo</span>
                <span className="text-[11px] font-black text-[#16805C] flex items-center gap-1 bg-[#EAF6F0] px-2 py-0.5 rounded border border-[#C6EADB]">
                  ✓ OK
                </span>
              </div>
              <p className="text-[11px] text-[#486581] mt-1.5 font-medium">
                Laser Alignment Verified
              </p>
              <div className="mt-2 w-full bg-[#F0F4F8] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#16805C] h-full w-[96%] rounded-full"></div>
              </div>
            </div>

            {/* 2. OHE */}
            <div className="p-3.5 rounded-xl bg-white border border-[#D9E0E8] hover:border-[#BCC8D6] transition-colors shadow-[0_2px_6px_rgba(15,42,67,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#102A43]">OHE Power</span>
                <span className="text-[11px] font-black text-[#16805C] flex items-center gap-1 bg-[#EAF6F0] px-2 py-0.5 rounded border border-[#C6EADB]">
                  ✓ OK
                </span>
              </div>
              <p className="text-[11px] text-[#486581] mt-1.5 font-medium">
                25kV Catenary Normal
              </p>
              <div className="mt-2 w-full bg-[#F0F4F8] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#16805C] h-full w-[99%] rounded-full"></div>
              </div>
            </div>

            {/* 3. S&T */}
            <div className="p-3.5 rounded-xl bg-white border border-[#D9E0E8] hover:border-[#BCC8D6] transition-colors shadow-[0_2px_6px_rgba(15,42,67,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#102A43]">S&T Signalling</span>
                <span className="text-[11px] font-black text-[#16805C] flex items-center gap-1 bg-[#EAF6F0] px-2 py-0.5 rounded border border-[#C6EADB]">
                  ✓ OK
                </span>
              </div>
              <p className="text-[11px] text-[#486581] mt-1.5 font-medium">
                Axle Counters Functional
              </p>
              <div className="mt-2 w-full bg-[#F0F4F8] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#16805C] h-full w-[98%] rounded-full"></div>
              </div>
            </div>

            {/* 4. Structures */}
            <div className="p-3.5 rounded-xl bg-white border border-[#D9E0E8] hover:border-[#BCC8D6] transition-colors shadow-[0_2px_6px_rgba(15,42,67,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#102A43]">Structures</span>
                <span className="text-[11px] font-black text-[#16805C] flex items-center gap-1 bg-[#EAF6F0] px-2 py-0.5 rounded border border-[#C6EADB]">
                  ✓ OK
                </span>
              </div>
              <p className="text-[11px] text-[#486581] mt-1.5 font-medium">
                Bridge Piers &amp; Culverts Clear
              </p>
              <div className="mt-2 w-full bg-[#F0F4F8] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#16805C] h-full w-[94%] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#D9E0E8] flex items-center justify-between text-xs text-[#627D98]">
          <span className="font-mono text-[11px]">Next Sensor Telemetry Scan in: 18s</span>
          <span className="text-[#1E5AA8] font-bold cursor-pointer hover:underline">
            View Live Sensor Topo →
          </span>
        </div>
      </div>

      {/* 2. Recent Events Card */}
      <div className="card-warm p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-[#D9E0E8]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FFF7E6] text-[#D9901A] flex items-center justify-center font-bold">
                <Clock size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#102A43] uppercase tracking-wider font-sans">
                  Recent Events
                </h3>
                <p className="text-[11px] text-[#627D98] font-medium">
                  Corridor Readiness &amp; Machine Movement Stream
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-[#627D98] bg-[#F0F4F8] px-2.5 py-1 rounded-md border border-[#D9E0E8]">
              Live Stream Active
            </span>
          </div>

          {/* Events Stream */}
          <div className="space-y-3 mt-3.5">
            {DEFAULT_EVENTS.map((evt) => (
              <div 
                key={evt.id} 
                className="p-3 rounded-xl bg-white border border-[#D9E0E8] hover:border-[#BCC8D6] transition-colors flex items-start gap-3"
              >
                <div className="flex flex-col items-center shrink-0 mt-0.5">
                  <span className="font-mono text-xs font-black text-[#334E68]">{evt.time}</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${evt.dotColor} mt-1.5 ring-2 ring-white`}></span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#102A43] truncate">
                      {evt.title}
                    </h4>
                    <span className="text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#F0F4F8] text-[#486581] border border-[#D9E0E8] shrink-0">
                      {evt.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#486581] mt-0.5 leading-snug">
                    {evt.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#D9E0E8] flex items-center justify-between text-xs text-[#627D98]">
          <span className="font-mono text-[11px]">Total Events Today: 48</span>
          <span className="text-[#1E5AA8] font-bold cursor-pointer hover:underline">
            Open Event Audit Archive →
          </span>
        </div>
      </div>
    </div>
  );
};
