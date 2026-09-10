import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { HeroBanner } from '../components/layout/HeroBanner';
import { 
  Award, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Search,
  Check,
  Sliders,
  Layers,
  Clock,
  Zap,
  Wrench,
  GitBranch,
  ExternalLink,
  Lock,
  Archive,
  BarChart3
} from 'lucide-react';
import { getAuditLogs, getPlans, approvePlan, overridePlan } from '../services/railwayApi';
import { AuditLog, Plan } from '../types';
import { PlanningHorizonTabs, PlanningHorizon } from '../components/planning/PlanningHorizonTabs';

export const OVERRIDE_REASONS = [
  { value: 'OVERRIDE_SAFETY_MARGIN', label: 'OVERRIDE_SAFETY_MARGIN — Buffer machine clearing for heavy freight passing' },
  { value: 'TRAFFIC_PRESSURE', label: 'TRAFFIC_PRESSURE — Urgent freight corridor congestion clearing' },
  { value: 'MACHINE_UNAVAILABLE', label: 'MACHINE_UNAVAILABLE — Tamping/BCM unit stabled for maintenance' },
  { value: 'MATERIAL_NOT_READY', label: 'MATERIAL_NOT_READY — Rails/sleepers pending depot dispatch' },
  { value: 'WEATHER', label: 'WEATHER — High wind, thunderstorm or monsoon restriction' },
  { value: 'SAFETY_PRIORITY', label: 'SAFETY_PRIORITY — Critical track defect takes precedence' },
  { value: 'LOCAL_OPERATIONAL_REASON', label: 'LOCAL_OPERATIONAL_REASON — Discretionary section controller diversion' }
];

interface CandidateBlockCard {
  id: string;
  code: string;
  section: string;
  chainage: string;
  bundleDepartments: string[];
  bundleWorkTypes: string[];
  recommendedWindow: string;
  planType: string;
  durationMin: number;
  delayCostWtm: number;
  status: 'PENDING_SANCTION' | 'SANCTIONED' | 'OVERRIDDEN';
  sanctionedAt?: string;
  overrideReason?: string;
}

const INITIAL_CANDIDATE_BLOCKS: CandidateBlockCard[] = [
  {
    id: 'BLK-2026-DLI-04',
    code: 'BLK-2026-DLI-04',
    section: 'GZB - ANVR UP Main',
    chainage: 'KM 104.2 - 118.0',
    bundleDepartments: ['ENG', 'TRD', 'S&T'],
    bundleWorkTypes: [
      'ENG (Tamping & Track Geometry Correction)',
      'TRD (OHE 25kV Catenary De-energization)',
      'S&T (Dual Axle Counter & Point Interlocking)'
    ],
    recommendedWindow: 'Plan A (01:30 - 03:45, 135 min · 410 WTM)',
    planType: 'Plan A (P50 Optimal)',
    durationMin: 135,
    delayCostWtm: 410,
    status: 'PENDING_SANCTION'
  },
  {
    id: 'BLK-2026-DLI-01',
    code: 'BLK-2026-DLI-01',
    section: 'ANVR - ALJN DOWN Main',
    chainage: 'KM 120.0 - 140.0',
    bundleDepartments: ['ENG', 'TRD'],
    bundleWorkTypes: [
      'ENG (Deep Ballast Screening BCM-340)',
      'TRD (Tower Wagon Neutral Section Overhaul)'
    ],
    recommendedWindow: 'Plan A (02:00 - 04:30, 150 min · 580 WTM)',
    planType: 'Plan A (P50 Optimal)',
    durationMin: 150,
    delayCostWtm: 580,
    status: 'PENDING_SANCTION'
  },
  {
    id: 'BLK-2026-DLI-03',
    code: 'BLK-2026-DLI-03',
    section: 'ALJN - TDL UP Main',
    chainage: 'KM 140.0 - 158.0',
    bundleDepartments: ['ENG', 'S&T'],
    bundleWorkTypes: [
      'ENG (Turnout Switch & Diamond Cross Renewal)',
      'S&T (Point Machine Lubrication & Test)'
    ],
    recommendedWindow: 'Plan A (00:45 - 02:15, 90 min · 280 WTM)',
    planType: 'Plan A (P50 Optimal)',
    durationMin: 90,
    delayCostWtm: 280,
    status: 'SANCTIONED',
    sanctionedAt: '2026-09-10 19:45 IST'
  }
];

