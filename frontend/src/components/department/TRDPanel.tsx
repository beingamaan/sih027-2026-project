import React, { useState } from 'react';
import { Zap, ShieldAlert, FileText, CheckCircle2, AlertOctagon, User, Radio } from 'lucide-react';

export interface ElementarySection {
  id: string;
  name: string;
  km_span: string;
  substation: string;
  status: 'ENERGIZED' | 'ISOLATED' | 'EARTHED';
  voltage_kv: number;
  isolator_id: string;
  isolator_state: 'CLOSED' | 'OPEN';
  target_task?: string;
}

const initialSections: ElementarySection[] = [
  { id: 'ES-101', name: 'STA - Anandpur UP', km_span: 'KM 100.0 – 108.4', substation: 'TSS Anandpur', status: 'ENERGIZED', voltage_kv: 25.4, isolator_id: 'ISO-101', isolator_state: 'CLOSED' },
  { id: 'ES-102', name: 'STA - Anandpur DN', km_span: 'KM 100.0 – 108.4', substation: 'TSS Anandpur', status: 'ENERGIZED', voltage_kv: 25.3, isolator_id: 'ISO-102', isolator_state: 'CLOSED' },
  { id: 'ES-103', name: 'Anandpur - Barhan UP', km_span: 'KM 108.4 – 119.2', substation: 'SP Barhan', status: 'ISOLATED', voltage_kv: 0.0, isolator_id: 'ISO-103', isolator_state: 'OPEN', target_task: 'TSK_TRD_03' },
  { id: 'ES-104', name: 'Anandpur - Barhan DN', km_span: 'KM 108.4 – 119.2', substation: 'SP Barhan', status: 'ENERGIZED', voltage_kv: 25.1, isolator_id: 'ISO-104', isolator_state: 'CLOSED' },
  { id: 'ES-105', name: 'Barhan - Chamrola UP', km_span: 'KM 119.2 – 128.5', substation: 'SSP Chamrola', status: 'ENERGIZED', voltage_kv: 25.2, isolator_id: 'ISO-105', isolator_state: 'CLOSED' },
  { id: 'ES-106', name: 'Barhan - Chamrola DN', km_span: 'KM 119.2 – 128.5', substation: 'SSP Chamrola', status: 'ENERGIZED', voltage_kv: 25.2, isolator_id: 'ISO-106', isolator_state: 'CLOSED' },
  { id: 'ES-107', name: 'Chamrola - Daudpur UP', km_span: 'KM 128.5 – 137.9', substation: 'TSS Daudpur', status: 'ENERGIZED', voltage_kv: 25.5, isolator_id: 'ISO-107', isolator_state: 'CLOSED' },
  { id: 'ES-108', name: 'Chamrola - Daudpur DN', km_span: 'KM 128.5 – 137.9', substation: 'TSS Daudpur', status: 'ENERGIZED', voltage_kv: 25.4, isolator_id: 'ISO-108', isolator_state: 'CLOSED' },
];

