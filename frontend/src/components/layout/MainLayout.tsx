import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * Strict 2-column root flex layout:
 * - Left column: Sticky/fixed Sidebar with zero external margins.
 * - Right column: Main Work Area with flush Navbar and standard padded scrollable main area.
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Work Area */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <Navbar title={title} subtitle={subtitle} />
        <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6">
          <div className="w-full max-w-[1600px] mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export const AppLayout = MainLayout;
export const Layout = MainLayout;
export default MainLayout;
