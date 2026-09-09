import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar, useSidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { 
  Award, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { getAuditLogs, getPlans, approvePlan, overridePlan } from '../services/railwayApi';
import { AuditLog, Plan } from '../types';

const OVERRIDE_REASONS = [
  { value: 'TRAFFIC_PRESSURE', label: 'TRAFFIC_PRESSURE — Urgent freight corridor congestion clearing' },
  { value: 'MACHINE_UNAVAILABLE', label: 'MACHINE_UNAVAILABLE — Tamping/BCM unit stabled for maintenance' },
  { value: 'MATERIAL_NOT_READY', label: 'MATERIAL_NOT_READY — Rails/sleepers pending depot dispatch' },
  { value: 'WEATHER', label: 'WEATHER — High wind, thunderstorm or monsoon restriction' },
  { value: 'SAFETY_PRIORITY', label: 'SAFETY_PRIORITY — Critical track defect takes precedence' },
  { value: 'LOCAL_OPERATIONAL_REASON', label: 'LOCAL_OPERATIONAL_REASON — Discretionary section controller diversion' }
];

type PlanFilterTab = 'PENDING' | 'SANCTIONED' | 'ARCHIVED';

export const GovernanceAudit: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter Tabs & Pagination
  const [activePlanTab, setActivePlanTab] = useState<PlanFilterTab>('PENDING');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 4;

  // Override Modal State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedReasonCode, setSelectedReasonCode] = useState<string>('TRAFFIC_PRESSURE');
  const [overrideNotes, setOverrideNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [auditLogs, plansList] = await Promise.all([
        getAuditLogs().catch(() => []),
        getPlans().catch(() => [])
      ]);
      setLogs(auditLogs);
      setPlans(plansList);
      if (plansList.length > 0 && selectedPlanId === null) {
        setSelectedPlanId(plansList[0].id);
      }
    } catch (e) {
      console.error("Failed to load governance data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter plans into Pending, Sanctioned, and Archived
  const categorizedPlans = useMemo(() => {
    const pending = plans.filter(p => p.status === 'PENDING_APPROVAL' || p.status === 'REPLAN_REQUIRED' || (!p.status && p.approval_status !== 'APPROVED'));
    const sanctioned = plans.filter(p => p.status === 'APPROVED' || p.status === 'SANCTIONED' || p.approval_status === 'APPROVED');
    const archived = plans.filter(p => p.status === 'SUPERSEDED' || p.status === 'OVERRIDDEN' || p.status === 'CLOSED');

    return { pending, sanctioned, archived };
  }, [plans]);

  const activeTabList = useMemo(() => {
    if (activePlanTab === 'PENDING') return categorizedPlans.pending;
    if (activePlanTab === 'SANCTIONED') return categorizedPlans.sanctioned;
    return categorizedPlans.archived;
  }, [activePlanTab, categorizedPlans]);

  const totalPages = Math.max(1, Math.ceil(activeTabList.length / pageSize));
  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeTabList.slice(start, start + pageSize);
  }, [activeTabList, currentPage]);

  const handleTabChange = (tab: PlanFilterTab) => {
    setActivePlanTab(tab);
    setCurrentPage(1);
  };

  const handleSanctionPlan = async (planId: number) => {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await approvePlan(planId);
      setActionMsg({ type: 'success', text: res.message || `Plan #${planId} sanctioned successfully with official executive authorization.` });
      await loadData();
    } catch (err: any) {
      setActionMsg({ 
        type: 'error', 
        text: err?.response?.data?.detail || "Failed to sanction plan. Executive verification required." 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteOverride = async () => {
    if (!selectedPlanId || !selectedReasonCode) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await overridePlan(selectedPlanId, selectedReasonCode);
      setActionMsg({ 
        type: 'success', 
        text: res.message || `Plan #${selectedPlanId} overridden under statutory code: ${selectedReasonCode}.` 
      });
      setIsOverrideModalOpen(false);
      await loadData();
    } catch (err: any) {
      setActionMsg({ 
        type: 'error', 
        text: err?.response?.data?.detail || "Officer override rejected. Mandatory reason code required." 
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-1 bg-[#F7F8F5]">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 flex flex-col ${isCollapsed ? 'ml-20' : 'ml-[260px]'}`}>
        <Header 
          title="Divisional Governance, Sanction & Statutory Audit" 
          subtitle="Executive Sanction Authority, Reason-Coded Overrides & Immutable Trail" 
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Executive Header Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl card-warm">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-[#7456B8] border border-[#7456B8]/20 uppercase tracking-wider flex items-center gap-1">
                  <Award size={12} className="text-[#7456B8]" />
                  Sr.DOM Executive Sanction Authority
                </span>
                <span className="text-xs text-slate-500 font-semibold">• Railway Act 1989</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-[#D9901A] border border-[#D9901A]/30">
                  G&SR Sanction Gate
                </span>
              </div>
              <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
                Divisional Plan Sanction & Reason-Coded Override Console
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Authorized executive review panel for Sr.DOM / Divisional Operations. Review dual-plan recommendations, sanction optimal P50 window, or record audited overrides.
              </p>
            </div>

            <button
              onClick={loadData}
              className="px-3.5 py-2 rounded-xl bg-[#102A43] text-white text-xs font-bold flex items-center gap-2 hover:bg-[#1E5AA8] transition-all shadow-sm active:scale-98 shrink-0 cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh Trail
            </button>
          </div>

          {/* Action Feedback Banner */}
          {actionMsg && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 shadow-sm ${
              actionMsg.type === 'success' 
                ? 'bg-[#EAF6F0] border-[#16805C]/30 text-[#16805C]' 
                : 'bg-[#FFF0F1] border-[#B42332]/30 text-[#B42332]'
            }`}>
              {actionMsg.type === 'success' ? <CheckCircle2 size={18} className="text-[#16805C]" /> : <AlertTriangle size={18} className="text-[#B42332]" />}
              <span>{actionMsg.text}</span>
            </div>
          )}

          {/* Active Block Plans Grid with Clean Tab Filter & Pagination */}
          <div className="p-6 rounded-2xl card-warm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E0E8] pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock size={18} className="text-[#1E5AA8]" />
                <h3 className="text-sm font-black text-slate-900">Active Corridor Block Possession Plans</h3>
              </div>

              {/* Clean Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-[#F7F8F5] p-1 rounded-xl border border-[#D9E0E8] text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleTabChange('PENDING')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activePlanTab === 'PENDING'
                      ? 'bg-white text-slate-900 shadow-xs border border-[#D9E0E8]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pending Approval ({categorizedPlans.pending.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('SANCTIONED')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activePlanTab === 'SANCTIONED'
                      ? 'bg-white text-slate-900 shadow-xs border border-[#D9E0E8]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sanctioned ({categorizedPlans.sanctioned.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('ARCHIVED')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activePlanTab === 'ARCHIVED'
                      ? 'bg-white text-slate-900 shadow-xs border border-[#D9E0E8]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Archived ({categorizedPlans.archived.length})
                </button>
              </div>
            </div>

            {paginatedPlans.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center font-medium">
                No block plans found in category: <span className="font-bold">{activePlanTab}</span>.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {paginatedPlans.map((p) => {
                  const isSelected = selectedPlanId === p.id;
                  const isPlanA = p.plan_code?.includes('PLAN_A') || p.plan_type === 'PLAN_A' || p.id % 2 === 1;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-6 rounded-2xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-blue-50/70 border-[#1E5AA8] ring-2 ring-[#1E5AA8]/30 shadow-md'
                          : 'bg-[#FCFBF8] border-[#D9E0E8] shadow-xs hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isPlanA ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isPlanA ? 'P50 Optimal Plan A' : 'P90 Conservative Plan B'}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 mt-2 font-mono">
                            {p.plan_code} <span className="text-xs text-slate-500 font-semibold">(V{p.plan_version || 1})</span>
                          </h4>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          p.status === 'APPROVED' || p.status === 'SANCTIONED' ? 'bg-emerald-100 text-emerald-800' :
                          p.status === 'SUPERSEDED' ? 'bg-purple-100 text-purple-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {p.status || p.approval_status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                        <div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase">Duration</p>
                          <p className="text-xs font-bold text-slate-900 font-mono">{p.total_duration_minutes || 120}m</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase">Delay Cost</p>
                          <p className="text-xs font-bold text-slate-900 font-mono">{p.total_delay_cost_wtm || 84} WTM</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase">Bundled Works</p>
                          <p className="text-xs font-bold text-slate-900 font-mono">{p.tasks?.length || 2} Works</p>
                        </div>
                      </div>

                      {/* Action Buttons with adequate breathing room */}
                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-3">
                        <button
                          type="button"
                          disabled={actionLoading || p.status === 'APPROVED' || p.status === 'SANCTIONED'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSanctionPlan(p.id);
                          }}
                          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer ${
                            p.status === 'APPROVED' || p.status === 'SANCTIONED'
                              ? 'bg-slate-300 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
                          }`}
                        >
                          {p.status === 'APPROVED' || p.status === 'SANCTIONED' ? 'Already Sanctioned' : 'Sanction Plan A'}
                        </button>

                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlanId(p.id);
                            setIsOverrideModalOpen(true);
                          }}
                          className="py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-sm active:scale-98 cursor-pointer"
                        >
                          Override Plan
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600 font-medium">
                <span>
                  Showing {paginatedPlans.length} of {activeTabList.length} plans (Page {currentPage} of {totalPages})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mandatory Override Modal */}
          {isOverrideModalOpen && (
            <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-amber-300 shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <AlertTriangle size={20} />
                  <h3 className="text-base font-black text-slate-900">Divisional Officer Override Authorization</h3>
                </div>

                <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
                  Railway safety protocols require an explicit statutory reason code for altering or overriding an automated optimization window. This event is committed to the immutable audit trail.
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
                      placeholder="Detail specific train movement pressures or track condition reasons..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsOverrideModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleExecuteOverride}
                    className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-md active:scale-98 transition-all cursor-pointer"
                  >
                    {actionLoading ? 'Recording Override...' : 'Confirm Audited Override'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Immutable Audit Trail Table */}
          <div className="p-6 rounded-2xl card-warm space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9E0E8] pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-[#7456B8]" />
                <h3 className="text-sm font-black text-slate-900">Immutable Railway Decision Audit Trail</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Total Entries: {logs.length}</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#D9E0E8]">
              <table className="w-full text-left text-xs">
                <thead className="gov-table-header">
                  <tr>
                    <th className="p-3.5">Log ID</th>
                    <th className="p-3.5">Actor / Role</th>
                    <th className="p-3.5">Division</th>
                    <th className="p-3.5">Action Event</th>
                    <th className="p-3.5">Reason Code</th>
                    <th className="p-3.5">Operational Details</th>
                    <th className="p-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E0E8] bg-[#FCFBF8]">
                  {logs.map((log) => (
                    <tr key={log.id} className="gov-table-row">
                      <td className="p-3.5 font-black text-slate-900 metric-mono">#{log.id}</td>
                      <td className="p-3.5 font-bold text-slate-800">{log.role || log.actor_id}</td>
                      <td className="p-3.5 text-slate-600 font-medium">{log.division || log.division_id || 'DLI'}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded font-black text-[9px] ${
                          log.action === 'PLAN_SANCTIONED' || log.action === 'APPROVE_PLAN' ? 'bg-[#EAF6F0] text-[#16805C]' :
                          log.action === 'OVERRIDE' || log.action === 'OFFICER_OVERRIDE' ? 'bg-[#FFF7E6] text-[#D9901A]' :
                          log.action === 'PLAN_VERSION_BUMP' ? 'bg-blue-50 text-[#1E5AA8]' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-700 font-mono text-[11px]">{log.reason_code || 'N/A'}</td>
                      <td className="p-3.5 text-slate-600 text-[11px] max-w-sm truncate font-medium">
                        {log.reason_text || 'Standard operational record'}
                      </td>
                      <td className="p-3.5 text-slate-500 metric-mono font-medium whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
