import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Combined mock product catalog matching LandingPage items
const PRODUCT_CATALOG = {
  "r-1": {
    id: "r-1",
    rowType: "Rent",
    title: "Canon EOS R50 Camera",
    price: 450,
    emoji: "📷",
    owner: "Arjun K.",
    distance: "1.2 km away",
    badge: "Popular 🔥",
    unit: "day",
    desc: "Vibrant and compact mirrorless camera designed for content creators. Capture stunning 24.2 MP photos and uncropped 4K video. Equipped with fast Dual Pixel CMOS AF II, a vari-angle touchscreen, and seamless smartphone connectivity.",
    rating: 4.8,
    ratingsCount: 840,
    ratingDistribution: { "5 star": 78, "4 star": 12, "3 star": 5, "2 star": 2, "1 star": 3 },
    specifications: {
      "Additional details": {
        "Operating System": "Canon Custom OS",
        "Sensor Resolution": "24.2 Megapixels",
        "Processor Series": "DIGIC X",
        "Video Capture": "4K UHD 30p, FHD 120p",
        "Memory Storage Capacity": "Supports SD/SDHC/SDXC UHS-I",
        "Color": "Sleek Black",
        "Connector Type": "USB Type C, Micro HDMI",
        "Form Factor": "Mirrorless",
        "Sim Card Size": "Not Applicable",
        "Water Resistance Level": "Not Water Resistant"
      },
      "Display": {
        "Screen Size": "3.0 Inches",
        "Resolution": "1.04 Million Dots",
        "Refresh Rate": "60 Hz",
        "Display Type": "Vari-angle LCD Touchscreen",
        "Display Resolution Maximum": "1040k Pixels",
        "Display Pixel Density": "340 PPI"
      },
      "Connectivity": {
        "Wireless Provider": "None",
        "Cellular Technology": "None",
        "Connectivity Technology": "Wi-Fi, Bluetooth 4.2",
        "Bluetooth": "Supported"
      },
      "Battery": {
        "Battery Life": "Approx. 370 shots per charge",
        "Battery Type": "Lithium-Ion LP-E17"
      }
    },
    reviews: [
      { id: 1, author: "Rahul Verma", rating: 5, date: "May 12, 2026", title: "Phenomenal starter mirrorless!", verified: true, text: "Extremely easy to carry and use. The auto-focus works like magic on eyes and faces. Highly recommend renting it first to see if you like it!", helpful: 34 },
      { id: 2, author: "Ananya S.", rating: 4, date: "May 20, 2026", title: "Great video quality, average battery", verified: true, text: "The uncropped 4K videos look beautiful. However, if you plan to shoot for long hours, make sure to ask the owner for a spare battery pack.", helpful: 19 }
    ]
  },
  "r-2": {
    id: "r-2",
    rowType: "Rent",
    title: "Honda Activa Scooter",
    price: 250,
    emoji: "🛵",
    owner: "Rahul P.",
    distance: "2.5 km away",
    badge: "Trending",
    unit: "day",
    desc: "Regularly serviced and clean Activa 6G. Ideal for navigating daily commutes and dense city traffic with absolute ease. Features high mileage, combi-braking system, and a comfortable suspension system.",
    rating: 4.6,
    ratingsCount: 650,
    ratingDistribution: { "5 star": 70, "4 star": 18, "3 star": 8, "2 star": 2, "1 star": 2 },
    specifications: {
      "Additional details": {
        "Engine Displacement": "109.51 cc",
        "Max Power": "7.79 PS @ 8000 rpm",
        "Fuel Type": "Petrol",
        "Mileage": "50-55 kmpl",
        "Color": "Pearl Precious White",
        "Brake Type": "Combi Drum Brakes",
        "Form Factor": "Scooter",
        "Water Resistance Level": "Waterproof Body"
      },
      "Display": {
        "Screen Size": "Analog Dashboard",
        "Display Type": "Speedometer & Fuel Gauge"
      },
      "Connectivity": {
        "Connectivity Technology": "None",
        "Bluetooth": "Not Supported"
      },
      "Battery": {
        "Battery Type": "Maintenance Free 12V Battery"
      }
    },
    reviews: [
      { id: 1, author: "Vikram Sen", rating: 5, date: "April 29, 2026", title: "Smooth riding!", verified: true, text: "The scooter was delivered in clean, top mechanical shape. The engine sound was smooth and fuel efficiency was amazing during my Hyderabad exploration.", helpful: 12 }
    ]
  },
  "r-3": {
    id: "r-3",
    rowType: "Rent",
    title: "PlayStation 5 Console",
    price: 350,
    emoji: "🎮",
    owner: "Aman G.",
    distance: "3.1 km away",
    unit: "day",
    desc: "Unleash new gaming possibilities with lightning-fast loading, deeper immersion, and ultra-high-speed SSD. Includes two DualSense controllers and pre-installed blockbuster games.",
    rating: 4.9,
    ratingsCount: 1200,
    ratingDistribution: { "5 star": 91, "4 star": 6, "3 star": 2, "2 star": 0, "1 star": 1 },
    specifications: {
      "Additional details": {
        "Operating System": "PlayStation Custom OS",
        "Processor Series": "AMD Zen 2 8-Core",
        "Graphics Processor": "AMD RDNA 2",
        "Memory Storage Capacity": "825 GB SSD",
        "Color": "White",
        "Connector Type": "HDMI 2.1, USB Type C, USB-A",
        "Form Factor": "Console"
      },
      "Display": {
        "Display Resolution Maximum": "8K UHD, 4K 120Hz",
        "Display Type": "HDMI Output"
      },
      "Connectivity": {
        "Connectivity Technology": "Ethernet, Wi-Fi 6, Bluetooth 5.1",
        "Bluetooth": "Supported"
      }
    },
    reviews: [
      { id: 1, author: "Karan Johar", rating: 5, date: "May 25, 2026", title: "Best party weekend setup", verified: true, text: "Rented this for a FIFA tournament weekend with friends. Outstanding condition, controllers were clean, and preloaded games saved me hours of download time.", helpful: 45 }
    ]
  },
  "r-4": {
    id: "r-4",
    rowType: "Rent",
    title: "DeWalt Power Drill Set",
    price: 120,
    emoji: "🔧",
    owner: "Suresh B.",
    distance: "0.8 km away",
    unit: "day",
    desc: "Cordless drill set featuring a high-torque motor and variable speed controls. Includes 20V battery, charger, and dynamic drive bits for various drilling chores.",
    rating: 4.5,
    ratingsCount: 180,
    ratingDistribution: { "5 star": 65, "4 star": 20, "3 star": 10, "2 star": 3, "1 star": 2 },
    specifications: {
      "Additional details": {
        "Chuck Size": "1/2 inch keyless",
        "Voltage": "20V MAX",
        "Processor Series": "Brushless Motor",
        "Color": "Yellow & Black",
        "Form Factor": "Handheld Drill",
        "Water Resistance Level": "Dust Resistant"
      },
      "Battery": {
        "Battery Type": "Lithium-Ion 2.0Ah",
        "Battery Life": "Approx. 2-3 hours active drilling"
      }
    },
    reviews: [
      { id: 1, author: "Amit K.", rating: 5, date: "March 15, 2026", title: "Heavy duty and robust", verified: true, text: "Extremely useful for setting up furniture. High torque and battery lasted long. Great value for short-term home repairs.", helpful: 8 }
    ]
  },
  "l-1": {
    id: "l-1",
    rowType: "Rent",
    title: "Specialized Carbon Road Bike",
    price: 600,
    emoji: "🚴",
    owner: "Varun Tej (You)",
    distance: "0.0 km away",
    badge: "Active",
    unit: "day",
    desc: "Ultralight carbon fiber road bike built for ultimate performance and velocity. Includes electronic shifting gears and dual safety disc brakes.",
    rating: 4.8,
    ratingsCount: 92,
    ratingDistribution: { "5 star": 82, "4 star": 10, "3 star": 4, "2 star": 2, "1 star": 2 },
    specifications: {
      "Additional details": {
        "Frame Material": "FACT 10r Carbon Fiber",
        "Shifting Gear Type": "Shimano Ultegra Di2 Electronic",
        "Brake Type": "Hydraulic Disc Brakes",
        "Color": "Gloss Carbon/Chrome",
        "Weight": "7.8 kg"
      }
    },
    reviews: [
      { id: 1, author: "Pavan Kalyan", rating: 5, date: "May 10, 2026", title: "Super lightweight, flies on road!", verified: true, text: "Excellent frame and electronic gear transitions are smooth as butter. Absolutely clean and well-maintained bike.", helpful: 14 }
    ]
  },
  "l-2": {
    id: "l-2",
    rowType: "Rent",
    title: "MacBook Pro 14\" M3 Max",
    price: 800,
    emoji: "💻",
    owner: "Varun Tej (You)",
    distance: "0.0 km away",
    badge: "Pending Deal",
    unit: "day",
    desc: "Unprecedented performance laptop featuring a 14-core CPU, 30-core GPU, and gorgeous Liquid Retina XDR screen display. Excellent for editing, rendering, and training AI models on the go.",
    rating: 4.9,
    ratingsCount: 380,
    ratingDistribution: { "5 star": 94, "4 star": 4, "3 star": 1, "2 star": 1, "1 star": 0 },
    specifications: {
      "Additional details": {
        "Operating System": "macOS Sonoma",
        "RAM Memory Installed": "36 GB Unified Memory",
        "Processor Series": "Apple M3 Max",
        "Memory Storage Capacity": "1 TB SSD",
        "Color": "Space Black",
        "Connector Type": "Thunderbolt 4, MagSafe 3, HDMI"
      },
      "Display": {
        "Screen Size": "14.2 Inches",
        "Resolution": "3024 x 1964",
        "Refresh Rate": "ProMotion 120 Hz",
        "Display Type": "Liquid Retina XDR",
        "Display Resolution Maximum": "3024x1964 Pixels",
        "Display Pixel Density": "254 PPI"
      }
    },
    reviews: [
      { id: 1, author: "Sai Dharam", rating: 5, date: "April 18, 2026", title: "Incredible rendering speeds", verified: true, text: "Rented this to compile complex machine learning pipelines during travel. The compiling speeds are outstanding and thermal management is silent.", helpful: 29 }
    ]
  },
  "s-1": {
    id: "s-1",
    rowType: "Second-Hand",
    title: "DJI Mavic Air 2 Drone",
    price: 45000,
    emoji: "🚁",
    owner: "Ravi M.",
    distance: "4.2 km away",
    badge: "Direct Sale",
    unit: "flat",
    desc: "Compact aerial photography drone in mint condition. Shoots amazing 48MP photos, 4K 60fps video, and features up to 34 minutes of battery flying time per charge.",
    rating: 4.7,
    ratingsCount: 420,
    ratingDistribution: { "5 star": 79, "4 star": 13, "3 star": 5, "2 star": 2, "1 star": 1 },
    specifications: {
      "Additional details": {
        "Sensor Resolution": "48 Megapixels",
        "Video Capture": "4K Ultra HD @ 60fps",
        "Max Flying Time": "34 Minutes per battery",
        "Weight": "570 grams",
        "Color": "Mineral Gray",
        "Connector Type": "USB-C, Lightning"
      },
      "Connectivity": {
        "Connectivity Technology": "OcuSync 2.0 (2.4/5.8GHz)",
        "Max Range": "10 km"
      }
    },
    reviews: [
      { id: 1, author: "Harsha V.", rating: 5, date: "February 20, 2026", title: "Flawless condition, very reliable", verified: true, text: "Flies stable even under strong wind conditions. Very satisfied with the seller's transparency. Recommended!", helpful: 11 }
    ]
  },
  "s-2": {
    id: "s-2",
    rowType: "Second-Hand",
    title: "Bose Noise Cancelling Headphones",
    price: 14500,
    emoji: "🎧",
    owner: "Kiran T.",
    distance: "2.1 km away",
    unit: "flat",
    desc: "Premium noise cancelling headphones providing premium sound with adjustable NC settings. Features soft cushions and lightweight design.",
    rating: 4.8,
    ratingsCount: 910,
    ratingDistribution: { "5 star": 84, "4 star": 9, "3 star": 4, "2 star": 2, "1 star": 1 },
    specifications: {
      "Additional details": {
        "Color": "Triple Black",
        "Form Factor": "Over Ear",
        "Connector Type": "USB-C, 3.5mm Jack"
      },
      "Connectivity": {
        "Connectivity Technology": "Bluetooth 5.0",
        "Bluetooth": "Supported"
      },
      "Battery": {
        "Battery Life": "Up to 20 Hours per charge"
      }
    },
    reviews: [
      { id: 1, author: "Swetha M.", rating: 5, date: "May 03, 2026", title: "Best active noise cancellation", verified: true, text: "Completely cuts off surrounding office noise. Sound profile is warm and bass is punchy. Cushion cups are soft.", helpful: 22 }
    ]
  },
  "w-1": {
    id: "w-1",
    rowType: "Wishlist",
    title: "2-Person Camping Tent",
    price: 150,
    emoji: "⛺",
    owner: "Meera N.",
    distance: "1.9 km away",
    badge: "High Priority",
    unit: "day",
    desc: "Durable dome camping tent featuring quick installation mechanism and water-proof fabric overlays. Spacious interior for two persons.",
    rating: 4.5,
    ratingsCount: 75,
    ratingDistribution: { "5 star": 68, "4 star": 17, "3 star": 8, "2 star": 4, "1 star": 3 },
    specifications: {
      "Additional details": {
        "Capacity": "2 Persons",
        "Color": "Forest Green",
        "Water Resistance Level": "Waterproof 2000mm rating",
        "Form Factor": "Dome Tent"
      }
    },
    reviews: [
      { id: 1, author: "Ganesh P.", rating: 5, date: "January 14, 2026", title: "Keeps dry and easy to pack", verified: true, text: "Rented this for a trek in Ananthagiri Hills. Very easy setup and kept us completely dry during overnight light rain.", helpful: 6 }
    ]
  },
  "w-2": {
    id: "w-2",
    rowType: "Wishlist",
    title: "Fender Stratocaster Guitar",
    price: 200,
    emoji: "🎸",
    owner: "Kiran T.",
    distance: "3.5 km away",
    unit: "day",
    desc: "Iconic electric guitar delivering classic Fender chime and versatility. Features three single-coil pickups, synchronized tremolo, and comfortable C-shape neck.",
    rating: 4.9,
    ratingsCount: 220,
    ratingDistribution: { "5 star": 90, "4 star": 7, "3 star": 2, "2 star": 1, "1 star": 0 },
    specifications: {
      "Additional details": {
        "Form Factor": "Electric Guitar",
        "Color": "Sunburst",
        "Connector Type": "1/4\" Mono Instrument Jack"
      }
    },
    reviews: [
      { id: 1, author: "Siddharth B.", rating: 5, date: "May 18, 2026", title: "Perfect chime, pristine neck", verified: true, text: "Fretboard and setup is fantastic. Crisp sound. Highly satisfying instrument to jam with.", helpful: 15 }
    ]
  }
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");

  const [duration, setDuration] = useState(3);
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState("Product information"); // Breadcrumb tabs

  // Resolve item or default to camera
  const item = PRODUCT_CATALOG[id] || PRODUCT_CATALOG["r-1"];

  const handleAction = () => {
    if (item.rowType === "Second-Hand") {
      setToastMessage(`Purchase request for ${item.title} submitted! Amount: ₹${item.price} checkout pending.`);
    } else if (item.rowType === "Wishlist") {
      setToastMessage(`Offer to fulfill request for "${item.title}" sent to ${item.owner}!`);
    } else {
      setToastMessage(`Rent request submitted for ${duration} days! Total: ₹${item.price * duration}`);
    }
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const [helpfulCounts, setHelpfulCounts] = useState({});
  const handleHelpfulClick = (revId) => {
    setHelpfulCounts(prev => ({
      ...prev,
      [revId]: (prev[revId] || 0) + 1
    }));
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 py-8 px-4 md:px-8 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`} style={{ fontFamily: "'Nunito', 'Poppins', sans-serif" }}>
      
      {/* Navigation Breadcrumbs / Anchors */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button 
          onClick={() => navigate("/dashboard")}
          className={`flex items-center gap-2 text-sm font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            isNight ? "bg-slate-900 border border-slate-800 hover:bg-slate-800" : "bg-white border border-slate-200 hover:bg-slate-100"
          }`}
        >
          ← Back to Home
        </button>
        <div className="flex gap-4 md:gap-8 text-xs font-black uppercase tracking-wider text-slate-400">
          {["Top", "Product information", "Reviews"].map(tab => (
            <button 
              key={tab} 
              onClick={() => {
                setActiveTab(tab);
                const el = document.getElementById(tab);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`hover:text-indigo-500 cursor-pointer transition-colors pb-2 ${activeTab === tab ? "text-indigo-500 border-b-2 border-indigo-500" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main product display section */}
      <div id="Top" className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Left column: Visual display and description */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`p-8 rounded-3xl border text-center transition-all ${
            isNight ? "bg-slate-900/60 border-slate-850" : "bg-white border-slate-200/60 shadow-sm"
          }`}>
            <div className={`w-48 h-48 md:w-64 md:h-64 mx-auto rounded-3xl flex items-center justify-center text-[110px] shadow-md ${
              isNight ? "bg-gradient-to-br from-slate-800 to-slate-950" : "bg-gradient-to-br from-indigo-50 to-violet-50"
            }`}>
              {item.emoji}
            </div>
            {item.badge && (
              <span className="inline-block mt-4 text-[10px] bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-widest">
                {item.badge}
              </span>
            )}
          </div>

          <div className={`p-6 md:p-8 rounded-3xl border ${
            isNight ? "bg-slate-900/60 border-slate-850" : "bg-white border-slate-200/60 shadow-sm"
          }`}>
            <h3 className="font-extrabold text-base mb-3">About this item</h3>
            <p className="text-sm text-slate-450 leading-relaxed">{item.desc}</p>
          </div>
        </div>

        {/* Right column: E-commerce actions & checkout details */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`p-6 rounded-3xl border shadow-sm ${
            isNight ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200"
          }`}>
            <h1 className="text-xl md:text-2xl font-black mb-3">{item.title}</h1>
            
            <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-slate-400">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">Owner: {item.owner}</span>
              <span>•</span>
              <span className="text-indigo-400">{item.distance}</span>
            </div>

            <div className="flex items-baseline gap-1 border-t border-b border-slate-100 dark:border-slate-850 py-4 mb-5">
              <span className="text-2xl md:text-3xl font-black text-indigo-500">₹{item.price}</span>
              <span className="text-xs text-slate-400">/{item.unit || "day"}</span>
            </div>

            {/* Config options based on listing type */}
            {item.rowType === "Rent" && (
              <div className="mb-5">
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Duration Required (Days)</label>
                <select 
                  value={duration}
                  onChange={e => setDuration(+e.target.value)}
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none transition-colors ${
                    isNight ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-200 text-slate-800 focus:border-indigo-400"
                  }`}
                >
                  {[1, 2, 3, 5, 7, 10, 14, 30].map(d => (
                    <option key={d} value={d}>{d} Day{d > 1 ? "s" : ""}</option>
                  ))}
                </select>
              </div>
            )}

            <button 
              onClick={handleAction}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-extrabold text-xs py-4 rounded-2xl shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
            >
              {item.rowType === "Second-Hand" ? (
                <span>Buy Out Now (₹{item.price})</span>
              ) : item.rowType === "Wishlist" ? (
                <span>Offer Fulfill Request</span>
              ) : (
                <span>Request for Rent (₹{item.price * duration} Total)</span>
              )}
            </button>
          </div>

          {/* Quick Features box */}
          <div className={`p-6 rounded-3xl border ${
            isNight ? "bg-slate-900 border-slate-850" : "bg-white border-slate-205"
          }`}>
            <div className="space-y-4">
              <div className="flex gap-3 items-center">
                <span className="text-xl">🛡️</span>
                <div>
                  <h4 className="text-xs font-black">Escrow Guarantee</h4>
                  <p className="text-[10px] text-slate-400">Payment held safely until delivery is complete.</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <span className="text-xl">👥</span>
                <div>
                  <h4 className="text-xs font-black">Verified Lenders</h4>
                  <p className="text-[10px] text-slate-400">Every community owner goes through AI-assisted KYC verification.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Product Information Specs Section */}
      <div id="Product information" className="max-w-6xl mx-auto mb-12">
        <h2 className="text-xl md:text-2xl font-black mb-6 tracking-tight border-b dark:border-slate-850 pb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          Product information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left spec group */}
          <div className={`p-6 rounded-3xl border space-y-4 ${
            isNight ? "bg-slate-900/60 border-slate-850" : "bg-white border-slate-100"
          }`}>
            <h3 className="font-extrabold text-sm text-indigo-400 uppercase tracking-wider mb-2">Additional details</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
              {Object.entries(item.specifications?.["Additional details"] || {
                "Operating System": "Proprietary",
                "Color": "Standard",
                "Form Factor": "Hardware"
              }).map(([key, val]) => (
                <div key={key} className="py-2.5 flex justify-between gap-4">
                  <span className="font-semibold text-slate-400">{key}</span>
                  <span className="font-bold text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right spec group */}
          <div className="space-y-6">
            
            {/* Display specifications */}
            <div className={`p-6 rounded-3xl border space-y-4 ${
              isNight ? "bg-slate-900/60 border-slate-850" : "bg-white border-slate-100"
            }`}>
              <h3 className="font-extrabold text-sm text-indigo-400 uppercase tracking-wider mb-2">Display Details</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {Object.entries(item.specifications?.["Display"] || {
                  "Display Type": "Standard Output Panel"
                }).map(([key, val]) => (
                  <div key={key} className="py-2.5 flex justify-between gap-4">
                    <span className="font-semibold text-slate-400">{key}</span>
                    <span className="font-bold text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Connectivity specifications */}
            <div className={`p-6 rounded-3xl border space-y-4 ${
              isNight ? "bg-slate-900/60 border-slate-850" : "bg-white border-slate-100"
            }`}>
              <h3 className="font-extrabold text-sm text-indigo-400 uppercase tracking-wider mb-2">Connectivity</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {Object.entries(item.specifications?.["Connectivity"] || {
                  "Connectivity Technology": "Wi-Fi, Bluetooth"
                }).map(([key, val]) => (
                  <div key={key} className="py-2.5 flex justify-between gap-4">
                    <span className="font-semibold text-slate-400">{key}</span>
                    <span className="font-bold text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Customer Reviews Section */}
      <div id="Reviews" className="max-w-6xl mx-auto">
        <h2 className="text-xl md:text-2xl font-black mb-8 tracking-tight border-b dark:border-slate-850 pb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          Customer reviews
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Rating overview side column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-amber-400 text-3xl">★ ★ ★ ★ ☆</span>
              <span className="text-xl font-extrabold">{item.rating} out of 5</span>
            </div>
            <p className="text-xs text-slate-400 font-semibold">{item.ratingsCount.toLocaleString()} global ratings</p>

            {/* Distribution bars */}
            <div className="space-y-2 mt-4">
              {Object.entries(item.ratingDistribution || {
                "5 star": 70, "4 star": 20, "3 star": 5, "2 star": 3, "1 star": 2
              }).map(([star, pct]) => (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="w-12 text-slate-400 font-bold hover:underline cursor-pointer">{star}</span>
                  <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-800 rounded overflow-hidden">
                    <div className="h-full bg-orange-500 rounded" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="w-8 text-slate-400 text-right font-bold">{pct}%</span>
                </div>
              ))}
            </div>

            {/* Review writing box */}
            <div className={`p-5 rounded-3xl border mt-6 ${
              isNight ? "bg-slate-900/60 border-slate-850" : "bg-white border-slate-200"
            }`}>
              <h4 className="font-extrabold text-sm mb-1">Review this product</h4>
              <p className="text-[10px] text-slate-450 mb-4">Share your thoughts with other community members</p>
              <button 
                onClick={() => triggerToast("Review submission is mock-activated!")}
                className={`w-full py-2.5 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                  isNight ? "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900" : "bg-white border-slate-200 text-slate-750 hover:bg-slate-50"
                }`}
              >
                Write a customer review
              </button>
            </div>
          </div>

          {/* Detailed reviews and filters */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* AI Customers Say summary card */}
            <div className={`p-6 rounded-3xl border border-indigo-500/20 ${
              isNight ? "bg-slate-900/40" : "bg-indigo-50/20"
            }`}>
              <h3 className="font-extrabold text-sm text-indigo-400 mb-2 flex items-center gap-1.5">
                <span>🤖</span> AI, Generated from the text of customer reviews
              </h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Customers report that the <span className="font-extrabold text-indigo-400">{item.title}</span> works perfectly and arrives in excellent cosmetic shape. Lenders are highly responsive, and transaction workflows are secure. Some users note that accessories or battery backups should be requested beforehand for extended production or riding sessions.
              </p>
            </div>

            {/* Filter pills */}
            <div>
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Select to learn more</h4>
              <div className="flex flex-wrap gap-2">
                {["Battery life", "Condition", "Value for money", "Appearance", "Lender communication", "Verifiability"].map(pill => (
                  <button 
                    key={pill} 
                    onClick={() => triggerToast(`Filtering reviews by "${pill}" (demo only)`)}
                    className={`text-[10px] font-black px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      isNight ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white" : "bg-white border-slate-200 text-slate-650 hover:border-slate-300"
                    }`}
                  >
                    🚀 {pill}
                  </button>
                ))}
              </div>
            </div>

            {/* Reviewer detail feeds */}
            <div className="space-y-6">
              {item.reviews?.map(rev => (
                <div key={rev.id} className="border-b dark:border-slate-850 pb-6 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-slate-400 flex items-center justify-center text-[10px] text-white font-bold">
                      {rev.author[0]}
                    </div>
                    <span className="text-xs font-bold">{rev.author}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-400 text-xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < rev.rating ? "★" : "☆"}</span>
                      ))}
                    </span>
                    <span className="text-xs font-extrabold">{rev.title}</span>
                  </div>

                  <p className="text-[10px] text-slate-400 mb-2">Reviewed on {rev.date} • <span className="text-orange-500 font-extrabold">Verified Rental</span></p>

                  <p className="text-xs text-slate-450 leading-relaxed mb-4">{rev.text}</p>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleHelpfulClick(rev.id)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                        isNight ? "bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white" : "bg-white border-slate-200 text-slate-650 hover:bg-slate-100"
                      }`}
                    >
                      Helpful
                    </button>
                    <span className="text-[10px] text-slate-400">
                      {rev.helpful + (helpfulCounts[rev.id] || 0)} people found this helpful
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-[120] flex items-center gap-3 bg-slate-950 border border-indigo-500/30 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl animate-slide-in">
          <span className="text-indigo-400 font-black">🔔 Alert:</span>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage("")} className="ml-3 text-slate-400 hover:text-white font-extrabold cursor-pointer">✕</button>
        </div>
      )}

    </div>
  );
}
