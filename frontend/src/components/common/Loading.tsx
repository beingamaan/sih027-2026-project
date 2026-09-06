import React from 'react';

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading data from backend...' }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
    </div>
    <p className="mt-4 text-sm font-medium text-slate-600">{message}</p>
    <p className="text-xs text-slate-400 mt-1">Connecting to FastAPI on port 8000</p>
  </div>
);
