import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { CityStreetScene } from "../components/CityStreetScene";

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
const ProductCard = ({ emoji, title, price, rating, owner, badge }) => (
  <div className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100 hover:-translate-y-2 cursor-pointer">
    {badge && (
      <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
        {badge}
      </div>
    )}
    <div className="h-40 bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">
      {emoji}
    </div>
    <div className="p-4">
      <h3 className="font-bold text-slate-800 text-sm mb-1 truncate">{title}</h3>
      <div className="flex items-center gap-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`text-xs ${i < rating ? "text-amber-400" : "text-slate-200"}`}>★</span>
        ))}
        <span className="text-xs text-slate-400 ml-1">({rating}.0)</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-indigo-600 font-bold text-lg">₹{price}<span className="text-xs text-slate-400 font-normal">/day</span></span>
        <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-full">{owner}</span>
      </div>
      <button className="mt-3 w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm py-2 rounded-xl font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all duration-200 active:scale-95">
        Request to Rent
      </button>
    </div>
  </div>
);

// ── How It Works Card ───────────────────────────────────────────────────────
const HowCard = ({ cartoon, step, title, desc, color }) => (
  <div className={`relative bg-white rounded-3xl p-6 shadow-lg border-2 ${color} hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group`}>
    <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
      {step}
    </div>
    <div className="mb-4 group-hover:scale-105 transition-transform duration-300">{cartoon}</div>
    <h3 className="font-black text-slate-800 text-lg mb-2 text-center">{title}</h3>
    <p className="text-slate-500 text-sm text-center leading-relaxed">{desc}</p>
  </div>
);

// ── Trust Badge ─────────────────────────────────────────────────────────────
const TrustBadge = ({ icon, label }) => (
  <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-indigo-100 text-sm font-semibold text-slate-700">
    <span className="text-lg">{icon}</span> {label}
  </div>
);

