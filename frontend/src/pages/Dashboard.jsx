import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CityStreetScene } from "../components/CityStreetScene";
import API from "../api"; // Adjust this path based on where your axios instance is
import { STORAGE_KEYS } from "../constants/auth";

// ── Cartoon SVG Characters ──────────────────────────────────────────────────
const CartoonVerify = () => (
  <svg viewBox="0 0 120 130" className="w-24 h-24 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="115" rx="28" ry="6" fill="#e0e7ff" opacity="0.5"/>
    <rect x="30" y="75" width="60" height="42" rx="8" fill="#6366f1"/>
    <rect x="36" y="81" width="48" height="30" rx="5" fill="#818cf8"/>
    <rect x="40" y="86" width="20" height="3" rx="2" fill="white" opacity="0.7"/>
    <rect x="40" y="92" width="14" height="3" rx="2" fill="white" opacity="0.5"/>
    <rect x="40" y="98" width="17" height="3" rx="2" fill="white" opacity="0.5"/>
    <circle cx="75" cy="94" r="10" fill="#a5b4fc"/>
    <circle cx="75" cy="94" r="7" fill="#e0e7ff"/>
    <text x="70" y="98" fontSize="9" fill="#6366f1" fontWeight="bold">ID</text>
    <circle cx="60" cy="44" r="22" fill="#fde68a"/>
    <circle cx="52" cy="40" r="3" fill="#1e1b4b"/>
    <circle cx="68" cy="40" r="3" fill="#1e1b4b"/>
    <path d="M52 52 Q60 58 68 52" stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <ellipse cx="40" cy="44" rx="5" ry="8" fill="#fde68a"/>
    <ellipse cx="80" cy="44" rx="5" ry="8" fill="#fde68a"/>
    <path d="M44 18 Q60 8 76 18" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <circle cx="88" cy="88" r="10" fill="#22c55e"/>
    <text x="83" y="93" fontSize="12" fill="white" fontWeight="bold">✓</text>
  </svg>
);

const CartoonPost = () => (
  <svg viewBox="0 0 120 130" className="w-24 h-24 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="118" rx="28" ry="5" fill="#d1fae5" opacity="0.5"/>
    <rect x="25" y="55" width="70" height="60" rx="10" fill="#10b981"/>
    <rect x="31" y="61" width="58" height="48" rx="7" fill="#34d399"/>
    <rect x="37" y="68" width="30" height="4" rx="2" fill="white"/>
    <rect x="37" y="76" width="22" height="3" rx="2" fill="white" opacity="0.7"/>
    <rect x="37" y="83" width="25" height="3" rx="2" fill="white" opacity="0.7"/>
    <rect x="37" y="90" width="18" height="3" rx="2" fill="white" opacity="0.5"/>
    <rect x="72" y="97" width="12" height="6" rx="3" fill="#059669"/>
    <text x="74" y="102" fontSize="6" fill="white" fontWeight="bold">$$$</text>
    <circle cx="60" cy="35" r="20" fill="#bfdbfe"/>
    <circle cx="52" cy="31" r="2.5" fill="#1e3a5f"/>
    <circle cx="68" cy="31" r="2.5" fill="#1e3a5f"/>
    <path d="M53 41 Q60 46 67 41" stroke="#1e3a5f" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <ellipse cx="42" cy="35" rx="4" ry="6" fill="#bfdbfe"/>
    <ellipse cx="78" cy="35" rx="4" ry="6" fill="#bfdbfe"/>
    <path d="M50 18 Q60 10 70 18" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <rect x="75" y="44" width="18" height="22" rx="4" fill="#f59e0b" transform="rotate(15 75 44)"/>
    <text x="76" y="56" fontSize="9" fill="white" fontWeight="bold" transform="rotate(15 76 56)">📦</text>
  </svg>
);

const CartoonNegotiate = () => (
  <svg viewBox="0 0 140 130" className="w-28 h-24 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="38" cy="38" r="20" fill="#fca5a5"/>
    <circle cx="31" cy="34" r="2.5" fill="#7f1d1d"/>
    <circle cx="45" cy="34" r="2.5" fill="#7f1d1d"/>
    <path d="M32 44 Q38 50 44 44" stroke="#7f1d1d" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <ellipse cx="20" cy="38" rx="4" ry="6" fill="#fca5a5"/>
    <ellipse cx="56" cy="38" rx="4" ry="6" fill="#fca5a5"/>
    <rect x="12" y="58" width="52" height="40" rx="9" fill="#ef4444"/>
    <rect x="18" y="64" width="40" height="28" rx="6" fill="#fca5a5"/>
    <circle cx="102" cy="38" r="20" fill="#6ee7b7"/>
    <circle cx="95" cy="34" r="2.5" fill="#064e3b"/>
    <circle cx="109" cy="34" r="2.5" fill="#064e3b"/>
    <path d="M96 44 Q102 50 108 44" stroke="#064e3b" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <ellipse cx="84" cy="38" rx="4" ry="6" fill="#6ee7b7"/>
    <ellipse cx="120" cy="38" rx="4" ry="6" fill="#6ee7b7"/>
    <rect x="76" y="58" width="52" height="40" rx="9" fill="#10b981"/>
    <rect x="82" y="64" width="40" height="28" rx="6" fill="#6ee7b7"/>
    <rect x="55" y="72" width="30" height="16" rx="8" fill="#f59e0b"/>
    <text x="60" y="83" fontSize="9" fill="white" fontWeight="bold">DEAL!</text>
    <path d="M65 58 L70 72" stroke="#f59e0b" strokeWidth="2"/>
    <path d="M75 58 L70 72" stroke="#f59e0b" strokeWidth="2"/>
  </svg>
);

