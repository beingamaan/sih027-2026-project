import React from 'react';
import { Link } from 'react-router-dom';
import { Task } from '../../types';
import { LaneBadge } from './LaneBadge';
import { ReadinessBadge } from './ReadinessBadge';
import { Badge } from '../common/Badge';
import { Clock, ChevronRight } from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
}

export const TaskTable: React.FC<TaskTableProps> = ({ tasks }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Task Code</th>
              <th className="px-5 py-3.5">Dept</th>
              <th className="px-5 py-3.5">Location & Corridor</th>
              <th className="px-5 py-3.5">Assigned Window</th>
              <th className="px-5 py-3.5">Lane</th>
              <th className="px-5 py-3.5">Readiness</th>
              <th className="px-5 py-3.5">Duration</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {tasks.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-bold font-mono text-slate-900">{t.task_code}</td>
                <td className="px-5 py-3.5 font-semibold text-slate-800">{t.department}</td>
                <td className="px-5 py-3.5">
                  <span className="font-semibold text-slate-800 block">
                    {((t.id - 1) % 4) === 0
                      ? 'SEC-1: NDLS-GZB'
                      : ((t.id - 1) % 4) === 1
                      ? 'SEC-2: GZB-MB'
                      : ((t.id - 1) % 4) === 2
                      ? 'SEC-3: MB-BE'
                      : 'SEC-4: BE-HW'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    KM {t.km_from} – {t.km_to}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {t.status === 'ACKNOWLEDGED' || t.status === 'READY' || t.status === 'IN_PROGRESS' || t.status === 'LINE_HANDED_BACK' || t.status === 'WORK_COMPLETED' ? (
                    <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Window {((t.id - 1) % 4) + 1}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <LaneBadge lane={t.lane} />
                </td>
                <td className="px-5 py-3.5">
                  <ReadinessBadge level={t.material_ready && t.ptw_ready ? 'HIGH' : 'MEDIUM'} />
                </td>
                <td className="px-5 py-3.5 text-slate-600">
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Clock size={12} className="text-slate-400" />
                    {t.estimated_duration_minutes || 60}m
                  </span>
                </td>
                <td className="px-5 py-3.5 font-bold text-slate-700">{t.status}</td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    to={`/tasks/${t.id}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold hover:underline"
                  >
                    View <ChevronRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
