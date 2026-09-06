import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Info } from 'lucide-react';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
        
        {/* Safety & Prototype Disclaimer footer */}
        <footer className="px-8 py-3 bg-white border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-600">
            <Info size={14} className="text-blue-600 shrink-0" />
            <span>
              <strong>Prototype Decision Support System (SIH26027).</strong> Uses synthetic/simulated data. Recommendations require authorized human review and do not replace existing railway safety procedures.
            </span>
          </div>
          <span className="text-[11px] text-slate-400 whitespace-nowrap">FastAPI + OR-Tools + React</span>
        </footer>
      </div>
    </div>
  );
};
