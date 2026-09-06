import React from 'react';
import { Task } from '../../types';
import { LaneBadge } from '../tasks/LaneBadge';
import { Button } from '../common/Button';
import { Clock, MapPin, CheckCircle, Play, ShieldCheck } from 'lucide-react';

interface FieldTaskCardProps {
  task: Task;
  onAcknowledge: (id: number) => void;
  onReady: (id: number) => void;
  onStart: (id: number) => void;
  onComplete: (id: number) => void;
  onHandback: (id: number) => void;
  actionLoading: boolean;
}

export const FieldTaskCard: React.FC<FieldTaskCardProps> = ({
  task,
  onAcknowledge,
  onReady,
  onStart,
  onComplete,
  onHandback,
  actionLoading,
}) => {
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-slate-900">{task.task_code}</span>
            <LaneBadge lane={task.lane} />
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">{task.description}</p>
        </div>

        <span className="text-xs font-bold uppercase px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
          Status: {task.status}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-600">
          <MapPin size={13} className="text-blue-600" />
          <span>Section #{task.block_section_id}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <Clock size={13} className="text-blue-600" />
          <span>{task.estimated_duration_minutes || 60} mins</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <span>Dept: {task.department}</span>
        </div>
      </div>

      {/* State transition buttons based on strict lifecycle */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={task.status !== 'PLANNED' && task.status !== 'OPEN'}
          loading={actionLoading}
          onClick={() => onAcknowledge(task.id)}
        >
          Acknowledge
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={task.status !== 'ACKNOWLEDGED'}
          loading={actionLoading}
          onClick={() => onReady(task.id)}
          icon={<CheckCircle size={14} className="text-emerald-600" />}
        >
          Mark Ready
        </Button>

        <Button
          size="sm"
          variant="primary"
          disabled={task.status !== 'READY'}
          loading={actionLoading}
          onClick={() => onStart(task.id)}
          icon={<Play size={14} />}
        >
          Start Work
        </Button>

        <Button
          size="sm"
          variant="secondary"
          disabled={task.status !== 'IN_PROGRESS'}
          loading={actionLoading}
          onClick={() => onComplete(task.id)}
        >
          Complete
        </Button>

        <Button
          size="sm"
          variant="success"
          disabled={task.status !== 'COMPLETED'}
          loading={actionLoading}
          onClick={() => onHandback(task.id)}
          icon={<ShieldCheck size={14} />}
        >
          Handback Block
        </Button>
      </div>
    </div>
  );
};
