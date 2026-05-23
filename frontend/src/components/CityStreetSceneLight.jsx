import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * CityStreetSceneLight
 * 
 * A premium cinematic, animated city hero section designed with SVG layers,
 * Framer Motion, and modern UI principles.
 * 
 * Visual Style:
 * - Moody, atmospheric, futuristic, and highly immersive.
 * - Glassmorphism skyscrapers, cinematic sunlight glows, drifting clouds.
 * - Stylized geometric pine/Christmas trees that sway gently in the breeze.
 * - Floating ambient micro-particles for depth.
 */
export default function CityStreetSceneLight() {
  const [particles, setParticles] = useState([]);
  
  // Generate random atmospheric dust particles on client-side to prevent SSR mismatch
  useEffect(() => {
    const generated = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 15 + 20,
      delay: Math.random() * -20,
      opacity: Math.random() * 0.4 + 0.1,
    }));
    setParticles(generated);
  }, []);

  // Soft breeze animation variant for the stylized trees
  const treeSwayVariants = (duration, delay) => ({
    animate: {
      rotate: [-1.5, 1.5, -1.5],
      skewX: [-0.6, 0.6, -0.6],
      transition: {
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-[#b3e5fc] via-[#e1f5fe] to-[#fffde7] select-none font-sans">
      
      {/* 1. SKY & ATMOSPHERE LAYER (SVG) */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <defs>
          {/* Sky Gradient */}
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="1" />
            <stop offset="60%" stopColor="#e0f2fe" stopOpacity="1" />
            <stop offset="85%" stopColor="#fef3c7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffedd5" stopOpacity="0.7" />
          </linearGradient>

          {/* Cinematic Sunlight Radial Glow */}
          <radialGradient id="sunGlow" cx="80%" cy="20%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="20%" stopColor="#fffbeb" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ffedd5" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#bae6fd" stopOpacity="0" />
          </radialGradient>

          {/* Distant Mountains/Hills Gradients */}
          <linearGradient id="hillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#fed7aa" stopOpacity="0.4" />
          </linearGradient>

          {/* Distant Building Gradients */}
          <linearGradient id="distantBuildGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#fdba74" stopOpacity="0.45" />
          </linearGradient>

          {/* Midground Building Gradients */}
          <linearGradient id="midBuildGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#fdba74" stopOpacity="0.6" />
          </linearGradient>

          {/* Foreground Glass Skyscraper Gradients */}
          <linearGradient id="fgGlassGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="40%" stopColor="#e2e8f0" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="fgGlassGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
          </linearGradient>

          {/* Stylized Christmas Tree Foliage Gradients */}
          <linearGradient id="treeGradDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#047857" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#064e3b" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="treeGradLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#065f46" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Sky Background */}
        <rect width="100%" height="100%" fill="url(#skyGrad)" />

        {/* Sunlight Overlay */}
        <rect width="100%" height="100%" fill="url(#sunGlow)" />
      </svg>

      {/* 2. ATMOSPHERIC DRIFTING CLOUDS (Parallax Layers) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Distant slow clouds */}
        <motion.div
          initial={{ x: "-20%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
          className="absolute top-[15%] left-0 w-[450px] h-[120px] opacity-25 blur-xl bg-white rounded-full"
        />

        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: "-20%" }}
          transition={{ duration: 220, repeat: Infinity, ease: "linear" }}
          className="absolute top-[8%] right-0 w-[600px] h-[150px] opacity-20 blur-2xl bg-white rounded-full"
        />

        {/* Midground soft clouds */}
        <motion.div
          initial={{ x: "-40%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute top-[28%] left-0 w-[350px] h-[90px] opacity-35 blur-lg bg-[#f0fdf4]/60 rounded-full"
        />
      </div>

      {/* 3. DISTANT LAYERS (Distant Mountains & Stylized Hills) */}
      <svg className="absolute bottom-0 w-full h-[35%]" viewBox="0 0 1440 250" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft atmospheric distant ridges */}
        <path d="M0,150 Q360,110 720,160 T1440,130 L1440,250 L0,250 Z" fill="url(#hillGrad)" />
        <path d="M0,180 Q480,140 960,190 T1440,170 L1440,250 L0,250 Z" fill="url(#distantBuildGrad)" opacity="0.4" />
      </svg>

      {/* 4. MIDGROUND SILHOUETTES & MODERN TOWERS */}
      <div className="absolute bottom-0 inset-x-0 h-[45%] pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1440 350" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          {/* Distant city block skyscrapers */}
          <g fill="url(#distantBuildGrad)">
            <rect x="80" y="120" width="70" height="230" rx="3" />
            <rect x="180" y="80" width="90" height="270" rx="4" />
            <rect x="310" y="160" width="85" height="190" rx="2" />
            <rect x="440" y="100" width="60" height="250" rx="3" />
            <rect x="580" y="140" width="110" height="210" rx="5" />
            <rect x="740" y="60" width="100" height="290" rx="4" />
            <rect x="890" y="130" width="75" height="220" rx="2" />
            <rect x="1010" y="90" width="95" height="260" rx="4" />
            <rect x="1160" y="150" width="80" height="200" rx="3" />
            <rect x="1280" y="110" width="70" height="240" rx="3" />
          </g>

          {/* Midground modern towers with glass reflections */}
          <g fill="url(#midBuildGrad)">
            <rect x="130" y="140" width="65" height="210" rx="3" />
            <rect x="250" y="90" width="80" height="260" rx="4" />
            <rect x="410" y="180" width="95" height="170" rx="2" />
            <rect x="530" y="120" width="75" height="230" rx="4" />
            <rect x="680" y="150" width="90" height="200" rx="3" />
            <rect x="830" y="80" width="85" height="270" rx="5" />
            <rect x="960" y="170" width="70" height="180" rx="2" />
            <rect x="1090" y="110" width="90" height="240" rx="4" />
            <rect x="1220" y="160" width="75" height="190" rx="3" />
          </g>
        </svg>
      </div>

      {/* 5. FOREGROUND GLASS SKYSCRAPERS */}
      <div className="absolute bottom-0 inset-x-0 h-[60%] pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1440 500" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          {/* Glass skyscraper 1 - Left */}
          <g>
            <rect x="100" y="120" width="130" height="380" rx="8" fill="url(#fgGlassGrad1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            {/* Structural vertical glass fins */}
            <line x1="132" y1="120" x2="132" y2="500" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="165" y1="120" x2="165" y2="500" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="198" y1="120" x2="198" y2="500" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            {/* Soft geometric architectural lighting */}
            <rect x="115" y="140" width="10" height="60" rx="1" fill="#fffbeb" opacity="0.3" />
            <rect x="115" y="240" width="10" height="60" rx="1" fill="#fffbeb" opacity="0.2" />
            <rect x="205" y="180" width="10" height="60" rx="1" fill="#fffbeb" opacity="0.25" />
          </g>

          {/* Glass skyscraper 2 - Mid Left (Very Tall) */}
          <g>
            <rect x="300" y="40" width="160" height="460" rx="12" fill="url(#fgGlassGrad2)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" />
            {/* Vertical glass fins */}
            <line x1="340" y1="40" x2="340" y2="500" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
            <line x1="380" y1="40" x2="380" y2="500" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
            <line x1="420" y1="40" x2="420" y2="500" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
            {/* Horizontal safety bands */}
            <line x1="300" y1="150" x2="460" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="300" y1="300" x2="460" y2="300" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            {/* Premium minimal window indicators */}
            <circle cx="320" cy="80" r="2" fill="#ffffff" opacity="0.5" />
            <circle cx="320" cy="110" r="2" fill="#ffffff" opacity="0.4" />
            <circle cx="440" cy="80" r="2" fill="#ffffff" opacity="0.5" />
            <circle cx="440" cy="110" r="2" fill="#ffffff" opacity="0.4" />
          </g>

          {/* Glass skyscraper 3 - Center Right */}
          <g>
            <rect x="620" y="160" width="150" height="340" rx="10" fill="url(#fgGlassGrad1)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
            {/* Diagonal abstract light reflection vector */}
            <path d="M620,380 L770,220 L770,250 L620,410 Z" fill="#ffffff" opacity="0.05" />
            <line x1="670" y1="160" x2="670" y2="500" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="720" y1="160" x2="720" y2="500" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            {/* Minimal glowing core */}
            <rect x="645" y="200" width="6" height="80" rx="1" fill="#fffbeb" opacity="0.35" />
            <rect x="715" y="240" width="6" height="80" rx="1" fill="#fffbeb" opacity="0.2" />
          </g>

          {/* Glass skyscraper 4 - Right (Tiered Architecture) */}
          <g>
            {/* Tier 1 */}
            <rect x="880" y="80" width="140" height="420" rx="10" fill="url(#fgGlassGrad2)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            {/* Tier 2 */}
            <rect x="910" y="30" width="80" height="50" rx="6" fill="url(#fgGlassGrad1)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
            {/* Vertical accents */}
            <line x1="950" y1="30" x2="950" y2="500" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
            <line x1="920" y1="80" x2="920" y2="500" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <line x1="980" y1="80" x2="980" y2="500" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          </g>

          {/* Glass skyscraper 5 - Far Right */}
          <g>
            <rect x="1150" y="140" width="160" height="360" rx="8" fill="url(#fgGlassGrad1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <line x1="1200" y1="140" x2="1200" y2="500" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="1260" y1="140" x2="1260" y2="500" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          </g>
        </svg>
      </div>

      {/* 6. LAYERED PREMIUM STYLIZED CHRISTMAS/PINE TREES */}
      <div className="absolute bottom-0 inset-x-0 h-[22%] pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1440 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          
          {/* TREE 1: Deep forest pine - Left */}
          <motion.g
            variants={treeSwayVariants(5.4, 0)}
            animate="animate"
            style={{ transformOrigin: "80px 180px" }}
          >
            {/* Trunk */}
            <rect x="76" y="140" width="8" height="40" fill="#78350f" opacity="0.9" />
            {/* Foliage Ellipse Layers (Stylized Pine) */}
            <ellipse cx="80" cy="130" rx="42" ry="24" fill="url(#treeGradDark)" />
            <ellipse cx="80" cy="105" rx="34" ry="20" fill="url(#treeGradLight)" />
            <ellipse cx="80" cy="82" rx="26" ry="16" fill="url(#treeGradDark)" />
            <ellipse cx="80" cy="62" rx="18" ry="12" fill="url(#treeGradLight)" />
          </motion.g>

          {/* TREE 2: Breezy tall pine - Mid Left */}
          <motion.g
            variants={treeSwayVariants(6.2, 0.5)}
            animate="animate"
            style={{ transformOrigin: "260px 180px" }}
          >
            {/* Trunk */}
            <rect x="256" y="110" width="8" height="70" fill="#78350f" opacity="0.95" />
            {/* Foliage Layers */}
            <ellipse cx="260" cy="110" rx="46" ry="26" fill="url(#treeGradLight)" />
            <ellipse cx="260" cy="85" rx="38" ry="22" fill="url(#treeGradDark)" />
            <ellipse cx="260" cy="62" rx="28" ry="18" fill="url(#treeGradLight)" />
            <ellipse cx="260" cy="42" rx="18" ry="12" fill="url(#treeGradDark)" />
          </motion.g>

          {/* TREE 3: Dense geometric pine - Center */}
          <motion.g
            variants={treeSwayVariants(5.0, 1.2)}
            animate="animate"
            style={{ transformOrigin: "520px 185px" }}
          >
            {/* Trunk */}
            <rect x="516" y="130" width="8" height="55" fill="#78350f" opacity="0.85" />
            {/* Foliage Layers */}
            <ellipse cx="520" cy="120" rx="40" ry="24" fill="url(#treeGradDark)" />
            <ellipse cx="520" cy="98" rx="32" ry="20" fill="url(#treeGradLight)" />
            <ellipse cx="520" cy="78" rx="24" ry="16" fill="url(#treeGradDark)" />
            <ellipse cx="520" cy="60" rx="16" ry="12" fill="url(#treeGradLight)" />
          </motion.g>

          {/* TREE 4: Golden hour glowing pine - Right */}
          <motion.g
            variants={treeSwayVariants(5.8, 0.8)}
            animate="animate"
            style={{ transformOrigin: "820px 180px" }}
          >
            {/* Trunk */}
            <rect x="816" y="100" width="8" height="80" fill="#78350f" opacity="0.9" />
            {/* Foliage Layers */}
            <ellipse cx="820" cy="100" rx="44" ry="25" fill="url(#treeGradLight)" />
            <ellipse cx="820" cy="76" rx="36" ry="21" fill="url(#treeGradDark)" />
            <ellipse cx="820" cy="54" rx="26" ry="17" fill="url(#treeGradLight)" />
            <ellipse cx="820" cy="34" rx="16" ry="12" fill="url(#treeGradDark)" />
          </motion.g>

          {/* TREE 5: Small pine - Far Right */}
          <motion.g
            variants={treeSwayVariants(4.6, 1.8)}
            animate="animate"
            style={{ transformOrigin: "1120px 185px" }}
          >
            {/* Trunk */}
            <rect x="1117" y="145" width="6" height="40" fill="#78350f" opacity="0.8" />
            {/* Foliage Layers */}
            <ellipse cx="1120" cy="135" rx="32" ry="20" fill="url(#treeGradDark)" />
            <ellipse cx="1120" cy="115" rx="26" ry="16" fill="url(#treeGradLight)" />
            <ellipse cx="1120" cy="97" rx="18" ry="12" fill="url(#treeGradDark)" />
          </motion.g>

          {/* TREE 6: Midsize Pine - Far Left */}
          <motion.g
            variants={treeSwayVariants(5.6, 2.1)}
            animate="animate"
            style={{ transformOrigin: "1320px 180px" }}
          >
            {/* Trunk */}
            <rect x="1316" y="125" width="8" height="55" fill="#78350f" opacity="0.9" />
            {/* Foliage Layers */}
            <ellipse cx="1320" cy="115" rx="38" ry="23" fill="url(#treeGradLight)" />
            <ellipse cx="1320" cy="92" rx="30" ry="19" fill="url(#treeGradDark)" />
            <ellipse cx="1320" cy="72" rx="22" ry="15" fill="url(#treeGradLight)" />
            <ellipse cx="1320" cy="54" rx="14" ry="10" fill="url(#treeGradDark)" />
          </motion.g>
        </svg>
      </div>

      {/* 7. AMBIENT PARTICLES (Sun Dusted Motes) */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: `${p.x}%`, y: `${p.y + 10}%`, opacity: 0 }}
            animate={{
              y: [`${p.y + 10}%`, `${p.y - 20}%`],
              opacity: [0, p.opacity, p.opacity, 0],
              x: [`${p.x}%`, `${p.x + (Math.random() * 4 - 2)}%`],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              width: p.size,
              height: p.size,
            }}
            className="absolute rounded-full bg-[#fef08a] shadow-[0_0_8px_#fef08a] blur-[0.3px]"
          />
        ))}
      </div>

      {/* 8. CINEMATIC GLOW, BACKDROP BLUR OVERLAYS & VIGNETTE */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle horizontal gradient overlay at the base */}
        <div className="absolute bottom-0 inset-x-0 h-[10%] bg-gradient-to-t from-white via-white/40 to-transparent" />
        
        {/* High-end cinematic radial glow center-top */}
        <div className="absolute top-0 right-0 w-[55%] h-[55%] rounded-full bg-radial-glow opacity-[0.25] blur-[140px] bg-gradient-to-br from-[#fef3c7] to-transparent" />

        {/* Ambient atmospheric haze backdrop blur */}
        <div className="absolute bottom-0 inset-x-0 h-[8%] backdrop-blur-[1px] opacity-70 bg-gradient-to-t from-[#fffbeb]/20 to-transparent" />

        {/* Vignette */}
        <div className="absolute inset-0 bg-radial-gradient shadow-[inset_0_0_120px_rgba(254,243,199,0.06)]" />
      </div>
    </div>
  );
}
