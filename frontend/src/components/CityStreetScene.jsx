// ── Animated Indian City Street Scene ──────────────────────────────────────
export const CityStreetScene = () => (
  <svg
    viewBox="0 0 900 340"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full"
    style={{ minHeight: "100%" }}
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      {/* Sky gradient */}
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fde8c8"/>
        <stop offset="60%" stopColor="#fcd5a0"/>
        <stop offset="100%" stopColor="#f9a35a" stopOpacity="0.6"/>
      </linearGradient>
      {/* Road gradient */}
      <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#78716c"/>
        <stop offset="100%" stopColor="#57534e"/>
      </linearGradient>
      {/* Building gradients */}
      <linearGradient id="bldg1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fb923c"/>
        <stop offset="100%" stopColor="#ea580c"/>
      </linearGradient>
      <linearGradient id="bldg2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a78bfa"/>
        <stop offset="100%" stopColor="#7c3aed"/>
      </linearGradient>
      <linearGradient id="bldg3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#34d399"/>
        <stop offset="100%" stopColor="#059669"/>
      </linearGradient>
      <linearGradient id="bldg4" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#60a5fa"/>
        <stop offset="100%" stopColor="#2563eb"/>
      </linearGradient>
      <linearGradient id="bldg5" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f9a8d4"/>
        <stop offset="100%" stopColor="#db2777"/>
      </linearGradient>
      <linearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fef08a"/>
        <stop offset="100%" stopColor="#fb923c"/>
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

        /* Cloud drift */
        @keyframes cloud1 { 0%{transform:translateX(0)} 100%{transform:translateX(900px)} }
        @keyframes cloud2 { 0%{transform:translateX(-200px)} 100%{transform:translateX(900px)} }
        .cloud1 { animation: cloud1 28s linear infinite; }
        .cloud2 { animation: cloud2 38s linear infinite; }

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

        /* Wheel spin */
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .wheel { animation: spin 0.7s linear infinite; transform-box:fill-box; transform-origin:center; }

        /* Person 1 walk L→R */
        @keyframes walkR { 0%{transform:translateX(-60px)} 100%{transform:translateX(960px)} }
        .person1 { animation: walkR 14s linear infinite; }

        /* Person 2 walk L→R (offset) */
        @keyframes walkR2 { 0%{transform:translateX(-60px)} 100%{transform:translateX(960px)} }
        .person2 { animation: walkR2 18s 4s linear infinite; }

        /* Person 3 walk R→L */
        @keyframes walkL { 0%{transform:translateX(960px)} 100%{transform:translateX(-60px)} }
        .person3 { animation: walkL 16s linear infinite; }

        /* Person 4 walk R→L (offset) */
        .person4 { animation: walkL 12s 6s linear infinite; }

        /* Leg swing for walkers */
        @keyframes legSwingF { 0%,100%{transform:rotate(-18deg)} 50%{transform:rotate(18deg)} }
        @keyframes legSwingB { 0%,100%{transform:rotate(18deg)} 50%{transform:rotate(-18deg)} }
        .legF { animation: legSwingF 0.55s ease-in-out infinite; transform-box:fill-box; transform-origin:top center; }
        .legB { animation: legSwingB 0.55s ease-in-out infinite; transform-box:fill-box; transform-origin:top center; }
        .legF2 { animation: legSwingF 0.65s ease-in-out infinite; transform-box:fill-box; transform-origin:top center; }
        .legB2 { animation: legSwingB 0.65s ease-in-out infinite; transform-box:fill-box; transform-origin:top center; }

        /* Arm swing */
        @keyframes armSwingF { 0%,100%{transform:rotate(18deg)} 50%{transform:rotate(-18deg)} }
        @keyframes armSwingB { 0%,100%{transform:rotate(-18deg)} 50%{transform:rotate(18deg)} }
        .armF { animation: armSwingF 0.55s ease-in-out infinite; transform-box:fill-box; transform-origin:top center; }
        .armB { animation: armSwingB 0.55s ease-in-out infinite; transform-box:fill-box; transform-origin:top center; }

        /* Dog walk (wag+walk) */
        @keyframes dogWalkR { 0%{transform:translateX(-80px)} 100%{transform:translateX(960px)} }
        @keyframes dogWalkL { 0%{transform:translateX(960px)} 100%{transform:translateX(-80px)} }
        .dog1 { animation: dogWalkR 20s 2s linear infinite; }
        .dog2 { animation: dogWalkL 17s linear infinite; }
        @keyframes tailWag { 0%,100%{transform:rotate(-30deg)} 50%{transform:rotate(30deg)} }
        .tail { animation: tailWag 0.4s ease-in-out infinite; transform-box:fill-box; transform-origin:left center; }
        @keyframes dogLegF { 0%,100%{transform:rotate(-20deg)} 50%{transform:rotate(20deg)} }
        @keyframes dogLegB { 0%,100%{transform:rotate(20deg)} 50%{transform:rotate(-20deg)} }
        .dlegF { animation: dogLegF 0.35s ease-in-out infinite; transform-box:fill-box; transform-origin:top center; }
        .dlegB { animation: dogLegB 0.35s ease-in-out infinite; transform-box:fill-box; transform-origin:top center; }

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
        .kite { animation: kiteDrift 4s ease-in-out infinite; }

        /* Crow flap */
        @keyframes crowFly { 0%,100%{transform:translate(0,0)} 25%{transform:translate(30px,-10px)} 50%{transform:translate(70px,0)} 75%{transform:translate(100px,-8px)} }
        @keyframes wingFlap { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(-0.6)} }
        .crow { animation: crowFly 6s ease-in-out infinite; }
        .wing { animation: wingFlap 0.3s ease-in-out infinite; transform-box:fill-box; transform-origin:center; }

        /* Smoke puff from dhaba */
        @keyframes smokePuff { 0%{transform:translateY(0) scale(1);opacity:0.6} 100%{transform:translateY(-30px) scale(2);opacity:0} }
        .smoke1 { animation: smokePuff 2s ease-out infinite; }
        .smoke2 { animation: smokePuff 2s 0.7s ease-out infinite; }
        .smoke3 { animation: smokePuff 2s 1.4s ease-out infinite; }
      `}</style>
    </defs>

    {/* ── SKY ── */}
    <rect width="900" height="340" fill="url(#sky)"/>

    {/* Sun */}
    <circle cx="820" cy="55" r="22" fill="url(#sunGrad)" className="sun-circle"/>
    <circle cx="820" cy="55" r="30" fill="#fef9c3" opacity="0.15" filter="url(#blur2)"/>

    {/* Clouds */}
    <g className="cloud1" opacity="0.85">
      <ellipse cx="120" cy="38" rx="38" ry="16" fill="white"/>
      <ellipse cx="148" cy="30" rx="24" ry="14" fill="white"/>
      <ellipse cx="96" cy="32" rx="20" ry="12" fill="white"/>
    </g>
    <g className="cloud2" opacity="0.7">
      <ellipse cx="400" cy="28" rx="30" ry="12" fill="white"/>
      <ellipse cx="424" cy="22" rx="18" ry="10" fill="white"/>
      <ellipse cx="380" cy="24" rx="16" ry="9" fill="white"/>
    </g>

    {/* Kite */}
    <g className="kite" style={{transformOrigin:"680px 60px"}}>
      <polygon points="680,44 696,60 680,76 664,60" fill="#ef4444" opacity="0.9"/>
      <polygon points="680,44 696,60 680,60" fill="#fca5a5" opacity="0.7"/>
      <path d="M680 76 Q685 88 682 100" stroke="#7c3aed" strokeWidth="1.2" fill="none" strokeDasharray="3,2"/>
    </g>

    {/* Crow */}
    <g className="crow" style={{transformOrigin:"100px 75px"}}>
      <ellipse cx="100" cy="75" rx="7" ry="4" fill="#1e1b4b"/>
      <ellipse cx="106" cy="74" rx="4" ry="2.5" fill="#1e1b4b"/>
      <g className="wing" style={{transformOrigin:"98px 73px"}}>
        <path d="M98 73 Q88 66 80 70" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      </g>
      <path d="M102 73 Q112 66 120 70" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </g>

    {/* ── BUILDINGS (back row) ── */}
    {/* B1 - tall orange */}
    <rect x="30" y="55" width="70" height="195" fill="url(#bldg1)" rx="3"/>
    <rect x="36" y="65" width="14" height="18" rx="2" fill="#fff7ed" opacity="0.8"/>
    <rect x="56" y="65" width="14" height="18" rx="2" fill="#fff7ed" opacity="0.8"/>
    <rect x="76" y="65" width="14" height="18" rx="2" fill="#fff7ed" opacity="0.3"/>
    <rect x="36" y="95" width="14" height="18" rx="2" fill="#fff7ed" opacity="0.8"/>
    <rect x="56" y="95" width="14" height="18" rx="2" fill="#fff7ed" opacity="0.5"/>
    <rect x="76" y="95" width="14" height="18" rx="2" fill="#fff7ed" opacity="0.8"/>
    <rect x="36" y="125" width="14" height="18" rx="2" fill="#fff7ed" opacity="0.4"/>
    <rect x="56" y="125" width="14" height="18" rx="2" fill="#fff7ed" opacity="0.8"/>
    <rect x="76" y="125" width="14" height="18" rx="2" fill="#fff7ed" opacity="0.6"/>
    <rect x="36" y="155" width="14" height="18" rx="2" fill="#fff7ed" opacity="0.7"/>
    <rect x="56" y="155" width="14" height="18" rx="2" fill="#fff7ed" opacity="0.3"/>
    <rect x="76" y="155" width="14" height="18" rx="2" fill="#fff7ed" opacity="0.8"/>

    {/* B2 - medium purple */}
    <rect x="120" y="85" width="60" height="165" fill="url(#bldg2)" rx="3"/>
    <rect x="126" y="98" width="13" height="16" rx="2" fill="#e0e7ff" opacity="0.6"/>
    <rect x="145" y="98" width="13" height="16" rx="2" fill="#e0e7ff" opacity="0.8"/>
    <rect x="164" y="98" width="13" height="16" rx="2" fill="#e0e7ff" opacity="0.4"/>
    <rect x="126" y="125" width="13" height="16" rx="2" fill="#e0e7ff" opacity="0.8"/>
    <rect x="145" y="125" width="13" height="16" rx="2" fill="#e0e7ff" opacity="0.5"/>
    <rect x="164" y="125" width="13" height="16" rx="2" fill="#e0e7ff" opacity="0.7"/>
    <rect x="126" y="152" width="13" height="16" rx="2" fill="#e0e7ff" opacity="0.6"/>
    <rect x="145" y="152" width="13" height="16" rx="2" fill="#e0e7ff" opacity="0.8"/>
    <rect x="164" y="152" width="13" height="16" rx="2" fill="#e0e7ff" opacity="0.4"/>

    {/* B3 - tall green */}
    <rect x="210" y="40" width="75" height="210" fill="url(#bldg3)" rx="3"/>
    <rect x="218" y="56" width="15" height="20" rx="2" fill="#cffafe" opacity="0.7"/>
    <rect x="240" y="56" width="15" height="20" rx="2" fill="#cffafe" opacity="0.5"/>
    <rect x="262" y="56" width="15" height="20" rx="2" fill="#cffafe" opacity="0.8"/>
    <rect x="218" y="90" width="15" height="20" rx="2" fill="#cffafe" opacity="0.8"/>
    <rect x="240" y="90" width="15" height="20" rx="2" fill="#cffafe" opacity="0.6"/>
    <rect x="262" y="90" width="15" height="20" rx="2" fill="#cffafe" opacity="0.7"/>
    <rect x="218" y="124" width="15" height="20" rx="2" fill="#cffafe" opacity="0.5"/>
    <rect x="240" y="124" width="15" height="20" rx="2" fill="#cffafe" opacity="0.8"/>
    <rect x="262" y="124" width="15" height="20" rx="2" fill="#cffafe" opacity="0.4"/>
    <rect x="218" y="158" width="15" height="20" rx="2" fill="#cffafe" opacity="0.8"/>
    <rect x="240" y="158" width="15" height="20" rx="2" fill="#cffafe" opacity="0.6"/>
    <rect x="262" y="158" width="15" height="20" rx="2" fill="#cffafe" opacity="0.7"/>

    {/* B4 - medium blue */}
    <rect x="315" y="95" width="70" height="155" fill="url(#bldg4)" rx="3"/>
    <rect x="323" y="110" width="14" height="17" rx="2" fill="#e0f2fe" opacity="0.7"/>
    <rect x="343" y="110" width="14" height="17" rx="2" fill="#e0f2fe" opacity="0.5"/>
    <rect x="363" y="110" width="14" height="17" rx="2" fill="#e0f2fe" opacity="0.8"/>
    <rect x="323" y="142" width="14" height="17" rx="2" fill="#e0f2fe" opacity="0.6"/>
    <rect x="343" y="142" width="14" height="17" rx="2" fill="#e0f2fe" opacity="0.8"/>
    <rect x="363" y="142" width="14" height="17" rx="2" fill="#e0f2fe" opacity="0.4"/>

    {/* B5 - pink on far right */}
    <rect x="615" y="75" width="65" height="175" fill="url(#bldg5)" rx="3"/>
    <rect x="623" y="88" width="13" height="18" rx="2" fill="#fce7f3" opacity="0.7"/>
    <rect x="642" y="88" width="13" height="18" rx="2" fill="#fce7f3" opacity="0.5"/>
    <rect x="661" y="88" width="13" height="18" rx="2" fill="#fce7f3" opacity="0.8"/>
    <rect x="623" y="122" width="13" height="18" rx="2" fill="#fce7f3" opacity="0.8"/>
    <rect x="642" y="122" width="13" height="18" rx="2" fill="#fce7f3" opacity="0.5"/>
    <rect x="661" y="122" width="13" height="18" rx="2" fill="#fce7f3" opacity="0.7"/>
    <rect x="623" y="156" width="13" height="18" rx="2" fill="#fce7f3" opacity="0.6"/>
    <rect x="642" y="156" width="13" height="18" rx="2" fill="#fce7f3" opacity="0.8"/>
    <rect x="661" y="156" width="13" height="18" rx="2" fill="#fce7f3" opacity="0.4"/>

    {/* ── ROAD ── */}
    <rect x="0" y="250" width="900" height="90" fill="url(#road)"/>
    {/* Road markings */}
    <line x1="0" y1="280" x2="900" y2="280" stroke="#fbbf24" strokeWidth="2" strokeDasharray="20,15" opacity="0.6"/>
    <line x1="0" y1="290" x2="900" y2="290" stroke="#fbbf24" strokeWidth="1" strokeDasharray="20,15" opacity="0.4"/>

    {/* ── TREES (depth backdrop) ── */}
    {/* Left trees (far back) */}
    <g opacity="0.6">
      <rect x="15" y="180" width="8" height="80" rx="4" fill="#92400e"/>
      <ellipse cx="19" cy="160" rx="22" ry="28" fill="#166534" className="tree-top"/>
      <rect x="50" y="190" width="7" height="70" rx="3.5" fill="#92400e"/>
      <ellipse cx="53" cy="172" rx="20" ry="25" fill="#166534" className="tree-top2"/>
    </g>

    {/* Right trees */}
    <g opacity="0.65">
      <rect x="865" y="200" width="8" height="60" rx="4" fill="#92400e"/>
      <ellipse cx="869" cy="182" rx="24" ry="30" fill="#166534" className="tree-top3"/>
    </g>

    {/* ── TRAFFIC LIGHT ── */}
    <rect x="720" y="120" width="12" height="50" rx="2" fill="#1e1b4b" opacity="0.8"/>
    <rect x="722" y="125" width="8" height="8" rx="4" fill="#fbbf24" className="tl-red" opacity="0.8"/>
    <rect x="722" y="140" width="8" height="8" rx="4" fill="#65a30d" className="tl-green"/>
    <text x="715" y="185" fontSize="6" fill="#78716c">Traffic</text>

    {/* ── VEHICLES & PEOPLE (animated) ── */}

    {/* Auto Rickshaw (yellow-green, goes L→R) */}
    <g className="rickshaw-grp" clipPath="url(#personClip)">
      <rect x="0" y="265" width="60" height="28" rx="4" fill="#facc15"/>
      <ellipse cx="12" cy="293" r="8" fill="#1e1b4b" className="wheel"/>
      <ellipse cx="48" cy="293" r="8" fill="#1e1b4b" className="wheel"/>
      <rect x="2" y="268" width="20" height="12" rx="2" fill="#1e40af" opacity="0.6"/>
      <circle cx="58" cy="285" r="4" fill="#fbbf24"/>
    </g>

    {/* Scooter (red, goes R→L) */}
    <g className="scooter-grp" clipPath="url(#personClip)">
      <ellipse cx="0" cy="288" rx="12" ry="4" fill="#dc2626"/>
      <ellipse cx="20" cy="288" rx="12" ry="4" fill="#dc2626"/>
      <rect x="-4" y="270" width="24" height="14" rx="3" fill="#1e40af" opacity="0.5"/>
      <circle cx="0" cy="295" r="6" fill="#1e1b4b" className="wheel"/>
      <circle cx="20" cy="295" r="6" fill="#1e1b4b" className="wheel"/>
    </g>

    {/* Person 1 (walks L→R) */}
    <g className="person1" clipPath="url(#personClip)">
      <circle cx="0" cy="240" r="5" fill="#b45309"/>
      <rect x="-4" y="245" width="8" height="16" rx="2" fill="#94a3b8"/>
      <rect x="-6" y="262" width="4" height="12" rx="2" fill="#d4af37" className="legF"/>
      <rect x="-2" y="262" width="4" height="12" rx="2" fill="#d4af37" className="legB"/>
      <rect x="-8" y="247" width="4" height="10" rx="2" fill="#b45309" className="armF"/>
      <rect x="4" y="247" width="4" height="10" rx="2" fill="#b45309" className="armB"/>
    </g>

    {/* Person 2 (walks L→R, delayed) */}
    <g className="person2" clipPath="url(#personClip)">
      <circle cx="0" cy="245" r="5" fill="#9333ea"/>
      <rect x="-4" y="250" width="8" height="16" rx="2" fill="#fbbf24"/>
      <rect x="-6" y="267" width="4" height="12" rx="2" fill="#475569" className="legF2"/>
      <rect x="-2" y="267" width="4" height="12" rx="2" fill="#475569" className="legB2"/>
      <rect x="-8" y="252" width="4" height="10" rx="2" fill="#9333ea" className="armF"/>
      <rect x="4" y="252" width="4" height="10" rx="2" fill="#9333ea" className="armB"/>
    </g>

    {/* Person 3 (walks R→L) */}
    <g className="person3" clipPath="url(#personClip)">
      <circle cx="0" cy="242" r="5" fill="#06b6d4"/>
      <rect x="-4" y="247" width="8" height="16" rx="2" fill="#67e8f9"/>
      <rect x="-6" y="264" width="4" height="12" rx="2" fill="#1f2937" className="legB"/>
      <rect x="-2" y="264" width="4" height="12" rx="2" fill="#1f2937" className="legF"/>
      <rect x="-8" y="249" width="4" height="10" rx="2" fill="#06b6d4" className="armB"/>
      <rect x="4" y="249" width="4" height="10" rx="2" fill="#06b6d4" className="armF"/>
    </g>

    {/* Person 4 (walks R→L, delayed) */}
    <g className="person4" clipPath="url(#personClip)">
      <circle cx="0" cy="247" r="5" fill="#ec4899"/>
      <rect x="-4" y="252" width="8" height="16" rx="2" fill="#fbcfe8"/>
      <rect x="-6" y="269" width="4" height="12" rx="2" fill="#064e3b" className="legB"/>
      <rect x="-2" y="269" width="4" height="12" rx="2" fill="#064e3b" className="legF"/>
      <rect x="-8" y="254" width="4" height="10" rx="2" fill="#ec4899" className="armB"/>
      <rect x="4" y="254" width="4" height="10" rx="2" fill="#ec4899" className="armF"/>
    </g>

    {/* ── DOGS ── */}
    {/* Dog 1 (L→R, bigger, happy look) */}
    <g className="dog1" clipPath="url(#personClip)">
      <ellipse cx="28" cy="256" rx="14" ry="7" fill="#b45309"/>
      <circle cx="10" cy="250" r="7" fill="#b45309"/>
      <ellipse cx="4" cy="253" rx="4.5" ry="3" fill="#d4af37"/>
      <circle cx="2" cy="250" r="1.5" fill="#1e1b4b"/>
      <ellipse cx="8" cy="244" rx="3" ry="5" fill="#92400e" transform="rotate(15 8 244)"/>
      <path d="M42 254 Q54 240 60 246" stroke="#b45309" strokeWidth="4.5" strokeLinecap="round" fill="none" className="tail"/>
      <rect x="15" y="263" width="4" height="12" rx="2" fill="#92400e" className="dlegF"/>
      <rect x="24" y="263" width="4" height="12" rx="2" fill="#92400e" className="dlegB"/>
      <rect x="33" y="263" width="4" height="12" rx="2" fill="#92400e" className="dlegF"/>
      <rect x="42" y="263" width="4" height="12" rx="2" fill="#92400e" className="dlegB"/>
      <ellipse cx="36" cy="245" rx="3.5" ry="6" fill="#b45309" transform="rotate(-18 36 245)"/>
    </g>

    {/* Dog 2 (R→L, smaller, stray look) */}
    <g className="dog2" clipPath="url(#personClip)">
      <ellipse cx="22" cy="260" rx="13" ry="6" fill="#78716c"/>
      <circle cx="8" cy="255" r="6" fill="#78716c"/>
      <ellipse cx="3" cy="257" rx="4" ry="2.8" fill="#a8a29e"/>
      <circle cx="2" cy="255" r="1.2" fill="#1e1b4b"/>
      <ellipse cx="10" cy="250" rx="2.5" ry="4" fill="#57534e" transform="rotate(10 10 250)"/>
      <path d="M34 258 Q42 250 46 253" stroke="#78716c" strokeWidth="3.5" strokeLinecap="round" fill="none" className="tail"/>
      <rect x="12" y="264" width="3" height="8" rx="1.5" fill="#57534e" className="dlegF"/>
      <rect x="19" y="264" width="3" height="8" rx="1.5" fill="#57534e" className="dlegB"/>
      <rect x="26" y="264" width="3" height="8" rx="1.5" fill="#57534e" className="dlegF"/>
      <rect x="33" y="264" width="3" height="8" rx="1.5" fill="#57534e" className="dlegB"/>
    </g>

    {/* ── GROUND SHADOW / ambient depth ── */}
    <rect x="0" y="336" width="900" height="10" fill="#1c1917" opacity="0.18"/>

    {/* ── OVERLAY gradient to blend with hero content ── */}
    <rect x="0" y="0" width="900" height="340" fill="url(#overlayGrad)"/>
    <defs>
      <linearGradient id="overlayGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.82"/>
        <stop offset="45%" stopColor="#f8fafc" stopOpacity="0.55"/>
        <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.08"/>
      </linearGradient>
    </defs>
    <rect width="900" height="340" fill="rgba(20,10,5,0.30)"/>
  </svg>
);
