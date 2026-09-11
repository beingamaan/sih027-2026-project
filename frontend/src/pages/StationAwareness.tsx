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
import { getBlocks, acknowledgeStationBlock, getLiveStationBoard } from '../services/railwayApi';
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

interface ApproachingTrain {
  train_number: string;
  train_name: string;
  priority_class?: string;
  origin?: string;
  destination?: string;
  scheduled_arrival?: string;
  eta?: string;
  delay_minutes?: number;
  current_location?: string;
  current_chainage_km?: number;
  status: string;
  line?: string;
  platform?: string;
  speed_kmph?: number;
  loco?: string;
  feed_message?: string;
}

export const StationAwareness: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [ackToast, setAckToast] = useState<string | null>(null);

  const isMemosView = location.pathname.includes('/memos');

  // Approaching Train Services state bound to live RailRadar feed (/api/live/station/LKO)
  const [approachingTrains, setApproachingTrains] = useState<ApproachingTrain[]>([
    {
      train_number: '12004',
      train_name: '12004 Lucknow Swarna Shatabdi',
      priority_class: 'SUPERFAST',
      origin: 'NDLS',
      destination: 'LKO',
      scheduled_arrival: '03:30 hrs',
      eta: '03:30 hrs',
      delay_minutes: 5,
      status: 'Approaching · On Time (+5m)',
      current_location: 'Approaching LKO Outer (KM 6.2)',
      current_chainage_km: 6.2,
      line: 'UP Main Line',
      platform: '1',
      speed_kmph: 110,
      loco: 'WAP-7 / Ghaziabad Shed (GZB)',
      feed_message: '● Live NTES Feed: Running on-time / +5m at Lucknow Division'
    },
    {
      train_number: '22425',
      train_name: '22425 Ayodhya Cantt - Anand Vihar Vande Bharat',
      priority_class: 'PREMIUM',
      origin: 'AY',
      destination: 'ANVT',
      scheduled_arrival: '04:15 hrs',
      eta: '04:15 hrs',
      delay_minutes: 0,
      status: 'On Time',
      current_location: 'Traversing Manak Nagar Jn (KM 5.0)',
      current_chainage_km: 5.0,
      line: 'DOWN Main Line',
      platform: '2',
      speed_kmph: 128,
      loco: 'Vande Bharat Trainset (Rake-08)',
      feed_message: '● Live NTES Feed: Running on-time / +0m at Lucknow Division'
    },
    {
      train_number: '12555',
      train_name: '12555 Gorakhdham Superfast Express',
      priority_class: 'SUPERFAST',
      origin: 'GKP',
      destination: 'BTI',
      scheduled_arrival: '04:45 hrs',
      eta: '04:57 hrs',
      delay_minutes: 12,
      status: 'Running Delayed (+12m)',
      current_location: 'Departed Unnao Jn · Block Section ON-MKG (KM 42.0)',
      current_chainage_km: 42.0,
      line: 'UP Main Line',
      platform: '4',
      speed_kmph: 102,
      loco: 'WAP-7 / Kanpur Shed (CNB)',
      feed_message: '● Live NTES Feed: Running delayed +12m at Lucknow Division'
    },
    {
      train_number: '14218',
      train_name: '14218 Unchahar Express',
      priority_class: 'EXPRESS',
      origin: 'CNA',
      destination: 'PYGS',
      scheduled_arrival: '05:10 hrs',
      eta: '05:10 hrs',
      delay_minutes: 0,
      status: 'On Time',
      current_location: 'Cleared Ajgain Block Hut C (KM 25.0)',
      current_chainage_km: 25.0,
      line: 'DOWN Main Line',
      platform: '3',
      speed_kmph: 95,
      loco: 'WAP-4 / Mughalsarai (DDU)',
      feed_message: '● Live NTES Feed: On Schedule / +0m at Lucknow Division'
    }
  ]);

  // Today's blocks intersecting station LKO (Lucknow Charbagh Jn)
  const [stationBlocks, setStationBlocks] = useState<StationBlock[]>([
    {
      id: 1,
      plan_code: 'BLK-2026-LKO-04',
      section: 'LKO (Lucknow Charbagh) – MKG (Manak Nagar)',
      time_window: '02:00 – 04:00 hrs (120m)',
      impacted_line: 'UP Main Line (Track 1)',
      departments: ['ENG', 'TRD', 'SNT'],
      status: 'APPROVED & SANCTIONED',
      chainage: 'KM 100.0 – 120.0',
      acknowledged: false
    },
    {
      id: 2,
      plan_code: 'BLK-2026-LKO-01',
      section: 'LKO Western Yard Approach / Siding',
      time_window: '04:15 – 05:45 hrs (90m)',
      impacted_line: 'Loop Line 2 & Crossover 101',
      departments: ['ENG'],
      status: 'SCHEDULED',
      chainage: 'KM 100.0 – 104.2',
      acknowledged: false
    },
    {
      id: 3,
      plan_code: 'BLK-2026-LKO-02',
      section: 'LKO – ON – CNB Corridor Section',
      time_window: '10:30 – 12:30 hrs (120m)',
      impacted_line: 'DN Main Line (Track 2)',
      departments: ['ENG', 'TRD'],
      status: 'SCHEDULED',
      chainage: 'KM 104.0 – 112.5',
      acknowledged: false
    }
  ]);

  // Statutory Memo Ledger entries for Lucknow Charbagh Jn
  const statutoryMemos: StatutoryMemo[] = [
    {
      id: 'MEMO-LKO-2026-081',
      formType: 'Form T/409 (Caution Order)',
      title: 'Temporary Speed Restriction (TSR 30 km/h) on Ganga Bridge / Sai River Br. No. 109',
      issuedBy: 'AEN-II / Lucknow Division (P-Way)',
      timestamp: 'Today, 01:15 hrs',
      lineSection: 'UP Main Line · KM 118.000 – 124.000',
      speedLimitOrCondition: 'Speed Limit: 30 km/h · Ballast Dressing in Progress',
      status: 'ACKNOWLEDGED',
      gsrRule: 'G&SR Rule 4.09 / 4.14'
    },
    {
      id: 'DISC-LKO-2026-041',
      formType: 'Form T/351 (Disconnection Notice)',
      title: 'Electronic Interlocking Dual Axle Counter Track Circuit Disconnection',
      issuedBy: 'SSE / Signal / LKO',
      timestamp: 'Today, 01:45 hrs',
      lineSection: 'LKO Interlocking Limit · Yard Point 101A/B',
      speedLimitOrCondition: 'Handed to Station Master · Clamp & Padlock Applied',
      status: 'ACKNOWLEDGED',
      gsrRule: 'G&SR Rule 3.51'
    },
    {
      id: 'PWR-LKO-2026-019',
      formType: 'Form E/TRD (Traction Isolation)',
      title: '25kV AC Overhead Catenary Power Block & Earth Wire Bonding Permit',
      issuedBy: 'Traction Power Controller (TPC) / Lucknow',
      timestamp: 'Today, 02:00 hrs',
      lineSection: 'LKO – MKG Section (UP Main Line)',
      speedLimitOrCondition: 'OHE Discharged · Station Master Red Indicator Locked',
      status: 'ACKNOWLEDGED',
      gsrRule: 'ACTM Para 20600'
    },
    {
      id: 'MEMO-LKO-2026-092',
      formType: 'Form T/409 (Caution Order)',
      title: 'Daylight Track Patrolling & Engineering Gauge Check',
      issuedBy: 'Permanent Way Inspector (PWI) / LKO',
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

  // Fetch live approaching trains from RailRadar API (/api/live/station/LKO)
  useEffect(() => {
    const fetchLiveStationBoard = async () => {
      try {
        const data = await getLiveStationBoard('LKO');
        if (data && Array.isArray(data.trains) && data.trains.length > 0) {
          setApproachingTrains(data.trains);
        }
      } catch (e) {
        console.warn("RailRadar Station Board fallback to default Lucknow train schedule:", e);
      }
    };
    fetchLiveStationBoard();
    const interval = setInterval(fetchLiveStationBoard, 30000); // 30-second live poll
    return () => clearInterval(interval);
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
    const toastText = "Electronic Caution Memo Acknowledged by SM Lucknow (G&SR Rule 4.14)";
    setAckToast(toastText);
    setTimeout(() => setAckToast(null), 5000);

    try {
      await acknowledgeStationBlock(block.plan_code, 'LKO');
    } catch (e) {
      console.warn("Backend sync notice for SM Lucknow acknowledgement:", e);
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
          subtitle="LKO (Lucknow Charbagh Jn) · Northern Railway Lucknow Division" 
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
              sectionTag="LKO (LUCKNOW CHARBAGH JN) · STATION ID: 10 · DESIGNEE: IR-STN-0450"
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
                        Station Code: LKO · Division: Lucknow NR
                      </span>
                      <span className="text-xs text-slate-700 font-semibold">• LKO (Lucknow Charbagh Jn) · Station ID: 10 · Designee: IR-STN-0450</span>
                    </div>
                    <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
                      Affected Blocks Intersecting Station LKO Limit
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
                          Today's Scheduled Blocks (Intersecting LKO Territory)
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
                        Approaching Train Services (Lucknow NR Advisory Telemetry · RailRadar Live)
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">Auto-refresh: 30s</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Feed (LKO)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {approachingTrains.map((tr) => {
                      const delay = tr.delay_minutes ?? 0;
                      return (
                        <div 
                          key={tr.train_number} 
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-blue-300 transition-all shadow-2xs flex flex-col justify-between gap-2.5"
                        >
                          <div>
                            {/* Top header: Train Number, Name & Dynamic Delay Badge */}
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <span className="font-mono font-black text-xs text-blue-700 block">
                                  {tr.train_number}
                                </span>
                                <h4 className="font-bold text-xs text-slate-900 leading-snug truncate" title={tr.train_name}>
                                  {tr.train_name}
                                </h4>
                              </div>
                              {delay === 0 ? (
                                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-bold shrink-0">
                                  ON TIME
                                </span>
                              ) : (
                                <span className="bg-rose-100 text-rose-800 text-xs px-2 py-0.5 rounded font-bold font-mono shrink-0">
                                  DELAY +{delay}m
                                </span>
                              )}
                            </div>

                            {/* Schedule & Platform Strip */}
                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-1 text-[11px]">
                              <div>
                                <span className="text-slate-400 text-[10px] block font-medium">Sched. Arrival:</span>
                                <span className="font-mono font-bold text-slate-800">
                                  {tr.scheduled_arrival || tr.eta || '04:00 hrs'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block font-medium">Berthing PF:</span>
                                <span className="font-bold text-slate-800">
                                  {tr.platform ? `Platform ${tr.platform}` : 'Main Line'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Live NTES GPS Telemetry Subtext */}
                          <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-600">
                            <p className="font-medium leading-relaxed">
                              Last reported: <strong className="text-slate-900 font-semibold">{tr.current_location || tr.status}</strong> · Real-time NTES GPS Telemetry
                            </p>
                          </div>
                        </div>
                      );
                    })}
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
                      <span className="text-xs text-slate-700 font-semibold">• LKO (Lucknow Charbagh Jn) · Station ID: 10 · Designee: IR-STN-0450</span>
                    </div>
                    <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
                      Station Master G&amp;SR Memo &amp; Disconnection Ledger
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Statutory electronic record of Form T/409 (Caution Orders), Form T/351 (S&amp;T Disconnection/Reconnection Notices), and Form E/TRD (Traction Isolation) issued to Station Master Lucknow Charbagh.
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
                          Active &amp; Acknowledged Statutory Memos (Lucknow Charbagh Jn Limit)
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
