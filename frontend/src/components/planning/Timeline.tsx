import React, { useState } from 'react';
import { PlannedTask } from '../../types';
import { ScheduleRow } from './ScheduleRow';
import { ExplanationPanel } from './ExplanationPanel';

interface TimelineProps {
  tasks: PlannedTask[];
}

export const Timeline: React.FC<TimelineProps> = ({ tasks = [] }) => {
  const [selectedTask, setSelectedTask] = useState<PlannedTask | null>(tasks[0] || null);

  const sections = [
    { name: 'SEC-1: NDLS - GZB', filter: (t: PlannedTask) => t.block_window_id % 3 === 1 },
    { name: 'SEC-2: GZB - MB', filter: (t: PlannedTask) => t.block_window_id % 3 === 2 },
    { name: 'SEC-3: MB - BE', filter: (t: PlannedTask) => t.block_window_id % 3 === 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Corridor Block Window Allocation Timeline</h3>
            <p className="text-xs text-slate-500">Visual timetable across high-density sections</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Engineering</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-600"></span> TRD</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-600"></span> S&T</span>
          </div>
        </div>

        {/* Schedule grid */}
        <div className="divide-y divide-slate-100 overflow-x-auto">
          {sections.map((sec) => (
            <ScheduleRow
              key={sec.name}
              sectionName={sec.name}
              tasks={tasks.filter(sec.filter)}
              onSelectTask={setSelectedTask}
              selectedTaskId={selectedTask?.id}
            />
          ))}
        </div>
      </div>

      <ExplanationPanel task={selectedTask} />
    </div>
  );
};