export const TRDPanel: React.FC = () => {
  const [sections, setSections] = useState<ElementarySection[]>(initialSections);
  const [selectedES, setSelectedES] = useState<ElementarySection>(initialSections[2]); // ES-103 default

  // Calculate isolated sections count
  const isolatedCount = sections.filter(s => s.status !== 'ENERGIZED').length;

  return (
    <div className="space-y-6">
      {/* Top TRD Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border-l-4 border-l-[#8B7CF6] border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">25 kV OHE Grid Feeder</span>
            <Zap size={15} className="text-[#8B7CF6]" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">25.2 <span className="text-xs font-normal text-slate-500">kV RMS</span></p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            TSS Anandpur & Daudpur in synchronism
          </p>
        </div>

        <div className="bg-white border-l-4 border-l-[#8B7CF6] border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Elementary Isolation Status</span>
            <AlertOctagon size={15} className="text-[#8B7CF6]" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">{isolatedCount} / {sections.length} <span className="text-xs font-normal text-slate-500">Isolated</span></p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B7CF6]"></span>
            Section ES-103 isolated for OHE Cantilever work
          </p>
        </div>

        <div className="bg-white border-l-4 border-l-[#8B7CF6] border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">PTW Memo Registry</span>
            <FileText size={15} className="text-[#8B7CF6]" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">1 <span className="text-xs font-normal text-slate-500">Active Memo</span></p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono text-purple-700 font-semibold">
            PTW-TRD-2026-882 issued
          </p>
        </div>
      </div>

      {/* Elementary Section Isolation Strip (ES-101 to ES-108) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8B7CF6]"></span>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Corridor 25 kV Elementary Section Isolation Strip (ES-101 to ES-108)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any elementary section block to inspect isolator switch state and feeder continuity.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-bold">
            SCADA Feed: REALTIME
          </span>
        </div>

        {/* 8-Section Interactive Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {sections.map((es) => {
            const isSelected = selectedES.id === es.id;
            const isIsolated = es.status === 'ISOLATED' || es.status === 'EARTHED';

            return (
              <button
                key={es.id}
                onClick={() => setSelectedES(es)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'ring-2 ring-[#8B7CF6] shadow-md ' + (isIsolated ? 'bg-purple-50/80 border-purple-300' : 'bg-slate-50 border-slate-300')
                    : isIsolated
                      ? 'bg-purple-50/50 border-purple-200 hover:border-purple-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-black text-slate-900">{es.id}</span>
                  <span className={`w-2 h-2 rounded-full ${isIsolated ? 'bg-purple-600 animate-pulse' : 'bg-emerald-500'}`} />
                </div>
                <p className="text-[10px] font-bold text-slate-600 truncate">{es.name}</p>
                <p className="text-[9px] font-mono text-slate-400 mt-0.5">{es.km_span}</p>
                <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-[9px] font-bold px-1 rounded ${
                    isIsolated ? 'bg-purple-100 text-purple-800' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {es.status}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-slate-700">{es.voltage_kv} kV</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail Inspection Box for Selected Section */}
        <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${selectedES.status === 'ISOLATED' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
              <Zap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-900">{selectedES.id}: {selectedES.name}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  selectedES.status === 'ISOLATED' ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {selectedES.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Feeder Substation: <strong className="text-slate-700">{selectedES.substation}</strong> • Chainage: <strong className="text-slate-700">{selectedES.km_span}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-sans">Isolator Switch</span>
              <p className="font-bold text-slate-800">{selectedES.isolator_id}: <span className={selectedES.isolator_state === 'OPEN' ? 'text-purple-600' : 'text-emerald-600'}>{selectedES.isolator_state}</span></p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-sans">Voltage Level</span>
              <p className="font-bold text-slate-800">{selectedES.voltage_kv} kV AC</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Permit to Work (PTW) & Overlap Warning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PTW Active Memo Badge Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8B7CF6]"></span>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Active Permit to Work (PTW Badge)
              </h3>
            </div>
            <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300">
              PTW VALID
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">PTW Memo Number:</span>
              <span className="font-mono font-bold text-slate-900">PTW-TRD-2026-882</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Authorized Holder:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <User size={12} className="text-[#8B7CF6]" />
                P. Kulkarni (SSE/TRD/DLI)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Target Elementary Section:</span>
              <span className="font-mono font-bold text-purple-800">ES-103 (KM 108.4 – 119.2)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Scheduled Duration:</span>
              <span className="font-mono text-slate-700">120 minutes (02:00 – 04:00 hrs)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Earthing Discharge Rods:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} />
                Fitted at Mast 112/14 & 116/08
              </span>
            </div>
          </div>
        </div>

        {/* Overlapping Feeder Conflict Warning Detector */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8B7CF6]"></span>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Substation Interlock & Overlap Detector
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              NO CONFLICTS
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Automatic SCADA interlock validator ensures no two concurrent tasks request conflicting OHE isolations on the same elementary feeding zone.
          </p>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">TSS Anandpur Bus Coupler:</span>
              <span className="font-mono font-semibold text-slate-800">NORMAL CLOSED</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Feed Overlap Protection:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} />
                Zone isolated without adjacent bridging
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Neutral Section Passage:</span>
              <span className="font-mono text-slate-700">KM 114.8 Auto-Drop Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
