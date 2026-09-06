import React from 'react';
import { AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { OperationalRisk } from '../../types';

interface RiskCardProps {
  risks: OperationalRisk[];
}

export const RiskCard: React.FC<RiskCardProps> = ({ risks }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-rose-100 text-rose-700">
            <AlertTriangle size={18} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Active Operational Risks</h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {risks.length} Detected
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {risks.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            No critical operational risks active in current block sections.
          </div>
        ) : (
          risks.map((risk, idx) => (
            <div key={idx} className="p-4.5 hover:bg-slate-50/80 transition-colors flex items-start gap-3">
              {risk.severity === 'HIGH' ? (
                <AlertOctagon size={18} className="text-rose-600 mt-0.5 shrink-0" />
              ) : risk.severity === 'MEDIUM' ? (
                <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
              ) : (
                <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide ${
                      risk.severity === 'HIGH'
                        ? 'bg-rose-100 text-rose-800'
                        : risk.severity === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {risk.severity}
                  </span>
                  <p className="text-xs font-semibold text-slate-900 truncate">{risk.title}</p>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{risk.detail}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
