import React, { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { HeroBanner } from '../components/layout/HeroBanner';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Layers, 
  Calendar, 
  Download, 
  Filter, 
  CheckCircle2, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export const ReportsInsights: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D'>('7D');
  const [downloadToast, setDownloadToast] = useState(false);

  const handleExportReport = () => {
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 3500);
  };

  // 7-day trend data for Punctuality & WTM
  const punctualityData = [
    { day: 'Day 1 (Mon)', baseline: 82.0, optimized: 83.5, wtmBaseline: 890, wtmOptimized: 620 },
    { day: 'Day 2 (Tue)', baseline: 81.5, optimized: 86.2, wtmBaseline: 940, wtmOptimized: 540 },
    { day: 'Day 3 (Wed)', baseline: 83.0, optimized: 88.0, wtmBaseline: 910, wtmOptimized: 480 },
    { day: 'Day 4 (Thu)', baseline: 82.4, optimized: 90.5, wtmBaseline: 960, wtmOptimized: 450 },
    { day: 'Day 5 (Fri)', baseline: 81.8, optimized: 92.1, wtmBaseline: 1020, wtmOptimized: 430 },
    { day: 'Day 6 (Sat)', baseline: 82.5, optimized: 93.8, wtmBaseline: 980, wtmOptimized: 400 },
    { day: 'Day 7 (Sun)', baseline: 82.1, optimized: 94.2, wtmBaseline: 950, wtmOptimized: 380 },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <Navbar 
          title="Reports & Capacity Insights" 
          subtitle="Corridor Punctuality Preservation, WTM Penalty Trend & Quota Utilization" 
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto overflow-y-auto">
          {/* REUSABLE HERO BANNER */}
          <HeroBanner 
            title="Reports & Capacity Analytics" 
            subtitle="Macro Corridor Performance, Freight Punctuality & Quota Efficiency" 
            sectionTag="SR. DOM · DR. S. MUKHERJEE · IR-OFF-0104 · NORTHERN RAILWAY"
          />

          {/* Toast */}
          {downloadToast && (
            <div className="p-3.5 rounded-xl bg-[#0C2138] border border-emerald-500/40 text-white text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in duration-200">
              <span className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Executive Capacity &amp; Punctuality Report exported successfully (PDF/CSV format).</span>
              </span>
              <button onClick={() => setDownloadToast(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>
          )}

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Analysis Horizon:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {(['7D', '30D', '90D'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      timeRange === range
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {range === '7D' ? 'Last 7 Days' : range === '30D' ? 'Last 30 Days' : 'Quarterly (90D)'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleExportReport}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer self-start sm:self-auto"
            >
              <Download size={14} />
              <span>Export Executive Brief</span>
            </button>
          </div>

          {/* High-Level Executive KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Corridor Punctuality</span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-0.5">
                  <ArrowUpRight size={12} /> +12.2%
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">94.2%</div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Preserved vs uncoordinated baseline of <span className="font-bold text-slate-700">82.0%</span>.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">WTM Penalty Index</span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-0.5">
                  <ArrowDownRight size={12} /> -60.0%
                </span>
              </div>
              <div className="text-3xl font-black text-blue-700 font-mono">380 WTM</div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Down from 950 WTM via CP-SAT shadow window clustering.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mega-Block Quota</span>
                <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Optimal Envelope
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">74.6%</div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                135 min used of 180 min statutory daily capacity.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Co-Location Synergy</span>
                <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Joint Bundling
                </span>
              </div>
              <div className="text-3xl font-black text-purple-700 font-mono">88.5%</div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Cross-department possession sharing (ENG + TRD + S&amp;T).
              </p>
            </div>
          </div>

          {/* MAIN VISUAL: Corridor Punctuality Preservation Chart (82% -> 94%) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Section Optimization Metrics</span>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-600" />
                  Corridor Punctuality Preservation Trend (82% → 94.2%)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparison between baseline manual ad-hoc blocks and automated AI co-block shadow windows on Northern Railway HDN-04 corridor.
                </p>
              </div>
              
              <div className="flex items-center gap-3 text-xs font-bold shrink-0">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  AI Dual-Plan Engine (94.2%)
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                  Uncoordinated Baseline (82.0%)
                </span>
              </div>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="py-4">
              <div className="relative h-64 w-full bg-slate-50/70 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
                {/* Horizontal grid lines */}
                <div className="absolute inset-x-4 top-8 border-b border-slate-200/60 flex justify-end">
                  <span className="text-[9px] font-mono font-bold text-slate-400 -mt-3.5">100%</span>
                </div>
                <div className="absolute inset-x-4 top-24 border-b border-slate-200/60 flex justify-end">
                  <span className="text-[9px] font-mono font-bold text-slate-400 -mt-3.5">90%</span>
                </div>
                <div className="absolute inset-x-4 top-40 border-b border-slate-200/60 flex justify-end">
                  <span className="text-[9px] font-mono font-bold text-slate-400 -mt-3.5">80%</span>
                </div>
                <div className="absolute inset-x-4 top-56 border-b border-slate-200/60 flex justify-end">
                  <span className="text-[9px] font-mono font-bold text-slate-400 -mt-3.5">70%</span>
                </div>

                {/* SVG Visual */}
                <svg className="w-full h-48 overflow-visible z-10" viewBox="0 0 700 160" preserveAspectRatio="none">
                  {/* Baseline curve (gray) */}
                  <polyline
                    fill="none"
                    stroke="#CBD5E1"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    points="50,110 150,114 250,105 350,109 450,112 550,108 650,110"
                  />
                  {/* Optimized curve (emerald) */}
                  <polyline
                    fill="none"
                    stroke="#059669"
                    strokeWidth="3.5"
                    points="50,100 150,82 250,68 350,52 450,38 550,26 650,20"
                  />
                  {/* Points on optimized curve */}
                  {[
                    [50, 100, '83.5%'],
                    [150, 82, '86.2%'],
                    [250, 68, '88.0%'],
                    [350, 52, '90.5%'],
                    [450, 38, '92.1%'],
                    [550, 26, '93.8%'],
                    [650, 20, '94.2%']
                  ].map(([x, y, label], i) => (
                    <g key={i}>
                      <circle cx={x} cy={y} r="5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                      <text x={Number(x) - 14} y={Number(y) - 10} fontSize="10" fontWeight="bold" fill="#065F46" fontFamily="monospace">
                        {label}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Day Labels */}
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-200">
                  {punctualityData.map((d, i) => (
                    <span key={i}>{d.day}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TWO COLUMN ROW: WTM Penalty Trend & Mega-Block Quota Utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* WTM Penalty Trend */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Delay Mitigation</span>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock size={18} className="text-blue-600" />
                  WTM Penalty Trend (Delay Cost)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily reduction in Weighted Train-Minutes across passenger express and coal rakes.
                </p>
              </div>

              <div className="space-y-3">
                {punctualityData.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">{item.day}</span>
                      <span className="font-mono text-emerald-700">
                        {item.wtmOptimized} WTM <span className="text-slate-400 text-[10px] line-through font-normal">({item.wtmBaseline} WTM)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(item.wtmOptimized / 1100) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mega-Block Quota Utilization Breakdown */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Capacity Envelope</span>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={18} className="text-purple-600" />
                  Mega-Block Quota Utilization Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Departmental quota allocation under Northern Railway Master Ledger (180 min daily quota).
                </p>
              </div>

              <div className="space-y-4 pt-1">
                {/* Engineering */}
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-amber-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      Engineering (P-Way Track Tamping &amp; BCM)
                    </span>
                    <span className="font-mono text-amber-800 font-black">60 min (33.3%)</span>
                  </div>
                  <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full rounded-full" style={{ width: '33.3%' }}></div>
                  </div>
                </div>

                {/* Electrical Traction */}
                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/70 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-purple-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                      Electrical Traction (TRD OHE Catenary Overhaul)
                    </span>
                    <span className="font-mono text-purple-800 font-black">45 min (25.0%)</span>
                  </div>
                  <div className="w-full bg-purple-200/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full" style={{ width: '25.0%' }}></div>
                  </div>
                </div>

                {/* Signalling */}
                <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200/70 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-teal-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                      Signalling &amp; Telecomm (S&amp;T Point Machine Interlocking)
                    </span>
                    <span className="font-mono text-teal-800 font-black">30 min (16.6%)</span>
                  </div>
                  <div className="w-full bg-teal-200/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full rounded-full" style={{ width: '16.6%' }}></div>
                  </div>
                </div>

                {/* Remaining Contingency Buffer */}
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      Safe Operational Buffer (Train Clearing Margin)
                    </span>
                    <span className="font-mono text-emerald-800 font-black">45 min (25.0%)</span>
                  </div>
                  <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '25.0%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportsInsights;
