import React, { useState, useEffect } from 'react';
import { Sidebar, useSidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { 
  Eye, 
  Radio, 
  CheckCircle2, 
  Clock, 
  Train, 
  ShieldAlert, 
  MapPin, 
  AlertOctagon,
  RefreshCw,
  Info
} from 'lucide-react';
import { getTrains } from '../services/railwayApi';
import { TrainPath } from '../types';

export const StationAwareness: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [trains, setTrains] = useState<TrainPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgedAt, setAcknowledgedAt] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const trainList = await getTrains();
      setTrains(trainList);
    } catch (e) {
      console.error("Failed to load station awareness data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcknowledge = () => {
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAcknowledgedAt(timeStr);
  };

  const cautionOrders = [
    { id: 'CO-2026-041', location: 'KM 104.2 – 105.0', speed: '30 KMPH', reason: 'Deep screening ballast renewal in progress', validUntil: '18:00 hrs' },
    { id: 'CO-2026-042', location: 'KM 118.6 – 119.2', speed: '45 KMPH', reason: 'OHE cantilever realignment works', validUntil: '20:30 hrs' },
    { id: 'CO-2026-043', location: 'KM 122.0 – 122.8', speed: '20 KMPH (Dead Slow)', reason: 'Point 12B sleeper packing', validUntil: '22:00 hrs' },
  ];

  const adjacentBlocks = [
    { section: 'STA (Anandpur) – STB (Belapur)', direction: 'UP LINE (Towards DLI)', status: 'MAINTENANCE SHADOW', km: 'KM 104.2 – 124.8', occupancy: 'Clear / Advisory Shadow Window' },
    { section: 'STA (Anandpur) – STB (Belapur)', direction: 'DN LINE (Towards CNB)', status: 'LIVE TRAFFIC', km: 'KM 104.2 – 124.8', occupancy: 'Occupied by 12004 Express' },
    { section: 'STB (Belapur) – STC (Chanderi)', direction: 'UP & DN LINES', status: 'LIVE TRAFFIC', km: 'KM 124.8 – 142.0', occupancy: 'Normal Line Clear Operations' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8F5]">
      <div className="flex flex-1">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 flex flex-col ${isCollapsed ? 'ml-20' : 'ml-[260px]'}`}>
          <Header 
            title="Station Master Situational Awareness Console" 
            subtitle="Read-Only Real-Time Corridor State & Adjacent Block Visibility" 
          />

          <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
            {/* Top Workspace Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-elevated border border-white/90">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-800 uppercase tracking-wider flex items-center gap-1">
                    <Radio size={12} className="text-cyan-700" />
                    Station Master Awareness
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">• Station Code: STA (Anandpur)</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Read-Only Telemetry
                  </span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Adjacent Block Status, Caution Orders & Approaching Trajectories
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Provides Station Masters with complete situational visibility into ongoing engineering blocks and train movements without granting control.
                </p>
              </div>

              {/* Single Allowed Action: Acknowledge Situational Awareness */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleAcknowledge}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-98 transition-all cursor-pointer"
                >
                  <CheckCircle2 size={15} />
                  {acknowledgedAt ? `Awareness Acknowledged (${acknowledgedAt})` : 'Acknowledge Situational Awareness'}
                </button>
              </div>
            </div>

            {/* MANDATORY STATUTORY ADVISORY NOTICE (PROMINENT) */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-xs font-semibold text-amber-950 shadow-sm">
              <Info size={20} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-black uppercase tracking-wider text-amber-900 block mb-0.5">
                  Statutory Railway Operating Notice:
                </span>
                Advisory awareness view only. This system does not control signals, grant block possessions, or issue Line Clear. Statutory Line Clear, Caution Orders, and train movements strictly follow standard Railway Operating Rules and authorized block instruments.
              </div>
            </div>

            {/* Adjacent Block Section Status */}
            <div className="p-6 rounded-2xl glass-panel-elevated space-y-4 border border-white/90">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900">Adjacent Block Sections & Possession Status</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Station Limit: KM 104.0</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {adjacentBlocks.map((blk, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">{blk.km}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                        blk.status === 'MAINTENANCE SHADOW' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {blk.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-slate-900">{blk.section}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold">{blk.direction}</p>

                    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-600 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                      <span>{blk.occupancy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Caution Orders */}
              <div className="p-6 rounded-2xl glass-panel-elevated space-y-4 border border-white/90">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertOctagon size={18} className="text-amber-600" />
                    <h3 className="text-sm font-black text-slate-900">Active Caution Orders (TSR / PSR)</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{cautionOrders.length} Active</span>
                </div>

                <div className="space-y-3">
                  {cautionOrders.map((co) => (
                    <div key={co.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-slate-900">{co.id}</span>
                          <span className="text-[10px] font-bold text-slate-500">{co.location}</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium mt-1">{co.reason}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Valid until: {co.validUntil}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs font-mono">
                          {co.speed}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approaching Train Schedules */}
              <div className="p-6 rounded-2xl glass-panel-elevated space-y-4 border border-white/90">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Train size={18} className="text-indigo-600" />
                    <h3 className="text-sm font-black text-slate-900">Approaching Trains & Indicative Position</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{trains.length} Trains Tracked</span>
                </div>

                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {trains.slice(0, 5).map((t) => (
                    <div key={t.id} className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{t.train_number}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">{t.train_name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Speed: {t.max_speed_kmph || 110} KMPH • Type: {t.train_type}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                          Approaching Section
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
