import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");

  // Mock listing catalog data
  const catalog = {
    "camera": {
      emoji: "📷",
      title: "Sony FX3 Cinema Camera Kit",
      price: 450,
      rating: 5,
      owner: "Arjun K.",
      desc: "Full production-ready cinema camera. Includes Sony FX3 body, two 160GB CFexpress cards, 3 batteries, charger, and a sleek carry case. Capture flawless 4K 120fps footage with incredible low-light capability and custom S-Cinetone profile support.",
      specs: [
        "12.1MP Full-Frame Exmor R CMOS Sensor",
        "UHD 4K up to 120p | 10-Bit 4:2:2",
        "S-Cinetone / S-Log3 / HLG dynamic ranges",
        "Compact cage-free body design with standard mounting points",
        "XLR top handle unit with dual full-size inputs"
      ],
      rules: [
        "Refundable deposit required.",
        "Must be returned with clean lenses.",
        "Batteries must be fully charged upon return.",
        "Damage waiver options available at configuration stage."
      ]
    },
    "ps5": {
      emoji: "🎮",
      title: "PlayStation 5 Pro Console",
      price: 350,
      rating: 5,
      owner: "Aman G.",
      desc: "Get the ultimate gaming console experience. Rent the PS5 Pro with two DualSense controllers, charging dock, and pre-installed games (EA FC 26, Spider-Man 2, and Gran Turismo 7). Fits beautifully into party weekends or casual gaming marathons.",
      specs: [
        "Upgraded Pro GPU | Advanced Ray Tracing",
        "2TB High-Speed SSD Storage",
        "Includes two DualSense controllers",
        "Pre-installed blockbuster games included",
        "Dual controller charging dock"
      ],
      rules: [
        "Handle controllers with clean hands.",
        "Do not modify the console firmware or account setup.",
        "Return all cables (HDMI, Power, USB-C Charging).",
        "No drinks or food items allowed near the console."
      ]
    },
    "bike": {
      emoji: "🚴",
      title: "Specialized Carbon Road Bike",
      price: 300,
      rating: 5,
      owner: "Priya S.",
      desc: "Elite carbon fiber road bike designed for speed, lightweight climbing, and smooth gear transitions. Ideal for cycling events, weekend endurance rides, or touring near the city outskirts. Cleaned and tuned professionally before every rental.",
      specs: [
        "FACT 10r Carbon Fiber Frame & Fork",
        "Shimano Ultegra Di2 Electronic Shifting",
        "Hydraulic Disc Brakes for precise stopping",
        "Weight: ~7.8 kg",
        "Includes custom frame bag and patch repair kit"
      ],
      rules: [
        "Renter must bring their own cycling helmet.",
        "Always lock the bike securely when unattended.",
        "Return the bike free of excessive mud and dirt.",
        "Flat tire repair tools provided; return in original pouch."
      ]
    }
  };

  // Find item by ID or default to camera
  const item = catalog[id] || catalog["camera"];

  return (
    <div className={`min-h-screen transition-colors duration-500 py-8 px-4 md:px-8 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Header Area */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center">
        <button 
          onClick={() => navigate("/dashboard")}
          className={`flex items-center gap-2 text-sm font-extrabold px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.05] active:scale-95 ${
            isNight ? "bg-slate-900 border border-slate-800 hover:bg-slate-800" : "bg-white border border-slate-200 hover:bg-slate-100"
          }`}
        >
          ← Back to Discovery
        </button>
        <span className="text-xs bg-violet-500/10 text-violet-500 border border-violet-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
          Verified Listing
        </span>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Product overview, images, specs, owner specs */}
        <div className="lg:col-span-8 space-y-6">
          <div className={`p-8 rounded-3xl border transition-all duration-300 ${
            isNight ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200/60"
          }`}>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className={`w-36 h-36 md:w-44 md:h-44 rounded-2xl flex items-center justify-center text-7xl md:text-8xl shadow-lg shrink-0 ${
                isNight ? "bg-gradient-to-br from-slate-800 to-slate-950" : "bg-gradient-to-br from-indigo-50 to-violet-50"
              }`}>
                {item.emoji}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-2">{item.title}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                  <div className="flex text-amber-400 text-sm">
                    {Array.from({ length: item.rating }).map((_, i) => <span key={i}>★</span>)}
                  </div>
                  <span className="text-xs text-slate-400 font-bold">({item.rating}.0 rating)</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${isNight ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                    Owner: {item.owner}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${isNight ? "text-slate-400" : "text-slate-500"}`}>
                  {item.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Technical Specifications Card */}
          <div className={`p-6 md:p-8 rounded-3xl border ${
            isNight ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200/60"
          }`}>
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <span>📋</span> Package Specifications
            </h3>
            <ul className="space-y-2.5">
              {item.specs.map((spec, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="text-violet-500 mt-1">✔</span>
                  <span className={isNight ? "text-slate-300" : "text-slate-600"}>{spec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Safety & Guidelines Card */}
          <div className={`p-6 md:p-8 rounded-3xl border ${
            isNight ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200/60"
          }`}>
            <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-rose-500">
              <span>⚠️</span> Rental Guidelines & Rules
            </h3>
            <ul className="space-y-2.5">
              {item.rules.map((rule, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="text-rose-500 mt-0.5">•</span>
                  <span className={isNight ? "text-slate-300" : "text-slate-600"}>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Estimator Card */}
        <div className="lg:col-span-4">
          <div className={`sticky top-24 rounded-3xl p-6 border shadow-xl relative overflow-hidden transition-all duration-300 ${
            isNight ? "bg-slate-900 border-slate-800" : "bg-white border-indigo-100"
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />

            <div className="mb-4">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-extrabold">Instant Booking</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-violet-500">${item.price}</span>
                <span className="text-xs text-slate-400">/day</span>
              </div>
            </div>

            {/* Quick Benefits */}
            <div className="space-y-3.5 my-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-sm font-bold shrink-0">🛡️</div>
                <div>
                  <h4 className="text-xs font-black">Trusted Owner</h4>
                  <p className="text-[10px] text-slate-400">Highly rated community profile</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-sm font-bold shrink-0">🕒</div>
                <div>
                  <h4 className="text-xs font-black">Flexible Cancellation</h4>
                  <p className="text-[10px] text-slate-400">Full refund up to 24 hours prior</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm font-bold shrink-0">💰</div>
                <div>
                  <h4 className="text-xs font-black">Refundable Deposit</h4>
                  <p className="text-[10px] text-slate-400">Returned instantly upon safe return</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => navigate(`/rent/configure/${id || "camera"}`)}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-sm py-4 rounded-2xl shadow-lg shadow-violet-500/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-center flex items-center justify-center gap-2 group"
            >
              <span>Rent This Item Now</span>
              <span className="transition-transform group-hover:translate-x-1">➔</span>
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-3">You won't be charged yet in the next steps</p>
          </div>
        </div>

      </div>
    </div>
  );
}
