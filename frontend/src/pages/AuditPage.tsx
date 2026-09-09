import React, { useState, useEffect } from 'react';
import { Sidebar, useSidebar } from '../components/layout/Sidebar';
import { FileSpreadsheet, ShieldCheck, RefreshCw, Layers } from 'lucide-react';
import { getAuditLogs } from '../services/railwayApi';
import { AuditLog } from '../types';

export const AuditPage: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await getAuditLogs();
      setLogs(res);
    } catch (e) {
      console.error("Failed to load audit logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F7F8F5]">
      <Sidebar />
      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-[260px]'} p-6 relative z-10`}>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-elevated mb-6 border border-white/90">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-violet-100 text-violet-800 uppercase tracking-wider glow-teal">
                Immutable Governance Trail
              </span>
              <span className="text-xs text-slate-500 font-semibold">• Railway Safety Compliance</span>
            </div>
            <h1 className="text-2xl font-black text-[#0B1220] tracking-tight">
              Operational Decision Audit & Sanction Log
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Complete accountability record of automatic optimizer runs, controller approvals, overrides, and field loss codes.
            </p>
          </div>

          <button
            onClick={loadLogs}
            className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-98"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Audit Log
          </button>
        </div>

        {/* Audit Log Table */}
        <div className="p-6 rounded-2xl glass-panel-elevated">
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-200/80 bg-white">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-black text-[#0B1220] metric-mono">#{log.id}</td>
                    <td className="p-3.5 font-bold text-slate-800">{log.role}</td>
                    <td className="p-3.5 text-slate-600 font-medium">{log.division}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 font-black text-[10px] glow-blue">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-black text-slate-700">{log.reason_code || 'N/A'}</td>
                    <td className="p-3.5 text-slate-600 text-[11px] max-w-sm font-medium">{log.reason_text || 'Standard operational event'}</td>
                    <td className="p-3.5 text-slate-500 metric-mono font-medium">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};
