import React from 'react';
import { Database } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-center">
    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
      <Database size={22} />
    </div>
    <h4 className="text-base font-semibold text-slate-800">{title}</h4>
    <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">{description}</p>
    {action}
  </div>
);
