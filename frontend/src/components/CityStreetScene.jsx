// ── Animated Indian City Street Scene ──────────────────────────────────────
export const CityStreetScene = ({ isNight = false }) => (
  <svg
    viewBox="0 0 900 340"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full"
    style={{ minHeight: "100%" }}
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      {/* Sky gradient - High-vibrancy clean blue sky / Starry night */}
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={isNight ? "#09090b" : "#0ea5e9"}/> {/* Bright Sky Blue / Space Black */}
        <stop offset="60%" stopColor={isNight ? "#111827" : "#38bdf8"}/> {/* Vibrant Cyan-Blue / Dark Navy */}
        <stop offset="100%" stopColor={isNight ? "#1e1b4b" : "#bae6fd"}/> {/* Clean Light Blue / Dark Indigo */}
      </linearGradient>
      {/* Road gradient - Modern bright asphalt / Night tarmac */}
      <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={isNight ? "#374151" : "#6b7280"}/>
        <stop offset="100%" stopColor={isNight ? "#1f2937" : "#4b5563"}/>
      </linearGradient>
      {/* Building gradients - Fresh high-vibrancy modern palette (dimmed for night) */}
      <linearGradient id="bldg1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={isNight ? "#0891b2" : "#06b6d4"}/> {/* Vivid Cyan */}
        <stop offset="100%" stopColor={isNight ? "#155e75" : "#22d3ee"}/>
      </linearGradient>
      <linearGradient id="bldg2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={isNight ? "#6d28d9" : "#a78bfa"}/> {/* Bright Purple */}
        <stop offset="100%" stopColor={isNight ? "#4c1d95" : "#c084fc"}/>
      </linearGradient>
      <linearGradient id="bldg3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={isNight ? "#047857" : "#10b981"}/> {/* Vivid Emerald */}
        <stop offset="100%" stopColor={isNight ? "#064e3b" : "#34d399"}/>
      </linearGradient>
      <linearGradient id="bldg4" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={isNight ? "#1d4ed8" : "#3b82f6"}/> {/* Electric Blue */}
        <stop offset="100%" stopColor={isNight ? "#172554" : "#60a5fa"}/>
      </linearGradient>
      <linearGradient id="bldg5" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={isNight ? "#be185d" : "#ec4899"}/> {/* Hot Pink */}
        <stop offset="100%" stopColor={isNight ? "#500724" : "#f472b6"}/>
      </linearGradient>
      <linearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fef08a"/>
        <stop offset="100%" stopColor="#f97316"/>
      </linearGradient>
      <filter id="blur2">
        <feGaussianBlur stdDeviation="2"/>
      </filter>

      {/* Person body clip */}
      <clipPath id="personClip"><rect width="900" height="340"/></clipPath>

      {/* Animations */}
      <style>{`
        /* Sun shimmer */
        @keyframes sunPulse {
          0%,100%{r:22px;opacity:1} 50%{r:24px;opacity:0.85}
        }
        .sun-circle { animation: sunPulse 3s ease-in-out infinite; }

        /* Twinkling stars */
        @keyframes starBlink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .star-blink1 { animation: starBlink 2.5s ease-in-out infinite; }
        .star-blink2 { animation: starBlink 3.5s ease-in-out infinite 0.5s; }
        .star-blink3 { animation: starBlink 1.8s ease-in-out infinite 1s; }

        /* Seamless off-screen cloud drift */
        @keyframes drift {
          0% { transform: translateX(-250px); }
          100% { transform: translateX(950px); }
        }
        .cloud1 { animation: drift 35s linear infinite; }
        .cloud2 { animation: drift 50s linear infinite; animation-delay: -15s; }
        .cloud3 { animation: drift 65s linear infinite; animation-delay: -30s; }
        .cloud4 { animation: drift 80s linear infinite; animation-delay: -5s; }
        .cloud5 { animation: drift 95s linear infinite; animation-delay: -40s; }
        .cloud6 { animation: drift 110s linear infinite; animation-delay: -75s; }


        /* Tree sway */
        @keyframes treeSway {
          0%,100%{transform-origin:bottom center;transform:rotate(-3deg)}
          50%{transform-origin:bottom center;transform:rotate(3deg)}
        }
        .tree-top { animation: treeSway 3s ease-in-out infinite; }
        .tree-top2 { animation: treeSway 3.6s ease-in-out infinite; }
        .tree-top3 { animation: treeSway 2.8s ease-in-out infinite; }

        /* Auto-rickshaw scroll */
        @keyframes rickshaw { 0%{transform:translateX(960px)} 100%{transform:translateX(-180px)} }
        .rickshaw-grp { animation: rickshaw 9s linear infinite; }

        /* Scooter scroll */
        @keyframes scooter { 0%{transform:translateX(-160px)} 100%{transform:translateX(960px)} }
        .scooter-grp { animation: scooter 7s linear infinite; }

        /* Modern Car scroll */
        @keyframes carScroll { 0%{transform:translateX(-180px)} 100%{transform:translateX(960px)} }
        .car-grp { animation: carScroll 6s linear infinite; }

        /* Wheel spin (Clockwise for forward L->R motion) */
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .wheel { animation: spin 0.7s linear infinite; transform-box:fill-box; transform-origin:center; }

        /* Wheel spin (Counter-Clockwise for R->L motion) */
        @keyframes spin-ccw { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
        .wheel-ccw { animation: spin-ccw 0.7s linear infinite; transform-box:fill-box; transform-origin:center; }

        /* Banner flap */
        @keyframes bannerFlap { 0%,100%{transform:scaleX(1)} 50%{transform:scaleX(0.92)} }
        .banner { animation: bannerFlap 2s ease-in-out infinite; transform-box:fill-box; transform-origin:left center; }

        /* Traffic light blink */
        @keyframes lightGreen { 0%,40%{opacity:1} 50%,100%{opacity:0.2} }
        @keyframes lightRed   { 0%,40%{opacity:0.2} 50%,100%{opacity:1} }
        .tl-green { animation: lightGreen 4s step-end infinite; }
        .tl-red   { animation: lightRed 4s step-end infinite; }

        /* Kite float */
        @keyframes kiteDrift { 0%,100%{transform:translate(0,0) rotate(-8deg)} 50%{transform:translate(10px,-12px) rotate(8deg)} }
        .kite { animation: kiteDrift 4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }

        /* Smoke puff from dhaba */
        @keyframes smokePuff { 0%{transform:translateY(0) scale(1);opacity:0.6} 100%{transform:translateY(-30px) scale(2);opacity:0} }
        .smoke1 { animation: smokePuff 2s ease-out infinite; }
        .smoke2 { animation: smokePuff 2s 0.7s ease-out infinite; }
        .smoke3 { animation: smokePuff 2s 1.4s ease-out infinite; }
      `}</style>
    </defs>

    {/* ── SKY ── */}
    <rect width="900" height="340" fill="url(#sky)"/>

    {/* Twinkling Stars (only in night mode) */}
    {isNight && (
      <g opacity="0.8">
        <circle cx="80" cy="40" r="1" fill="white" className="star-blink1"/>
        <circle cx="210" cy="30" r="1.2" fill="white" className="star-blink2"/>
        <circle cx="340" cy="50" r="0.8" fill="white" className="star-blink3"/>
        <circle cx="480" cy="25" r="1.5" fill="white" className="star-blink1"/>
        <circle cx="620" cy="45" r="1" fill="white" className="star-blink2"/>
        <circle cx="760" cy="35" r="1.2" fill="white" className="star-blink3"/>
        <circle cx="150" cy="80" r="0.8" fill="white" className="star-blink2"/>
        <circle cx="290" cy="70" r="1" fill="white" className="star-blink1"/>
        <circle cx="700" cy="85" r="1.2" fill="white" className="star-blink3"/>
      </g>
    )}

    {/* Celestial Body (Sun or Moon) - Centered at cx=500, completely clean, elegant and face-free */}
    <g>
      {/* Glow layer */}
      <circle cx="500" cy="55" r="32" fill={isNight ? "#e0e7ff" : "#fffbeb"} opacity={isNight ? "0.15" : "0.3"} filter="url(#blur2)"/>
      
      {!isNight ? (
        <>
          {/* Snug, fixed Sun rays around the sun surface (No wobbly rotation) */}
          <g>
            <path d="M500 16 L500 24" stroke="#fb923c" strokeWidth="3" strokeLinecap="round"/>
            <path d="M500 86 L500 94" stroke="#fb923c" strokeWidth="3" strokeLinecap="round"/>
            <path d="M461 55 L469 55" stroke="#fb923c" strokeWidth="3" strokeLinecap="round"/>
            <path d="M531 55 L539 55" stroke="#fb923c" strokeWidth="3" strokeLinecap="round"/>
            <path d="M472 27 L478 33" stroke="#fb923c" strokeWidth="3" strokeLinecap="round"/>
            <path d="M528 83 L522 77" stroke="#fb923c" strokeWidth="3" strokeLinecap="round"/>
            <path d="M528 27 L522 33" stroke="#fb923c" strokeWidth="3" strokeLinecap="round"/>
            <path d="M472 83 L478 77" stroke="#fb923c" strokeWidth="3" strokeLinecap="round"/>
          </g>
          {/* Main Sun circle (Pristine & Elegant) */}
          <circle cx="500" cy="55" r="22" fill="url(#sunGrad)" className="sun-circle"/>
        </>
      ) : (
        <>
          {/* Sparkling night accent coordinates */}
          <g>
            <circle cx="470" cy="30" r="1.5" fill="#fef08a" opacity="0.6"/>
            <circle cx="535" cy="40" r="1.2" fill="#fef08a" opacity="0.8"/>
            <circle cx="480" cy="85" r="1.8" fill="#fef08a" opacity="0.5"/>
          </g>
          {/* Moon Crescent Shape (Pristine & Elegant) */}
          <path d="M490 35 A22 22 0 1 0 514 69 A17 17 0 1 1 490 35 Z" fill="#e2e8f0"/>
        </>
      )}
    </g>

    {/* Background Clouds (Drifting underneath/above depending on spacing) */}
    <g className="cloud1" opacity={isNight ? "0.4" : "1.0"}>
      <ellipse cx="120" cy="38" rx="38" ry="16" fill="white"/>
      <ellipse cx="148" cy="30" rx="24" ry="14" fill="white"/>
      <ellipse cx="96" cy="32" rx="20" ry="12" fill="white"/>
    </g>
    <g className="cloud2" opacity={isNight ? "0.3" : "1.0"}>
      <ellipse cx="400" cy="28" rx="30" ry="12" fill="white"/>
      <ellipse cx="424" cy="22" rx="18" ry="10" fill="white"/>
      <ellipse cx="380" cy="24" rx="16" ry="9" fill="white"/>
    </g>

    {/* Kite (Light Mode Only) */}
    {!isNight && (
      <g className="kite" style={{transformOrigin:"680px 60px"}}>
        <polygon points="680,44 696,60 680,76 664,60" fill="#ef4444" opacity="0.9"/>
        <polygon points="680,44 696,60 680,60" fill="#fca5a5" opacity="0.7"/>
        <path d="M680 76 Q685 88 682 100" stroke="#7c3aed" strokeWidth="1.2" fill="none" strokeDasharray="3,2"/>
      </g>
    )}

    {/* ── BUILDINGS (back row) - Brighter windows and higher contrast ── */}
    {/* B1 - tall cyan */}
    <rect x="30" y="55" width="70" height="195" fill="url(#bldg1)" rx="3"/>
    <rect x="36" y="65" width="14" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.85" : "0.95"}/>
    <rect x="56" y="65" width="14" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.9" : "0.95"}/>
    <rect x="76" y="65" width="14" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.2" : "0.4"}/>
    <rect x="36" y="95" width="14" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.9" : "0.95"}/>
    <rect x="56" y="95" width="14" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.5" : "0.6"}/>
    <rect x="76" y="95" width="14" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.85" : "0.95"}/>
    <rect x="36" y="125" width="14" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.4" : "0.5"}/>
    <rect x="56" y="125" width="14" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.9" : "0.95"}/>
    <rect x="76" y="125" width="14" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.6" : "0.7"}/>
    <rect x="36" y="155" width="14" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.8" : "0.85"}/>
    <rect x="56" y="155" width="14" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.3" : "0.4"}/>
    <rect x="76" y="155" width="14" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.9" : "0.95"}/>

    {/* B2 - medium purple */}
    <rect x="120" y="85" width="60" height="165" fill="url(#bldg2)" rx="3"/>
    <rect x="126" y="98" width="13" height="16" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.7" : "0.8"}/>
    <rect x="145" y="98" width="13" height="16" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.9" : "0.95"}/>
    <rect x="164" y="98" width="13" height="16" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.4" : "0.5"}/>
    <rect x="126" y="125" width="13" height="16" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.9" : "0.95"}/>
    <rect x="145" y="125" width="13" height="16" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.5" : "0.6"}/>
    <rect x="164" y="125" width="13" height="16" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.8" : "0.85"}/>
    <rect x="126" y="152" width="13" height="16" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.7" : "0.8"}/>
    <rect x="145" y="152" width="13" height="16" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.9" : "0.95"}/>
    <rect x="164" y="152" width="13" height="16" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.4" : "0.5"}/>

    {/* B3 - tall green */}
    <rect x="210" y="40" width="75" height="210" fill="url(#bldg3)" rx="3"/>
    <rect x="218" y="56" width="15" height="20" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.85" : "0.9"}/>
    <rect x="240" y="56" width="15" height="20" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.6" : "0.7"}/>
    <rect x="262" y="56" width="15" height="20" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.9" : "0.95"}/>
    <rect x="218" y="90" width="15" height="20" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.9" : "0.95"}/>
    <rect x="240" y="90" width="15" height="20" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.7" : "0.8"}/>
    <rect x="262" y="90" width="15" height="20" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.85" : "0.85"}/>
    <rect x="218" y="124" width="15" height="20" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.6" : "0.7"}/>
    <rect x="240" y="124" width="15" height="20" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.9" : "0.95"}/>
    <rect x="262" y="124" width="15" height="20" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.4" : "0.5"}/>
    <rect x="218" y="158" width="15" height="20" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.9" : "0.95"}/>
    <rect x="240" y="158" width="15" height="20" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.7" : "0.8"}/>
    <rect x="262" y="158" width="15" height="20" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.85" : "0.85"}/>

    {/* B4 - medium blue */}
    <rect x="315" y="95" width="70" height="155" fill="url(#bldg4)" rx="3"/>
    <rect x="323" y="110" width="14" height="17" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.85" : "0.9"}/>
    <rect x="343" y="110" width="14" height="17" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.6" : "0.7"}/>
    <rect x="363" y="110" width="14" height="17" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.9" : "0.95"}/>
    <rect x="323" y="142" width="14" height="17" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.75" : "0.8"}/>
    <rect x="343" y="142" width="14" height="17" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.9" : "0.95"}/>
    <rect x="363" y="142" width="14" height="17" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.4" : "0.5"}/>

    {/* B5 - pink on far right */}
    <rect x="615" y="75" width="65" height="175" fill="url(#bldg5)" rx="3"/>
    <rect x="623" y="88" width="13" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.8" : "0.9"}/>
    <rect x="642" y="88" width="13" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.6" : "0.7"}/>
    <rect x="661" y="88" width="13" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.9" : "0.95"}/>
    <rect x="623" y="122" width="13" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.9" : "0.95"}/>
    <rect x="642" y="122" width="13" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.6" : "0.7"}/>
    <rect x="661" y="122" width="13" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.85" : "0.85"}/>
    <rect x="623" y="156" width="13" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.7" : "0.8"}/>
    <rect x="642" y="156" width="13" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.9" : "0.95"}/>
    <rect x="661" y="156" width="13" height="18" rx="2" fill={isNight ? "#fef08a" : "#ffffff"} opacity={isNight ? "0.4" : "0.5"}/>

    {/* ── ROAD ── */}
    <rect x="0" y="250" width="900" height="90" fill="url(#road)"/>
    {/* Road markings */}
    <line x1="0" y1="280" x2="900" y2="280" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="20,15" opacity="0.85"/>
    <line x1="0" y1="290" x2="900" y2="290" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="20,15" opacity="0.6"/>

    {/* ── FOREGROUND CLOUDS (Specifically positioned at cy=50-60 to float SLOWLY directly over the Sun/Moon) ── */}
    <g className="cloud3" opacity={isNight ? "0.35" : "0.65"}>
      <ellipse cx="250" cy="58" rx="28" ry="12" fill="white"/>
      <ellipse cx="270" cy="52" rx="18" ry="10" fill="white"/>
      <ellipse cx="232" cy="54" rx="14" ry="8" fill="white"/>
    </g>
    <g className="cloud4" opacity={isNight ? "0.3" : "0.55"}>
      <ellipse cx="580" cy="52" rx="34" ry="14" fill="white"/>
      <ellipse cx="604" cy="46" rx="20" ry="11" fill="white"/>
      <ellipse cx="560" cy="48" rx="16" ry="9" fill="white"/>
    </g>
    <g className="cloud5" opacity={isNight ? "0.28" : "0.5"}>
      <ellipse cx="100" cy="56" rx="36" ry="13" fill="white"/>
      <ellipse cx="124" cy="50" rx="22" ry="11" fill="white"/>
      <ellipse cx="78" cy="53" rx="18" ry="9" fill="white"/>
    </g>
    <g className="cloud6" opacity={isNight ? "0.32" : "0.58"}>
      <ellipse cx="750" cy="54" rx="32" ry="12" fill="white"/>
      <ellipse cx="772" cy="48" rx="18" ry="9" fill="white"/>
      <ellipse cx="730" cy="51" rx="16" ry="8" fill="white"/>
    </g>


    {/* ── TREES (Lush vibrant green) ── */}
    {/* Left trees */}
    <g opacity={isNight ? "0.65" : "0.85"}>
      <rect x="15" y="180" width="8" height="80" rx="4" fill="#78350f"/>
      <ellipse cx="19" cy="160" rx="22" ry="28" fill="#22c55e" className="tree-top"/>
      <rect x="50" y="190" width="7" height="70" rx="3.5" fill="#78350f"/>
      <ellipse cx="53" cy="172" rx="20" ry="25" fill="#4ade80" className="tree-top2"/>
    </g>

    {/* Right trees */}
    <g opacity={isNight ? "0.7" : "0.9"}>
      <rect x="865" y="200" width="8" height="60" rx="4" fill="#78350f"/>
      <ellipse cx="869" cy="182" rx="24" ry="30" fill="#22c55e" className="tree-top3"/>
    </g>

    {/* ── TRAFFIC LIGHT ── */}
    <rect x="720" y="120" width="12" height="50" rx="2" fill="#1e1b4b" opacity="0.9"/>
    <rect x="722" y="125" width="8" height="8" rx="4" fill="#fbbf24" className="tl-red" opacity="0.9"/>
    <rect x="722" y="140" width="8" height="8" rx="4" fill="#22c55e" className="tl-green"/>
    <text x="715" y="185" fontSize="6" fill={isNight ? "#9ca3af" : "#f3f4f6"} fontWeight="bold">Traffic</text>

    {/* ── VEHICLES (animated) - Brighter tones ── */}

    {/* Auto Rickshaw (Vibrant Yellow, goes R→L, facing left, wheels spin CCW) */}
    <g className="rickshaw-grp" clipPath="url(#personClip)">
      {isNight && <polygon points="2,285 -45,270 -45,300" fill="#fef08a" opacity="0.25"/>}
      <rect x="0" y="265" width="60" height="28" rx="4" fill="#facc15"/>
      <circle cx="12" cy="293" r="8" fill="#0f172a" className="wheel-ccw"/>
      <circle cx="48" cy="293" r="8" fill="#0f172a" className="wheel-ccw"/>
      <rect x="38" y="268" width="20" height="12" rx="2" fill="#38bdf8" opacity="0.85"/>
      <circle cx="2" cy="285" r="4.5" fill="#fffbeb"/>
    </g>

    {/* Scooter (Vibrant Candy Red, goes L→R, facing right, wheels spin CW) */}
    <g className="scooter-grp" clipPath="url(#personClip)">
      {isNight && <polygon points="23,264 65,250 65,278" fill="#fef08a" opacity="0.25"/>}
      <ellipse cx="0" cy="288" rx="12" ry="4" fill="#ef4444"/>
      <ellipse cx="20" cy="288" rx="12" ry="4" fill="#ef4444"/>
      <rect x="-4" y="270" width="24" height="14" rx="3" fill="#38bdf8" opacity="0.75"/>
      <circle cx="0" cy="295" r="6" fill="#0f172a" className="wheel"/>
      <circle cx="20" cy="295" r="6" fill="#0f172a" className="wheel"/>
      {/* Premium handlebar & headlight facing right */}
      <line x1="22" y1="272" x2="18" y2="260" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="14" y1="260" x2="22" y2="260" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="23" cy="264" r="3" fill="#fffbeb"/>
    </g>

    {/* Sleek Modern Blue Car (Bright Electric Blue, goes L→R, foreground lane, wheels spin CW) */}
    <g className="car-grp" clipPath="url(#personClip)">
      {isNight && <polygon points="83,291 140,275 140,307" fill="#fef08a" opacity="0.25"/>}
      {/* Car Base Body */}
      <rect x="0" y="284" width="85" height="22" rx="5" fill="#3b82f6"/>
      {/* Car Cabin Dome */}
      <path d="M15 284 L26 270 L58 270 L68 284 Z" fill="#2563eb"/>
      {/* Windows */}
      <rect x="28" y="273" width="12" height="8" fill="#bae6fd" opacity="0.95"/>
      <rect x="44" y="273" width="12" height="8" fill="#bae6fd" opacity="0.95"/>
      {/* Wheels */}
      <circle cx="20" cy="306" r="8" fill="#0f172a" className="wheel"/>
      <circle cx="65" cy="306" r="8" fill="#0f172a" className="wheel"/>
      <circle cx="20" cy="306" r="4" fill="#cbd5e1"/>
      <circle cx="65" cy="306" r="4" fill="#cbd5e1"/>
      {/* Headlight */}
      <circle cx="83" cy="291" r="3.5" fill="#fffbeb"/>
      {/* Taillight */}
      <circle cx="2" cy="289" r="2.5" fill="#f43f5e"/>
    </g>

    {/* ── GROUND SHADOW / ambient depth ── */}
    <rect x="0" y="336" width="900" height="10" fill="#0f172a" opacity="0.12"/>

    {/* ── OVERLAY gradient to blend with hero content - Optimized to keep graphics extremely bright ── */}
    <rect x="0" y="0" width="900" height="340" fill="url(#overlayGrad)"/>
    <defs>
      <linearGradient id="overlayGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={isNight ? "#09090b" : "#f8fafc"} stopOpacity="0.6"/>
        <stop offset="40%" stopColor={isNight ? "#111827" : "#f8fafc"} stopOpacity="0.3"/>
        <stop offset="100%" stopColor={isNight ? "#1e1b4b" : "#f8fafc"} stopOpacity="0.0"/>
      </linearGradient>
    </defs>
    <rect width="900" height="340" fill={isNight ? "rgba(15,23,42,0.15)" : "rgba(224,242,254,0.02)"}/>
  </svg>
);
