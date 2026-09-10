import React from 'react';
import { AlertTriangle, Wrench, Shield, Compass, CheckCircle2, Clock } from 'lucide-react';

export interface TSRItem {
  id: string;
  section: string;
  km_range: string;
  speed_kmph: number;
  normal_speed_kmph: number;
  imposed_days: number;
  wtm_loss_per_day: number;
  reason: string;
  target_block: string;
}

export interface MachineItem {
  code: string;
  name: string;
  type: string;
  siding_location: string;
  chainage_km: number;
  status: 'READY' | 'IN_TRANSIT' | 'MAINTENANCE';
  operator: string;
  fuel_percent: number;
}

const mockTSRs: TSRItem[] = [
  {
    id: 'TSR-ENG-104',
    section: 'GZB - ANVR (KM 100.0 - 120.0)',
    km_range: 'KM 104.2 – 108.0',
    speed_kmph: 30,
    normal_speed_kmph: 110,
    imposed_days: 14,
    wtm_loss_per_day: 42.5,
    reason: 'Deep screening & track bed stabilization',
    target_block: 'BLK-2026-DLI-01'
  },
  {
    id: 'TSR-ENG-119',
    section: 'ANVR - ALJN (KM 120.0 - 140.0)',
    km_range: 'KM 120.0 – 124.5',
    speed_kmph: 45,
    normal_speed_kmph: 100,
    imposed_days: 8,
    wtm_loss_per_day: 28.0,
    reason: 'Through sleeper renewal & weld examination',
    target_block: 'BLK-2026-DLI-04'
  },
  {
    id: 'TSR-ENG-128',
    section: 'ALJN - TDL (KM 140.0 - 158.0)',
    km_range: 'KM 142.0 – 144.5',
    speed_kmph: 20,
    normal_speed_kmph: 110,
    imposed_days: 3,
    wtm_loss_per_day: 56.2,
    reason: 'Turnout switch renewal & lead curve dressing',
    target_block: 'BLK-2026-DLI-03'
  }
];

const mockMachines: MachineItem[] = [
  {
    code: 'CSM-952',
    name: 'Continuous Action Tamper',
    type: 'Track Tamping & Lining',
    siding_location: 'ANVR Siding (Line 3)',
    chainage_km: 119.2,
    status: 'READY',
    operator: 'S. Sharma (Sr. Tech)',
    fuel_percent: 92
  },
  {
    code: 'BCM-412',
    name: 'Ballast Cleaning Machine',
    type: 'Deep Screening Unit',
    siding_location: 'GZB Siding (Loop 2)',
    chainage_km: 100.0,
    status: 'READY',
    operator: 'R. Verma (SSE/Mech)',
    fuel_percent: 78
  },
  {
    code: 'DGS-340',
    name: 'Dynamic Track Stabilizer',
    type: 'Track Settlement Unit',
    siding_location: 'TDL Yard (Siding A)',
    chainage_km: 158.0,
    status: 'IN_TRANSIT',
    operator: 'M. Patel (Tech-I)',
    fuel_percent: 64
  }
];

export const PWayPanel: React.FC = () => {
  const totalWtmLoss = mockTSRs.reduce((acc, t) => acc + t.wtm_loss_per_day, 0);

  return (
    <div className="space-y-6">
      {/* Top Engineering Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border-l-4 border-l-[#D9A05B] border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Speed Restrictions</span>
            <AlertTriangle size={15} className="text-[#D9A05B]" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">{mockTSRs.length} <span className="text-xs font-normal text-slate-500">locations</span></p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9A05B]"></span>
            Cumulative TSR impact: <strong className="text-slate-800 font-mono">{totalWtmLoss.toFixed(1)} WTM/day</strong>
          </p>
        </div>

        <div className="bg-white border-l-4 border-l-[#D9A05B] border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tamping / BCM Fleet</span>
            <Wrench size={15} className="text-[#D9A05B]" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">2 / 3 <span className="text-xs font-normal text-slate-500">Operational</span></p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            CSM-952 stabled & pre-checked at STB
          </p>
        </div>

        <div className="bg-white border-l-4 border-l-[#D9A05B] border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Corridor Health Index</span>
            <Shield size={15} className="text-[#D9A05B]" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">94.2 <span className="text-xs font-normal text-slate-500">/ 100</span></p>
          <p className="text-[11px] text-slate-500 mt-1">
            Track Quality Index (TQI) within permissible limits
          </p>
        </div>
      </div>

      {/* Active TSR Register */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D9A05B]"></span>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Active Temporary Speed Restrictions (TSR Register)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Permanent Way restrictions imposing line capacity friction and passenger delay minutes.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-50 text-[#9E651E] border border-amber-200">
            Total TSRs: {mockTSRs.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="pb-2">TSR ID & Section</th>
                <th className="pb-2">Chainage Span</th>
                <th className="pb-2">Speed Restriction</th>
                <th className="pb-2">Age (Days)</th>
                <th className="pb-2">WTM Cost / Day</th>
                <th className="pb-2">Engineering Justification</th>
                <th className="pb-2 text-right">Target Block</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockTSRs.map((tsr) => (
                <tr key={tsr.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 font-semibold text-slate-900">
                    <span className="font-mono text-xs text-[#9E651E] font-bold block">{tsr.id}</span>
                    <span className="text-[11px] text-slate-500">{tsr.section}</span>
                  </td>
                  <td className="py-3 font-mono font-bold text-slate-700">{tsr.km_range}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded font-black font-mono text-[11px] bg-amber-100 text-amber-900 border border-amber-300">
                      {tsr.speed_kmph} KMPH
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Normal: {tsr.normal_speed_kmph} KMPH</span>
                  </td>
                  <td className="py-3">
                    <span className="font-mono font-bold text-slate-800">{tsr.imposed_days}d</span>
                    <span className="text-[10px] text-slate-400 block">{tsr.imposed_days > 10 ? 'Overdue clearance' : 'Within window'}</span>
                  </td>
                  <td className="py-3 font-mono font-bold text-[#B42332]">
                    +{tsr.wtm_loss_per_day} WTM
                  </td>
                  <td className="py-3 text-slate-600 max-w-[220px] truncate" title={tsr.reason}>
                    {tsr.reason}
                  </td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      {tsr.target_block}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Machine Fleet & Stabling Sidings */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D9A05B]"></span>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                P-Way Track Machines & Siding Stabling
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tamping machine and ballast cleaner deployment status, siding locations, and crew availability.
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">All units fitted with GPS telematics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockMachines.map((m) => (
            <div key={m.code} className="border border-slate-200/70 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-sm text-slate-900">{m.code}</span>
                  <p className="text-[11px] font-medium text-slate-500">{m.name}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  m.status === 'READY' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  {m.status === 'READY' ? <CheckCircle2 size={11} className="text-emerald-600" /> : <Clock size={11} className="text-blue-600" />}
                  {m.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Siding Location:</span>
                  <span className="font-semibold text-slate-800 font-mono">{m.siding_location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Chainage:</span>
                  <span className="font-mono text-slate-700">KM {m.chainage_km.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Operator / Tech:</span>
                  <span className="text-slate-800">{m.operator}</span>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
                    <span>Fuel & Hydraulic Fluid</span>
                    <span>{m.fuel_percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${m.fuel_percent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
