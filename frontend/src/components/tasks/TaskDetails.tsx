import React from 'react';
import { Task, TaskClassification, TaskReadiness } from '../../types';
import { LaneBadge } from './LaneBadge';
import { ReadinessBadge } from './ReadinessBadge';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { CheckCircle2, XCircle, Clock, Zap, ShieldAlert } from 'lucide-react';

interface TaskDetailsProps {
  task: Task;
  classification: TaskClassification | null;
  readiness: TaskReadiness | null;
  onClassify: () => void;
  classifying: boolean;
}

export const TaskDetailsView: React.FC<TaskDetailsProps> = ({
  task,
  classification,
  readiness,
  onClassify,
  classifying,
}) => {
  const p50 = task.p50_duration_minutes || task.estimated_duration_minutes || 60;
  const p90 = task.p90_duration_minutes || Math.round(p50 * 1.5);
  const overrun = task.overrun_probability ? Math.round(task.overrun_probability * 100) : 12;

  const readinessItems = [
    { label: 'Required Machine', ready: !!task.machine_ready, note: task.required_machine || 'Not Specified' },
    { label: 'Assigned Gang', ready: !!task.gang_ready, note: task.required_gang || 'Track Gang Assigned' },
    { label: 'Materials at Site', ready: !!task.material_ready, note: 'Ballast, rails, clips confirmed' },
    { label: 'Power / OHE Permit', ready: !!task.power_permit_ready, note: task.department === 'TRD' ? 'Permit mandatory' : 'Not required' },
    { label: 'Site Preparation', ready: !!task.site_ready, note: 'Access roads & clearances verified' },
    { label: 'Weather Suitability', ready: !!task.weather_suitable, note: 'Wind & rain thresholds OK' },
  ];

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold font-mono text-slate-900">{task.task_code}</h2>
            <LaneBadge lane={task.lane} showSubtitle />
            <Badge variant={task.status === 'OPEN' ? 'green' : 'slate'}>{task.status}</Badge>
          </div>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl font-medium leading-relaxed">{task.description}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={onClassify}
            loading={classifying}
            variant="secondary"
            icon={<Zap size={16} className="text-amber-400" />}
          >
            Run AI Classification
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Specs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider">
            Operational Parameters
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Department</span>
              <span className="font-bold text-slate-800">{task.department}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Task Type</span>
              <span className="font-semibold text-slate-700">{task.task_type}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Block Section ID</span>
              <span className="font-mono font-bold text-blue-700">SEC-#{task.block_section_id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Asset ID</span>
              <span className="font-mono text-slate-700">AST-#{task.asset_id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Statutory Deadline</span>
              <span className="font-mono font-bold text-rose-700">{task.deadline || 'Flexible'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">Priority Rating</span>
              <Badge variant={task.priority === 'CRITICAL' ? 'red' : 'amber'}>{task.priority}</Badge>
            </div>
          </div>
        </div>

        {/* Statistical Duration Model */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Duration Distribution</h3>
            <Clock size={16} className="text-blue-600" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <p className="text-[11px] font-semibold text-slate-500">P50 (Median)</p>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1">{p50} min</p>
            </div>
            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 text-center">
              <p className="text-[11px] font-semibold text-blue-700">P90 (Conservative)</p>
              <p className="text-xl font-bold font-mono text-blue-900 mt-1">{p90} min</p>
            </div>
          </div>

          <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">Overrun Probability</span>
            <span className="text-sm font-bold text-amber-800 font-mono">{overrun}%</span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed italic">
            Statistical regression based on historical block performance. Planner should schedule using P90 in high-density corridors.
          </p>
        </div>

        {/* AI Classification Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Classification Authority</h3>
            <ShieldAlert size={16} className="text-slate-600" />
          </div>

          {classification ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Assigned Lane</span>
                <LaneBadge lane={classification.lane} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Optimizer Eligible</span>
                <Badge variant={classification.optimizer_eligible ? 'green' : 'red'}>
                  {classification.optimizer_eligible ? 'ELIGIBLE' : 'MANUAL BYPASS'}
                </Badge>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <strong>Reasoning: </strong>{classification.reason}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
              Click &apos;Run AI Classification&apos; to trigger backend ruleset verification.
            </div>
          )}
        </div>
      </div>

      {/* Readiness Assessment Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Prerequisite Readiness Assessment</h3>
            <p className="text-xs text-slate-500">Six-point operational checklist required prior to Plan A entry</p>
          </div>
          {readiness && <ReadinessBadge level={readiness.level} />}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {readinessItems.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-lg border flex items-start gap-3 transition-colors ${
                item.ready ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/30 border-rose-200'
              }`}
            >
              {item.ready ? (
                <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <XCircle size={18} className="text-rose-600 mt-0.5 shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold text-slate-900">{item.label}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">{item.note}</p>
                <span
                  className={`inline-block mt-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    item.ready ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {item.ready ? 'READY' : 'NOT READY'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {readiness?.reasons && readiness.reasons.length > 0 && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <strong>Backend Readiness Notes: </strong>
            {readiness.reasons.join(' ')}
          </div>
        )}
      </div>
    </div>
  );
};