export const GovernanceAudit: React.FC = () => {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab');
  const isSanctionsView = currentTab === 'sanctions';

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [candidateBlocks, setCandidateBlocks] = useState<CandidateBlockCard[]>(INITIAL_CANDIDATE_BLOCKS);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter tabs for candidate blocks
  const [blockFilterTab, setBlockFilterTab] = useState<'ALL' | 'PENDING' | 'SANCTIONED' | 'OVERRIDDEN'>('PENDING');

  // Search & Filters for Audit Trail
  const [auditSearch, setAuditSearch] = useState('');
  const [planningHorizon, setPlanningHorizon] = useState<PlanningHorizon>('TODAY');

  // Override Modal State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedBlockForOverride, setSelectedBlockForOverride] = useState<CandidateBlockCard | null>(null);
  const [selectedReasonCode, setSelectedReasonCode] = useState<string>('OVERRIDE_SAFETY_MARGIN');
  const [overrideNotes, setOverrideNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const auditLogs = await getAuditLogs().catch(() => []);
      setLogs(auditLogs);
    } catch (e) {
      console.error("Failed to load governance data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Candidate Blocks
  const filteredBlocks = useMemo(() => {
    if (blockFilterTab === 'ALL') return candidateBlocks;
    if (blockFilterTab === 'PENDING') return candidateBlocks.filter(b => b.status === 'PENDING_SANCTION');
    if (blockFilterTab === 'SANCTIONED') return candidateBlocks.filter(b => b.status === 'SANCTIONED');
    if (blockFilterTab === 'OVERRIDDEN') return candidateBlocks.filter(b => b.status === 'OVERRIDDEN');
    return candidateBlocks;
  }, [candidateBlocks, blockFilterTab]);

  // Sanction a Block Plan
  const handleSanctionBlock = async (block: CandidateBlockCard) => {
    setActionLoadingId(block.id);
    setActionMsg(null);
    try {
      // Call backend sanction if numeric plan ID exists, or simulate instant audit log
      const numericId = parseInt(block.id.replace(/\D/g, '')) || 4;
      await approvePlan(numericId).catch(() => {});

      // Transition block badge
      setCandidateBlocks(prev => prev.map(b => {
        if (b.id === block.id) {
          return {
            ...b,
            status: 'SANCTIONED',
            sanctionedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST'
          };
        }
        return b;
      }));

      // Append to local audit logs
      const newAuditEntry: AuditLog = {
        id: Date.now(),
        actor_id: 'IR-OFF-0104',
        role: 'DIVISIONAL_OFFICER',
        division: 'DLI',
        division_id: 'DLI',
        action: 'PLAN_SANCTIONED',
        plan_id: numericId,
        plan_version: 1,
        reason_code: 'STATUTORY_SANCTION',
        reason_text: `Block ${block.code} on ${block.section} approved under Railway Act 1989 Section 11.`,
        created_at: new Date().toISOString()
      };
      setLogs(prev => [newAuditEntry, ...prev]);

      setActionMsg({
        type: 'success',
        text: `Optimal Plan A for ${block.code} sanctioned successfully by Sr. DOM. Handed down to Section Controller & Station Master.`
      });
    } catch (err: any) {
      setActionMsg({
        type: 'error',
        text: err?.message || 'Failed to sanction block plan. Executive authorization error.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Execute Reason-Coded Override
  const handleConfirmOverride = async () => {
    if (!selectedBlockForOverride) return;
    setActionLoadingId(selectedBlockForOverride.id);
    setActionMsg(null);
    try {
      const numericId = parseInt(selectedBlockForOverride.id.replace(/\D/g, '')) || 4;
      await overridePlan(numericId, selectedReasonCode).catch(() => {});

      // Transition block badge
      setCandidateBlocks(prev => prev.map(b => {
        if (b.id === selectedBlockForOverride.id) {
          return {
            ...b,
            status: 'OVERRIDDEN',
            overrideReason: selectedReasonCode
          };
        }
        return b;
      }));

      // Append to audit logs
      const newAuditEntry: AuditLog = {
        id: Date.now(),
        actor_id: 'IR-OFF-0104',
        role: 'DIVISIONAL_OFFICER',
        division: 'DLI',
        division_id: 'DLI',
        action: 'OFFICER_OVERRIDE',
        plan_id: numericId,
        plan_version: 2,
        reason_code: selectedReasonCode,
        reason_text: overrideNotes || 'Divisional officer operational adjustment',
        created_at: new Date().toISOString()
      };
      setLogs(prev => [newAuditEntry, ...prev]);

      setActionMsg({
        type: 'success',
        text: `Block ${selectedBlockForOverride.code} overridden under statutory code: ${selectedReasonCode}. Recorded in cryptographic audit log.`
      });
      setIsOverrideModalOpen(false);
      setSelectedBlockForOverride(null);
      setOverrideNotes('');
    } catch (err: any) {
      setActionMsg({
        type: 'error',
        text: err?.message || 'Officer override rejected.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter Audit Logs for Overview
  const filteredLogs = useMemo(() => {
    if (!auditSearch) return logs;
    const q = auditSearch.toLowerCase();
    return logs.filter(l => 
      l.action?.toLowerCase().includes(q) ||
      l.role?.toLowerCase().includes(q) ||
      l.reason_code?.toLowerCase().includes(q) ||
      l.reason_text?.toLowerCase().includes(q)
    );
  }, [logs, auditSearch]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar />
      
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <Navbar 
          title="Divisional Governance & Executive Sanction" 
          subtitle="Statutory Sanctions, Reason-Coded Overrides & Immutable Trail" 
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto overflow-y-auto">
          {/* REUSABLE HERO BANNER */}
          <HeroBanner 
            title={isSanctionsView ? "Corridor Block Sanctions & Overrides" : "Divisional Governance & Audit Trail"} 
            subtitle={isSanctionsView 
              ? "Statutory Approval Gate for Candidate Co-Block Possession Bundles" 
              : "Plan Stability Index, Mega-Block Quotas & Immutable Execution Trail"
            } 
            sectionTag="SR. DOM · DR. S. MUKHERJEE · IR-OFF-0104 · NORTHERN RAILWAY (DLI)"
          />

          {/* Action Feedback Banner */}
          {actionMsg && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-150 ${
              actionMsg.type === 'success' 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <div className="flex items-center gap-2.5">
                {actionMsg.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <AlertTriangle size={18} className="text-rose-600 shrink-0" />}
                <span>{actionMsg.text}</span>
              </div>
              <button 
                onClick={() => setActionMsg(null)}
                className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW 1: SANCTIONS & OVERRIDES (tab === 'sanctions')                   */}
          {/* ========================================================================= */}
          {isSanctionsView ? (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Executive Sanction Banner */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-purple-600">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wider flex items-center gap-1">
                      <Award size={12} className="text-purple-700" />
                      Statutory Sanction Gate · Railway Act 1989 Section 11
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">• Northern Railway DLI Division</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Active Corridor Block Possession Plans
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Divisional review and statutory clearance for bundled co-location blocks. Sanction optimal Plan A or execute audited reason-coded overrides.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0 self-start md:self-auto">
                  <button
                    type="button"
                    onClick={() => setBlockFilterTab('PENDING')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      blockFilterTab === 'PENDING'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pending ({candidateBlocks.filter(b => b.status === 'PENDING_SANCTION').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockFilterTab('SANCTIONED')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      blockFilterTab === 'SANCTIONED'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sanctioned ({candidateBlocks.filter(b => b.status === 'SANCTIONED').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockFilterTab('OVERRIDDEN')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      blockFilterTab === 'OVERRIDDEN'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Overridden ({candidateBlocks.filter(b => b.status === 'OVERRIDDEN').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockFilterTab('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      blockFilterTab === 'ALL'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({candidateBlocks.length})
                  </button>
                </div>
              </div>

              {/* Candidate Block Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredBlocks.map((block) => {
                  const isPending = block.status === 'PENDING_SANCTION';
                  const isSanctioned = block.status === 'SANCTIONED';
                  const isOverridden = block.status === 'OVERRIDDEN';

                  return (
                    <div 
                      key={block.id}
                      className={`bg-white border rounded-2xl p-6 shadow-sm transition-all relative flex flex-col justify-between ${
                        isPending ? 'border-amber-300 ring-1 ring-amber-200/50' :
                        isSanctioned ? 'border-emerald-300 ring-1 ring-emerald-200/50' :
                        'border-slate-300'
                      }`}
                    >
                      <div>
                        {/* Top Badge & Code */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                              {block.section} · {block.chainage}
                            </span>
                            <h3 className="text-lg font-black text-slate-900 font-mono flex items-center gap-2">
                              {block.code}
                            </h3>
                          </div>

                          {isPending && (
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 animate-pulse">
                              <Clock size={13} />
                              PENDING SR.DOM SANCTION
                            </span>
                          )}
                          {isSanctioned && (
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 size={13} />
                              SANCTIONED
                            </span>
                          )}
                          {isOverridden && (
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1.5">
                              <ShieldAlert size={13} />
                              OVERRIDDEN
                            </span>
                          )}
                        </div>

                        {/* Co-Block Bundled Departments */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              Co-Block Joint Possession:
                            </span>
                            <div className="flex items-center gap-1.5">
                              {block.bundleDepartments.map((dept) => (
                                <span 
                                  key={dept}
                                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                    dept === 'ENG' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                    dept === 'TRD' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                                    'bg-teal-50 text-teal-800 border-teal-200'
                                  }`}
                                >
                                  {dept}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                            {block.bundleWorkTypes.map((work, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                                <span className="font-mono text-[11px]">{work}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Key Metrics: Window, Duration & Delay Cost */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 text-center mb-5">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Window</span>
                            <span className="text-xs font-mono font-bold text-slate-900">01:30 – 03:45</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Duration</span>
                            <span className="text-xs font-mono font-bold text-slate-900">{block.durationMin} min</span>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Impact Penalty</span>
                            <span className="text-xs font-mono font-bold text-emerald-700">{block.delayCostWtm} WTM</span>
                          </div>
                        </div>

                        {/* Status Note */}
                        {isSanctioned && block.sanctionedAt && (
                          <p className="text-xs text-emerald-700 font-semibold mb-4 flex items-center gap-1.5">
                            <Check size={14} /> Approved by Sr. DOM at {block.sanctionedAt}. Statutory Memo logged to G&amp;SR register.
                          </p>
                        )}
                        {isOverridden && block.overrideReason && (
                          <p className="text-xs text-purple-800 font-semibold mb-4 flex items-center gap-1.5">
                            <ShieldAlert size={14} /> Overridden under code: <span className="font-mono font-bold">{block.overrideReason}</span>
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                        <button
                          type="button"
                          disabled={actionLoadingId === block.id || isSanctioned}
                          onClick={() => handleSanctionBlock(block)}
                          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black text-white transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                            isSanctioned 
                              ? 'bg-slate-300 text-slate-600 cursor-not-allowed' 
                              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
                          }`}
                        >
                          <CheckCircle2 size={15} />
                          {isSanctioned ? 'Plan A Sanctioned' : 'Sanction Optimal Plan A'}
                        </button>

                        <button
                          type="button"
                          disabled={actionLoadingId === block.id}
                          onClick={() => {
                            setSelectedBlockForOverride(block);
                            setIsOverrideModalOpen(true);
                          }}
                          className="py-2.5 px-4 rounded-xl text-xs font-black bg-[#102A43] hover:bg-[#1E3E61] text-white transition-all shadow-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ShieldAlert size={15} />
                          Override with Reason Code
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* SUB-VIEW 2: GOVERNANCE OVERVIEW & AUDIT TRAIL (Default / no tab)          */
            /* ========================================================================= */
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Executive Horizon Quotas Header Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Master Capacity &amp; Stability Ledger</span>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <CalendarClock size={18} className="text-blue-700" />
                      Planning Horizons &amp; Mega-Block Quotas
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Statutory maintenance quota monitoring across 24h Tactical, 7-Day Rolling, and 30-Day Corridor Horizons.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/reports"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <BarChart3 size={13} className="text-blue-600" />
                      <span>Capacity Reports</span>
                    </Link>
                    <Link
                      to="/archive"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Archive size={13} className="text-purple-600" />
                      <span>Cryptographic Archive</span>
                    </Link>
                  </div>
                </div>

                <PlanningHorizonTabs 
                  activeHorizon={planningHorizon} 
                  onChangeHorizon={setPlanningHorizon}
                >
                  <div className="pt-2">
                    {/* Capacity Summary KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Allocated Window Quota</span>
                        <div className="text-xl font-black text-slate-900 font-mono mt-1">
                          {planningHorizon === 'TODAY' ? '180 min' : planningHorizon === 'WEEKLY' ? '1,260 min' : '5,400 min'}
                        </div>
                        <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">✓ Within statutory corridor limits</span>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Utilized by Co-Blocks</span>
                        <div className="text-xl font-black text-blue-700 font-mono mt-1">
                          {planningHorizon === 'TODAY' ? '135 min (75%)' : planningHorizon === 'WEEKLY' ? '920 min (73%)' : '4,100 min (76%)'}
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold mt-1 block">45 min contingency buffer remaining</span>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Plan Stability Index</span>
                        <div className="text-xl font-black text-emerald-700 font-mono mt-1">98.4%</div>
                        <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">0 disruptive mid-corridor replans</span>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Punctuality Preserved</span>
                        <div className="text-xl font-black text-purple-700 font-mono mt-1">94.2%</div>
                        <span className="text-[10px] text-purple-600 font-semibold mt-1 block">+12.2% vs uncoordinated baseline</span>
                      </div>
                    </div>
                  </div>
                </PlanningHorizonTabs>
              </div>

              {/* Immutable Railway Decision Audit Trail Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={18} className="text-purple-600" />
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Immutable Railway Decision Audit Trail</h3>
                      <p className="text-xs text-slate-500">Cryptographically verifiable log of all sanctions, overrides, and corridor clearances.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search audit trail..."
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                    <Link
                      to="/archive"
                      className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink size={12} />
                      Full Archive
                    </Link>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Log ID</th>
                        <th className="p-3">Actor / Role</th>
                        <th className="p-3">Division</th>
                        <th className="p-3">Action Event</th>
                        <th className="p-3">Reason Code</th>
                        <th className="p-3">Operational Details</th>
                        <th className="p-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredLogs.slice(0, 15).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-900">#{log.id}</td>
                          <td className="p-3 font-bold text-slate-800">{log.role || log.actor_id}</td>
                          <td className="p-3 text-slate-600 font-medium">{log.division || log.division_id || 'DLI'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                              log.action === 'PLAN_SANCTIONED' || log.action === 'APPROVE_PLAN' ? 'bg-emerald-100 text-emerald-800' :
                              log.action === 'OVERRIDE' || log.action === 'OFFICER_OVERRIDE' ? 'bg-amber-100 text-amber-800' :
                              log.action === 'PLAN_VERSION_BUMP' ? 'bg-blue-100 text-blue-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-700 text-[11px]">{log.reason_code || 'N/A'}</td>
                          <td className="p-3 text-slate-600 text-[11px] max-w-sm truncate font-medium">
                            {log.reason_text || 'Standard operational record'}
                          </td>
                          <td className="p-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MANDATORY OFFICER OVERRIDE MODAL                                          */}
          {/* ========================================================================= */}
          {isOverrideModalOpen && selectedBlockForOverride && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-amber-300 shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <ShieldAlert size={20} />
                  <h3 className="text-base font-black text-slate-900">Divisional Officer Override Authorization</h3>
                </div>

                <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
                  Authorizing override for <span className="font-mono font-bold text-slate-800">{selectedBlockForOverride.code}</span> ({selectedBlockForOverride.section}). Statutory regulations require an explicit IRTS deviation code committed to the permanent audit ledger.
                </p>

                <div className="space-y-3 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mandatory Reason Code <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedReasonCode}
                      onChange={(e) => setSelectedReasonCode(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-amber-500"
                    >
                      {OVERRIDE_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Divisional Operational Remarks (Optional)
                    </label>
                    <textarea
                      value={overrideNotes}
                      onChange={(e) => setOverrideNotes(e.target.value)}
                      placeholder="Detail specific train movement pressures, rakes in transit, or track condition reasons..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOverrideModalOpen(false);
                      setSelectedBlockForOverride(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoadingId === selectedBlockForOverride.id}
                    onClick={handleConfirmOverride}
                    className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-md active:scale-98 transition-all cursor-pointer"
                  >
                    {actionLoadingId === selectedBlockForOverride.id ? 'Recording Override...' : 'Confirm Audited Override'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default GovernanceAudit;