// ── Chat Message ────────────────────────────────────────────────────────────
const ChatMsg = ({ from, text }) => (
  <div className={`flex ${from === "bot" ? "justify-start" : "justify-end"} mb-2`}>
    {from === "bot" && <span className="text-xl mr-2">🤖</span>}
    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${from === "bot" ? "bg-indigo-50 text-slate-700 rounded-tl-none" : "bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-tr-none"}`}>
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const botReplies = [
    "Great question! You can post your item in under 2 minutes — just upload photos, set your price, and go live! 🚀",
    "All users are verified with a government ID for your safety. We take trust seriously! 🛡️",
    "You can negotiate directly in the chat — propose a price, counter-offer, and seal the deal! 🤝",
    "RentIt uses secure escrow payments so money is only released when the renter confirms receipt. 💰",
    "You can browse items by category, location, or price range using our smart filters! 🔍",
  ];

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { from: "user", text: chatInput };
    setMessages(p => [...p, userMsg]);
    setChatInput("");
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsTyping(false);
    setMessages(p => [...p, { from: "bot", text: botReplies[Math.floor(Math.random() * botReplies.length)] }]);
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
    <div className="min-h-screen bg-slate-50 font-sans overflow-x-hidden" style={{ fontFamily: "'Nunito', 'Poppins', sans-serif" }}>
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

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-xl shadow-md">R</div>
            <span className="text-xl font-black text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>
              Rent<span className="text-indigo-500">It</span>
            </span>
          </div>

          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-600">
            {["Browse", "Post Item", "How It Works", "Categories"].map(l => (
              <a key={l} href="#" className="hover:text-indigo-500 transition-colors duration-200 hover:underline underline-offset-4">{l}</a>
            ))}
          </div>

          {/* Right CTA */}
          <div className="flex items-center gap-3">
            <Link to="/Login" className="hidden sm:block text-sm font-bold text-slate-600 hover:text-indigo-500 transition-colors">Log In</Link>
            <Link to="/Register" className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm px-4 py-2 rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200">
              Register Free
            </Link>
            <button className="md:hidden text-slate-600" onClick={() => setMobileMenu(m => !m)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 flex flex-col gap-3 text-sm font-bold text-slate-700">
            {["Browse", "Post Item", "How It Works", "Log In", "Register"].map(l => (
              <a key={l} href="#" className="hover:text-indigo-500 transition-colors">{l}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-20 px-4" style={{background:"#fdf6ee"}}>
        <CityStreetScene />
        {particles.map((p, i) => (
          <Particle key={i} style={{ ...p, "--dur": p.animationDuration }} />
        ))}

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="slide-left">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              🎉 Now live in Hyderabad & Bengaluru
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Rent Anything.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">Earn Everything.</span>
            </h1>
            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
              India's most trusted peer-to-peer rental marketplace. Post your idle items, find what you need, and negotiate the perfect deal — all in one place.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <button className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 active:scale-95">
                🚀 Start Renting
              </button>
              <button className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-lg shadow-md hover:shadow-xl border-2 border-indigo-200 hover:border-indigo-400 hover:scale-105 transition-all duration-200">
                📦 Post Item
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <TrustBadge icon="🔒" label="Secure Payments" />
              <TrustBadge icon="✅" label="Verified Users" />
              <TrustBadge icon="🤝" label="Deal Guarantee" />
            </div>
          </div>

          {/* Right – Hero graphic */}
          <div className="slide-right flex justify-center">
            <div className="relative">
              {/* Main card */}
              <div className="bg-white rounded-3xl shadow-2xl p-6 w-72 border border-indigo-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-2xl">📷</div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">Canon EOS R50</p>
                    <p className="text-xs text-slate-400">Listed by Arjun K. • Hyderabad</p>
                  </div>
                </div>
                <div className="h-36 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-7xl mb-4">📷</div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black text-indigo-600">₹450<span className="text-xs text-slate-400 font-normal">/day</span></span>
                  <div className="flex gap-0.5 text-amber-400">★★★★★</div>
                </div>
                {/* Negotiation bubble */}
                <div className="bg-indigo-50 rounded-2xl p-3 mb-3">
                  <p className="text-xs text-slate-500 mb-1">💬 Price Negotiation</p>
                  <p className="text-xs font-bold text-indigo-700">"Can you do ₹380 for 3 days?" 🤔</p>
                </div>
                <div className="bg-green-50 rounded-2xl p-3">
                  <p className="text-xs font-bold text-green-700">✅ Counter: "₹400 for 3 days — deal!" 🎉</p>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-green-400 text-white text-xs font-black px-3 py-2 rounded-2xl shadow-lg rotate-6 animate-pulse">
                Deal Closed! 🤝
              </div>
              <div className="absolute -bottom-4 -left-4 bg-amber-400 text-white text-xs font-black px-3 py-2 rounded-2xl shadow-lg -rotate-3">
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
              <span>🏠 50,000+ Items Listed</span>
              <span>👥 1.2L+ Verified Users</span>
              <span>🤝 98% Deal Success Rate</span>
              <span>⭐ 4.9/5 Average Rating</span>
              <span>🔒 256-bit SSL Encrypted</span>
              <span>📍 20+ Cities Active</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── BROWSE / POST TABS ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>
              {activeTab === "browse" ? "🔍 Browse Items Near You" : "📢 Make a Borrow Request"}
            </h2>
            <p className="text-slate-500 mt-1">Hyderabad, Telangana</p>
          </div>
          <div className="flex bg-slate-100 rounded-2xl p-1.5 gap-1">
            {["browse", "request"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all duration-200 ${activeTab === tab ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md" : "text-slate-600 hover:text-indigo-500"}`}
              >
                {tab === "browse" ? "🔍 Browse" : "📝 Request"}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "browse" ? (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <input
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="🔍 Search cameras, bikes, tents..."
                className="flex-1 min-w-48 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-indigo-400 transition-colors"
              />
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-slate-600">Max ₹{priceFilter}/day</label>
                <input type="range" min={100} max={1000} step={50} value={priceFilter} onChange={e => setPriceFilter(+e.target.value)}
                  className="w-32 accent-indigo-500" />
              </div>
              <select className="border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 focus:outline-none focus:border-indigo-400 bg-white">
                <option>All Categories</option>
                <option>Electronics</option>
                <option>Vehicles</option>
                <option>Outdoor</option>
                <option>Music</option>
                <option>Tools</option>
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {filtered.length ? filtered.map((p, i) => <ProductCard key={i} {...p} />) : (
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
          <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-indigo-100">
            <div className="text-center mb-6">
              <span className="text-5xl block mb-2">📋</span>
              <h3 className="text-2xl font-black text-slate-800">Post a Borrow Request</h3>
              <p className="text-slate-500 text-sm mt-1">Tell us what you need — owners will reach out!</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">What do you need?</label>
                <input placeholder="e.g. DSLR Camera for a wedding shoot" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 transition-colors"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">From Date</label>
                  <input type="date" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400"/>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">To Date</label>
                  <input type="date" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400"/>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Your Price Proposal (₹/day)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-sm">₹</span>
                  <input type="number" placeholder="350" className="w-full border-2 border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-400"/>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Additional Notes</label>
                <textarea rows={3} placeholder="Any specific requirements, pickup preference, etc." className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 resize-none"/>
              </div>
              <button className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
                🚀 Post My Request
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-gradient-to-br from-slate-800 to-indigo-900 py-20 px-4">
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
            />
            <HowCard
              step="2"
              cartoon={<CartoonPost />}
              title="Post or Request Items"
              desc="List your idle items with photos & your price, or post a borrow request with your own price proposal."
              color="border-green-400/30 bg-green-950/50"
            />
            <HowCard
              step="3"
              cartoon={<CartoonNegotiate />}
              title="Negotiate the Deal"
              desc="Chat directly with owners or borrowers. Counter-offer, discuss terms, and agree on a fair price in real-time."
              color="border-amber-400/30 bg-amber-950/50"
            />
            <HowCard
              step="4"
              cartoon={<CartoonDeal />}
              title="Seal & Rent Securely"
              desc="Money held in escrow. Once both confirm, the deal is done. Rate each other and build your rental reputation!"
              color="border-violet-400/30 bg-violet-950/50"
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
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-black text-slate-800 mb-8 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
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
            <button key={i} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100 hover:shadow-lg hover:border-indigo-200 hover:-translate-y-1 transition-all duration-200 group">
              <div className="text-3xl mb-1 group-hover:scale-125 transition-transform duration-200">{c.icon}</div>
              <p className="text-xs font-black text-slate-700">{c.label}</p>
              <p className="text-xs text-slate-400">{c.count}+</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-gradient-to-br from-indigo-50 to-violet-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-slate-800 mb-10 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
            ❤️ Real Stories from Real Renters
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Priya S.", city: "Hyderabad", avatar: "👩", rating: 5, text: "I rented my DSLR camera for 3 days and made ₹1,200! The negotiation chat made it so easy to agree on a price with the renter.", role: "Item Owner" },
              { name: "Kiran M.", city: "Bengaluru", avatar: "👨", rating: 5, text: "Found a scooter to rent for a week at half the price I expected. The government ID verification gave me full confidence!", role: "Renter" },
              { name: "Ananya R.", city: "Chennai", avatar: "🧑", rating: 5, text: "I posted a borrow request for a camping tent, got 3 proposals in an hour, and negotiated down from ₹300 to ₹220. Amazing!", role: "Borrower" },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-3xl p-6 shadow-lg border border-indigo-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{t.avatar}</span>
                  <div>
                    <p className="font-black text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role} • {t.city}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5 text-amber-400">{[...Array(t.rating)].map((_, j) => <span key={j}>★</span>)}</div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed italic">"{t.text}"</p>
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
            <button className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
              🚀 Get Started Free
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-white/10 transition-all duration-200">
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
          <div className="chat-pop w-80 bg-white rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden flex flex-col" style={{ height: 420 }}>
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
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-1">
              {messages.map((m, i) => <ChatMsg key={i} {...m} />)}
              {isTyping && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🤖</span>
                  <div className="bg-indigo-50 px-3 py-2 rounded-2xl rounded-tl-none flex gap-1">
                    {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full dot-bounce" style={{animationDelay:`${i*0.2}s`}}/>)}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick chips */}
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto">
              {["How to rent?", "Is it safe?", "Negotiation tips"].map(q => (
                <button key={q} onClick={() => { setChatInput(q); }}
                  className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full font-bold whitespace-nowrap hover:bg-indigo-100 transition-colors">
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-3 py-3 bg-white border-t border-slate-100 flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition-colors"
              />
              <button onClick={sendMessage}
                className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-md hover:shadow-lg hover:scale-110 transition-all">
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
            className="relative w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full shadow-2xl flex items-center justify-center text-2xl hover:scale-110 transition-all duration-200 active:scale-95"
          >
            {chatOpen ? "✕" : "🤖"}
          </button>
        </div>
      </div>
    </div>
  );
}