import React, { useState, useEffect } from 'react';
import { Sun } from 'lucide-react';

export interface HeroBannerProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  sectionTag?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  title,
  subtitle,
  badgeText = "SAFE RAILS, STRONGER INDIA",
  sectionTag = "DELHI DIVISION · KM 100 – 158"
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-[#FCFBF8] p-6 mb-6 min-h-[160px] flex items-center">
      {/* Background Image */}
      <img
        src="/vande_bharat_banner.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none z-0"
      />

      {/* Soft overlay gradient div */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#FCFBF8] via-[#FCFBF8]/85 to-transparent z-10 pointer-events-none" />

      {/* Foreground content container */}
      <div className="relative z-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full">
        {/* Left Block (Content) */}
        <div className="flex flex-col max-w-full md:max-w-[55%]">
          {/* Badge: crisp saffron/navy pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#102A43] text-[#ECC94B] text-[10px] font-black uppercase tracking-wider w-fit shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#FF9933] animate-pulse"></span>
            <span>{badgeText}</span>
          </div>

          {/* Title */}
          <h1 className="font-serif font-black text-2xl md:text-3xl tracking-tight text-[#0A192F] mt-1.5 leading-tight">
            {title}
          </h1>

          {/* Tag Strip */}
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EAF2FF] text-[#1E5AA8] border border-[#BFDBFE]/70 w-fit uppercase tracking-wider">
            <span>{sectionTag}</span>
          </div>

          {/* Subtitle */}
          <p className="italic text-slate-600 text-sm mt-1 leading-snug">
            "{subtitle}"
          </p>
        </div>

        {/* Right Block (Telemetry Instrument Card) */}
        <div className="bg-[#FCFBF8]/95 backdrop-blur-sm border border-slate-200/90 rounded-lg p-3.5 shadow-sm min-w-[220px] shrink-0">
          {/* Status badge: SECTION STATUS · ● LIVE */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <span className="text-[10px] font-extrabold text-[#627D98] uppercase tracking-wider">
              SECTION STATUS
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#16805C]">
              <span className="w-2 h-2 rounded-full bg-[#16805C] animate-ping"></span>
              LIVE
            </span>
          </div>

          {/* Server IST Time, Date & Weather summary */}
          <div className="py-2">
            <p className="text-xs font-mono font-bold text-[#102A43]">
              {formattedDate} | {formattedTime} IST
            </p>
            <p className="text-[11px] text-[#486581] font-medium mt-1 flex items-center gap-1.5">
              <Sun size={13} className="text-[#D9901A]" />
              <span>28°C Clear Sky · Delhi Div</span>
            </p>
          </div>

          {/* "VIKSIT BHARAT / VIKSIT RAIL" badge with Indian flag emblem */}
          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-[#102A43] tracking-wider">
              VIKSIT BHARAT / VIKSIT RAIL
            </span>
            <div className="flex items-center gap-1.5">
              <div className="flex flex-col h-3.5 w-4.5 rounded-xs overflow-hidden border border-slate-300 shrink-0 shadow-2xs">
                <div className="h-1 bg-[#FF9933]"></div>
                <div className="h-1.5 bg-[#FFFFFF] flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-[#000080]"></div>
                </div>
                <div className="h-1 bg-[#138808]"></div>
              </div>
              <span className="text-[10px] font-bold text-[#D9901A] bg-[#FFF7E6] px-1.5 py-0.2 rounded border border-[#FFE7BA]">
                2047
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
