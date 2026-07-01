import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon, Download, Truck, ShoppingBag, Folder, Camera, Trash2, X, Bell } from "lucide-react";
import API from "../api";
import { STORAGE_KEYS } from "../constants/auth";

export default function Profile() {
  const navigate = useNavigate();
  const [isNight, setIsNight] = useState(() => localStorage.getItem("theme") === "night");
  const [profilePic, setProfilePic] = useState(() => localStorage.getItem("userProfilePic") || "");
  const [userName, setUserName] = useState(() => localStorage.getItem("user_name") || "Varun Tej");
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("pendingEmail") || "varun@example.com");
  const [reputationScore, setReputationScore] = useState(100);
  const [reputationHistory, setReputationHistory] = useState([]);
  const [userRole, setUserRole] = useState("USER");

  const getReputationTier = (score) => {
    if (score >= 1000) return { name: "Trusted Member", emoji: "💎", colorClass: "text-blue-400 bg-blue-500/15 border-blue-500/20" };
    if (score >= 500) return { name: "Gold Member", emoji: "🥇", colorClass: "text-amber-400 bg-amber-500/15 border-amber-500/20" };
    if (score >= 250) return { name: "Silver Member", emoji: "🥈", colorClass: "text-slate-350 bg-slate-500/15 border-slate-500/20" };
    if (score >= 100) return { name: "Bronze Member", emoji: "🥉", colorClass: "text-orange-400 bg-orange-500/15 border-orange-500/20" };
    return { name: "Newbie", emoji: "🥚", colorClass: "text-indigo-400 bg-indigo-500/15 border-indigo-500/20" };
  };

  useEffect(() => {
    const activeToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (activeToken) {
      API.get("/auth/me")
        .then(res => {
          if (res.data?.name) {
            setUserName(res.data.name);
            localStorage.setItem("user_name", res.data.name);
          }
          if (res.data?.email) {
            setUserEmail(res.data.email);
          }
          if (res.data?.profilePic) {
            setProfilePic(res.data.profilePic);
            localStorage.setItem("userProfilePic", res.data.profilePic);
          }
          if (res.data?.reputationScore !== undefined) {
            setReputationScore(res.data.reputationScore);
          }
          if (Array.isArray(res.data?.reputationHistory)) {
            setReputationHistory(res.data.reputationHistory);
          }
          if (res.data?.role) {
            setUserRole(res.data.role);
          }
          if (res.data?._id) {
            setCurrentUserId(res.data._id);
          }
        })
        .catch(err => console.error("Error loading profile:", err));
    }
  }, []);

  const [expandedCard, setExpandedCard] = useState(null);
  const [showNotification, setShowNotification] = useState("");

  // Real transaction data
  const [currentUserId, setCurrentUserId] = useState(null);
  const [rentingItems, setRentingItems] = useState([]);   // user is borrower
  const [lendingItems, setLendingItems] = useState([]);   // user is owner
  const [txLoading, setTxLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) { setTxLoading(false); return; }
    let uid = null;
    try { uid = JSON.parse(atob(token.split(".")[1])).id; } catch {}
    API.get("/rent/transactions")
      .then(res => {
        if (!res.data?.length) { setTxLoading(false); return; }
        const mapped = res.data.map(tx => ({
          _id: tx._id,
          title: tx.product?.title || "Deleted Listing",
          productType: tx.product?.productType || "RENT",
          dailyRate: tx.dailyRate,
          totalPaid: tx.totalPaid,
          status: tx.status,
          startDate: tx.startDate,
          endDate: tx.endDate,
          borrower: tx.borrower,
          owner: tx.owner,
          securityDeposit: tx.securityDeposit,
        }));
        setRentingItems(mapped.filter(tx => tx.borrower?._id?.toString() === uid || tx.borrower?.toString() === uid));
        setLendingItems(mapped.filter(tx => tx.owner?._id?.toString() === uid || tx.owner?.toString() === uid));
        setTxLoading(false);
      })
      .catch(() => setTxLoading(false));
  }, []);

  const calcProgress = (s, e) => {
    const start = new Date(s).getTime(), end = new Date(e).getTime(), now = Date.now();
    if (now <= start) return 0; if (now >= end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  const STATUS_BADGE = {
    RESERVED: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    IN_POSSESSION: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    RETURN_INITIATED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    DAMAGE_REVIEW: "bg-red-500/10 text-red-400 border-red-500/20",
    DISPUTED: "bg-red-600/10 text-red-500 border-red-600/20",
    SETTLED: "bg-emerald-600/10 text-emerald-500 border-emerald-600/20",
    NEGOTIATION_DECLINED: "bg-slate-700/30 text-slate-500 border-slate-700/20",
    RETRACTED: "bg-red-500/10 text-red-400 border-red-500/20",
    AWAITING_PAYMENT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    PENDING_NEGOTIATION: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  const ACTIVE = new Set(["RESERVED","IN_POSSESSION","RETURN_INITIATED","DAMAGE_REVIEW","DISPUTED"]);
  const HISTORY = new Set(["SETTLED","NEGOTIATION_DECLINED","RETRACTED"]);
  const [prefCity, setPrefCity] = useState("Hyderabad");
  const [prefRadius, setPrefRadius] = useState(15);
  const [prefWhatsApp, setPrefWhatsApp] = useState(true);
  const [prefEmail, setPrefEmail] = useState(true);

  // Canvas Image Cropper & Camera states
  const [rawImage, setRawImage] = useState("");
  const [showCropModal, setShowCropModal] = useState(false);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [imgDetails, setImgDetails] = useState({ wBase: 288, hBase: 288, naturalWidth: 0, naturalHeight: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Hook camera stream to video tag
  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(err => console.error("Error playing video stream:", err));
    }
  }, [isCameraActive, cameraStream]);

  // Unified image loading & sizing helper to preserve aspect ratio
  const handleImageLoad = (dataUrl) => {
    const img = new Image();
    img.onload = () => {
      const S = 288; // size of the crop frame
      const ratio = img.width / img.height;
      let wBase = S;
      let hBase = S;
      if (ratio > 1) {
        // Landscape: height matches crop box, width is wider
        wBase = S * ratio;
        hBase = S;
      } else {
        // Portrait or Square: width matches crop box, height is taller
        wBase = S;
        hBase = S / ratio;
      }
      setImgDetails({ wBase, hBase, naturalWidth: img.width, naturalHeight: img.height });
      setRawImage(dataUrl);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsCameraActive(false);
      setShowChoiceModal(false);
      setShowCropModal(true);
    };
    img.src = dataUrl;
  };

  // Auto-clear toast notifications
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const toggleTheme = () => {
    setIsNight(prev => {
      const next = !prev;
      localStorage.setItem("theme", next ? "night" : "day");
      return next;
    });
  };

  return (
    <div className={`min-h-screen py-10 px-4 transition-colors duration-500 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header / Navigation Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/10">
          <button 
            onClick={() => navigate("/dashboard")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs border transition-all duration-200 cursor-pointer hover:scale-[1.05] active:scale-95 ${isNight ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white" : "bg-white border-indigo-50 text-slate-650 hover:text-indigo-650 shadow-sm"}`}
          >
            ← Back to Home
          </button>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-8 rounded-full transition-all duration-300 p-1 flex items-center justify-between border cursor-pointer ${isNight ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-indigo-50 border-indigo-100 text-slate-650"}`}
            >
              <span className="text-xs ml-1 select-none">☀️</span>
              <span className="text-xs mr-1 select-none">🌙</span>
              <div 
                className={`absolute w-6 h-6 rounded-full shadow-md flex items-center justify-center text-xs transition-transform duration-300 bg-white ${isNight ? "translate-x-6 bg-indigo-950 shadow-indigo-500/20" : "translate-x-0 bg-yellow-400"}`}
              >
                {isNight ? "🌙" : "☀️"}
              </div>
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className={`p-8 rounded-3xl border transition-all duration-350 ${isNight ? "bg-slate-900/60 border-slate-800 text-white shadow-[0_12px_40px_rgba(0,0,0,0.4)]" : "bg-white border-indigo-50 text-slate-850 shadow-[0_12px_40px_rgba(99,102,241,0.06)]"}`}>
          <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-slate-800/10">
            
            {/* Avatar Uploader inspired by Reddit, LinkedIn, Instagram */}
            <div 
              onClick={() => setShowChoiceModal(true)}
              className="relative group/avatar cursor-pointer"
            >
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-extrabold text-3xl shadow-xl overflow-hidden transition-all duration-300 border-2 border-indigo-500/30 group-hover/avatar:border-indigo-400">
                {profilePic ? (
                  <img src={profilePic} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  userName ? userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "VT"
                )}
              </div>
              
              {/* Premium Hover Camera Icon Overlay */}
              <div className="absolute inset-0 bg-slate-950/65 rounded-3xl opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center transition-all duration-200 z-10">
                <span className="text-xl">📷</span>
                <span className="text-[10px] text-white/90 font-black mt-1 uppercase tracking-wider">Edit Picture</span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h3 className="text-2xl font-black tracking-tight text-indigo-400">{userName}</h3>
                {/* Flair Status Badge */}
                {(() => {
                  const tier = getReputationTier(reputationScore);
                  return (
                    <div className="relative group/badge">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-help transition-all duration-200 ${tier.colorClass}`}>
                        {tier.emoji} {tier.name}
                      </span>
                      <div className="absolute left-1/2 md:left-0 bottom-full mb-2 -translate-x-1/2 md:translate-x-0 hidden group-hover/badge:block w-52 bg-slate-950/95 text-white text-[10px] rounded-xl p-3 shadow-xl leading-relaxed border border-slate-800 z-50">
                        Your badge changes dynamically according to your reputation score.
                      </div>
                    </div>
                  );
                })()}
              </div>
              <p className="text-sm text-slate-400 font-medium mb-3">Member since May 2026 • Bangalore, KA</p>
              
              {/* Reputation Score Container */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className={`px-4 py-2 rounded-2xl border ${isNight ? "bg-slate-950/40 border-slate-800" : "bg-indigo-50/50 border-indigo-100"}`}>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">Reputation Score</span>
                  <span className="text-lg font-black text-emerald-400">
                    {reputationScore} <span className="text-xs text-slate-500 font-normal">points</span>
                  </span>
                </div>
                {userRole === "ADMIN" && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="px-4 py-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-black hover:bg-violet-500/20 transition-colors"
                  >
                    🛡️ Admin Panel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Reputation History Timeline */}
          <div className={`mt-8 p-6 rounded-2xl border ${isNight ? "bg-slate-950/40 border-slate-800" : "bg-indigo-50/30 border-indigo-100"}`}>
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">Reputation History</h4>
            {reputationHistory.length === 0 ? (
              <p className="text-sm text-slate-500">No reputation events yet. Complete rentals and transactions to earn points.</p>
            ) : (
              <div className="space-y-4">
                {[...reputationHistory].reverse().map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${entry.points >= 0 ? "bg-emerald-400" : "bg-red-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-300">{entry.action}</span>
                        <span className={`text-xs font-black ${entry.points >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {entry.points >= 0 ? "+" : ""}{entry.points} pts
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Unknown date"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile Preferences & Settings Area */}
          <div className="mt-8">
            <h4 className="text-lg font-black mb-6 tracking-tight">Personalized Settings & Search Preferences</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Primary City</label>
                <select 
                  value={prefCity}
                  onChange={(e) => { setPrefCity(e.target.value); setShowNotification(`Primary city set to ${e.target.value}`); }}
                  className={`w-full border-2 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none transition-colors ${isNight ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-200 text-slate-800 focus:border-indigo-400"}`}
                >
                  <option value="Hyderabad">Hyderabad (Telangana)</option>
                  <option value="Bengaluru">Bengaluru (Karnataka)</option>
                  <option value="Chennai">Chennai (Tamil Nadu)</option>
                  <option value="Mumbai">Mumbai (Maharashtra)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Search Radius ({prefRadius} km)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min={5} 
                    max={50} 
                    step={5} 
                    value={prefRadius} 
                    onChange={(e) => { setPrefRadius(+e.target.value); }} 
                    onMouseUp={() => setShowNotification(`Search radius set to ${prefRadius}km`)}
                    className="flex-1 accent-indigo-500" 
                  />
                  <span className="text-sm font-bold text-indigo-400 w-12">{prefRadius} km</span>
                </div>
              </div>

              <div className="col-span-full border-t border-slate-800/10 pt-6">
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-4">Notification Channels</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black">WhatsApp & SMS Instant Alerts</p>
                      <p className="text-[10px] text-slate-400">Receive counter-offers, damage reports, and return reminders</p>
                    </div>
                    <button 
                      onClick={() => { setPrefWhatsApp(!prefWhatsApp); setShowNotification(prefWhatsApp ? "WhatsApp notifications disabled" : "WhatsApp notifications enabled!"); }}
                      className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 ${prefWhatsApp ? "bg-emerald-500 justify-end" : "bg-slate-700 justify-start"}`}
                    >
                      <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black">Email Transaction Statements</p>
                      <p className="text-[10px] text-slate-400">Monthly breakdown of rental income and security receipts</p>
                    </div>
                    <button 
                      onClick={() => { setPrefEmail(!prefEmail); setShowNotification(prefEmail ? "Email statements disabled" : "Email statements enabled!"); }}
                      className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 ${prefEmail ? "bg-indigo-500 justify-end" : "bg-slate-700 justify-start"}`}
                    >
                      <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE RENTALS PANEL */}
        <div className={`mt-8 p-8 rounded-3xl border transition-all ${isNight ? "bg-slate-900/60 border-slate-800 text-white" : "bg-white border-indigo-50 text-slate-800"}`}>
          <h3 className="text-xl font-black mb-1 flex items-center gap-2 text-indigo-400"><Download className="w-5 h-5 inline mr-2" /> Active Rentals</h3>
          <p className="text-xs text-slate-500 mb-6">Products you are currently renting from others.</p>
          {txLoading ? (<div className="space-y-3">{[1,2].map(i=><div key={i} className="h-16 rounded-2xl bg-slate-800/40 animate-pulse"/>)}</div>)
          : rentingItems.filter(tx=>ACTIVE.has(tx.status)).length===0 ? (<p className="text-sm text-slate-500">No active rentals right now.</p>)
          : (<div className="space-y-4">{rentingItems.filter(tx=>ACTIVE.has(tx.status)).map(tx=>{
            const open=expandedCard===tx._id, prog=calcProgress(tx.startDate,tx.endDate);
            return (<div key={tx._id} onClick={()=>setExpandedCard(open?null:tx._id)} className={`p-5 rounded-2xl border cursor-pointer hover:border-indigo-500/50 transition-all ${isNight?"bg-slate-950 border-slate-800":"bg-indigo-50/30 border-indigo-100/50"}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-extrabold text-sm text-indigo-400">{tx.title}</h4>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${STATUS_BADGE[tx.status]||"bg-slate-700/20 text-slate-400"}`}>{tx.status}</span>
                  </div>
                  <p className="text-xs text-slate-400">Rs.{tx.dailyRate}/day &bull; Owner: {tx.owner?.name||"—"} &bull; {new Date(tx.startDate).toLocaleDateString([],{month:"short",day:"numeric"})} to {new Date(tx.endDate).toLocaleDateString([],{month:"short",day:"numeric"})}</p>
                </div>
                <span className={`text-xs font-bold transition-transform ${open?"rotate-180":""}`}>&#9660;</span>
              </div>
              {open&&(<div className="mt-6 pt-6 border-t border-slate-800/10" onClick={e=>e.stopPropagation()}>
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                  <span>{new Date(tx.startDate).toLocaleDateString()}</span><span>{new Date(tx.endDate).toLocaleDateString()}</span>
                </div>
                <div className="relative w-full h-1 bg-slate-800 rounded-full my-6 flex items-center">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{width:`${prog}%`}}/>
                  <div className="absolute left-0 w-2.5 h-2.5 rounded-full bg-slate-600 -translate-x-1/2"/>
                  <div className="absolute w-4 h-4 rounded-full bg-indigo-500 border-2 border-white -translate-x-1/2 shadow-md" style={{left:`${prog}%`}}/>
                  <div className="absolute right-0 w-2.5 h-2.5 rounded-full bg-slate-600 translate-x-1/2"/>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-slate-400">Total paid: <span className="font-black text-emerald-400">Rs.{tx.totalPaid?.toLocaleString()}</span></p>
                  <button onClick={()=>navigate("/orders")} className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5">Go to Orders</button>
                </div>
              </div>)}
            </div>);
          })}</div>)}
        </div>

        {/* ACTIVE LENDING TRACKERS */}
        <div className={`mt-8 p-8 rounded-3xl border transition-all ${isNight ? "bg-slate-900/60 border-slate-800 text-white" : "bg-white border-indigo-50 text-slate-800"}`}>
          <h3 className="text-xl font-black mb-1 flex items-center gap-2 text-indigo-400"><Truck className="w-5 h-5 inline mr-2" /> Active Lending</h3>
          <p className="text-xs text-slate-500 mb-6">Your listings currently rented out to others.</p>
          {txLoading ? (<div className="space-y-3">{[1,2].map(i=><div key={i} className="h-16 rounded-2xl bg-slate-800/40 animate-pulse"/>)}</div>)
          : lendingItems.filter(tx=>ACTIVE.has(tx.status)).length===0 ? (<p className="text-sm text-slate-500">No active lending right now.</p>)
          : (<div className="space-y-4">{lendingItems.filter(tx=>ACTIVE.has(tx.status)).map(tx=>{
            const open=expandedCard===tx._id+"-l", prog=calcProgress(tx.startDate,tx.endDate);
            return (<div key={tx._id+"-l"} onClick={()=>setExpandedCard(open?null:tx._id+"-l")} className={`p-5 rounded-2xl border cursor-pointer hover:border-indigo-500/50 transition-all ${isNight?"bg-slate-950 border-slate-800":"bg-white border-slate-100"}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-extrabold text-sm text-indigo-400">{tx.title}</h4>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${STATUS_BADGE[tx.status]||"bg-slate-700/20 text-slate-400"}`}>{tx.status}</span>
                  </div>
                  <p className="text-xs text-slate-400">Rs.{tx.dailyRate}/day &bull; Borrower: {tx.borrower?.name||"—"} &bull; {new Date(tx.startDate).toLocaleDateString([],{month:"short",day:"numeric"})} to {new Date(tx.endDate).toLocaleDateString([],{month:"short",day:"numeric"})}</p>
                </div>
                <span className={`text-xs font-bold transition-transform ${open?"rotate-180":""}`}>&#9660;</span>
              </div>
              {open&&(<div className="mt-6 pt-6 border-t border-slate-800/10" onClick={e=>e.stopPropagation()}>
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                  <span>{new Date(tx.startDate).toLocaleDateString()}</span><span>{new Date(tx.endDate).toLocaleDateString()}</span>
                </div>
                <div className="relative w-full h-1 bg-slate-800 rounded-full my-4 flex items-center">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" style={{width:`${prog}%`}}/>
                  <div className="absolute left-0 w-2.5 h-2.5 rounded-full bg-slate-600 -translate-x-1/2"/>
                  <div className="absolute w-4 h-4 rounded-full bg-violet-500 border-2 border-white -translate-x-1/2 shadow-md" style={{left:`${prog}%`}}/>
                  <div className="absolute right-0 w-2.5 h-2.5 rounded-full bg-slate-600 translate-x-1/2"/>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-slate-400">Security held: <span className="font-black text-emerald-400">Rs.{tx.securityDeposit?.toLocaleString()}</span></p>
                  <button onClick={()=>navigate("/orders")} className="text-[10px] font-black text-violet-400 hover:text-violet-300 px-3 py-1.5 rounded-lg border border-violet-500/20 bg-violet-500/5">Go to Orders</button>
                </div>
              </div>)}
            </div>);
          })}</div>)}
        </div>

        {/* ORDER HISTORY */}
        <div className={`mt-8 p-8 rounded-3xl border transition-all ${isNight ? "bg-slate-900/60 border-slate-800 text-white" : "bg-white border-indigo-50 text-slate-800"}`}>
          <h3 className="text-xl font-black mb-1 flex items-center gap-2 text-indigo-400"><ShoppingBag className="w-5 h-5 inline mr-2" /> Transaction History</h3>
          <p className="text-xs text-slate-500 mb-6">All completed, declined, and closed transactions.</p>
          {txLoading ? (<div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-14 rounded-2xl bg-slate-800/40 animate-pulse"/>)}</div>)
          : (()=>{
            const hist=[...rentingItems.filter(tx=>HISTORY.has(tx.status)),...lendingItems.filter(tx=>HISTORY.has(tx.status))].sort((a,b)=>new Date(b.endDate)-new Date(a.endDate));
            if(!hist.length) return <p className="text-sm text-slate-500">No completed transactions yet.</p>;
            return (<div className="space-y-4">{hist.map(tx=>{
              const open=expandedCard===tx._id+"-h";
              const isBorrower=tx.borrower?._id?.toString()===currentUserId?.toString()||tx.borrower?.toString()===currentUserId?.toString();
              return (<div key={tx._id+"-h"} onClick={()=>setExpandedCard(open?null:tx._id+"-h")} className={`p-5 rounded-2xl border cursor-pointer hover:border-indigo-500/50 transition-all ${isNight?"bg-slate-950 border-slate-800":"bg-white border-slate-100"}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-extrabold text-sm text-indigo-400">{tx.title}</h4>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${STATUS_BADGE[tx.status]||"bg-slate-700/20 text-slate-400"}`}>{tx.status}</span>
                      <span className="text-[10px] text-slate-500">{isBorrower?"rented":"lent"}</span>
                      {tx.productType==="SECOND_HAND"&&<span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-black">SALE</span>}
                    </div>
                    <p className="text-xs text-slate-400">Rs.{tx.totalPaid?.toLocaleString()} total &bull; {isBorrower?`Owner: ${tx.owner?.name||"—"}`:`Borrower: ${tx.borrower?.name||"—"}`} &bull; {new Date(tx.endDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-bold transition-transform ${open?"rotate-180":""}`}>&#9660;</span>
                </div>
                {open&&(<div className="mt-4 pt-4 border-t border-slate-800/10 text-xs text-slate-400 space-y-1" onClick={e=>e.stopPropagation()}>
                  <p>Start: <span className="font-bold text-slate-300">{new Date(tx.startDate).toLocaleDateString()}</span></p>
                  <p>End: <span className="font-bold text-slate-300">{new Date(tx.endDate).toLocaleDateString()}</span></p>
                  <p>Rate: <span className="font-bold text-slate-300">Rs.{tx.dailyRate}/day</span></p>
                  <p>Security: <span className="font-bold text-slate-300">Rs.{tx.securityDeposit?.toLocaleString()}</span></p>
                </div>)}
              </div>);
            })}</div>);
          })()}
        </div>

      </div>



      {/* Choice Modal (Options Menu when profile pic is clicked, Instagram/Github style) */}
      {showChoiceModal && (
        <div 
          className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-950/70 backdrop-blur-md animate-fade-in" 
          onClick={() => setShowChoiceModal(false)}
        >
          <div 
            className={`w-[90%] max-w-sm rounded-3xl p-6 border shadow-2xl transition-all duration-300 transform scale-100 ${isNight ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-indigo-50 text-slate-800"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-center font-black text-sm tracking-wide uppercase text-indigo-400 mb-6">Change Profile Photo</h3>
            
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-3.5 rounded-2xl text-xs font-bold text-center border cursor-pointer transition-all ${isNight ? "bg-slate-950 border-slate-800 hover:bg-slate-850 hover:text-indigo-400" : "bg-indigo-50/40 border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600"}`}
              >
                ≡ƒôü Upload from Device
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const dataUrl = event.target?.result;
                      if (typeof dataUrl === "string") {
                        handleImageLoad(dataUrl);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              
              <button 
                onClick={async () => {
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 480, aspectRatio: 1 } });
                    setCameraStream(stream);
                    setIsCameraActive(true);
                    setRawImage("");
                    setShowChoiceModal(false);
                    setShowCropModal(true);
                  } catch (err) {
                    console.error("Camera error:", err);
                    setShowNotification("Unable to access camera. Check device permissions.");
                  }
                }}
                className={`w-full py-3.5 rounded-2xl text-xs font-bold text-center border cursor-pointer transition-all ${isNight ? "bg-slate-950 border-slate-800 hover:bg-slate-850 hover:text-indigo-400" : "bg-indigo-50/40 border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600"}`}
              >
                ≡ƒô╖ Take Photo with Camera
              </button>
              
              {profilePic && (
                <button 
                  onClick={() => {
                    setProfilePic("");
                    localStorage.removeItem("userProfilePic");
                    setShowChoiceModal(false);
                    setShowNotification("Profile photo deleted successfully.");
                  }}
                  className="w-full py-3.5 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 text-red-400 rounded-2xl text-xs font-bold text-center cursor-pointer transition-all"
                >
                  ≡ƒùæ∩╕Å Remove Current Photo
                </button>
              )}
              
              <button 
                onClick={() => setShowChoiceModal(false)}
                className={`w-full py-3.5 mt-2 rounded-2xl text-xs font-bold text-center border cursor-pointer transition-all ${isNight ? "border-slate-800 text-slate-400 hover:text-white" : "border-slate-200 text-slate-500 hover:text-slate-800"}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Square Image Crop & Arrange Modal */}
      {showCropModal && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in" onClick={() => {
          if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
          }
          setShowCropModal(false);
        }}>
          <div 
            className={`w-[90%] max-w-md rounded-3xl p-6 border shadow-2xl transition-colors ${isNight ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-indigo-50 text-slate-800"}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black mb-1">Position & Crop Avatar</h3>
            <p className="text-xs text-slate-400 mb-6">Arrange your display picture in the square box below.</p>

            {isCameraActive ? (
              /* CAMERA INTERFACE */
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-72 h-72 rounded-3xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover scale-x-[-1]" 
                    playsInline 
                    muted 
                  />
                  {/* Square highlight grid overlay */}
                  <div className="absolute inset-4 border-2 border-dashed border-indigo-500/40 pointer-events-none rounded-2xl"></div>
                </div>
                
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => {
                      if (cameraStream) {
                        cameraStream.getTracks().forEach(track => track.stop());
                        setCameraStream(null);
                      }
                      setIsCameraActive(false);
                      setShowCropModal(false);
                    }}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isNight ? "border-slate-800 text-slate-400 hover:text-white" : "border-slate-200 text-slate-650 hover:text-slate-850"}`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (videoRef.current) {
                        const video = videoRef.current;
                        const canvas = document.createElement("canvas");
                        const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext("2d");
                        if (ctx) {
                          // Mirror capture to match preview and crop center square
                          ctx.translate(canvas.width, 0);
                          ctx.scale(-1, 1);
                          
                          const startX = (video.videoWidth - size) / 2;
                          const startY = (video.videoHeight - size) / 2;
                          ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
                          
                          const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
                          if (cameraStream) {
                            cameraStream.getTracks().forEach(track => track.stop());
                            setCameraStream(null);
                          }
                          handleImageLoad(dataUrl);
                        }
                      }
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-xs font-bold hover:scale-102 transition-all cursor-pointer shadow-lg"
                  >
                    ≡ƒô╕ Capture Photo
                  </button>
                </div>
              </div>
            ) : (
              /* POSITION/CROP INTERFACE */
              <div className="flex flex-col items-center gap-4">
                {/* Square Crop Frame Container */}
                <div 
                  className="relative w-72 h-72 overflow-hidden bg-slate-950 rounded-3xl border border-indigo-500/20 cursor-move flex items-center justify-center select-none"
                  onMouseDown={(e) => {
                    setIsDragging(true);
                    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                  }}
                  onMouseMove={(e) => {
                    if (!isDragging) return;
                    setPan({
                      x: e.clientX - dragStart.x,
                      y: e.clientY - dragStart.y
                    });
                  }}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    setIsDragging(true);
                    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
                  }}
                  onTouchMove={(e) => {
                    if (!isDragging) return;
                    const touch = e.touches[0];
                    setPan({
                      x: touch.clientX - dragStart.x,
                      y: touch.clientY - dragStart.y
                    });
                  }}
                  onTouchEnd={() => setIsDragging(false)}
                >
                  {rawImage && (
                    <img 
                      src={rawImage} 
                      alt="Crop Source" 
                      draggable="false"
                      className="absolute max-w-none origin-center pointer-events-none transition-transform duration-75"
                      style={{
                        width: `${imgDetails.wBase}px`,
                        height: `${imgDetails.hBase}px`,
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      }}
                    />
                  )}
                  {/* Square Outline Guide with Instagram-style blurred vignette shadow */}
                  <div className="absolute inset-4 border-2 border-white/60 pointer-events-none rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]"></div>
                  {/* Grid Lines inside the crop guide */}
                  <div className="absolute inset-4 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                    <div className="border-r border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-b border-white"></div>
                    <div className="border-r border-white"></div>
                    <div className="border-r border-white"></div>
                    <div></div>
                  </div>
                </div>

                {/* Zoom Controller */}
                <div className="w-full flex items-center gap-3 mt-2 px-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Zoom</span>
                  <input 
                    type="range" 
                    min={1} 
                    max={3} 
                    step={0.02} 
                    value={zoom} 
                    onChange={(e) => setZoom(+e.target.value)} 
                    className="flex-1 accent-indigo-500 h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800" 
                  />
                  <span className="text-xs text-indigo-400 font-black w-10 text-right">{Math.round(zoom * 100)}%</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 w-full mt-2">
                  <button 
                    onClick={() => setShowCropModal(false)}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isNight ? "border-slate-800 text-slate-400 hover:text-white" : "border-slate-200 text-slate-600 hover:text-slate-900"}`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      const img = new Image();
                      img.onload = () => {
                        const canvas = document.createElement("canvas");
                        canvas.width = 400;
                        canvas.height = 400;
                        const ctx = canvas.getContext("2d");
                        if (ctx) {
                          // Draw background
                          ctx.fillStyle = isNight ? "#09090b" : "#ffffff";
                          ctx.fillRect(0, 0, 400, 400);

                          // Preserve aspect ratio crop offsets logic
                          const S = 288;
                          const C = 400;
                          const scaleFactor = C / S;
                          
                          // Base dimensions scaled by current zoom and scale factor to export resolution
                          const wCanvas = imgDetails.wBase * zoom * scaleFactor;
                          const hCanvas = imgDetails.hBase * zoom * scaleFactor;
                          
                          // Canvas coordinates centering and offset calculations
                          const xCanvas = (C - wCanvas) / 2 + (pan.x * scaleFactor);
                          const yCanvas = (C - hCanvas) / 2 + (pan.y * scaleFactor);

                          ctx.save();
                          ctx.drawImage(img, xCanvas, yCanvas, wCanvas, hCanvas);
                          ctx.restore();

                          const croppedUrl = canvas.toDataURL("image/jpeg", 0.95);
                          setProfilePic(croppedUrl);
                          localStorage.setItem("userProfilePic", croppedUrl);
                          API.put("/auth/profile", { profilePic: croppedUrl })
                            .catch(err => console.error("Error saving profile pic to backend:", err));
                          setShowCropModal(false);
                          setShowNotification("Avatar cropped and updated successfully! ≡ƒÄë");
                        }
                      };
                      img.src = rawImage;
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-xs font-bold hover:scale-102 transition-all cursor-pointer shadow-md"
                  >
                    Apply & Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Modern Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-6 left-6 z-[110] flex items-center gap-3 bg-slate-950 border border-indigo-500/30 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-[0_12px_40px_rgba(99,102,241,0.2)] animate-slide-in">
          <span className="text-indigo-400 font-black">≡ƒöö Alert:</span>
          <span>{showNotification}</span>
          <button onClick={() => setShowNotification("")} className="ml-3 text-slate-400 hover:text-white font-extrabold">Γ£ò</button>
        </div>
      )}
    </div>
  );
}