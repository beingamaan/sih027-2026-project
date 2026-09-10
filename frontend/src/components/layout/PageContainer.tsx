import React, { ReactNode } from 'react';
import { Sidebar, useSidebar } from './Sidebar';
import { Header } from './Header';
import { Info } from 'lucide-react';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, title, subtitle }) => {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F8F5]">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 min-w-0 overflow-y-auto p-6 md:p-8">
          <div className="w-full max-w-[1600px] mx-auto space-y-6">
            {children}
          </div>
        </main>
        
        {/* Safety & Prototype Disclaimer footer */}
        <footer className="px-6 md:px-8 py-3.5 bg-white/80 backdrop-blur-md border-t border-slate-200/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xs shrink-0">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Info size={14} className="text-blue-600 shrink-0" />
            <span>
              <strong className="text-slate-800">Prototype Decision Support System (SIH26027).</strong> Recommendations require authorized human review and do not replace existing railway safety procedures.
            </span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-slate-400 bg-slate-100/80 border border-slate-200/60 px-2 py-0.5 rounded-full whitespace-nowrap">
            FastAPI • CP-SAT • React
          </span>
        </footer>
      </div>
    </div>
  );
};
