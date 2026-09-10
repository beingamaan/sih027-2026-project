import React, { useState, useEffect } from 'react';
import { Sidebar, useSidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { 
  ListTodo, Clock, AlertTriangle, ShieldCheck, 
  TrendingUp, CheckCircle2, Train, RefreshCw, Zap, Radio,
  Wrench, Compass, Cpu, Sun
} from 'lucide-react';
import { getDashboardSummary, getDashboardRisks, getTasks } from '../services/railwayApi';
import { DashboardSummary, Task } from '../types';
import { ScenicTrainHeroArtwork } from '../components/dashboard/ScenicTrainHeroArtwork';

export const Dashboard: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [risks, setRisks] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, riskRes, tskRes] = await Promise.all([
        getDashboardSummary(),
        getDashboardRisks(),
        getTasks(),
      ]);
      setSummary(sumRes);
      setRisks(riskRes);
      setTasks(tskRes);
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F7F8F5]">
      <Sidebar />
      <div className="flex-1 min-w-0 transition-all duration-300 ease-in-out flex flex-col">
        <Header />

        <main className="p-6 relative z-10 space-y-6 flex-1">
          {/* Full-Width Scenic Train Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFFBF2] via-[#FFF9EE] to-[#F2EDE4] border border-[#E8E2D5] p-8 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
            {/* Left Title & Division Details */}
            <div className="max-w-md z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#102A43] text-[#ECC94B] text-[10px] font-black uppercase tracking-wider mb-2.5">
                <span className="w-2 h-2 rounded-full bg-[#ECC94B] animate-pulse"></span>
                Safe Rails, Stronger India
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-[#0F2841] tracking-tight font-serif-hero leading-tight">
                Operations Command Center
              </h1>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1E5AA8] uppercase tracking-wider mt-2 flex-wrap">
                <span className="bg-[#EAF2FF] px-2 py-0.5 rounded border border-[#BFDBFE]/60">Delhi Division</span>
                <span>•</span>
                <span>KM 100 – 158</span>
                <span>•</span>
                <span className="text-[#627D98] font-sans font-semibold">Department Supervisor Maintenance</span>
              </div>
              <p className="italic text-slate-500 text-sm mt-2">
                "Safe Rails, Stronger India"
              </p>
            </div>

            {/* Center: Full-Width Scenic Landscape Vande Bharat Train Artwork */}
            <div className="flex flex-col items-center justify-center flex-1 max-w-xl w-full hidden md:flex z-10 px-4">
              <ScenicTrainHeroArtwork className="w-full max-w-lg h-auto" />
            </div>

            {/* Far Right: Weather & Calendar Card with Tricolor Ribbon */}
            <div className="bg-white/85 backdrop-blur-md border border-[#E2E8F0] p-5 rounded-2xl shadow-sm shrink-0 max-w-[280px] w-full z-10">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E8F0]">
                <span className="text-[10px] font-extrabold text-[#627D98] uppercase">Section Status</span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#16805C]">
                  <span className="w-2 h-2 rounded-full bg-[#16805C] animate-ping"></span>
                  LIVE
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-[#102A43]">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} | {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
              </p>
              <p className="text-[11px] text-[#486581] font-medium mt-1 flex items-center gap-1.5">
                <Sun size={13} className="text-[#D9901A]" />
                28°C Clear Sky · Delhi Division
              </p>

              {/* Viksit Bharat / Viksit Rail badge with Tricolor Ribbon */}
              <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-[#102A43] tracking-wider">
                  Viksit Bharat / Viksit Rail
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col h-3.5 w-4 rounded-xs overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                    <div className="h-1 bg-[#FF9933]"></div>
                    <div className="h-1.5 bg-[#FFFFFF] flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-[#000080]"></div>
                    </div>
                    <div className="h-1 bg-[#138808]"></div>
                  </div>
                  <span className="text-[10px] font-bold text-[#D9901A] bg-[#FFF7E6] px-2 py-0.5 rounded border border-[#FFE7BA]">
                    2047
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Stat Metric Cards with Sparkline Wave Accents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Tasks */}
            <div className="bg-[#FCFBF8] border border-[#E2E8F0] p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-[#627D98] uppercase tracking-wider">Total Tasks</p>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#EAF2FF] text-[#1E5AA8]">Pool</span>
                </div>
                <p className="text-3xl font-black text-[#102A43] metric-mono mt-2">{summary?.total_tasks ?? 70}</p>
                <p className="text-[10px] text-[#829AB1] mt-1 font-medium">Seeded pool in database</p>
              </div>
              {/* Blue Upward Sparkline */}
              <svg viewBox="0 0 200 36" className="w-full h-8 mt-2 -mb-1" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="dSparkBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E5AA8" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#1E5AA8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0 30 Q 35 26 70 28 T 130 16 T 175 10 L 200 4 L 200 36 L 0 36 Z" fill="url(#dSparkBlue)" />
                <path d="M 0 30 Q 35 26 70 28 T 130 16 T 175 10 L 200 4" stroke="#1E5AA8" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            {/* Card 2: Open Schedulable */}
            <div className="bg-[#FCFBF8] border border-[#E2E8F0] p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-[#16805C] uppercase tracking-wider">Open Schedulable</p>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#EAF6F0] text-[#16805C]">Ready</span>
                </div>
                <p className="text-3xl font-black text-[#16805C] metric-mono mt-2">{summary?.open_tasks ?? 58}</p>
                <p className="text-[10px] text-[#627D98] mt-1 font-medium">Pending block possession</p>
              </div>
              {/* Green Upward Wave */}
              <svg viewBox="0 0 200 36" className="w-full h-8 mt-2 -mb-1" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="dSparkGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16805C" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#16805C" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0 26 Q 40 30 80 20 T 150 12 L 200 4 L 200 36 L 0 36 Z" fill="url(#dSparkGreen)" />
                <path d="M 0 26 Q 40 30 80 20 T 150 12 L 200 4" stroke="#16805C" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            {/* Card 3: Lane B2 Statutory */}
            <div className="bg-[#FCFBF8] border border-[#E2E8F0] p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-[#D9901A] uppercase tracking-wider">Lane B2 Statutory</p>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#FFF7E6] text-[#D9901A]">Mandatory</span>
                </div>
                <p className="text-3xl font-black text-[#D9901A] metric-mono mt-2">{summary?.lane_b2_count ?? 3}</p>
                <p className="text-[10px] text-[#D9901A] mt-1 font-semibold">Mandatory Inspections</p>
              </div>
              {/* Amber Warning Curve */}
              <svg viewBox="0 0 200 36" className="w-full h-8 mt-2 -mb-1" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="dSparkAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D9901A" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#D9901A" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0 20 Q 30 10 65 24 T 120 12 T 165 22 L 200 16 L 200 36 L 0 36 Z" fill="url(#dSparkAmber)" />
                <path d="M 0 20 Q 30 10 65 24 T 120 12 T 165 22 L 200 16" stroke="#D9901A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            {/* Card 4: Lane A Emergency */}
            <div className="bg-[#FCFBF8] border border-[#E2E8F0] p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-[#B42332] uppercase tracking-wider">Lane A Emergency</p>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#FFF0F1] text-[#B42332]">Priority</span>
                </div>
                <p className="text-3xl font-black text-[#B42332] metric-mono mt-2">{summary?.lane_a_count ?? 2}</p>
                <p className="text-[10px] text-[#B42332] mt-1 font-semibold">Manual Safety Protocol</p>
              </div>
              {/* Red Critical Blip Curve */}
              <svg viewBox="0 0 200 36" className="w-full h-8 mt-2 -mb-1" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="dSparkRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B42332" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#B42332" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0 24 Q 40 24 70 22 L 90 8 L 105 30 L 120 16 L 150 23 L 200 22 L 200 36 L 0 36 Z" fill="url(#dSparkRed)" />
                <path d="M 0 24 Q 40 24 70 22 L 90 8 L 105 30 L 120 16 L 150 23 L 200 22" stroke="#B42332" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-warm p-5 border border-[#D9E0E8]">
              <p className="text-[10px] font-bold text-[#627D98] uppercase tracking-wider">Lane B1 Planned</p>
              <p className="text-3xl font-black text-[#102A43] metric-mono mt-2">{summary?.lane_b1_count ?? 0}</p>
              <p className="text-[10px] text-[#829AB1] mt-1 font-medium">Optimizable maintenance</p>
            </div>

            <div className="card-warm p-5 border border-[#C6EADB] bg-[#F2FAF6]">
              <p className="text-[10px] font-bold text-[#16805C] uppercase tracking-wider">High Readiness Pct</p>
              <p className="text-3xl font-black text-[#16805C] metric-mono mt-2">{summary?.high_readiness_pct ?? 0}%</p>
              <p className="text-[10px] text-[#16805C] mt-1 font-semibold">100-pt gate verified</p>
            </div>

            <div className="card-warm p-5 border border-[#E9D5FF] bg-[#FAF5FF]">
              <p className="text-[10px] font-bold text-[#7456B8] uppercase tracking-wider">Generated Dual Plans</p>
              <p className="text-3xl font-black text-[#7456B8] metric-mono mt-2">{summary?.generated_plans ?? 0}</p>
              <p className="text-[10px] text-[#7456B8] mt-1 font-semibold">Plan A &amp; Plan B</p>
            </div>

            <div className="card-warm p-5 border border-[#D9E0E8]">
              <p className="text-[10px] font-bold text-[#627D98] uppercase tracking-wider">Solver Engine</p>
              <p className="text-2xl font-black text-[#102A43] metric-mono mt-2.5 truncate">{summary?.solver_status ?? 'OPTIMAL'}</p>
              <p className="text-[10px] text-[#829AB1] mt-1 font-medium">Explainable Rule &amp; CP-SAT</p>
            </div>
          </div>

          {/* Caution Orders & Work Items */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card-warm p-5 border border-[#D9E0E8]">
              <h3 className="text-xs font-black text-[#102A43] uppercase tracking-wider mb-3.5 pb-2 border-b border-[#D9E0E8]">
                Caution Orders &amp; Active TSRs
              </h3>
              <div className="space-y-3">
                {risks.length > 0 ? risks.map((r, i) => (
                  <div key={i} className="p-3.5 bg-[#FFF7E6] rounded-xl border border-[#FFE7BA]">
                    <p className="text-xs font-black text-[#78350F]">{r.title}</p>
                    <p className="text-[11px] text-[#92400E] mt-1 font-medium">{r.detail}</p>
                  </div>
                )) : (
                  <div className="p-4 rounded-xl bg-[#EAF6F0] border border-[#C6EADB] text-xs text-[#16805C] font-bold">
                    ✓ Zero active Emergency Speed Restrictions on Section STB–STC
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 card-warm p-5 border border-[#D9E0E8]">
              <h3 className="text-xs font-black text-[#102A43] uppercase tracking-wider mb-3.5 pb-2 border-b border-[#D9E0E8]">
                Recent Maintenance Work Items in Corridor
              </h3>
              <div className="space-y-2.5">
                {tasks.slice(0, 6).map(t => (
                  <div key={t.id} className="p-3.5 rounded-xl bg-white border border-[#D9E0E8] hover:border-[#BCC8D6] transition-all flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-xs font-black text-[#102A43] font-mono">{t.task_code}</span>
                      <span className="text-xs text-[#334E68] font-semibold ml-2.5">{t.work_type}</span>
                      <p className="text-[10px] text-[#627D98] mt-0.5 metric-mono">
                        KM {t.km_from}–{t.km_to} • {t.department} • {t.estimated_duration_minutes} mins
                      </p>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded ${
                      t.lane === 'A_EMERGENCY' ? 'pill-lane-a' : 'pill-lane-b'
                    }`}>
                      {t.lane}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
