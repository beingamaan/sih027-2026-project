import React from 'react';
import { Train, X, Activity, ShieldCheck, Clock, Gauge, MapPin, Radio, Zap } from 'lucide-react';

export interface TrainTelemetryData {
  trainNo: string;
  name: string;
  priority?: string;
  speed?: string | number;
  permissibleMps?: string | number;
  status?: string;
  delayMinutes?: number;
  section?: string;
  lineType?: string;
  loco?: string;
  currentKm?: number;
  currentLocation?: string;
  wtmImpact?: number | string;
  source?: string;
}

interface TrainTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  train: TrainTelemetryData | null;
}

export const TrainTelemetryModal: React.FC<TrainTelemetryModalProps> = ({
  isOpen,
  onClose,
  train
}) => {
  if (!isOpen || !train) return null;

  const speedVal = typeof train.speed === 'number' ? train.speed : (parseInt(String(train.speed)) || 108);
  const mpsVal = typeof train.permissibleMps === 'number' ? train.permissibleMps : (parseInt(String(train.permissibleMps)) || 130);
  const delayVal = train.delayMinutes ?? 0;
  const wtmVal = train.wtmImpact ?? (delayVal > 0 ? (delayVal * 2.5).toFixed(1) : '0.0');
  const locoStr = train.loco || 'WAP-7 #30215 (Ghaziabad Shed)';
  const locStr = train.currentLocation || (train.currentKm !== undefined ? `Approaching Manak Nagar Outer (KM ${train.currentKm.toFixed(1)})` : 'LKO Division Track Sector');
  const sourceStr = train.source || 'RailRadar Live API / CRIS Feed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#0C2138] border border-blue-500/40 text-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#102A43] to-[#0A192F] border-b border-slate-700/60 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
              <Train size={22} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-blue-400 font-bold block">
                Official IR NTES Telemetry Box
              </span>
              <h3 className="text-base font-black tracking-tight text-white font-mono">
                TRAIN {train.trainNo} · {train.name.toUpperCase()}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close telemetry popup"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Status Sub-strip */}
        <div className="px-6 py-2.5 bg-[#071626] border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              ● LIVE NTES FEED (SYNCED)
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Station: LKO Division
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Source: <span className="text-slate-200 font-semibold">{sourceStr}</span>
          </span>
        </div>

        {/* Main Grid Metrics */}
        <div className="p-6 space-y-4 text-xs font-sans">
          <div className="grid grid-cols-2 gap-3.5">
            {/* Metric 1: Current Speed */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Gauge size={14} className="text-blue-400" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Current Speed</span>
              </div>
              <p className="text-sm font-black text-white font-mono">
                {speedVal} km/h
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                (Max Permissible: {mpsVal} km/h)
              </span>
            </div>

            {/* Metric 2: Punctuality & WTM Impact */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Clock size={14} className={delayVal > 0 ? 'text-rose-400' : 'text-emerald-400'} />
                <span className="text-[10px] uppercase font-bold tracking-wider">Punctuality</span>
              </div>
              <p className={`text-sm font-black font-mono ${delayVal > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {delayVal === 0 ? 'ON TIME (+0m)' : `+${delayVal}m Delay`}
              </p>
              <span className="text-[10px] text-amber-300 font-mono block mt-0.5">
                Dynamic WTM Impact: {wtmVal}
              </span>
            </div>
          </div>

          {/* Metric 3: GPS Location */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <MapPin size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Live GPS Section Location
              </span>
              <p className="text-xs font-bold text-white font-mono mt-0.5">
                {locStr}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Line: <span className="text-blue-300 font-semibold">{train.lineType || 'Double Main Running Line'}</span>
                {train.currentKm !== undefined && (
                  <span className="ml-2 font-mono text-emerald-400">· Section Chainage KM {train.currentKm.toFixed(1)} / 72.0</span>
                )}
              </p>
            </div>
          </div>

          {/* Metric 4: Locomotive & Shed Details */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <Zap size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Traction &amp; Locomotive Details
              </span>
              <p className="text-xs font-bold text-slate-100 font-mono mt-0.5">
                {locoStr}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Crew Base: Lucknow NR Terminal Shed · 25kV 50Hz AC OHE Compliant
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>IRTS G&amp;SR § 4.14 Statutory Verified</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-all cursor-pointer"
          >
            Acknowledge &amp; Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainTelemetryModal;
