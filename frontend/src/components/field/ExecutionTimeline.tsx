import React from 'react';
import { TaskStatus } from '../../types';
import { Check } from 'lucide-react';

interface ExecutionTimelineProps {
  currentStatus: TaskStatus;
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({ currentStatus }) => {
  const steps: { key: TaskStatus; label: string }[] = [
    { key: 'PLANNED', label: '1. Planned' },
    { key: 'ACKNOWLEDGED', label: '2. Acknowledged' },
    { key: 'READY', label: '3. Site Ready' },
    { key: 'IN_PROGRESS', label: '4. Started' },
    { key: 'COMPLETED', label: '5. Completed' },
    { key: 'CLOSED', label: '6. Handback' },
  ];

  const statusOrder: Record<string, number> = {
    OPEN: 0,
    PLANNED: 1,
    ACKNOWLEDGED: 2,
    READY: 3,
    IN_PROGRESS: 4,
    COMPLETED: 5,
    CLOSED: 6,
  };

  const currentIndex = statusOrder[currentStatus] || 0;

  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
        Operational Handshake Lifecycle
      </h4>
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
        {steps.map((step, idx) => {
          const isPassed = currentIndex >= idx + 1;
          const isCurrent = currentIndex === idx + 1;
          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  isPassed
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isPassed ? <Check size={14} /> : idx + 1}
              </div>
              <span
                className={`mt-2 text-[11px] font-semibold tracking-tight ${
                  isCurrent ? 'text-blue-600 font-bold' : isPassed ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