const CartoonDeal = () => (
  <svg viewBox="0 0 120 130" className="w-24 h-24 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="38" r="22" fill="#c4b5fd"/>
    <circle cx="52" cy="33" r="3" fill="#2e1065"/>
    <circle cx="68" cy="33" r="3" fill="#2e1065"/>
    <path d="M51 45 Q60 54 69 45" stroke="#2e1065" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <ellipse cx="40" cy="38" rx="5" ry="7" fill="#c4b5fd"/>
    <ellipse cx="80" cy="38" rx="5" ry="7" fill="#c4b5fd"/>
    <path d="M46 16 Q60 6 74 16" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <rect x="28" y="60" width="64" height="50" rx="10" fill="#7c3aed"/>
    <rect x="34" y="66" width="52" height="38" rx="7" fill="#a78bfa"/>
    <rect x="40" y="73" width="24" height="4" rx="2" fill="white"/>
    <rect x="40" y="81" width="35" height="3" rx="2" fill="white" opacity="0.7"/>
    <circle cx="82" cy="82" r="10" fill="#fbbf24"/>
    <text x="78" y="86" fontSize="11" fill="white" fontWeight="bold">🤝</text>
    <circle cx="28" cy="32" r="8" fill="#fef08a"/>
    <text x="24" y="36" fontSize="10">⭐</text>
    <circle cx="92" cy="32" r="8" fill="#fef08a"/>
    <text x="88" y="36" fontSize="10">⭐</text>
  </svg>
);


// ── Floating particles ──────────────────────────────────────────────────────
const Particle = ({ style }) => (
  <div className="absolute rounded-full pointer-events-none opacity-20 animate-float" style={style} />
);

// ── Product Card ────────────────────────────────────────────────────────────
const ProductCard = ({ emoji, title, price, rating, owner, badge, isNight }) => (
  <div className={`group relative rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border ${isNight ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"} hover:-translate-y-2 cursor-pointer`}>
    {badge && (
      <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
        {badge}
      </div>
    )}
    <div className={`h-40 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300 ${isNight ? "bg-gradient-to-br from-slate-800 to-slate-950" : "bg-gradient-to-br from-indigo-50 to-violet-50"}`}>
      {emoji}
    </div>
    <div className="p-4">
      <h3 className={`font-bold text-sm mb-1 truncate ${isNight ? "text-slate-100" : "text-slate-800"}`}>{title}</h3>
      <div className="flex items-center gap-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`text-xs ${i < rating ? "text-amber-400" : "text-slate-200"}`}>★</span>
        ))}
        <span className="text-xs text-slate-400 ml-1">({rating}.0)</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-indigo-400 font-bold text-lg">₹{price}<span className="text-xs text-slate-400 font-normal">/day</span></span>
        <span className={`text-xs px-2 py-1 rounded-full ${isNight ? "text-slate-300 bg-slate-800" : "text-slate-500 bg-slate-50"}`}>{owner}</span>
      </div>
      <button className="mt-3 w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm py-2 rounded-xl font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all duration-200 active:scale-95 cursor-pointer">
        Request to Rent
      </button>
    </div>
  </div>
);

// ── How It Works Card ───────────────────────────────────────────────────────
const HowCard = ({ cartoon, step, title, desc, color, isNight }) => (
  <div className={`relative rounded-3xl p-6 shadow-lg border-2 ${color} hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group ${isNight ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}>
    <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
      {step}
    </div>
    <div className="mb-4 group-hover:scale-105 transition-transform duration-300">{cartoon}</div>
    <h3 className={`font-black text-lg mb-2 text-center ${isNight ? "text-slate-100" : "text-slate-800"}`}>{title}</h3>
    <p className={`text-sm text-center leading-relaxed ${isNight ? "text-slate-400" : "text-slate-500"}`}>{desc}</p>
  </div>
);

// ── Trust Badge ─────────────────────────────────────────────────────────────
const TrustBadge = ({ icon, label, isNight }) => (
  <div className={`flex items-center gap-2 backdrop-blur px-4 py-2 rounded-full shadow-sm text-sm font-semibold ${isNight ? "bg-slate-900/80 border border-slate-800 text-slate-200" : "bg-white/80 border border-indigo-100 text-slate-700"}`}>
    <span className="text-lg">{icon}</span> {label}
  </div>
);

// ── Chat Message ────────────────────────────────────────────────────────────
const ChatMsg = ({ from, text, isNight }) => (
  <div className={`flex ${from === "bot" ? "justify-start" : "justify-end"} mb-2`}>
    {from === "bot" && <span className="text-xl mr-2">🤖</span>}
    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${from === "bot" ? (isNight ? "bg-slate-800 text-slate-100 rounded-tl-none" : "bg-indigo-50 text-slate-700 rounded-tl-none") : "bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-tr-none"}`}>
      {text}
    </div>
  </div>
);

