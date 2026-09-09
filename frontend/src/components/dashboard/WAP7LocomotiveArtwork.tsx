import React from 'react';

export const WAP7LocomotiveArtwork: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`relative overflow-hidden flex items-center justify-end ${className}`}>
      {/* Locomotive Graphic with Speed Blur & Fade Gradient */}
      <svg 
        viewBox="0 0 540 130" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-[500px] h-auto object-contain pointer-events-none select-none"
      >
        <defs>
          {/* Smooth Fade-in gradient from left */}
          <linearGradient id="fadeMaskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FCFBF8" stopOpacity="0" />
            <stop offset="35%" stopColor="#FCFBF8" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#FCFBF8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FCFBF8" stopOpacity="1" />
          </linearGradient>

          {/* Crimson Red Gradient */}
          <linearGradient id="crimsonStripe" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#991B1B" />
            <stop offset="50%" stopColor="#B42332" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>

          {/* Locomotive Body Metal Gradient */}
          <linearGradient id="locoBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="60%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Golden Headlamp Glow */}
          <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="1" />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Speed Track Lines (Background) */}
        <line x1="20" y1="108" x2="520" y2="108" stroke="#CBD5E1" strokeWidth="2.5" strokeDasharray="16 8" opacity="0.6" />
        <line x1="50" y1="114" x2="540" y2="114" stroke="#94A3B8" strokeWidth="3" opacity="0.8" />
        {Array.from({ length: 18 }).map((_, i) => (
          <line 
            key={i} 
            x1={60 + i * 26} 
            y1="106" 
            x2={70 + i * 26} 
            y2="118" 
            stroke="#64748B" 
            strokeWidth="3" 
            opacity="0.4" 
          />
        ))}

        {/* Catenary Overhead Wire (OHE) */}
        <line x1="10" y1="14" x2="540" y2="14" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.5" />
        <line x1="30" y1="22" x2="540" y2="22" stroke="#64748B" strokeWidth="2" opacity="0.7" />

        {/* Pantograph (Roof Assembly) */}
        <path d="M 280 22 L 310 48 L 360 48 L 390 22" stroke="#B42332" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <line x1="310" y1="48" x2="335" y2="58" stroke="#718096" strokeWidth="2.5" />
        <line x1="360" y1="48" x2="335" y2="58" stroke="#718096" strokeWidth="2.5" />
        <rect x="325" y="56" width="20" height="6" fill="#4A5568" rx="2" />
        {/* Contact Strip */}
        <line x1="265" y1="22" x2="405" y2="22" stroke="#D9901A" strokeWidth="3.5" strokeLinecap="round" />

        {/* WAP-7 Aerodynamic Locomotive Main Body */}
        {/* Roof curvature */}
        <path 
          d="M 170 58 Q 210 54 360 54 Q 450 54 480 64 L 505 82 Q 515 90 515 98 L 515 106 L 160 106 L 160 70 Q 160 60 170 58 Z" 
          fill="url(#locoBody)" 
          stroke="#94A3B8" 
          strokeWidth="1.5" 
        />

        {/* Iconic WAP-7 Crimson Red Lightning Flash Stripe */}
        <path 
          d="M 160 84 L 380 84 L 430 76 L 490 84 L 515 94 L 515 98 L 485 92 L 420 86 L 370 94 L 160 94 Z" 
          fill="url(#crimsonStripe)" 
        />

        {/* Driver Cabin Windshield & Tinted Glass */}
        <path 
          d="M 445 62 L 476 66 L 495 78 L 465 78 Z" 
          fill="#1E293B" 
          stroke="#475569" 
          strokeWidth="1.5" 
        />
        {/* Windshield glare highlight */}
        <path d="M 452 64 L 472 67 L 468 76 L 456 74 Z" fill="#93C5FD" opacity="0.45" />

        {/* Cab Side Window */}
        <rect x="400" y="64" width="32" height="14" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1" />
        <rect x="403" y="66" width="12" height="10" fill="#93C5FD" opacity="0.35" />

        {/* Twin Headlamps on Nose */}
        <circle cx="508" cy="91" r="5.5" fill="#FEF08A" stroke="#B42332" strokeWidth="1.5" />
        <circle cx="508" cy="91" r="9" fill="url(#lampGlow)" />
        <circle cx="508" cy="91" r="2.5" fill="#FFFFFF" />

        {/* Cowcatcher / Cattle Guard (Pilot) */}
        <polygon points="495,106 525,106 515,116 485,116" fill="#B42332" stroke="#7F1D1D" strokeWidth="1" />
        <line x1="495" y1="108" x2="495" y2="114" stroke="#ECC94B" strokeWidth="2" />
        <line x1="505" y1="108" x2="505" y2="114" stroke="#ECC94B" strokeWidth="2" />
        <line x1="515" y1="108" x2="515" y2="114" stroke="#ECC94B" strokeWidth="2" />

        {/* Bogie Assemblies & Wheels (Below frame) */}
        {/* Bogie 1 (Front) */}
        <rect x="400" y="104" width="95" height="10" fill="#334155" rx="3" />
        <circle cx="420" cy="112" r="7.5" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
        <circle cx="420" cy="112" r="3" fill="#94A3B8" />
        <circle cx="450" cy="112" r="7.5" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
        <circle cx="450" cy="112" r="3" fill="#94A3B8" />
        <circle cx="480" cy="112" r="7.5" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
        <circle cx="480" cy="112" r="3" fill="#94A3B8" />

        {/* Bogie 2 (Rear) */}
        <rect x="180" y="104" width="95" height="10" fill="#334155" rx="3" />
        <circle cx="200" cy="112" r="7.5" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
        <circle cx="200" cy="112" r="3" fill="#94A3B8" />
        <circle cx="230" cy="112" r="7.5" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
        <circle cx="230" cy="112" r="3" fill="#94A3B8" />
        <circle cx="260" cy="112" r="7.5" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
        <circle cx="260" cy="112" r="3" fill="#94A3B8" />

        {/* Locomotive Markings: "WAP-7" and Indian Railways Crest */}
        <text x="320" y="76" fill="#102A43" fontSize="10" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">
          WAP-7
        </text>
        <text x="320" y="87" fill="#64748B" fontSize="7" fontWeight="bold" fontFamily="monospace">
          30201 · GZB
        </text>
        <circle cx="445" cy="88" r="4" fill="#ECC94B" stroke="#B42332" strokeWidth="0.8" />

        {/* Left Side Dissolve / Motion Vignette overlay */}
        <rect x="0" y="0" width="220" height="130" fill="url(#fadeMaskGrad)" />
      </svg>
    </div>
  );
};
