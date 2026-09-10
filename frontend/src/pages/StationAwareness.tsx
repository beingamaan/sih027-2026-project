import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Sidebar, useSidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { Navbar } from '../components/layout/Navbar';
import { HeroBanner } from '../components/layout/HeroBanner';
import { 
  Radio, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Train, 
  Check, 
  Shield, 
  Layers, 
  MapPin, 
  Lock,
  FileCheck,
  FileText,
  AlertOctagon,
  ExternalLink,
  ClipboardList
} from 'lucide-react';
import { getBlocks, acknowledgeStationBlock } from '../services/railwayApi';
import { CorridorTrackTopology } from '../components/corridor/CorridorTrackTopology';

interface StationBlock {
  id: number;
  plan_code: string;
  section: string;
  time_window: string;
  impacted_line: string;
  departments: string[];
  status: string;
  chainage: string;
  acknowledged: boolean;
  ack_time?: string;
}

interface StatutoryMemo {
  id: string;
  formType: string;
  title: string;
  issuedBy: string;
  timestamp: string;
  lineSection: string;
  speedLimitOrCondition: string;
  status: 'ACKNOWLEDGED' | 'ACTIVE' | 'ARCHIVED';
  gsrRule: string;
}

export const StationAwareness: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [ackToast, setAckToast] = useState<string | null>(null);

  const isMemosView = location.pathname.includes('/memos');

  // Today's blocks intersecting station GZB (station_id=10, Ghaziabad Jn)
  const [stationBlocks, setStationBlocks] = useState<StationBlock[]>([
    {
      id: 1,
      plan_code: 'BLK-2026-DLI-04',
      section: 'GZB (Ghaziabad) – ANVR (Anand Vihar)',
      time_window: '02:00 – 04:00 hrs (120m)',
      impacted_line: 'UP Main Line (Track 1)',
      departments: ['ENG', 'TRD', 'SNT'],
      status: 'APPROVED & SANCTIONED',
      chainage: 'KM 100.0 – 120.0',
      acknowledged: false
    },
    {
      id: 2,
      plan_code: 'BLK-2026-DLI-01',
      section: 'GZB Western Yard Approach',
      time_window: '04:15 – 05:45 hrs (90m)',
      impacted_line: 'Loop Line 2 & Crossover 101',
      departments: ['ENG'],
      status: 'SCHEDULED',
      chainage: 'KM 100.0 – 104.2',
      acknowledged: false
    },
    {
      id: 3,
      plan_code: 'BLK-2026-DLI-02',
      section: 'GZB – TDL Corridor',
      time_window: '10:30 – 12:30 hrs (120m)',
      impacted_line: 'DN Main Line (Track 2)',
      departments: ['ENG', 'TRD'],
      status: 'SCHEDULED',
      chainage: 'KM 104.0 – 112.5',
      acknowledged: false
    }
  ]);

  // Statutory Memo Ledger entries for Ghaziabad Jn
  const statutoryMemos: StatutoryMemo[] = [
    {
      id: 'MEMO-GZB-2026-081',
      formType: 'Form T/409 (Caution Order)',
      title: 'Temporary Speed Restriction (TSR 30 km/h) on Hindon Bridge No. 42',
      issuedBy: 'AEN-II / Delhi Division (P-Way)',
      timestamp: 'Today, 01:15 hrs',
      lineSection: 'UP Main Line · KM 118.000 – 124.000',
      speedLimitOrCondition: 'Speed Limit: 30 km/h · Ballast Dressing in Progress',
      status: 'ACKNOWLEDGED',
      gsrRule: 'G&SR Rule 4.09 / 4.14'
    },
    {
      id: 'DISC-GZB-2026-041',
      formType: 'Form T/351 (Disconnection Notice)',
      title: 'Electronic Interlocking Dual Axle Counter Track Circuit Disconnection',
      issuedBy: 'SSE / Signal / GZB',
      timestamp: 'Today, 01:45 hrs',
      lineSection: 'GZB Interlocking Limit · Yard Point 101A/B',
      speedLimitOrCondition: 'Handed to Station Master · Clamp & Padlock Applied',
      status: 'ACKNOWLEDGED',
      gsrRule: 'G&SR Rule 3.51'
    },
    {
      id: 'PWR-GZB-2026-019',
      formType: 'Form E/TRD (Traction Isolation)',
      title: '25kV AC Overhead Catenary Power Block & Earth Wire Bonding Permit',
      issuedBy: 'Traction Power Controller (TPC) / Delhi',
      timestamp: 'Today, 02:00 hrs',
      lineSection: 'GZB – ANVR Section (UP Main Line)',
      speedLimitOrCondition: 'OHE Discharged · Station Master Red Indicator Locked',
      status: 'ACKNOWLEDGED',
      gsrRule: 'ACTM Para 20600'
    },
    {
      id: 'MEMO-GZB-2026-092',
      formType: 'Form T/409 (Caution Order)',
      title: 'Daylight Track Patrolling & Engineering Gauge Check',
      issuedBy: 'Permanent Way Inspector (PWI) / GZB',
      timestamp: 'Today, 06:00 hrs',
      lineSection: 'DN Main Line · KM 104.000 – 112.500',
      speedLimitOrCondition: 'Normal Speed · Whistle Continuously at Work Site',
      status: 'ACTIVE',
      gsrRule: 'G&SR Rule 4.14'
    }
  ];

  // Load real blocks from backend if available and overlay
  useEffect(() => {
    const fetchLiveBlocks = async () => {
      try {
        const blocks = await getBlocks();
        if (blocks && blocks.length > 0) {
          setStationBlocks(prev => {
            return prev.map(sb => {
              const live = blocks.find((b: any) => b.plan_code === sb.plan_code || b.id === sb.id);
              if (live) {
                const isAck = live.stage === 'ACK_COMPLETE' || live.stage === 'IN_PROGRESS' || live.stage === 'CLOSED';
                return {
                  ...sb,
                  status: isAck ? 'ACKNOWLEDGED' : (live.stage || sb.status),
                  acknowledged: sb.acknowledged || isAck
                };
              }
              return sb;
            });
          });
        }
      } catch (e) {
        console.warn("Using offline mock blocks for Station Master console", e);
      }
    };
    fetchLiveBlocks();
  }, []);

  const handleAcknowledgeBlock = async (block: StationBlock) => {
    if (block.acknowledged || submittingId === block.id) return;
    setSubmittingId(block.id);
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // 1 & 2: Instantly transition button status to [Receipt Acknowledged] and table row status badge to ACKNOWLEDGED
    setStationBlocks(prev => 
      prev.map(b => b.id === block.id ? { ...b, acknowledged: true, ack_time: timeStr, status: 'ACKNOWLEDGED' } : b)
    );

    // 3: Trigger IRTS Audit toast
    const toastText = "Electronic Caution Memo Acknowledged by SM Ghaziabad (G&SR Rule 4.14)";
    setAckToast(toastText);
    setTimeout(() => setAckToast(null), 5000);

    try {
      await acknowledgeStationBlock(block.plan_code, 'GZB');
    } catch (e) {
      console.warn("Backend sync notice for SM Ghaziabad acknowledgement:", e);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Work Area */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <Navbar 
          title="Station Master Advisory Console" 
          subtitle="GZB (Ghaziabad Jn) · Northern Railway Delhi Division" 
        />
        
        {/* Floating IRTS Statutory Audit Toast */}
        {ackToast && (
          <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-[#0C2138] text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/40 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-emerald-400">IRTS Statutory Audit Log</p>
                <p className="text-xs font-bold text-white mt-0.5">{ackToast}</p>
              </div>
              <button 
                onClick={() => setAckToast(null)}
                aria-label="Close notification"
                className="ml-2 text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6">
          <div className="w-full max-w-[1600px] mx-auto space-y-6">
            
            {/* 1. TOP PERSISTENT STATUTORY MANDATORY BANNER */}
            <div className="border-2 border-rose-700 bg-rose-50 text-rose-950 font-bold p-4 rounded-lg shadow-sm flex items-center gap-3.5">
              <ShieldAlert size={26} className="text-rose-700 shrink-0" />
              <div>
                <span className="font-black text-[11px] uppercase tracking-widest text-rose-900 block">
                  STATUTORY G&amp;SR MANDATORY OPERATING DIRECTIVE
                </span>
                <p className="text-sm sm:text-base font-bold text-rose-950 mt-0.5">
                  Line Clear and block sanction remain with the Station Master under G&amp;SR. This screen is advisory only.
                </p>
              </div>
            </div>

            {/* REUSABLE HERO BANNER */}
            <HeroBanner 
              title="Station Master Operations Console" 
              subtitle="Line Clear & Advisory Interlocking Horizon" 
              sectionTag="GZB (GHAZIABAD JN) · STATION ID: 10 · DESIGNEE: IR-STN-0450"
            />

            {/* NAVIGATION TABS: Station Awareness vs G&SR Memo Register */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => navigate('/station')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !isMemosView
                    ? 'bg-[#102A43] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Radio size={14} className={!isMemosView ? 'text-amber-400' : 'text-slate-400'} />
                <span>Station Situational Awareness</span>
              </button>

              <button
                onClick={() => navigate('/station/memos')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isMemosView
                    ? 'bg-[#102A43] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <FileCheck size={14} className={isMemosView ? 'text-emerald-400' : 'text-slate-400'} />
                <span>G&amp;SR Memo Register (Form T/409, T/351)</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-700 border border-emerald-300">
                  {statutoryMemos.length}
                </span>
              </button>
            </div>

            {/* CONDITIONAL VIEW 1: STATION AWARENESS */}
            {!isMemosView ? (
              <>
                {/* Station Identity Summary */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl card-warm">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-200 uppercase tracking-wider flex items-center gap-1">
                        <Radio size={12} className="text-blue-700" />
                        Station Master Territory Enclosure
                      </span>
                      <span className="text-xs text-slate-700 font-semibold">• GZB (Ghaziabad Jn) · Station ID: 10 · Designee: IR-STN-0450</span>
                    </div>
                    <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
                      Affected Blocks Intersecting Station GZB Limit
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Real-time statutory awareness of scheduled corridor occupations, bundled departments, and impacted running lines. Zero point or signal controls.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold shrink-0">
                    <Lock size={14} className="text-slate-500" />
                    <span>Line Clear Granting: Physical Block Instrument / SM Key Only</span>
                  </div>
                </div>

                {/* REAL-TIME YARD & LOOP SIDING ADVISORY TOPOLOGY */}
                <CorridorTrackTopology variant="yard" />

                {/* 2. AFFECTED BLOCKS TABLE */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Layers size={18} className="text-blue-700" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Today's Scheduled Blocks (Intersecting GZB Territory)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Advisory listing of sanctioned maintenance possessions intersecting station interlocking boundaries.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      {stationBlocks.length} Blocks Today
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                          <th className="py-3.5 px-4">Block ID</th>
                          <th className="py-3.5 px-4">Scheduled Window</th>
                          <th className="py-3.5 px-4">Impacted Line</th>
                          <th className="py-3.5 px-4">Bundled Departments</th>
                          <th className="py-3.5 px-4 text-center">Status</th>
                          <th className="py-3.5 px-4 text-right">Single Authorized Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {stationBlocks.map((block) => (
                          <tr key={block.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-4 font-mono font-bold text-slate-900">
                              <div>
                                <span>{block.plan_code}</span>
                                <span className="block text-[10px] font-sans font-normal text-slate-500 mt-0.5">
                                  {block.section} ({block.chainage})
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1.5 font-mono text-slate-800 font-semibold">
                                <Clock size={13} className="text-slate-400 shrink-0" />
                                <span>{block.time_window}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200 text-[11px]">
                                {block.impacted_line}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1 flex-wrap">
                                {block.departments.map(dept => (
                                  <span 
                                    key={dept}
                                    className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                      dept === 'ENG' ? 'bg-[#D9A05B]/20 text-[#7D4D15]' :
                                      dept === 'TRD' ? 'bg-[#8B7CF6]/20 text-[#5442A8]' :
                                      'bg-[#2DD4BF]/20 text-[#0E685C]'
                                    }`}
                                  >
                                    {dept}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider ${
                                block.acknowledged 
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                                  : 'bg-amber-100 text-amber-950 border border-amber-200'
                              }`}>
                                {block.acknowledged ? 'ACKNOWLEDGED' : block.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              {block.acknowledged ? (
                                <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 justify-end">
                                  ✓ [Receipt Acknowledged]
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAcknowledgeBlock(block)}
                                  disabled={submittingId === block.id}
                                  className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm bg-[#102A43] hover:bg-[#1E5AA8] text-white active:scale-98 cursor-pointer"
                                >
                                  {submittingId === block.id ? (
                                    <span>Acknowledging...</span>
                                  ) : (
                                    <>
                                      <CheckCircle2 size={14} className="text-white" />
                                      <span>[Acknowledge Receipt]</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Approaching Train Services Advisory Feed */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Train size={16} className="text-slate-700" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Approaching Train Services (Ghaziabad Advisory Telemetry)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      Read-Only Display
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="flex justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900">12951 Rajdhani Exp</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-900">PREMIUM</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">ETA GZB: <strong className="font-mono text-slate-900">01:45 hrs</strong> (On Time)</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Line: UP Main Line</p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="flex justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900">12004 Shatabdi Exp</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">SUPERFAST</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">ETA GZB: <strong className="font-mono text-slate-900">03:30 hrs</strong> (Regulation Plan)</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Line: Loop Line 1</p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="flex justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900">BOXN-9021 Freight</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900">GOODS</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">ETA GZB: <strong className="font-mono text-slate-900">04:10 hrs</strong> (Ahead of Margin)</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Line: DN Main Line</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* CONDITIONAL VIEW 2: G&SR STATUTORY MEMO REGISTER */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl card-warm">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
                        <FileCheck size={12} className="text-emerald-700" />
                        Statutory Caution Memo Register
                      </span>
                      <span className="text-xs text-slate-700 font-semibold">• GZB (Ghaziabad Jn) · Station ID: 10 · Designee: IR-STN-0450</span>
                    </div>
                    <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
                      Station Master G&amp;SR Memo &amp; Disconnection Ledger
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Statutory electronic record of Form T/409 (Caution Orders), Form T/351 (S&amp;T Disconnection/Reconnection Notices), and Form E/TRD (Traction Isolation) issued to Station Master Ghaziabad.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shrink-0">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Statutory Audit Trail: All Memos Recorded</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ClipboardList size={18} className="text-emerald-700" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Active &amp; Acknowledged Statutory Memos (Ghaziabad Jn Limit)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Maintained pursuant to General &amp; Subsidiary Rules (G&amp;SR 4.09, 4.14 &amp; 3.51).
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      {statutoryMemos.length} Recorded Memos
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                          <th className="py-3.5 px-4">Memo ID / Form</th>
                          <th className="py-3.5 px-4">Statutory Subject</th>
                          <th className="py-3.5 px-4">Issued By / Timestamp</th>
                          <th className="py-3.5 px-4">Impacted Section</th>
                          <th className="py-3.5 px-4">Operational Rule</th>
                          <th className="py-3.5 px-4 text-center">Receipt Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {statutoryMemos.map((memo) => (
                          <tr key={memo.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-4 font-mono font-bold text-slate-900">
                              <div>
                                <span className="text-blue-700">{memo.id}</span>
                                <span className="block text-[10px] font-sans font-bold text-slate-600 mt-0.5">
                                  {memo.formType}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-bold text-slate-900">{memo.title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{memo.speedLimitOrCondition}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-semibold text-slate-800">{memo.issuedBy}</p>
                              <p className="text-[10px] font-mono text-slate-400 mt-0.5">{memo.timestamp}</p>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200 text-[11px]">
                                {memo.lineSection}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-mono text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                {memo.gsrRule}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider inline-flex items-center gap-1 ${
                                memo.status === 'ACKNOWLEDGED'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                  : 'bg-amber-100 text-amber-950 border border-amber-200'
                              }`}>
                                <Check size={11} className="stroke-[3]" />
                                {memo.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