// ── Main Component ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hey there! 👋 I'm RentBot. Ask me anything about renting, posting items, or how to negotiate deals!" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");
  const [searchVal, setSearchVal] = useState("");
  const [priceFilter, setPriceFilter] = useState(500);
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // Dynamic States
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isNight, setIsNight] = useState(() => localStorage.getItem("theme") === "night");
  const [itemsCount, setItemsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const toggleTheme = () => {
    setIsNight(prev => {
      const next = !prev;
      localStorage.setItem("theme", next ? "night" : "day");
      return next;
    });
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handlePostItemClick = (e) => {
    e.preventDefault();
    setActiveTab("request");
    setMobileMenu(false);
    setTimeout(() => {
      scrollToSection("browse-section");
    }, 100);
  };

  const handleTiltMove = (e) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    const rx = -(y / box.height) * 15;
    const ry = (x / box.width) * 15;
    setTilt({ rx, ry });
  };

  const handleTiltLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const isLoggedIn = !!token;

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    navigate("/dashboard");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Stat counting animation on load
  useEffect(() => {
    let start = 0;
    const endItems = 50000;
    const endUsers = 120000;
    const duration = 1500; // 1.5 seconds
    const stepTime = 30;
    const steps = duration / stepTime;
    const itemInc = endItems / steps;
    const userInc = endUsers / steps;

    const timer = setInterval(() => {
      start += 1;
      if (start >= steps) {
        setItemsCount(endItems);
        setUsersCount(endUsers);
        clearInterval(timer);
      } else {
        setItemsCount(Math.floor(start * itemInc));
        setUsersCount(Math.floor(start * userInc));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, []);

  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    // 1. Add User Message to UI
    const userMsg = { from: "user", text: chatInput };
    setMessages(p => [...p, userMsg]);
    setChatInput("");
    setIsTyping(true);

    try {
      // 2. Call your Backend AI route
      const response = await API.post("/ai/chat", {
        message: chatInput,
        context: "The user is currently on the main Dashboard. They are looking at rental products like cameras, scooters, and gaming consoles in Hyderabad."
      });

      // 3. Add AI Response to UI
      setMessages(p => [...p, { from: "bot", text: response.data.reply }]);
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages(p => [...p, { from: "bot", text: "Sorry, I'm having trouble connecting to my brain right now! 🧠🔌" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const products = [
    { emoji: "📷", title: "Canon EOS R50 Camera", price: "450", rating: 5, owner: "Arjun K.", badge: "Hot 🔥" },
    { emoji: "🛺", title: "Auto Rickshaw (Half Day)", price: "300", rating: 4, owner: "Ravi M." },
    { emoji: "💻", title: "MacBook Pro 14\" M3", price: "800", rating: 5, owner: "Priya S.", badge: "New ✨" },
    { emoji: "🎸", title: "Fender Stratocaster Guitar", price: "200", rating: 4, owner: "Kiran T." },
    { emoji: "⛺", title: "2-Person Camping Tent", price: "150", rating: 5, owner: "Meera N." },
    { emoji: "🛵", title: "Honda Activa Scooter", price: "250", rating: 4, owner: "Rahul P.", badge: "Popular" },
    { emoji: "🎮", title: "PlayStation 5 Console", price: "350", rating: 5, owner: "Aman G." },
    { emoji: "🔧", title: "DeWalt Power Drill Set", price: "120", rating: 4, owner: "Suresh B." },
  ];

  const filtered = products.filter(p =>
    (p.title.toLowerCase().includes(searchVal.toLowerCase())) &&
    parseInt(p.price) <= priceFilter
  );

  const particles = [
    { width: 8, height: 8, background: "#818cf8", top: "10%", left: "5%", animationDuration: "6s" },
    { width: 12, height: 12, background: "#f59e0b", top: "25%", left: "90%", animationDuration: "8s" },
    { width: 6, height: 6, background: "#34d399", top: "60%", left: "3%", animationDuration: "7s" },
    { width: 10, height: 10, background: "#f472b6", top: "80%", left: "85%", animationDuration: "5s" },
    { width: 7, height: 7, background: "#60a5fa", top: "45%", left: "95%", animationDuration: "9s" },
  ];

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden transition-colors duration-500 ${isNight ? "bg-slate-950" : "bg-slate-50"}`} style={{ fontFamily: "'Nunito', 'Poppins', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes chatPop {
          0% { transform: scale(0.5) translateY(40px); opacity: 0; }
          80% { transform: scale(1.05) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-60px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(60px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-float { animation: float var(--dur, 6s) ease-in-out infinite; }
        .chat-pop { animation: chatPop 0.4s cubic-bezier(.34,1.56,.64,1) forwards; }
        .slide-left { animation: slideInLeft 0.7s ease forwards; }
        .slide-right { animation: slideInRight 0.7s ease forwards; }
        .fade-up { animation: fadeUp 0.7s ease forwards; }
        .marquee-inner { animation: marquee 22s linear infinite; }
        .dot-bounce:nth-child(1) { animation: bounce 1s ease-in-out infinite; }
        .dot-bounce:nth-child(2) { animation: bounce 1s ease-in-out 0.2s infinite; }
        .dot-bounce:nth-child(3) { animation: bounce 1s ease-in-out 0.4s infinite; }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .hero-blob {
          background: radial-gradient(ellipse at 60% 40%, #c7d2fe 0%, #ddd6fe 40%, transparent 70%);
        }
      `}</style>

      {/* ── CHATGPT-STYLE SIDE PANEL ── */}
      {/* Overlay Backdrop */}
      {sidePanelOpen && (
        <div 
          onClick={() => { setSidePanelOpen(false); setProfileMenuOpen(false); }}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        ></div>
      )}

      {/* Side Panel Container */}
      <div 
        className={`fixed top-0 left-0 h-full w-[300px] z-50 bg-slate-950 border-r border-slate-900 shadow-[24px_0_48px_rgba(0,0,0,0.8)] flex flex-col justify-between transition-transform duration-300 ease-in-out ${sidePanelOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Top Header & Navigation */}
        <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-grow">
          {/* Header row */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-900">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-lg">R</div>
              <span className="text-white font-black text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                RentIt <span className="text-xs text-indigo-400 font-semibold px-2 py-0.5 rounded-full bg-indigo-950/50 border border-indigo-900/50">v2.5</span>
              </span>
            </div>
            <button 
              onClick={() => { setSidePanelOpen(false); setProfileMenuOpen(false); }}
              className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>

          {/* "+ New Request" ChatGPT action button style */}
          <button 
            onClick={() => { setSidePanelOpen(false); scrollToSection("browse-section"); handlePostItemClick({ preventDefault: () => {} }); }}
            className="w-full py-3 px-4 rounded-xl border border-dashed border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-500/10 text-white font-bold text-sm tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group hover:scale-[1.02]"
          >
            <span>➕</span> Post New Request
          </button>

          {/* Nav Items */}
          <div className="flex flex-col gap-1.5 mt-2">
            <button 
              onClick={() => { setSidePanelOpen(false); scrollToSection("browse-section"); }}
              className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-left text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all font-semibold text-sm cursor-pointer group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">🔍</span> Browse Listings
            </button>
            
            <button 
              onClick={() => { setSidePanelOpen(false); scrollToSection("how-it-works"); }}
              className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-left text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all font-semibold text-sm cursor-pointer group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">ℹ️</span> How It Works
            </button>

            <button 
              onClick={() => { setSidePanelOpen(false); scrollToSection("categories"); }}
              className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-left text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all font-semibold text-sm cursor-pointer group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">📂</span> Categories
            </button>

            <div className="h-px bg-slate-900 my-2"></div>

            <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Activities</h3>

            <button 
              onClick={() => { setSidePanelOpen(false); }}
              className="w-full flex items-center justify-between py-3 px-4 rounded-xl text-left text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all font-semibold text-sm cursor-pointer group"
            >
              <span className="flex items-center gap-3">
                <span className="text-lg group-hover:scale-110 transition-transform">💬</span> Messages
              </span>
              <span className="bg-indigo-500/10 text-indigo-400 text-xs font-black px-2 py-0.5 rounded-full border border-indigo-500/20">3</span>
            </button>

            <button 
              onClick={() => { setSidePanelOpen(false); }}
              className="w-full flex items-center justify-between py-3 px-4 rounded-xl text-left text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all font-semibold text-sm cursor-pointer group"
            >
              <span className="flex items-center gap-3">
                <span className="text-lg group-hover:scale-110 transition-transform">📦</span> Track Active Orders
              </span>
              <span className="bg-amber-500/10 text-amber-400 text-xs font-black px-2 py-0.5 rounded-full border border-amber-500/20">2</span>
            </button>

            <button 
              onClick={() => { setSidePanelOpen(false); }}
              className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-left text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all font-semibold text-sm cursor-pointer group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">📍</span> Saved Locations
            </button>

            <button 
              onClick={() => { setSidePanelOpen(false); }}
              className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-left text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all font-semibold text-sm cursor-pointer group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">🛒</span> Rental Cart
            </button>
          </div>
        </div>

        {/* Bottom Profile Box (ChatGPT style anchored card) */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/80 backdrop-blur-md relative">
          
          {/* Bottom Floating Submenu Popup (renders when profile box is clicked) */}
          {profileMenuOpen && (
            <div className="absolute bottom-[80px] left-4 right-4 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-[0_-12px_36px_rgba(0,0,0,0.6)] flex flex-col gap-1 z-55">
              <button 
                onClick={() => { setProfileMenuOpen(false); setSidePanelOpen(false); }}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all text-left cursor-pointer"
              >
                👤 My Profile
              </button>
              <button 
                onClick={() => { setProfileMenuOpen(false); setSidePanelOpen(false); }}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all text-left cursor-pointer"
              >
                📍 Your Addresses
              </button>
              <button 
                onClick={() => { setProfileMenuOpen(false); setSidePanelOpen(false); }}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all text-left cursor-pointer"
              >
                📦 Your Orders
              </button>
              <button 
                onClick={() => { setProfileMenuOpen(false); setSidePanelOpen(false); }}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all text-left cursor-pointer"
              >
                🛍️ Your Requests
              </button>
              <button 
                onClick={() => { setProfileMenuOpen(false); setSidePanelOpen(false); }}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all text-left cursor-pointer"
              >
                ⚙️ Settings
              </button>
              <div className="h-px bg-slate-800 my-1"></div>
              <button 
                onClick={() => { setProfileMenuOpen(false); setSidePanelOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-bold transition-all text-left cursor-pointer"
              >
                🚪 Log Out
              </button>
            </div>
          )}

          {/* Active User Card Trigger */}
          <div 
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 transition-all duration-200 cursor-pointer group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md group-hover:scale-105 transition-transform">
                VT
              </div>
              <div className="flex flex-col">
                <span className="text-white text-xs font-black tracking-wide leading-tight group-hover:text-indigo-400 transition-colors">Varun Tej</span>
                <span className="text-slate-500 text-[10px] font-bold tracking-wider leading-none mt-0.5 uppercase">Pro Renter ⭐</span>
              </div>
            </div>
            <div className="text-slate-500 group-hover:text-white text-xs transition-colors">
              ⚙️
            </div>
          </div>
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md border-b shadow-sm transition-colors duration-500 ${isNight ? "bg-slate-950/90 border-slate-900" : "bg-white/90 border-slate-100"}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => setSidePanelOpen(!sidePanelOpen)} 
            className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform duration-150 hover:opacity-90"
            title="Toggle Navigation Panel"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-xl shadow-md">R</div>
            <span className={`text-xl font-black transition-colors ${isNight ? "text-white" : "text-slate-800"}`} style={{ fontFamily: "'Playfair Display', serif" }}>
              Rent<span className="text-indigo-500">It</span>
            </span>
          </div>

          {/* Center nav links - Fully functional smooth scroll links */}
          <div className={`hidden md:flex items-center gap-6 text-sm font-bold transition-colors ${isNight ? "text-slate-300" : "text-slate-600"}`}>
            <button onClick={() => scrollToSection("browse-section")} className="hover:text-indigo-500 transition-colors duration-200 hover:underline underline-offset-4 cursor-pointer">Browse</button>
            <button onClick={handlePostItemClick} className="hover:text-indigo-500 transition-colors duration-200 hover:underline underline-offset-4 cursor-pointer">Post Item</button>
            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-indigo-500 transition-colors duration-200 hover:underline underline-offset-4 cursor-pointer">How It Works</button>
            <button onClick={() => scrollToSection("categories")} className="hover:text-indigo-500 transition-colors duration-200 hover:underline underline-offset-4 cursor-pointer">Categories</button>
          </div>

          {/* Right CTA */}
          <div className="flex items-center gap-3">
            {/* Day/Night Toggle Switch */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-colors text-lg cursor-pointer ${isNight ? "bg-slate-900 hover:bg-slate-850" : "bg-slate-100 hover:bg-slate-200"}`}
              title="Toggle Day/Night Mode"
            >
              {isNight ? "🌙" : "☀️"}
            </button>

            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white text-sm px-4 py-2 rounded-xl font-bold shadow-md hover:bg-red-600 hover:scale-105 transition-all duration-200 cursor-pointer"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`hidden sm:block text-sm font-bold transition-colors ${isNight ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-indigo-500"}`}
                >
                  Log In
                </Link>

                <Link
                  to="/register"
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm px-4 py-2 rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  Register Free
                </Link>
              </>
            )}

            <button
              className={`md:hidden cursor-pointer ${isNight ? "text-slate-300" : "text-slate-600"}`}
              onClick={() => setMobileMenu((m) => !m)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className={`md:hidden border-t px-4 py-4 flex flex-col gap-3 text-sm font-bold transition-colors ${isNight ? "bg-slate-950 border-slate-900 text-slate-300" : "bg-white border-slate-100 text-slate-700"}`}>
            <button onClick={() => { setMobileMenu(false); scrollToSection("browse-section"); }} className="text-left hover:text-indigo-500 transition-colors cursor-pointer">Browse</button>
            <button onClick={handlePostItemClick} className="text-left hover:text-indigo-500 transition-colors cursor-pointer">Post Item</button>
            <button onClick={() => { setMobileMenu(false); scrollToSection("how-it-works"); }} className="text-left hover:text-indigo-500 transition-colors cursor-pointer">How It Works</button>
            <button onClick={() => { setMobileMenu(false); scrollToSection("categories"); }} className="text-left hover:text-indigo-500 transition-colors cursor-pointer">Categories</button>
            {!isLoggedIn && (
              <>
                <Link to="/login" onClick={() => setMobileMenu(false)} className="hover:text-indigo-500 transition-colors">Log In</Link>
                <Link to="/register" onClick={() => setMobileMenu(false)} className="hover:text-indigo-500 transition-colors">Register</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-20 px-4" style={{ background: isNight ? "#09090b" : "#fdf6ee", transition: "background 0.5s ease" }}>
        <CityStreetScene isNight={isNight} />
        {particles.map((p, i) => (
          <Particle key={i} style={{ ...p, "--dur": p.animationDuration }} />
        ))}

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="slide-left">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              🎉 Now live in Hyderabad & Bengaluru
            </div>
            <h1 className={`text-5xl md:text-6xl font-black leading-tight mb-4 ${isNight ? "text-white" : "text-slate-900"}`} style={{ fontFamily: "'Playfair Display', serif" }}>
              Rent Anything.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">Earn Everything.</span>
            </h1>
            <p className={`text-lg mb-8 leading-relaxed ${isNight ? "text-slate-300" : "text-slate-600"}`}>
              India's most trusted peer-to-peer rental marketplace. Post your idle items, find what you need, and negotiate the perfect deal — all in one place.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <button onClick={() => scrollToSection("browse-section")} className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 active:scale-95 cursor-pointer">
                🚀 Start Renting
              </button>
              <button onClick={handlePostItemClick} className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-lg shadow-md hover:shadow-xl border-2 border-indigo-200 hover:border-indigo-400 hover:scale-105 transition-all duration-200 cursor-pointer">
                📦 Post Item
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <TrustBadge icon="🔒" label="Secure Payments" isNight={isNight} />
              <TrustBadge icon="✅" label="Verified Users" isNight={isNight} />
              <TrustBadge icon="🤝" label="Deal Guarantee" isNight={isNight} />
            </div>
          </div>

          {/* Right – Hero graphic */}
          <div className="slide-right flex justify-center">
            <div
              className="relative cursor-pointer"
              onMouseMove={handleTiltMove}
              onMouseLeave={handleTiltLeave}
              style={{
                transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                transition: "transform 0.1s ease",
                transformStyle: "preserve-3d"
              }}
            >
              {/* Main card */}
              <div className={`rounded-3xl shadow-2xl p-6 w-72 border transition-colors ${isNight ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-indigo-100 text-slate-800"}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl ${isNight ? "bg-slate-800" : "bg-indigo-100"}`}>📷</div>
                  <div>
                    <p className={`font-black text-sm ${isNight ? "text-slate-100" : "text-slate-800"}`}>Canon EOS R50</p>
                    <p className="text-xs text-slate-400">Listed by Arjun K. • Hyderabad</p>
                  </div>
                </div>
                <div className={`h-36 rounded-2xl flex items-center justify-center text-7xl mb-4 ${isNight ? "bg-gradient-to-br from-slate-800 to-slate-950" : "bg-gradient-to-br from-indigo-100 to-violet-100"}`}>📷</div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black text-indigo-400">₹450<span className="text-xs text-slate-400 font-normal">/day</span></span>
                  <div className="flex gap-0.5 text-amber-400">★★★★★</div>
                </div>
                {/* Negotiation bubble */}
                <div className={`rounded-2xl p-3 mb-3 ${isNight ? "bg-slate-950" : "bg-indigo-50"}`}>
                  <p className="text-xs text-slate-500 mb-1">💬 Price Negotiation</p>
                  <p className="text-xs font-bold text-indigo-400">"Can you do ₹380 for 3 days?" 🤔</p>
                </div>
                <div className={`rounded-2xl p-3 ${isNight ? "bg-slate-950/70" : "bg-green-50"}`}>
                  <p className="text-xs font-bold text-green-400">✅ Counter: "₹400 for 3 days — deal!" 🎉</p>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-green-400 text-white text-xs font-black px-3 py-2 rounded-2xl shadow-lg rotate-6 animate-pulse" style={{ transform: "translateZ(30px)" }}>
                Deal Closed! 🤝
              </div>
              <div className="absolute -bottom-4 -left-4 bg-amber-400 text-white text-xs font-black px-3 py-2 rounded-2xl shadow-lg -rotate-3" style={{ transform: "translateZ(20px)" }}>
                ₹1.2L earned this month 💰
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE STATS ── */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 py-3 overflow-hidden">
        <div className="flex marquee-inner whitespace-nowrap gap-12 text-white text-sm font-bold">
          {[...Array(2)].map((_, idx) => (
            <span key={idx} className="flex gap-12">
              <span>🏠 {itemsCount.toLocaleString()}+ Items Listed</span>
              <span>👥 {usersCount.toLocaleString()}+ Verified Users</span>
              <span>🤝 98% Deal Success Rate</span>
              <span>⭐ 4.9/5 Average Rating</span>
              <span>🔒 256-bit SSL Encrypted</span>
              <span>📍 20+ Cities Active</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── BROWSE / POST TABS ── */}
      <section id="browse-section" className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className={`text-3xl font-black ${isNight ? "text-white" : "text-slate-800"}`} style={{ fontFamily: "'Playfair Display', serif" }}>
              {activeTab === "browse" ? "🔍 Browse Items Near You" : "📢 Make a Borrow Request"}
            </h2>
            <p className="text-slate-500 mt-1">Hyderabad, Telangana</p>
          </div>
          <div className={`flex rounded-2xl p-1.5 gap-1 ${isNight ? "bg-slate-900" : "bg-slate-100"}`}>
            {["browse", "request"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all duration-200 cursor-pointer ${activeTab === tab ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md" : (isNight ? "text-slate-300 hover:text-indigo-400" : "text-slate-600 hover:text-indigo-500")}`}
              >
                {tab === "browse" ? "🔍 Browse" : "📝 Request"}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "browse" ? (
          <>
            {/* Filters */}
            <div className={`flex flex-wrap gap-4 mb-8 p-4 rounded-2xl shadow-sm border ${isNight ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"}`}>
              <input
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="🔍 Search cameras, bikes, tents..."
                className={`flex-1 min-w-48 border-2 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none transition-colors ${isNight ? "bg-slate-850 border-slate-700 text-white placeholder-slate-400 focus:border-indigo-500" : "bg-white border-slate-200 text-slate-800 focus:border-indigo-400"}`}
              />
              <div className="flex items-center gap-3">
                <label className={`text-sm font-bold ${isNight ? "text-slate-300" : "text-slate-600"}`}>Max ₹{priceFilter}/day</label>
                <input type="range" min={100} max={1000} step={50} value={priceFilter} onChange={e => setPriceFilter(+e.target.value)}
                  className="w-32 accent-indigo-500" />
              </div>
              <select className={`border-2 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none ${isNight ? "bg-slate-850 border-slate-700 text-slate-300 focus:border-indigo-500" : "bg-white border-slate-200 text-slate-600 focus:border-indigo-400"}`}>
                <option>All Categories</option>
                <option>Electronics</option>
                <option>Vehicles</option>
                <option>Outdoor</option>
                <option>Music</option>
                <option>Tools</option>
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {filtered.length ? filtered.map((p, i) => <ProductCard key={i} {...p} isNight={isNight} />) : (
                <div className="col-span-full text-center py-16 text-slate-400">
                  <span className="text-5xl block mb-3">🔍</span>
                  <p className="font-bold text-lg">No items match your filter</p>
                  <p className="text-sm">Try increasing the price range or clearing search</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* REQUEST FORM */
          <div className={`max-w-2xl mx-auto rounded-3xl shadow-xl p-8 border transition-colors ${isNight ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-indigo-100 text-slate-800"}`}>
            <div className="text-center mb-6">
              <span className="text-5xl block mb-2">📋</span>
              <h3 className={`text-2xl font-black ${isNight ? "text-slate-100" : "text-slate-800"}`}>Post a Borrow Request</h3>
              <p className="text-slate-500 text-sm mt-1">Tell us what you need — owners will reach out!</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`text-sm font-bold block mb-1 ${isNight ? "text-slate-300" : "text-slate-700"}`}>What do you need?</label>
                <input placeholder="e.g. DSLR Camera for a wedding shoot" className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${isNight ? "bg-slate-850 border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-200 focus:border-indigo-400"}`}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm font-bold block mb-1 ${isNight ? "text-slate-300" : "text-slate-700"}`}>From Date</label>
                  <input type="date" className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none ${isNight ? "bg-slate-850 border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-200 focus:border-indigo-400"}`}/>
                </div>
                <div>
                  <label className={`text-sm font-bold block mb-1 ${isNight ? "text-slate-300" : "text-slate-700"}`}>To Date</label>
                  <input type="date" className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none ${isNight ? "bg-slate-850 border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-200 focus:border-indigo-400"}`}/>
                </div>
              </div>
              <div>
                <label className={`text-sm font-bold block mb-1 ${isNight ? "text-slate-300" : "text-slate-700"}`}>Your Price Proposal (₹/day)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-sm">₹</span>
                  <input type="number" placeholder="350" className={`w-full border-2 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none ${isNight ? "bg-slate-850 border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-200 focus:border-indigo-400"}`}/>
                </div>
              </div>
              <div>
                <label className={`text-sm font-bold block mb-1 ${isNight ? "text-slate-300" : "text-slate-700"}`}>Additional Notes</label>
                <textarea rows={3} placeholder="Any specific requirements, pickup preference, etc." className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none resize-none ${isNight ? "bg-slate-850 border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-200 focus:border-indigo-400"}`}/>
              </div>
              <button className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer">
                🚀 Post My Request
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-gradient-to-br from-slate-800 to-indigo-900 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-indigo-500/20 text-indigo-300 text-xs font-bold px-4 py-2 rounded-full mb-4 border border-indigo-500/30">
              🔐 Secure & Simple Process
            </span>
            <h2 className="text-4xl font-black text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              How RentIt Works
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">Our cartoon guides walk you through every step — from verifying your identity to sealing your first deal.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <HowCard
              step="1"
              cartoon={<CartoonVerify />}
              title="Verify Your Identity"
              desc="Upload your Aadhaar/PAN card. Our AI verifies you in 60 seconds — keeping the community safe and trusted."
              color="border-indigo-400/30 bg-indigo-950/50"
              isNight={isNight}
            />
            <HowCard
              step="2"
              cartoon={<CartoonPost />}
              title="Post or Request Items"
              desc="List your idle items with photos & your price, or post a borrow request with your own price proposal."
              color="border-green-400/30 bg-green-950/50"
              isNight={isNight}
            />
            <HowCard
              step="3"
              cartoon={<CartoonNegotiate />}
              title="Negotiate the Deal"
              desc="Chat directly with owners or borrowers. Counter-offer, discuss terms, and agree on a fair price in real-time."
              color="border-amber-400/30 bg-amber-950/50"
              isNight={isNight}
            />
            <HowCard
              step="4"
              cartoon={<CartoonDeal />}
              title="Seal & Rent Securely"
              desc="Money held in escrow. Once both confirm, the deal is done. Rate each other and build your rental reputation!"
              color="border-violet-400/30 bg-violet-950/50"
              isNight={isNight}
            />
          </div>

          {/* Security callout */}
          <div className="mt-14 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-3xl p-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {[
                { icon: "🔐", title: "Government ID Verified", desc: "Every user verifies with an official ID. Zero anonymous listings." },
                { icon: "💳", title: "Escrow Payments", desc: "Money is only released after successful handover — zero risk." },
                { icon: "🛡️", title: "Damage Protection", desc: "Optional item insurance available for high-value rentals." },
              ].map((b, i) => (
                <div key={i} className="text-white">
                  <div className="text-4xl mb-3">{b.icon}</div>
                  <h4 className="font-black text-lg mb-2">{b.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section id="categories" className="max-w-7xl mx-auto px-4 py-16">
        <h2 className={`text-3xl font-black mb-8 text-center ${isNight ? "text-white" : "text-slate-800"}`} style={{ fontFamily: "'Playfair Display', serif" }}>
          Browse by Category
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {[
            { icon: "📷", label: "Electronics", count: "2.4K" },
            { icon: "🛵", label: "Vehicles", count: "1.1K" },
            { icon: "🎸", label: "Music", count: "800" },
            { icon: "⛺", label: "Outdoor", count: "1.5K" },
            { icon: "🔧", label: "Tools", count: "930" },
            { icon: "📚", label: "Books", count: "3.2K" },
            { icon: "👗", label: "Fashion", count: "4K" },
            { icon: "🏋️", label: "Fitness", count: "670" },
            { icon: "🎮", label: "Gaming", count: "1.8K" },
            { icon: "🏠", label: "Home & Decor", count: "2.1K" },
            { icon: "🎨", label: "Art & Craft", count: "590" },
            { icon: "🌱", label: "Garden", count: "430" },
          ].map((c, i) => (
            <button key={i} className={`rounded-2xl p-4 text-center shadow-sm border hover:shadow-lg hover:border-indigo-200 hover:-translate-y-1 transition-all duration-200 group cursor-pointer ${isNight ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-800"}`}>
              <div className="text-3xl mb-1 group-hover:scale-125 transition-transform duration-200">{c.icon}</div>
              <p className={`text-xs font-black ${isNight ? "text-slate-200" : "text-slate-700"}`}>{c.label}</p>
              <p className="text-xs text-slate-400">{c.count}+</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className={`py-16 px-4 transition-colors duration-500 ${isNight ? "bg-slate-950" : "bg-gradient-to-br from-indigo-50 to-violet-50"}`}>
        <div className="max-w-6xl mx-auto">
          <h2 className={`text-3xl font-black mb-10 text-center ${isNight ? "text-white" : "text-slate-800"}`} style={{ fontFamily: "'Playfair Display', serif" }}>
            ❤️ Real Stories from Real Renters
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Priya S.", city: "Hyderabad", avatar: "👩", rating: 5, text: "I rented my DSLR camera for 3 days and made ₹1,200! The negotiation chat made it so easy to agree on a price with the renter.", role: "Item Owner" },
              { name: "Kiran M.", city: "Bengaluru", avatar: "👨", rating: 5, text: "Found a scooter to rent for a week at half the price I expected. The government ID verification gave me full confidence!", role: "Renter" },
              { name: "Ananya R.", city: "Chennai", avatar: "🧑", rating: 5, text: "I posted a borrow request for a camping tent, got 3 proposals in an hour, and negotiated down from ₹300 to ₹220. Amazing!", role: "Borrower" },
            ].map((t, i) => (
              <div key={i} className={`rounded-3xl p-6 shadow-lg border transition-colors ${isNight ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-indigo-100 text-slate-800"}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{t.avatar}</span>
                  <div>
                    <p className="font-black text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role} • {t.city}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5 text-amber-400">{[...Array(t.rating)].map((_, j) => <span key={j}>★</span>)}</div>
                </div>
                <p className={`text-sm leading-relaxed italic ${isNight ? "text-slate-300" : "text-slate-600"}`}>"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready to Start Earning?
          </h2>
          <p className="text-indigo-200 text-lg mb-8">Join 1.2 lakh+ Indians who are already renting smarter. Free to join, no hidden fees.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-lg hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer">
              🚀 Get Started Free
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-white/10 transition-all duration-200 cursor-pointer">
              📖 Learn More
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black">R</div>
              <span className="text-white font-black text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>RentIt</span>
            </div>
            <p className="text-sm leading-relaxed">India's most trusted peer-to-peer rental & borrow marketplace.</p>
          </div>
          {[
            { title: "Platform", links: ["Browse Items", "Post Item", "Borrow Request", "Categories"] },
            { title: "Company", links: ["About Us", "Blog", "Careers", "Press"] },
            { title: "Support", links: ["Help Center", "Safety", "Terms", "Privacy Policy"] },
          ].map((col, i) => (
            <div key={i}>
              <h4 className="text-white font-black text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(l => <li key={l}><a href="#" className="text-sm hover:text-indigo-400 transition-colors">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-800 pt-6 text-center text-xs">
          © 2025 RentIt Technologies Pvt. Ltd. • Made with ❤️ in Hyderabad, India
        </div>
      </footer>

      {/* ── AI CHAT BOT ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {chatOpen && (
          <div className={`chat-pop w-80 rounded-3xl shadow-2xl border overflow-hidden flex flex-col transition-colors ${isNight ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-indigo-100 text-slate-800"}`} style={{ height: 420 }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl">🤖</div>
              <div>
                <p className="text-white font-black text-sm">RentBot AI</p>
                <p className="text-indigo-200 text-xs">Always here to help!</p>
              </div>
              <button className="ml-auto text-white/70 hover:text-white text-xl" onClick={() => setChatOpen(false)}>×</button>
            </div>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-1 ${isNight ? "bg-slate-950" : "bg-slate-50"}`}>
              {messages.map((m, i) => <ChatMsg key={i} {...m} isNight={isNight} />)}
              {isTyping && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🤖</span>
                  <div className={`px-3 py-2 rounded-2xl rounded-tl-none flex gap-1 ${isNight ? "bg-slate-850" : "bg-indigo-50"}`}>
                    {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full dot-bounce" style={{animationDelay:`${i*0.2}s`}}/>)}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick chips */}
            <div className={`px-3 py-2 border-t flex gap-2 overflow-x-auto ${isNight ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
              {["How to rent?", "Is it safe?", "Negotiation tips"].map(q => (
                <button key={q} onClick={() => { setChatInput(q); }}
                  className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full font-bold whitespace-nowrap hover:bg-indigo-100 transition-colors">
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className={`px-3 py-3 border-t flex gap-2 ${isNight ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Ask me anything..."
                className={`flex-1 border-2 rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors ${isNight ? "bg-slate-850 border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-200 focus:border-indigo-400"}`}
              />
              <button onClick={sendMessage}
                className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-md hover:shadow-lg hover:scale-110 transition-all cursor-pointer">
                ➤
              </button>
            </div>
          </div>
        )}

        {/* FAB */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-30" />
          <button
            onClick={() => setChatOpen(o => !o)}
            className="relative w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full shadow-2xl flex items-center justify-center text-2xl hover:scale-110 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            {chatOpen ? "✕" : "🤖"}
          </button>
        </div>
      </div>
    </div>
  );
}