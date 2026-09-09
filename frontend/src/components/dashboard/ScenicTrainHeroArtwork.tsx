import React from 'react';

interface ScenicTrainHeroArtworkProps {
  className?: string;
}

export const ScenicTrainHeroArtwork: React.FC<ScenicTrainHeroArtworkProps> = ({ 
  className = "w-full max-w-[460px] h-auto" 
}) => {
  return (
    <div className={`relative overflow-hidden select-none pointer-events-none flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 540 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Sky atmospheric gradient */}
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF9E6" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FFF2D6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#F5EBE1" stopOpacity="0.1" />
          </linearGradient>

          {/* Vande Bharat Aerodynamic White-to-Silver Gradient */}
          <linearGradient id="vandeWhite" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#F0F4F8" />
            <stop offset="100%" stopColor="#D9E2EC" />
          </linearGradient>

          {/* Vande Bharat Royal Navy Stripe */}
          <linearGradient id="vandeNavy" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0B2545" />
            <stop offset="50%" stopColor="#133E68" />
            <stop offset="100%" stopColor="#1E5AA8" />
          </linearGradient>

          {/* Viaduct Stone Pier Gradient */}
          <linearGradient id="viaductGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E2D9CC" />
            <stop offset="100%" stopColor="#C9BEAF" />
          </linearGradient>

          {/* Soft Horizon Mist Gradient */}
          <linearGradient id="mistGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E6DFD5" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#F2EDE4" stopOpacity="0" />
          </linearGradient>

          {/* Saffron Glow Accent */}
          <radialGradient id="sunGlow" cx="80%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#FF9933" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#ECC94B" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#FFF9EE" stopOpacity="0" />
          </radialGradient>

          {/* Gradient mask for smooth edge fading */}
          <linearGradient id="edgeFade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.1" />
            <stop offset="15%" stopColor="#000" stopOpacity="1" />
            <stop offset="85%" stopColor="#000" stopOpacity="1" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
          </linearGradient>

          <mask id="scenicMask">
            <rect x="0" y="0" width="540" height="180" fill="url(#edgeFade)" />
          </mask>
        </defs>

        <g mask="url(#scenicMask)">
          {/* Atmospheric Background & Sun Glow */}
          <rect x="0" y="0" width="540" height="180" fill="url(#skyGrad)" />
          <circle cx="440" cy="50" r="100" fill="url(#sunGlow)" />

          {/* Subtle Watermark Typography Overlaid on Art: "INDIA MOVES TOGETHER" */}
          <text
            x="270"
            y="42"
            textAnchor="middle"
            fill="#7A141E"
            fillOpacity="0.08"
            fontSize="26"
            fontFamily="'Source Serif 4', Georgia, serif"
            fontWeight="900"
            letterSpacing="0.28em"
          >
            INDIA MOVES TOGETHER
          </text>

          {/* Distant Misty Mountain Ridges */}
          <path
            d="M 0 115 Q 90 85 180 102 T 360 88 T 540 105 L 540 180 L 0 180 Z"
            fill="#EADBCE"
            fillOpacity="0.45"
          />
          <path
            d="M 30 120 Q 140 100 240 112 T 440 102 T 540 116 L 540 180 L 30 180 Z"
            fill="#DECBB9"
            fillOpacity="0.35"
          />

          {/* Railway Viaduct Arches & Pillars (Curving from left to right) */}
          {/* Bridge Deck Base */}
          <path
            d="M 0 148 Q 270 142 540 138 L 540 152 Q 270 156 0 162 Z"
            fill="url(#viaductGrad)"
          />
          
          {/* Arched Openings */}
          {/* Arch 1 */}
          <path d="M 40 160 Q 65 140 90 160 L 90 180 L 40 180 Z" fill="#E8DFD3" fillOpacity="0.8" />
          <path d="M 40 160 Q 65 142 90 160" stroke="#B8AC9D" strokeWidth="2.5" fill="none" />
          {/* Arch 2 */}
          <path d="M 120 158 Q 150 138 180 158 L 180 180 L 120 180 Z" fill="#E8DFD3" fillOpacity="0.8" />
          <path d="M 120 158 Q 150 140 180 158" stroke="#B8AC9D" strokeWidth="2.5" fill="none" />
          {/* Arch 3 */}
          <path d="M 210 156 Q 242 136 274 156 L 274 180 L 210 180 Z" fill="#E8DFD3" fillOpacity="0.8" />
          <path d="M 210 156 Q 242 138 274 156" stroke="#B8AC9D" strokeWidth="2.5" fill="none" />
          {/* Arch 4 */}
          <path d="M 304 154 Q 340 134 376 154 L 376 180 L 304 180 Z" fill="#E8DFD3" fillOpacity="0.8" />
          <path d="M 304 154 Q 340 136 376 154" stroke="#B8AC9D" strokeWidth="2.5" fill="none" />
          {/* Arch 5 */}
          <path d="M 406 152 Q 444 132 482 152 L 482 180 L 406 180 Z" fill="#E8DFD3" fillOpacity="0.8" />
          <path d="M 406 152 Q 444 134 482 152" stroke="#B8AC9D" strokeWidth="2.5" fill="none" />

          {/* Viaduct Piers */}
          <rect x="90" y="152" width="30" height="28" fill="url(#viaductGrad)" />
          <rect x="180" y="150" width="30" height="30" fill="url(#viaductGrad)" />
          <rect x="274" y="148" width="30" height="32" fill="url(#viaductGrad)" />
          <rect x="376" y="146" width="30" height="34" fill="url(#viaductGrad)" />
          <rect x="482" y="144" width="30" height="36" fill="url(#viaductGrad)" />

          {/* OHE Electric Traction Catenary Masts & Overhead Wire */}
          {/* Masts */}
          {[60, 160, 260, 360, 460].map((mx, idx) => (
            <g key={idx}>
              <line x1={mx} y1="65" x2={mx} y2="145" stroke="#94A3B8" strokeWidth="1.8" />
              <line x1={mx - 2} y1="72" x2={mx + 18} y2="72" stroke="#94A3B8" strokeWidth="1.4" />
              <line x1={mx} y1="80" x2={mx + 16} y2="72" stroke="#94A3B8" strokeWidth="1" />
              {/* Insulator */}
              <circle cx={mx + 16} cy="73" r="2" fill="#D9901A" />
            </g>
          ))}
          {/* Catenary Messenger Wire & Contact Wire */}
          <path d="M 0 68 Q 60 76 160 70 Q 260 74 360 69 Q 460 73 540 67" stroke="#64748B" strokeWidth="1.2" fill="none" />
          <line x1="0" y1="82" x2="540" y2="78" stroke="#475569" strokeWidth="1" strokeDasharray="6 2" />

          {/* Steel Rails & Ballast Track */}
          <line x1="0" y1="147" x2="540" y2="137" stroke="#334155" strokeWidth="2" />
          <line x1="0" y1="151" x2="540" y2="141" stroke="#475569" strokeWidth="2.5" />
          {/* Sleepers */}
          {Array.from({ length: 36 }).map((_, i) => (
            <line
              key={i}
              x1={i * 15}
              y1={148 - i * 0.28}
              x2={i * 15 + 4}
              y2={154 - i * 0.28}
              stroke="#64748B"
              strokeWidth="2.2"
            />
          ))}

          {/* Speed Blur Lines / Dynamic Wind Streaks Behind Train */}
          <line x1="10" y1="110" x2="160" y2="110" stroke="#ECC94B" strokeWidth="1.5" strokeDasharray="30 15" opacity="0.6" />
          <line x1="50" y1="118" x2="220" y2="118" stroke="#1E5AA8" strokeWidth="1.5" strokeDasharray="40 20" opacity="0.5" />
          <line x1="30" y1="126" x2="280" y2="126" stroke="#FF9933" strokeWidth="1.2" strokeDasharray="25 25" opacity="0.6" />

          {/* ============================================================ */}
          {/* MODERN AERODYNAMIC VANDE BHARAT / ELECTRIC EXPRESS TRAIN      */}
          {/* ============================================================ */}
          <g transform="translate(180, 84)">
            {/* Trailing Coaches (Coach 3 & 2) */}
            <path
              d="M 0 45 L 85 43 L 85 16 L 0 17 Z"
              fill="url(#vandeWhite)"
              stroke="#CBD5E1"
              strokeWidth="0.8"
            />
            {/* Coach 3 Windows Band */}
            <rect x="8" y="24" width="70" height="9" rx="1.5" fill="#0F172A" />
            <line x1="22" y1="24" x2="22" y2="33" stroke="#CBD5E1" strokeWidth="0.8" />
            <line x1="38" y1="24" x2="38" y2="33" stroke="#CBD5E1" strokeWidth="0.8" />
            <line x1="54" y1="24" x2="54" y2="33" stroke="#CBD5E1" strokeWidth="0.8" />
            <line x1="70" y1="24" x2="70" y2="33" stroke="#CBD5E1" strokeWidth="0.8" />
            {/* Royal Navy Blue Accent Band */}
            <rect x="0" y="35" width="85" height="5" fill="url(#vandeNavy)" />
            {/* Indian Tricolor Micro Stripe */}
            <rect x="0" y="40" width="85" height="0.8" fill="#FF9933" />
            <rect x="0" y="40.8" width="85" height="0.8" fill="#FFFFFF" />
            <rect x="0" y="41.6" width="85" height="0.8" fill="#138808" />

            {/* Coach 2 */}
            <path
              d="M 87 43 L 180 41 L 180 14 L 87 16 Z"
              fill="url(#vandeWhite)"
              stroke="#CBD5E1"
              strokeWidth="0.8"
            />
            {/* Coach 2 Windows */}
            <rect x="94" y="22" width="78" height="9" rx="1.5" fill="#0F172A" />
            <line x1="110" y1="22" x2="110" y2="31" stroke="#CBD5E1" strokeWidth="0.8" />
            <line x1="126" y1="22" x2="126" y2="31" stroke="#CBD5E1" strokeWidth="0.8" />
            <line x1="142" y1="22" x2="142" y2="31" stroke="#CBD5E1" strokeWidth="0.8" />
            <line x1="158" y1="22" x2="158" y2="31" stroke="#CBD5E1" strokeWidth="0.8" />
            {/* Royal Navy Blue Accent Band */}
            <rect x="87" y="33" width="93" height="5" fill="url(#vandeNavy)" />
            {/* Tricolor Micro Stripe */}
            <rect x="87" y="38" width="93" height="0.8" fill="#FF9933" />
            <rect x="87" y="38.8" width="93" height="0.8" fill="#FFFFFF" />
            <rect x="87" y="39.6" width="93" height="0.8" fill="#138808" />

            {/* Aerodynamic High-Speed Pantograph (on top of Coach 2) */}
            <line x1="130" y1="14" x2="142" y2="2" stroke="#B42332" strokeWidth="1.8" />
            <line x1="142" y1="2" x2="154" y2="14" stroke="#B42332" strokeWidth="1.8" />
            <line x1="142" y1="2" x2="142" y2="-6" stroke="#475569" strokeWidth="2" />
            {/* Pantograph Contact Shoe touching OHE */}
            <line x1="134" y1="-6" x2="150" y2="-6" stroke="#D9901A" strokeWidth="2.5" strokeLinecap="round" />
            {/* Spark Glow */}
            <circle cx="142" cy="-6" r="3" fill="#60A5FA" opacity="0.8" />

            {/* Leading Aerodynamic Nose Engine Coach (Vande Bharat Streamlined Front) */}
            <path
              d="M 182 41 L 285 39 Q 320 38 335 34 Q 345 30 348 24 Q 342 15 315 12 L 182 14 Z"
              fill="url(#vandeWhite)"
              stroke="#CBD5E1"
              strokeWidth="0.8"
            />
            {/* Streamlined Cockpit Windshield (Aerodynamic wrap-around black visor) */}
            <path
              d="M 305 15 Q 328 17 338 23 L 330 26 Q 312 21 292 20 Z"
              fill="#0F172A"
              stroke="#334155"
              strokeWidth="0.5"
            />
            {/* Windshield Reflection Glare */}
            <path d="M 312 17 Q 322 18 330 22" stroke="#60A5FA" strokeWidth="1" strokeLinecap="round" />

            {/* Passenger Panoramic Window Stripe */}
            <rect x="188" y="20" width="86" height="9" rx="1.5" fill="#0F172A" />
            <line x1="206" y1="20" x2="206" y2="29" stroke="#CBD5E1" strokeWidth="0.8" />
            <line x1="226" y1="20" x2="226" y2="29" stroke="#CBD5E1" strokeWidth="0.8" />
            <line x1="246" y1="20" x2="246" y2="29" stroke="#CBD5E1" strokeWidth="0.8" />
            <line x1="264" y1="20" x2="264" y2="29" stroke="#CBD5E1" strokeWidth="0.8" />

            {/* Iconic Aerodynamic Navy Flow Stripe along the Nose */}
            <path
              d="M 182 31 L 282 29 Q 318 28 338 31 L 342 34 Q 318 35 282 35 L 182 37 Z"
              fill="url(#vandeNavy)"
            />
            
            {/* National Saffron / White / Green Speed Line */}
            <path d="M 182 37.5 L 325 35" stroke="#FF9933" strokeWidth="1.2" />
            <path d="M 182 38.8 L 327 36.3" stroke="#FFFFFF" strokeWidth="1.2" />
            <path d="M 182 40.1 L 329 37.6" stroke="#138808" strokeWidth="1.2" />

            {/* Dual High-Intensity LED Headlamps */}
            <ellipse cx="340" cy="27" rx="3" ry="2" fill="#FEF08A" />
            <polygon points="342,27 375,23 375,32" fill="#FEF08A" fillOpacity="0.25" />
            <ellipse cx="334" cy="31" rx="2" ry="1.5" fill="#FEF08A" />

            {/* Aerodynamic Front Cowcatcher Pilot */}
            <polygon points="338,36 349,27 348,37" fill="#1E293B" />

            {/* High-Speed Bogie Wheels Underframe */}
            {/* Front Bogie */}
            <rect x="270" y="39" width="36" height="4" rx="1" fill="#1E293B" />
            <circle cx="277" cy="43" r="3.5" fill="#334155" stroke="#0F172A" strokeWidth="1" />
            <circle cx="299" cy="43" r="3.5" fill="#334155" stroke="#0F172A" strokeWidth="1" />
            {/* Middle Bogies */}
            <rect x="172" y="41" width="22" height="4" rx="1" fill="#1E293B" />
            <circle cx="177" cy="45" r="3.5" fill="#334155" stroke="#0F172A" strokeWidth="1" />
            <circle cx="190" cy="45" r="3.5" fill="#334155" stroke="#0F172A" strokeWidth="1" />
            {/* Rear Bogies */}
            <rect x="78" y="43" width="22" height="4" rx="1" fill="#1E293B" />
            <circle cx="83" cy="47" r="3.5" fill="#334155" stroke="#0F172A" strokeWidth="1" />
            <circle cx="96" cy="47" r="3.5" fill="#334155" stroke="#0F172A" strokeWidth="1" />
          </g>
        </g>
      </svg>
    </div>
  );
};
