import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");

  // Page States
  const [duration, setDuration] = useState(3);
  const [negotiated, setNegotiated] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [activeDot, setActiveDot] = useState(0);
  const [tempToast, setTempToast] = useState("");

  const handleDotClick = (idx) => {
    if (idx === 0) {
      setActiveDot(0);
    } else {
      setTempToast("Owner did not upload the image yet.");
      setTimeout(() => setTempToast(""), 2000);
    }
  };

  const handleArrowClick = (direction) => {
    let nextDot = activeDot;
    if (direction === "next") {
      nextDot = (activeDot + 1) % 3;
    } else {
      nextDot = (activeDot - 1 + 3) % 3;
    }

    if (nextDot === 0) {
      setActiveDot(0);
    } else {
      setTempToast("Owner did not upload the image yet.");
      setTimeout(() => setTempToast(""), 2000);
    }
  };

  // Mock catalog
  const catalog = {
    "rent_camera_1": {
      emoji: "📷",
      title: "Sony FX3 Cinema Camera Kit",
      price: 450,
      category: "Electronics",
      owner: "Arjun K.",
      ownerRating: "4.9 ★",
      ownerVerified: true,
      ownerRentals: 42,
      condition: "Like New",
      minDuration: 2,
      maxDuration: 14,
      desc: "Full production-ready cinema camera. Includes Sony FX3 body, two 160GB CFexpress cards, 3 batteries, charger, and a sleek carry case. Capture flawless 4K 120fps footage with incredible low-light capability and custom S-Cinetone profile support.",
      specs: ["12.1MP Full-Frame Exmor R CMOS Sensor", "UHD 4K up to 120p | 10-Bit 4:2:2", "S-Cinetone / S-Log3 / HLG profiles"]
    },
    "rent_activa_2": {
      emoji: "🛵",
      title: "Honda Activa Scooter",
      price: 250,
      category: "Vehicles",
      owner: "Rahul P.",
      ownerRating: "4.7 ★",
      ownerVerified: true,
      ownerRentals: 18,
      condition: "Excellent",
      minDuration: 1,
      maxDuration: 30,
      desc: "Honda Activa 6G in excellent mechanical shape. Regularly serviced, clean helmet included. Perfect for quick errands, daily commutes, or local city exploring. Extremely high fuel efficiency and easy handling.",
      specs: ["110cc Fuel-Injected Engine", "Tubeless Tyres with Combi-Braking", "Spacious under-seat storage"]
    },
    "rent_ps5_3": {
      emoji: "🎮",
      title: "PlayStation 5 Pro Console",
      price: 350,
      category: "Electronics",
      owner: "Aman G.",
      ownerRating: "5.0 ★",
      ownerVerified: true,
      ownerRentals: 65,
      condition: "Excellent",
      minDuration: 2,
      maxDuration: 7,
      desc: "Get the ultimate gaming console experience. Rent the PS5 Pro with two DualSense controllers, charging dock, and blockbusters like EA FC 26 and Spider-Man 2 pre-installed. Fits beautifully into casual weekends.",
      specs: ["Upgraded GPU | Advanced Ray Tracing", "2TB Ultra-High Speed SSD", "Includes two DualSense controllers"]
    },
    "rent_drill_4": {
      emoji: "🔧",
      title: "DeWalt Power Drill Set",
      price: 120,
      category: "Tools",
      owner: "Suresh B.",
      ownerRating: "4.8 ★",
      ownerVerified: false,
      ownerRentals: 9,
      condition: "Good",
      minDuration: 1,
      maxDuration: 5,
      desc: "Professional heavy-duty DeWalt Cordless Drill/Driver kit. Includes two 20V Max batteries, fast charger, 24 distinct driver bits, and a heavy-duty storage bag. Highly reliable for home repairs or assembly.",
      specs: ["High-speed transmission variables", "Ergonomic comfort grip handle", "LED spotlight built-in"]
    }
  };

  const item = catalog[id] || catalog["rent_camera_1"];

  const handleRequestRent = () => {
    setRequestStatus(`Rent request successfully sent to ${item.owner} for ${duration} days!`);
    setTimeout(() => setRequestStatus(""), 4000);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 py-8 px-4 md:px-8 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Header breadcrumbs */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center">
        <button 
          onClick={() => navigate("/rent-catalog")}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.05] active:scale-95 ${
            isNight ? "bg-slate-900 border border-slate-850 hover:bg-slate-800" : "bg-white border border-slate-200 hover:bg-slate-100 shadow-sm"
          }`}
        >
          ← Back to Catalog
        </button>
        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-wider">
          {item.category}
        </span>
      </div>

      {/* Main amazon layout grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Image / Emoji details */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`p-10 rounded-3xl border text-center transition-all relative ${
            isNight ? "bg-slate-900/60 border-slate-850" : "bg-white border-slate-200/60 shadow-sm"
          }`}>
            <div className="relative flex items-center justify-center max-w-lg mx-auto">
              {/* Left Side Arrow Bar */}
              <button
                onClick={() => handleArrowClick("prev")}
                className="absolute left-0 md:left-4 z-10 text-slate-400 hover:text-indigo-500 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-125 active:scale-90"
                title="Previous Image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                </svg>
              </button>

              <div className={`w-48 h-48 md:w-60 md:h-60 rounded-3xl flex items-center justify-center text-9xl shadow-md ${
                isNight ? "bg-gradient-to-br from-slate-800 to-slate-950" : "bg-gradient-to-br from-indigo-50 to-violet-50"
              }`}>
                {item.emoji}
              </div>

              {/* Right Side Arrow Bar */}
              <button
                onClick={() => handleArrowClick("next")}
                className="absolute right-0 md:right-4 z-10 text-slate-400 hover:text-indigo-500 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-125 active:scale-90"
                title="Next Image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </button>
            </div>

            {tempToast && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-indigo-500/35 backdrop-blur-md shadow-xl transition-opacity duration-300 animate-pulse pointer-events-none">
                {tempToast}
              </div>
            )}
            
            <div className="flex justify-center items-center gap-2.5 mt-6">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  onClick={() => handleDotClick(idx)}
                  className={`w-3 h-3 rounded-full transition-all duration-250 cursor-pointer ${
                    activeDot === idx
                      ? "bg-indigo-500 scale-125 shadow-md shadow-indigo-500/20"
                      : "bg-slate-350 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Description Specs */}
          <div className={`p-6 md:p-8 rounded-3xl border ${
            isNight ? "bg-slate-900/60 border-slate-850" : "bg-white border-slate-200/60 shadow-sm"
          }`}>
            <h3 className="font-extrabold text-base mb-3">Product Description</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">{item.desc}</p>
            
            <h3 className="font-extrabold text-base mb-3 border-t border-slate-100 dark:border-slate-800 pt-5">Package Inclusions</h3>
            <ul className="space-y-2 text-xs text-slate-400 pl-1">
              {item.specs.map((spec, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-indigo-400">✔</span> {spec}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: E-commerce Details, Owner box, Negotiator */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Info Box */}
          <div className={`p-6 rounded-3xl border shadow-sm ${
            isNight ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200"
          }`}>
            <h1 className="text-xl md:text-2xl font-black mb-2">{item.title}</h1>
            
            <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-slate-400">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">Condition: {item.condition}</span>
              <span>•</span>
              <span className="text-violet-500">Min {item.minDuration} days</span>
            </div>

            <div className="flex items-baseline gap-1 border-t border-b border-slate-100 dark:border-slate-800/80 py-4 mb-4">
              <span className="text-2xl md:text-3xl font-black text-violet-500">₹{item.price}</span>
              <span className="text-xs text-slate-400">/day rental rate</span>
            </div>

            {/* Owner Box */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 mb-5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Listed By Owner</span>
                  <h4 className="font-bold text-xs mt-0.5 flex items-center gap-1.5">
                    {item.owner}
                    {item.ownerVerified && (
                      <span className="text-xs bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-black border border-indigo-500/20">Verified ✓</span>
                    )}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-amber-400 font-extrabold">{item.ownerRating}</span>
                  <p className="text-[9px] text-slate-400 mt-0.5">{item.ownerRentals} successful rentals</p>
                </div>
              </div>
            </div>

            {/* Configuration required duration */}
            <div className="mb-5">
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Duration Required (Days)</label>
              <select 
                value={duration}
                onChange={e => setDuration(+e.target.value)}
                className={`w-full border border-slate-350 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none transition-colors ${
                  isNight ? "bg-slate-950 text-white focus:border-indigo-500" : "bg-white text-slate-800 focus:border-indigo-400"
                }`}
              >
                {Array.from({ length: item.maxDuration - item.minDuration + 1 }).map((_, idx) => {
                  const d = item.minDuration + idx;
                  return (
                    <option key={d} value={d}>{d} Day{d > 1 ? "s" : ""}</option>
                  );
                })}
              </select>
              <span className="block text-[9px] text-slate-500 mt-1">Maximum allowed rental period: {item.maxDuration} days</span>
            </div>

            {/* Request a Rent primary button */}
            <button 
              onClick={handleRequestRent}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs py-4 rounded-2xl shadow-lg shadow-violet-500/10 transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>Request a Rent (${item.price * duration} Total)</span>
            </button>
          </div>

          {/* Negotiator Widget (Are you ok with the price?) */}
          <div className="h-44 relative">
            {!negotiated ? (
              <div className={`absolute inset-0 p-6 rounded-3xl border shadow-sm flex flex-col justify-between transition-all duration-300 ${
                isNight ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200"
              }`}>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">Are you ok with the pricing?</h4>
                  <p className="text-[10px] text-slate-400 mt-1">If the base rate is too high, you can propose a custom offer directly to {item.owner}.</p>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={handleRequestRent}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Yes, Request Rent
                  </button>
                  <button 
                    onClick={() => setNegotiated(true)}
                    className={`flex-1 text-xs font-bold py-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isNight ? "border-slate-800 hover:bg-slate-800 text-slate-300" : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    Negotiate Price
                  </button>
                </div>
              </div>
            ) : (
              <div className={`absolute inset-0 p-6 rounded-3xl border border-indigo-500 bg-indigo-500/5 shadow-lg flex flex-col justify-center items-center text-center animate-fadeIn`}>
                <span className="text-3xl block mb-2">🚀</span>
                <h4 className="font-extrabold text-sm text-indigo-400">Negotiation request has been sent!</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] leading-relaxed">
                  We've successfully broadcasted your negotiation request to {item.owner}. You'll receive a push alert once the new proposal rate is reviewed!
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Floating alert */}
      {requestStatus && (
        <div className="fixed bottom-6 left-6 z-[110] flex items-center gap-3 bg-slate-950 border border-indigo-500/30 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl animate-slide-in">
          <span>{requestStatus}</span>
        </div>
      )}
    </div>
  );
}
