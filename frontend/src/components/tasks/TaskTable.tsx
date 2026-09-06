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
              <th className="px-5 py-3.5">Description</th>
              <th className="px-5 py-3.5">Dept</th>
              <th className="px-5 py-3.5">Lane</th>
              <th className="px-5 py-3.5">Priority</th>
              <th className="px-5 py-3.5">Readiness</th>
              <th className="px-5 py-3.5">Duration</th>
              <th className="px-5 py-3.5">Deadline</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {tasks.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-bold font-mono text-slate-900">{t.task_code}</td>
                <td className="px-5 py-3.5 max-w-sm truncate text-slate-600 font-medium">{t.description}</td>
                <td className="px-5 py-3.5 font-semibold text-slate-800">{t.department}</td>
                <td className="px-5 py-3.5">
                  <LaneBadge lane={t.lane} />
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={t.priority === 'CRITICAL' ? 'red' : t.priority === 'HIGH' ? 'amber' : 'slate'}>
                    {t.priority}
                  </Badge>
                </td>
                <td className="px-5 py-3.5">
                  <ReadinessBadge level={t.material_ready && t.gang_ready ? 'HIGH' : 'MEDIUM'} />
                </td>
                <td className="px-5 py-3.5 text-slate-600">
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Clock size={12} className="text-slate-400" />
                    {t.estimated_duration_minutes || 60}m
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">{t.deadline || 'None'}</td>
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
