import React, { useState } from 'react';
import { GitBranch, ShieldCheck, CheckCircle2, Clock, AlertTriangle, Cpu, Radio, RotateCcw } from 'lucide-react';

export interface DisconnectionMemo {
  memo_number: string;
  station: string;
  interlocking_area: string;
  form_type: string; // T/351 Disconnection Notice
  status: 'PENDING_SANCTION' | 'DISCONNECTED' | 'RECONNECTED' | 'CORRESPONDENCE_TESTED';
  affected_gears: {
    points: string[];
    signals: string[];
    track_circuits: string[];
  };
  sse_incharge: string;
  station_master_ack: boolean;
  correspondence_tested: boolean;
  remarks: string;
}

const mockMemos: DisconnectionMemo[] = [
  {
    memo_number: 'SNT-DISC-409',
    station: 'Barhan Jn (BRHN / STB)',
    interlocking_area: 'STB Interlocking Area (KM 119.2)',
    form_type: 'Form T/351 (G&SR Rule 3.51)',
    status: 'DISCONNECTED',
    affected_gears: {
      points: ['Point 102A', 'Point 102B (Crossover)'],
      signals: ['Signal S-4 (Home)', 'Signal S-6 (Starter)'],
      track_circuits: ['TC-102T', 'Axle Counter Block A']
    },
    sse_incharge: 'A. Raman (SSE/Signal/BRHN)',
    station_master_ack: true,
    correspondence_tested: false,
    remarks: 'Point machine motor replacement & detection rod testing.'
  },
  {
    memo_number: 'SNT-DISC-410',
    station: 'Chamrola (CHL / STC)',
    interlocking_area: 'STC Interlocking Area (KM 128.5)',
    form_type: 'Form T/351 (G&SR Rule 3.51)',
    status: 'PENDING_SANCTION',
    affected_gears: {
      points: ['Point 201'],
      signals: ['Signal S-12 (Advance Starter)'],
      track_circuits: ['AFTC-201A']
    },
    sse_incharge: 'V. Khare (SSE/Signal/CHL)',
    station_master_ack: false,
    correspondence_tested: false,
    remarks: 'Track circuit impedance bond cable replacement.'
  }
];

export const SNTPanel: React.FC = () => {
  const [memos, setMemos] = useState<DisconnectionMemo[]>(mockMemos);
  const [selectedMemo, setSelectedMemo] = useState<DisconnectionMemo>(mockMemos[0]);

  const handleTestToggle = (memoNum: string) => {
    setMemos(prev => prev.map(m => {
      if (m.memo_number === memoNum) {
        const nextTested = !m.correspondence_tested;
        return {
          ...m,
          correspondence_tested: nextTested,
          status: nextTested ? 'CORRESPONDENCE_TESTED' : 'DISCONNECTED'
        };
      }
      return m;
    }));

    if (selectedMemo.memo_number === memoNum) {
      setSelectedMemo(prev => ({
        ...prev,
        correspondence_tested: !prev.correspondence_tested,
        status: !prev.correspondence_tested ? 'CORRESPONDENCE_TESTED' : 'DISCONNECTED'
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top S&T Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border-l-4 border-l-[#2DD4BF] border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Disconnection Memos</span>
            <GitBranch size={15} className="text-[#2DD4BF]" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">{memos.length} <span className="text-xs font-normal text-slate-500">Registered</span></p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF]"></span>
            STB & STC Interlocking areas active
          </p>
        </div>

        <div className="bg-white border-l-4 border-l-[#2DD4BF] border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Correspondence Testing</span>
            <ShieldCheck size={15} className="text-[#2DD4BF]" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">
            {memos.filter(m => m.correspondence_tested).length} / {memos.length} <span className="text-xs font-normal text-slate-500">Verified</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Reconnection requires SM joint signature
          </p>
        </div>

        <div className="bg-white border-l-4 border-l-[#2DD4BF] border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Electronic Interlocking</span>
            <Cpu size={15} className="text-[#2DD4BF]" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">DUAL HOT <span className="text-xs font-normal text-slate-500">Standby</span></p>
          <p className="text-[11px] text-slate-500 mt-1">
            Kyosan EI Rack 100% operational at BRHN
          </p>
        </div>
      </div>

      {/* Disconnection Register & Gears Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2DD4BF]"></span>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Interlocking Disconnection Register (Form T/351)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Statutory signalling & point machine disconnections requiring Station Master joint consent.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-teal-50 text-teal-900 border border-teal-200">
            Rule 3.51 Compliance
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {memos.map((memo) => {
            const isSelected = selectedMemo.memo_number === memo.memo_number;

            return (
              <div
                key={memo.memo_number}
                onClick={() => setSelectedMemo(memo)}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'ring-2 ring-[#2DD4BF] border-teal-300 bg-teal-50/30 shadow-md'
                    : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">{memo.memo_number}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {memo.form_type}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    memo.status === 'CORRESPONDENCE_TESTED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : memo.status === 'DISCONNECTED'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {memo.status}
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-800">{memo.interlocking_area}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{memo.remarks}</p>

                {/* Affected Gears Badges */}
                <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="text-[11px] text-slate-600">
                    <span className="text-slate-400 font-medium">Points: </span>
                    {memo.affected_gears.points.map((p) => (
                      <span key={p} className="inline-block px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-bold text-slate-800 mr-1">
                        {p}
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-600">
                    <span className="text-slate-400 font-medium">Signals: </span>
                    {memo.affected_gears.signals.map((s) => (
                      <span key={s} className="inline-block px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-bold text-slate-800 mr-1">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-600">
                    <span className="text-slate-400 font-medium">Circuits: </span>
                    {memo.affected_gears.track_circuits.map((tc) => (
                      <span key={tc} className="inline-block px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-bold text-slate-800 mr-1">
                        {tc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Reconnection Correspondence Action */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400">SM Ack:</span>
                    <span className={memo.station_master_ack ? 'text-emerald-700 font-bold' : 'text-amber-700 font-medium'}>
                      {memo.station_master_ack ? '✓ Acknowledged' : 'Pending Ack'}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestToggle(memo.memo_number);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      memo.correspondence_tested
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-200 text-slate-800 hover:bg-[#2DD4BF] hover:text-slate-950'
                    }`}
                  >
                    {memo.correspondence_tested ? (
                      <>
                        <CheckCircle2 size={12} />
                        Correspondence Tested
                      </>
                    ) : (
                      <>
                        <RotateCcw size={12} />
                        Simulate Test & Reconnect
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
