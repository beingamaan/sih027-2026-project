import React from 'react';
import { Link } from 'react-router-dom';
import { Task } from '../../types';
import { LaneBadge } from '../tasks/LaneBadge';
import { ReadinessBadge } from '../tasks/ReadinessBadge';
import { Badge } from '../common/Badge';
import { ChevronRight } from 'lucide-react';

interface UpcomingTasksProps {
  tasks: Task[];
}

export const UpcomingTasks: React.FC<UpcomingTasksProps> = ({ tasks }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">High-Priority Upcoming Tasks</h3>
          <p className="text-xs text-slate-500">Live work items queued for block window assignment</p>
        </div>
        <Link to="/tasks" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
          View All Tasks <ChevronRight size={14} />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3">Task Code</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Lane</th>
              <th className="px-5 py-3">Priority</th>
              <th className="px-5 py-3">Readiness</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {tasks.slice(0, 6).map((task) => (
              <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-5 py-3.5 font-bold font-mono text-slate-900">{task.task_code}</td>
                <td className="px-5 py-3.5 font-medium">{task.department}</td>
                <td className="px-5 py-3.5 max-w-xs truncate text-slate-600">{task.description}</td>
                <td className="px-5 py-3.5">
                  <LaneBadge lane={task.lane} />
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={task.priority === 'CRITICAL' ? 'red' : task.priority === 'HIGH' ? 'amber' : 'slate'}>
                    {task.priority}
                  </Badge>
                </td>
                <td className="px-5 py-3.5">
                  <ReadinessBadge level={task.material_ready && task.gang_ready ? 'HIGH' : 'MEDIUM'} />
                </td>
                <td className="px-5 py-3.5">
                  <span className="font-semibold text-slate-600">{task.status}</span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    to={`/tasks/${task.id}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Details <ChevronRight size={13} />
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
