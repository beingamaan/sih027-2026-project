import React from 'react';
import { PlannedTask } from '../../types';

interface ScheduleRowProps {
  sectionName: string;
  tasks: PlannedTask[];
  onSelectTask: (t: PlannedTask) => void;
  selectedTaskId?: number;
}

export const ScheduleRow: React.FC<ScheduleRowProps> = ({
  sectionName,
  tasks,
  onSelectTask,
  selectedTaskId,
}) => {
  const getDeptColor = (dept: string | undefined) => {
    switch (dept) {
      case 'ENGINEERING': return 'bg-amber-500 border-amber-600 text-white';
      case 'TRD': return 'bg-blue-600 border-blue-700 text-white';
      case 'S&T':
      case 'S_AND_T': return 'bg-emerald-600 border-emerald-700 text-white';
      default: return 'bg-slate-700 border-slate-800 text-white';
    }
  };

  return (
    <div className="flex border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
      <div className="w-48 p-3 bg-slate-50/80 border-r border-slate-200 font-semibold text-xs text-slate-800 flex items-center shrink-0">
        {sectionName}
      </div>
      <div className="flex-1 p-3 flex flex-wrap items-center gap-2 min-h-[56px]">
        {tasks.length === 0 ? (
          <span className="text-slate-400 text-xs italic">No maintenance scheduled</span>
        ) : (
          tasks.map((task) => {
            const isSelected = selectedTaskId === task.id;
            return (
              <button
                key={task.id}
                onClick={() => onSelectTask(task)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border shadow-xs transition-all flex items-center gap-2 ${getDeptColor(
                  task.department
                )} ${isSelected ? 'ring-2 ring-slate-900 ring-offset-2' : 'opacity-90 hover:opacity-100'}`}
              >
                <span>{task.task_code}</span>
                <span className="text-[10px] font-mono bg-black/20 px-1.5 py-0.5 rounded">
                  {task.planned_duration_minutes}m
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
