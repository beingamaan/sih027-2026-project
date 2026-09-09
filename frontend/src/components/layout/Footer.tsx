import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer 
      style={{ backgroundColor: '#102A43' }}
      className="w-full py-3 px-6 text-slate-300 text-xs border-t border-[#1C3D5A] mt-auto select-none z-20"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        {/* Left Statutory Badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-6 h-6 rounded bg-[#D9901A]/15 border border-[#D9901A]/40 flex items-center justify-center text-[#ECC94B] font-black text-[10px]">
            IR
          </div>
          <span className="px-2 py-0.5 rounded bg-[#B42332]/20 text-[#FCA5A5] border border-[#B42332]/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <AlertCircle size={11} className="text-[#FCA5A5]" />
            Statutory Notice
          </span>
        </div>

        {/* Central Statutory Advisory Notice */}
        <p className="text-[11px] text-[#CBD5E0] font-normal text-center md:text-left leading-relaxed flex-1 max-w-3xl">
          <strong className="text-white font-semibold">Advisory Decision-Support Prototype:</strong> This system does NOT grant blocks, issue Line Clear or caution orders. All actions follow authorized Railway procedures.
        </p>

        {/* Right side: Locomotive Watermark + Viksit Bharat / Viksit Rail tag */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#071A2F] border border-[#1C3D5A] text-[10px] font-bold text-[#ECC94B]">
            {/* Small locomotive icon */}
            <svg width="18" height="14" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="16" height="11" rx="2" stroke="#ECC94B" strokeWidth="1.5" />
              <circle cx="6" cy="15" r="2" fill="#ECC94B" />
              <circle cx="14" cy="15" r="2" fill="#ECC94B" />
              <path d="M18 6L22 9V13H18" stroke="#ECC94B" strokeWidth="1.5" />
              <line x1="5" y1="5" x2="10" y2="5" stroke="#ECC94B" strokeWidth="1.5" />
            </svg>
            <span className="tracking-wide">Viksit Bharat / Viksit Rail</span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#829AB1]">
            <ShieldCheck size={13} className="text-[#16805C]" />
            <span>SIH26027 · G&SR</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
