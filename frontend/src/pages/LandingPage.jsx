import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CityStreetScene } from "../components/CityStreetScene";
import API from "../api"; 
import { STORAGE_KEYS } from "../constants/auth";
import PostProductModal from "../components/PostProductModal";
import NotificationBell from "../components/NotificationBell";

// ── Floating particles ──────────────────────────────────────────────────────
const Particle = ({ style }) => (
  <div className="absolute rounded-full pointer-events-none opacity-20 animate-float" style={style} />
);

// ── Modern Cartoon SVGs for How It Works ────────────────────────────────────
const CartoonVerify = () => (
  <svg viewBox="0 0 120 130" className="w-24 h-24 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="115" rx="28" ry="6" fill="#e0e7ff" opacity="0.5"/>
    <rect x="30" y="75" width="60" height="42" rx="8" fill="#6366f1"/>
    <rect x="36" y="81" width="48" height="30" rx="5" fill="#818cf8"/>
    <rect x="40" y="86" width="20" height="3" rx="2" fill="white" opacity="0.7"/>
    <circle cx="75" cy="94" r="10" fill="#a5b4fc"/>
    <circle cx="60" cy="44" r="22" fill="#fde68a"/>
    <circle cx="52" cy="40" r="3" fill="#1e1b4b"/>
    <circle cx="68" cy="40" r="3" fill="#1e1b4b"/>
    <path d="M52 52 Q60 58 68 52" stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="88" cy="88" r="10" fill="#22c55e"/>
    <text x="83" y="93" fontSize="12" fill="white" fontWeight="bold">✓</text>
  </svg>
);

const CartoonPost = () => (
  <svg viewBox="0 0 120 130" className="w-24 h-24 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="118" rx="28" ry="5" fill="#d1fae5" opacity="0.5"/>
    <rect x="25" y="55" width="70" height="60" rx="10" fill="#10b981"/>
    <rect x="31" y="61" width="58" height="48" rx="7" fill="#34d399"/>
    <circle cx="60" cy="35" r="20" fill="#bfdbfe"/>
    <circle cx="52" cy="31" r="2.5" fill="#1e3a5f"/>
    <circle cx="68" cy="31" r="2.5" fill="#1e3a5f"/>
    <path d="M53 41 Q60 46 67 41" stroke="#1e3a5f" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <text x="76" y="56" fontSize="9" fill="white" fontWeight="bold" transform="rotate(15 76 56)">📦</text>
  </svg>
);

const CartoonNegotiate = () => (
  <svg viewBox="0 0 140 130" className="w-28 h-24 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="38" cy="38" r="20" fill="#fca5a5"/>
    <path d="M32 44 Q38 50 44 44" stroke="#7f1d1d" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <rect x="12" y="58" width="52" height="40" rx="9" fill="#ef4444"/>
    <circle cx="102" cy="38" r="20" fill="#6ee7b7"/>
    <rect x="76" y="58" width="52" height="40" rx="9" fill="#10b981"/>
    <rect x="55" y="72" width="30" height="16" rx="8" fill="#f59e0b"/>
    <text x="60" y="83" fontSize="9" fill="white" fontWeight="bold">DEAL!</text>
  </svg>
);

const CartoonDeal = () => (
  <svg viewBox="0 0 120 130" className="w-24 h-24 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="38" r="22" fill="#c4b5fd"/>
    <path d="M51 45 Q60 54 69 45" stroke="#2e1065" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <rect x="28" y="60" width="64" height="50" rx="10" fill="#7c3aed"/>
    <circle cx="82" cy="82" r="10" fill="#fbbf24"/>
    <text x="78" y="86" fontSize="11" fill="white" fontWeight="bold">🤝</text>
  </svg>
);

// ── Trust Badge ─────────────────────────────────────────────────────────────
const TrustBadge = ({ icon, label, isNight }) => (
  <div className={`flex items-center gap-2 backdrop-blur px-4 py-2 rounded-full shadow-sm text-sm font-semibold ${isNight ? "bg-slate-900/80 border border-slate-800 text-slate-200" : "bg-white/80 border border-indigo-100 text-slate-700"}`}>
    <span className="text-lg">{icon}</span> {label}
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

// ── Chat Message ────────────────────────────────────────────────────────────
const ChatMsg = ({ from, text, isNight }) => (
  <div className={`flex ${from === "bot" ? "justify-start" : "justify-end"} mb-2`}>
    {from === "bot" && <span className="text-xl mr-2">🤖</span>}
    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${from === "bot" ? (isNight ? "bg-slate-880 text-slate-100 rounded-tl-none" : "bg-indigo-50 text-slate-700 rounded-tl-none") : "bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-tr-none"}`}>
      {text}
    </div>
  </div>
);

const getImageUrl = (image) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.url || "";
};

// ── Premium Product Card with Image Slider & Emojis ─────────────────────────
const ProductCard = ({ item, isNight, isBookmarked, onBookmarkToggle, onCardClick, userCoords, coordsLoading, coordsError, isOwnerCard = false, onToggleStatus, onDeleteProduct }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const [showFadeMsg, setShowFadeMsg] = useState(false);

  // Fallback slider images or static emoji display
  const images = item.images || [];

  const handlePrev = (e) => {
    e.stopPropagation();
    if (images.length > 1) {
      setImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    } else {
      triggerFadeMsg();
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (images.length > 1) {
      setImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    } else {
      triggerFadeMsg();
    }
  };

  const triggerFadeMsg = () => {
    setShowFadeMsg(true);
    setTimeout(() => setShowFadeMsg(false), 2000);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  return (
    <div 
      onClick={() => onCardClick?.(item)}
      className={`flex-shrink-0 w-[280px] sm:w-[320px] group relative rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border ${
        isNight ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"
      } hover:-translate-y-2 cursor-pointer`}
    >
      {/* Category/Status Badge */}
      {isOwnerCard ? (
        <div className={`absolute top-3 left-3 z-10 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
          item.badge === "INACTIVE" ? "bg-red-500" : "bg-emerald-500"
        }`}>
          {item.badge}
        </div>
      ) : (
        item.badge && (
          <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {item.badge}
          </div>
        )
      )}

      {/* Bookmark Button */}
      {!isOwnerCard && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onBookmarkToggle(item);
          }}
          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow transition-all cursor-pointer ${
            isBookmarked ? "bg-red-500 text-white hover:bg-red-600 scale-110" : "bg-slate-900/60 text-white hover:bg-indigo-500"
          }`}
          title={isBookmarked ? "Remove Bookmark" : "Bookmark Item"}
        >
          {isBookmarked ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
              <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          )}
        </button>
      )}

      {/* Image / Carousel Layer */}
      <div className={`h-40 relative flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300 overflow-hidden ${
        isNight ? "bg-gradient-to-br from-slate-800 to-slate-950" : "bg-gradient-to-br from-indigo-50 to-violet-50"
      }`}>
        {images.length > 0 ? (
          <img src={getImageUrl(images[imgIndex])} alt={item.title} className="w-full h-full object-contain p-3" />
        ) : (
          <span className="select-none">{item.emoji}</span>
        )}

        {/* Carousel controls - Custom Heroicons with no background circle */}
        <button 
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:text-indigo-400 transition-colors z-20 cursor-pointer"
          title="Previous Image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 filter drop-shadow">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
          </svg>
        </button>

        <button 
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:text-indigo-400 transition-colors z-20 cursor-pointer"
          title="Next Image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 filter drop-shadow">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
          </svg>
        </button>

        {/* Fade out fallback message */}
        {showFadeMsg && (
          <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center p-3 text-center transition-all duration-300 z-30">
            <span className="text-[10px] sm:text-xs font-black uppercase text-white tracking-widest animate-pulse">
              Owner did not upload the image yet.
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1.5">
        <h3 className={`font-black text-sm truncate ${isNight ? "text-slate-100" : "text-slate-800"}`}>
          {item.title}
        </h3>
        
        <div className="flex items-baseline gap-1">
          <span className="text-indigo-400 font-black text-base">₹{item.price}</span>
          <span className="text-[10px] text-slate-400 font-normal">/{item.unit || "day"}</span>
        </div>

        {item.securityDeposit !== undefined && item.securityDeposit > 0 && (
          <p className="text-[10px] text-slate-450 font-bold">
            🛡️ Security Deposit: <span className="text-indigo-400">₹{item.securityDeposit}</span>
          </p>
        )}

        <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
          <span>👤</span> {item.owner}
        </p>

        <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
          <span>📍</span> {item.area || "Local"}
        </p>

        <div className="mt-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center w-full">
          {isOwnerCard ? (
            <div className="flex gap-2 w-full">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStatus?.(item.id);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black text-white shadow-md active:scale-95 transition-all cursor-pointer text-center ${
                  item.badge === "INACTIVE" 
                    ? "bg-slate-700 hover:bg-slate-650 border border-slate-650" 
                    : "bg-emerald-600 hover:bg-emerald-500 border border-emerald-500"
                }`}
              >
                {item.badge === "INACTIVE" ? "🟢 Enable" : "🔴 Disable"}
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProduct?.(item.id);
                }}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/25 p-2 rounded-xl text-xs font-black active:scale-95 transition-all cursor-pointer flex items-center justify-center aspect-square"
                title="Delete Listing permanently"
              >
                🗑️
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col">
                <span className="text-[8px] uppercase tracking-wider text-slate-400 font-black">Proximity</span>
                {coordsLoading ? (
                  <span className="text-[10px] text-indigo-400 font-bold animate-pulse">Calculating distance...</span>
                ) : coordsError ? (
                  <span className="text-[9px] text-amber-500 font-bold" title={coordsError}>Distance unavailable ⚠️</span>
                ) : (
                  <span className="text-xs text-indigo-400 font-black bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/25">
                    ⚡ {calculateDistance(
                      userCoords?.latitude,
                      userCoords?.longitude,
                      item.location?.coordinates?.[1],
                      item.location?.coordinates?.[0]
                    )} km away
                  </span>
                )}
              </div>
              <button className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] px-3.5 py-1.5 rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all cursor-pointer">
                {item.rowType === "Second-Hand" ? "Buy Out" : item.rowType === "Wishlist" ? "Offer" : "Rent Flow"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Page Component ────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  
  // Theme & Mobile Switchers
  const [isNight, setIsNight] = useState(() => localStorage.getItem("theme") === "night");
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem("user_name") || "Varun Tej");

  useEffect(() => {
    const activeToken = localStorage.getItem("token");
    if (activeToken) {
      API.get("/auth/me")
        .then(res => {
          if (res.data?.name) {
            setUserName(res.data.name);
            localStorage.setItem("user_name", res.data.name);
          }
        })
        .catch(err => console.error("Error loading user profile:", err));
    }
  }, []);

  const [userCoords, setUserCoords] = useState(null);
  const [coordsLoading, setCoordsLoading] = useState(true);
  const [coordsError, setCoordsError] = useState("");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setCoordsLoading(false);
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          setCoordsError("Distance unavailable. Enable location access to view distance.");
          setCoordsLoading(false);
        },
        { timeout: 10000 }
      );
    } else {
      setCoordsError("Distance unavailable. Geolocation is not supported by this browser.");
      setCoordsLoading(false);
    }
  }, []);

  // Address Panel
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [savedAddress, setSavedAddress] = useState(() => localStorage.getItem("saved_delivery_address") || "Add Address");
  const [pincodeInput, setPincodeInput] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  const [dbProducts, setDbProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [dbWishes, setDbWishes] = useState([]);

  const syncMyProducts = () => {
    const token = localStorage.getItem("token");
    if (token) {
      API.get("/rent/products/me")
        .then(res => setMyProducts(res.data))
        .catch(err => console.error("Error fetching my products:", err));
    } else {
      setMyProducts([]);
    }
  };

  const syncProducts = () => {
    API.get("/rent/products")
      .then(res => setDbProducts(res.data))
      .catch(err => console.error("Error fetching db products:", err));
    syncMyProducts();
  };

  const handleToggleStatus = async (productId) => {
    try {
      await API.put(`/rent/products/${productId}/toggle-status`);
      syncProducts();
      setShowNotification("Listing visibility status updated successfully!");
    } catch (err) {
      console.error("Error toggling status:", err);
      setShowNotification("Failed to update listing status.");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to permanently delete this listing? This action cannot be undone.")) return;
    try {
      await API.delete(`/rent/products/${productId}`);
      syncProducts();
      setShowNotification("Listing deleted successfully!");
    } catch (err) {
      console.error("Error deleting product:", err);
      setShowNotification("Failed to delete listing.");
    }
  };

  useEffect(() => {
    syncProducts();

    // Fetch wishes
    API.get("/wishes")
      .then(res => setDbWishes(res.data))
      .catch(err => console.error("Error fetching db wishes:", err));

    const token = localStorage.getItem("token");
    if (token) {
      API.get("/addresses")
        .then(response => {
          const defaultAddr = response.data.find(a => a.isDefault);
          if (defaultAddr) {
            const formatted = `${defaultAddr.firstName} ${defaultAddr.lastName} - ${defaultAddr.fullAddress}`;
            setSavedAddress(formatted);
            localStorage.setItem("saved_delivery_address", formatted);
          } else if (response.data.length > 0) {
            const formatted = `${response.data[0].firstName} ${response.data[0].lastName} - ${response.data[0].fullAddress}`;
            setSavedAddress(formatted);
            localStorage.setItem("saved_delivery_address", formatted);
          } else {
            setSavedAddress("Add Address");
            localStorage.setItem("saved_delivery_address", "Add Address");
          }
        })
        .catch(err => {
          console.error("Failed to load address for navbar sync:", err);
        });
    } else {
      setSavedAddress("Add Address");
      localStorage.setItem("saved_delivery_address", "Add Address");
    }
  }, []);

  // Notification / Toast popup
  const [showNotification, setShowNotification] = useState("");

  // Stats Counters
  const [itemsCount, setItemsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);

  // Tilt Graphic effect
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hey there! 👋 I'm RentBot. Ask me anything about renting, posting items, or how to negotiate deals!" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Centralized Bookmarked list
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  // Profile Specific triggers
  const [profilePic, setProfilePic] = useState(() => localStorage.getItem("userProfilePic") || "");
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [rawImage, setRawImage] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef(null);

  // Unified Return alert
  const [activeRentals, setActiveRentals] = useState([
    { id: "active-1", title: "Canon EOS R50 Camera", rate: "₹450/day", progress: 75, startDate: "12 May", endDate: "30 May" },
    { id: "active-2", title: "Honda Activa Scooter", rate: "₹250/day", progress: 40, startDate: "18 May", endDate: "05 June" }
  ]);

  // Load Bookmarks on Mount and hook sync updates
  useEffect(() => {
    const loaded = JSON.parse(localStorage.getItem("bookmarked_items") || "[]");
    setBookmarkedIds(loaded.map(x => x.id));
  }, []);

  const handleBookmarkToggle = (item) => {
    const existing = JSON.parse(localStorage.getItem("bookmarked_items") || "[]");
    const isBookmarked = bookmarkedIds.includes(item.id || item._id);

    let updated = [];
    if (isBookmarked) {
      updated = existing.filter(x => x.id !== (item.id || item._id));
      triggerToast(`Removed "${item.title}" from saved bookmarks!`);
    } else {
      const normalizedItem = {
        id: item.id || item._id,
        title: item.title,
        price: item.price || item.rentalPrice || item.budget,
        unit: item.unit || "day",
        owner: typeof item.owner === "object" ? item.owner?.name : (item.owner || "Local Owner"),
        area: item.area || item.distance || "Local",
        images: item.images || [],
        emoji: item.emoji || (item.title?.toLowerCase().includes("camera") ? "📷" : item.title?.toLowerCase().includes("scooter") || item.title?.toLowerCase().includes("activa") ? "🛵" : item.title?.toLowerCase().includes("playstation") || item.title?.toLowerCase().includes("ps5") ? "🎮" : "📦"),
        rowType: item.rowType || item.badge || "Saved"
      };
      updated = [...existing, normalizedItem];
      triggerToast(`Saved "${item.title}" to bookmarks! 🔖`);
    }

    localStorage.setItem("bookmarked_items", JSON.stringify(updated));
    setBookmarkedIds(updated.map(x => x.id));
  };

  const triggerToast = (msg) => {
    setShowNotification(msg);
  };

  // Body scroll lock effect
  useEffect(() => {
    if (sidePanelOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidePanelOpen]);

  // Autoclose alerts
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => setShowNotification(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  // Statistics load effect
  useEffect(() => {
    let start = 0;
    const endItems = 50000;
    const endUsers = 120000;
    const steps = 50;

    const timer = setInterval(() => {
      start += 1;
      if (start >= steps) {
        setItemsCount(endItems);
        setUsersCount(endUsers);
        clearInterval(timer);
      } else {
        setItemsCount(Math.floor((start / steps) * endItems));
        setUsersCount(Math.floor((start / steps) * endUsers));
      }
    }, 30);

    return () => clearInterval(timer);
  }, []);

  // Theme Toggler
  const toggleTheme = () => {
    setIsNight((prev) => {
      const next = !prev;
      localStorage.setItem("theme", next ? "night" : "day");
      if (next) {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
      }
      return next;
    });
  };

  // Smooth scroll helper
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handlePostItemClick = (e) => {
    e.preventDefault();
    scrollToSection("browse-section");
  };

  // Geocoding Localities resolution
  const handleApplyPincode = async (pincodeToApply) => {
    const pin = pincodeToApply || pincodeInput;
    if (!pin || pin.length < 6 || !/^\d{6}$/.test(pin)) {
      setPincodeError("Please enter a valid 6-digit pincode.");
      return;
    }
    
    setIsDetecting(true);
    setPincodeError("");

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await response.json();
      setIsDetecting(false);
      
      if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice[0]) {
        const po = data[0].PostOffice[0];
        const locationName = `${po.Name} ${pin}`;
        localStorage.setItem("saved_delivery_address", locationName);
        setSavedAddress(locationName);
        setAddressModalOpen(false);
        triggerToast(`Location updated! Services to ${locationName} 📍`);
      } else {
        setPincodeError("Could not resolve location for this pincode.");
      }
    } catch (err) {
      setIsDetecting(false);
      setPincodeError("Error resolving pincode location.");
    }
  };

  // Avatar Upload Aspect Helper
  const handleImageLoad = (dataUrl) => {
    const img = new Image();
    img.onload = () => {
      const S = 288;
      const ratio = img.width / img.height;
      let wBase = S, hBase = S;
      if (ratio > 1) {
        wBase = S * ratio;
        hBase = S;
      } else {
        wBase = S;
        hBase = S / ratio;
      }
      setImgDetails({ wBase, hBase });
      setRawImage(dataUrl);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setShowChoiceModal(false);
      setShowCropModal(true);
    };
    img.src = dataUrl;
  };
  const [imgDetails, setImgDetails] = useState({ wBase: 288, hBase: 288 });

  // Unified Chat messaging
  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { from: "user", text: chatInput };
    setMessages((p) => [...p, userMsg]);
    setChatInput("");
    setIsTyping(true);

    try {
      const response = await API.post("/ai/chat", {
        message: chatInput,
        context: "Renting and negotiating items in Hyderabad."
      });
      setMessages((p) => [...p, { from: "bot", text: response.data.reply }]);
    } catch (err) {
      setMessages((p) => [...p, { from: "bot", text: "Sorry, I'm having trouble connecting right now! 🔌" }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Auth checking
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const isLoggedIn = !!token;

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    setSidePanelOpen(false);
    setMyProducts([]);
    triggerToast("Logged out successfully. Authentication wiped!");
  };

  // Mock card lists corresponding to 4 Rows
  const rowRentItems = [
    { id: "r-1", title: "Canon EOS R50 Camera", price: 450, emoji: "📷", owner: "Arjun K.", distance: "1.2 km away", badge: "Popular 🔥" },
    { id: "r-2", title: "Honda Activa Scooter", price: 250, emoji: "🛵", owner: "Rahul P.", distance: "2.5 km away", badge: "Trending" },
    { id: "r-3", title: "PlayStation 5 Console", price: 350, emoji: "🎮", owner: "Aman G.", distance: "3.1 km away" },
    { id: "r-4", title: "DeWalt Power Drill Set", price: 120, emoji: "🔧", owner: "Suresh B.", distance: "0.8 km away" }
  ];

  const rowListedItems = [
    { id: "l-1", title: "Specialized Carbon Road Bike", price: 600, emoji: "🚴", owner: `${userName} (You)`, distance: "0.0 km away", badge: "Active" },
    { id: "l-2", title: "MacBook Pro 14\" M3 Max", price: 800, emoji: "💻", owner: `${userName} (You)`, distance: "0.0 km away", badge: "Pending Deal" }
  ];

  const rowSecondHandItems = [
    { id: "s-1", title: "DJI Mavic Air 2 Drone", price: 45000, emoji: "🚁", owner: "Ravi M.", distance: "4.2 km away", badge: "Direct Sale", unit: "flat" },
    { id: "s-2", title: "Bose Noise Cancelling Headphones", price: 14500, emoji: "🎧", owner: "Kiran T.", distance: "2.1 km away", unit: "flat" }
  ];

  const rowRequestedItems = [
    { id: "w-1", title: "2-Person Camping Tent", price: 150, emoji: "⛺", owner: "Meera N.", distance: "1.9 km away", badge: "High Priority" },
    { id: "w-2", title: "Fender Stratocaster Guitar", price: 200, emoji: "🎸", owner: "Kiran T.", distance: "3.5 km away" }
  ];

  const particles = [
    { width: 8, height: 8, background: "#818cf8", top: "10%", left: "5%", animationDuration: "6s" },
    { width: 12, height: 12, background: "#f59e0b", top: "25%", left: "90%", animationDuration: "8s" }
  ];

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden transition-colors duration-500 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`} style={{ fontFamily: "'Nunito', 'Poppins', sans-serif" }}>
      
      {/* ── STYLE BLOCKS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes chatPop {
          0% { transform: scale(0.5) translateY(40px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-float { animation: float var(--dur, 6s) ease-in-out infinite; }
        .chat-pop { animation: chatPop 0.4s cubic-bezier(.34,1.56,.64,1) forwards; }
        .marquee-inner { animation: marquee 22s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>



      {/* ── NAVBAR ── */}
      <nav className={`sticky top-0 z-[45] backdrop-blur-md border-b shadow-sm transition-colors duration-500 ${isNight ? "bg-slate-950/90 border-slate-900" : "bg-white/90 border-slate-100"}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-xl shadow-md">R</div>
            <span className={`text-xl font-black transition-colors ${isNight ? "text-white" : "text-slate-800"}`} style={{ fontFamily: "'Playfair Display', serif" }}>
              Rent<span className="text-indigo-500">It</span>
            </span>
          </div>

          {/* Amazon-style Address Panel */}
          <button
            onClick={() => navigate("/addresses")}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 text-left focus:outline-none ${
              isNight 
                ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850" 
                : "bg-slate-50 border-slate-200 text-slate-605 hover:text-indigo-600 hover:bg-slate-100"
            }`}
            title="Services to location"
          >
            <span className="text-base select-none">📍</span>
            <div className="flex flex-col">
              <span className={`text-[9px] font-bold uppercase leading-none tracking-wider ${isNight ? "text-slate-450" : "text-slate-500"}`}>
                services to
              </span>
              <span className={`text-xs font-black leading-tight truncate max-w-[150px] ${isNight ? "text-slate-200" : "text-slate-800"}`}>
                {savedAddress}
              </span>
            </div>
          </button>

          {/* Center nav links */}
          <div className={`hidden md:flex items-center gap-6 text-sm font-bold transition-colors ${isNight ? "text-slate-300" : "text-slate-600"}`}>
            <button onClick={() => navigate("/rent-catalog")} className="hover:text-indigo-500 transition-colors duration-200">Rent Hub</button>
            <button onClick={() => navigate("/second-hand-catalog")} className="hover:text-indigo-500 transition-colors duration-200">Second-Hand</button>
            <button onClick={() => navigate("/requested-catalog")} className="hover:text-indigo-500 transition-colors duration-200">Requests Hub</button>
            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-indigo-500 transition-colors duration-200">How It Works</button>
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



            {isLoggedIn && (
              <NotificationBell isNight={isNight} />
            )}

            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 focus:outline-none ${
                    isNight
                      ? "bg-slate-900 border-slate-800 text-slate-350 hover:text-white hover:bg-slate-850"
                      : "bg-slate-50 border-slate-200 text-slate-650 hover:text-indigo-600 hover:bg-slate-100"
                  }`}
                  title="Profile Menu"
                >
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-7 h-7 rounded-lg object-cover" />
                  ) : (
                    <span className="text-lg">👤</span>
                  )}
                  <span className={`text-xs font-black mr-1 hidden sm:inline ${isNight ? "text-slate-200" : "text-slate-800"}`}>{userName}</span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </button>
                {profileDropdownOpen && (
                  <>
                    {/* Invisible overlay for click-outside closure */}
                    <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                    <div className={`absolute right-0 mt-2 w-48 rounded-2xl shadow-xl border p-2 z-50 animate-fade-in ${
                      isNight ? "bg-slate-900 border-slate-850 text-white" : "bg-white border-slate-100 text-slate-800"
                    }`}>
                      <button
                        onClick={() => { setProfileDropdownOpen(false); navigate("/profile"); }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black transition-colors flex items-center gap-2 ${
                          isNight ? "hover:bg-slate-800 text-slate-200 hover:text-indigo-400" : "hover:bg-indigo-50 text-slate-700 hover:text-indigo-650"
                        }`}
                      >
                        <span>👤</span> My Profile
                      </button>
                      <button
                        onClick={() => { setProfileDropdownOpen(false); navigate("/orders"); }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black transition-colors flex items-center gap-2 ${
                          isNight ? "hover:bg-slate-800 text-slate-200 hover:text-indigo-400" : "hover:bg-indigo-50 text-slate-700 hover:text-indigo-650"
                        }`}
                      >
                        <span>📦</span> My Orders
                      </button>
                      <button
                        onClick={() => { setProfileDropdownOpen(false); navigate("/saved"); }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black transition-colors flex items-center gap-2 ${
                          isNight ? "hover:bg-slate-800 text-slate-200 hover:text-indigo-400" : "hover:bg-indigo-50 text-slate-700 hover:text-indigo-650"
                        }`}
                      >
                        <span>🔖</span> Saved Items
                      </button>
                      <div className={`border-t my-1 ${isNight ? "border-slate-800" : "border-slate-100"}`}></div>
                      <button
                        onClick={() => { setProfileDropdownOpen(false); handleLogout(); }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black transition-colors flex items-center gap-2 ${
                          isNight ? "hover:bg-red-500/10 text-red-400" : "hover:bg-red-50 text-red-650"
                        }`}
                      >
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
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
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-20 px-4" style={{ background: isNight ? "#09090b" : "#fdf6ee", transition: "background 0.5s ease" }}>
        <CityStreetScene isNight={isNight} />
        {particles.map((p, i) => (
          <Particle key={i} style={{ ...p, "--dur": p.animationDuration }} />
        ))}

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
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
              <button onClick={() => navigate("/rent-catalog")} className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 active:scale-95 cursor-pointer">
                🚀 Start Renting
              </button>
              <button 
                onClick={() => {
                  if (isLoggedIn) {
                    setPostModalOpen(true);
                  } else {
                    navigate("/login");
                  }
                }} 
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer"
              >
                📢 Post an Item
              </button>
              <button onClick={() => navigate("/orders")} className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-lg shadow-md hover:shadow-xl border-2 border-indigo-200 hover:border-indigo-400 hover:scale-105 transition-all duration-200 cursor-pointer">
                📦 My Orders
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <TrustBadge icon="🔒" label="Secure Payments" isNight={isNight} />
              <TrustBadge icon="✅" label="Verified Users" isNight={isNight} />
              <TrustBadge icon="🤝" label="Deal Guarantee" isNight={isNight} />
            </div>
          </div>

          <div className="slide-right flex justify-center">
            <div
              className="relative cursor-pointer"
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
                <div className={`rounded-2xl p-3 mb-3 ${isNight ? "bg-slate-950" : "bg-indigo-50"}`}>
                  <p className="text-xs text-slate-500 mb-1">💬 Price Negotiation</p>
                  <p className="text-xs font-bold text-indigo-400">"Can you do ₹380 for 3 days?" 🤔</p>
                </div>
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

      {/* ── FOUR DISTINCT HORIZONTAL PRODUCT CARD ROWS ── */}
      <section className="max-w-7xl mx-auto px-4 py-16 space-y-16">
        
        {/* Row 1: Items Available For Rent */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className={`text-2xl font-black tracking-tight ${isNight ? "text-white" : "text-black"}`} style={{ fontFamily: "'Playfair Display', serif" }}>
              🛒 Items Available For Rent
            </h2>
            <button onClick={() => navigate("/rent-catalog")} className="text-xs font-black text-indigo-500 hover:underline">
              View All Rental Hub
            </button>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {dbProducts.filter(p => p.productType === "RENT").map((item) => (
              <ProductCard 
                key={item._id} 
                item={{ id: item._id, title: item.title, price: item.rentalPrice, emoji: "📷", owner: item.owner?.name || "Owner", area: item.area, badge: item.status, location: item.location, securityDeposit: item.securityDeposit, images: item.images }} 
                isNight={isNight} 
                isBookmarked={bookmarkedIds.includes(item._id)}
                onBookmarkToggle={() => handleBookmarkToggle({ id: item._id, ...item })}
                onCardClick={() => navigate(`/product/${item._id}`)}
                userCoords={userCoords}
                coordsLoading={coordsLoading}
                coordsError={coordsError}
              />
            ))}
          </div>
        </div>

        {/* Row 2: Items You Are Listing */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className={`text-2xl font-black tracking-tight ${isNight ? "text-white" : "text-black"}`} style={{ fontFamily: "'Playfair Display', serif" }}>
              📦 Items You Are Listing
            </h2>
            <button onClick={() => navigate(isLoggedIn ? "/orders" : "/login")} className="text-xs font-black text-indigo-500 hover:underline">
              Manage Orders
            </button>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {myProducts.map((item) => (
              <ProductCard 
                key={item._id} 
                item={{ id: item._id, title: item.title, price: item.rentalPrice, emoji: "💻", owner: "You", area: item.area, badge: item.status, location: item.location, securityDeposit: item.securityDeposit, images: item.images }} 
                isNight={isNight} 
                isBookmarked={bookmarkedIds.includes(item._id)}
                onBookmarkToggle={() => handleBookmarkToggle({ id: item._id, ...item })}
                onCardClick={() => navigate(`/product/${item._id}`)}
                userCoords={userCoords}
                coordsLoading={coordsLoading}
                coordsError={coordsError}
                isOwnerCard={true}
                onToggleStatus={handleToggleStatus}
                onDeleteProduct={handleDeleteProduct}
              />
            ))}
            
            {/* Permanent Add Listing Tile */}
            <button
              type="button"
              onClick={() => {
                if (isLoggedIn) {
                  setPostModalOpen(true);
                } else {
                  navigate("/login");
                }
              }}
              className="flex-shrink-0 w-[280px] sm:w-[320px] h-[380px] sm:h-[400px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-100/50 dark:bg-slate-900/10 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center text-slate-450 hover:text-indigo-400 cursor-pointer gap-2.5 shadow-sm"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-center px-4">
                <span className="text-[12px] font-black uppercase tracking-wider block">Add New Listing</span>
                <span className="text-[10px] text-slate-450 block mt-0.5">Rent or sell another item in your catalog</span>
              </div>
            </button>
          </div>
        </div>

        {/* Row 3: Available For Second-Hand Purchase */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className={`text-2xl font-black tracking-tight ${isNight ? "text-white" : "text-black"}`} style={{ fontFamily: "'Playfair Display', serif" }}>
              🤝 Available For Second-Hand Purchase
            </h2>
            <button onClick={() => navigate("/second-hand-catalog")} className="text-xs font-black text-indigo-500 hover:underline">
              View Buyout Hub
            </button>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {dbProducts.filter(p => p.productType === "SECOND_HAND").map((item) => (
              <ProductCard 
                key={item._id} 
                item={{ id: item._id, title: item.title, price: item.rentalPrice, emoji: "🚁", owner: item.owner?.name || "Owner", area: item.area, badge: "Direct Sale", location: item.location, securityDeposit: item.securityDeposit, images: item.images, rowType: "Second-Hand", unit: "flat" }} 
                isNight={isNight} 
                isBookmarked={bookmarkedIds.includes(item._id)}
                onBookmarkToggle={() => handleBookmarkToggle({ id: item._id, ...item })}
                onCardClick={() => navigate(`/product/${item._id}`)}
                userCoords={userCoords}
                coordsLoading={coordsLoading}
                coordsError={coordsError}
              />
            ))}
            {dbProducts.filter(p => p.productType === "SECOND_HAND").length === 0 && (
              <p className="text-xs text-slate-400 p-4">No second-hand buyout listings currently active.</p>
            )}
          </div>
        </div>

        {/* Row 4: Requested Products (Borrow Wishes) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className={`text-2xl font-black tracking-tight ${isNight ? "text-white" : "text-black"}`} style={{ fontFamily: "'Playfair Display', serif" }}>
              📢 Requested Products (Borrow Wishes)
            </h2>
            <button onClick={() => navigate("/requested-catalog")} className="text-xs font-black text-indigo-500 hover:underline">
              View All Wishes
            </button>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {dbWishes.map((item) => (
              <ProductCard 
                key={item._id} 
                item={{ id: item._id, title: item.title, price: item.budget, emoji: "⛺", owner: item.creator?.name || "Borrower", area: "Local", badge: "Wishlist", location: null, securityDeposit: 0, rowType: "Wishlist" }} 
                isNight={isNight} 
                isBookmarked={bookmarkedIds.includes(item._id)}
                onBookmarkToggle={() => handleBookmarkToggle({ id: item._id, ...item })}
                onCardClick={() => navigate(`/requested-catalog`)}
                userCoords={userCoords}
                coordsLoading={coordsLoading}
                coordsError={coordsError}
              />
            ))}
          </div>
        </div>

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
            <HowCard step="1" cartoon={<CartoonVerify />} title="Verify Your Identity" desc="Upload your Aadhaar/PAN card. Our AI verifies you in 60 seconds — keeping the community safe and trusted." color="border-indigo-400/30 bg-indigo-950/50" isNight={isNight} />
            <HowCard step="2" cartoon={<CartoonPost />} title="Post or Request Items" desc="List your idle items with photos & your price, or post a borrow request with your own price proposal." color="border-green-400/30 bg-green-950/50" isNight={isNight} />
            <HowCard step="3" cartoon={<CartoonNegotiate />} title="Negotiate the Deal" desc="Chat directly with owners or borrowers. Counter-offer, discuss terms, and agree on a fair price in real-time." color="border-amber-400/30 bg-amber-950/50" isNight={isNight} />
            <HowCard step="4" cartoon={<CartoonDeal />} title="Seal & Rent Securely" desc="Money held in escrow. Once both confirm, the deal is done. Rate each other and build your rental reputation!" color="border-violet-400/30 bg-violet-950/50" isNight={isNight} />
          </div>
        </div>
      </section>



      {/* Choice Modal Options Menu for Display Picture */}
      {showChoiceModal && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 backdrop-blur-md" 
          onClick={() => setShowChoiceModal(false)}
        >
          <div className="w-[90%] max-w-sm bg-slate-900 border border-slate-850 text-white p-6 rounded-3xl">
            <h3 className="text-center font-black text-sm tracking-wide uppercase text-indigo-400 mb-6">Change Profile Photo</h3>
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 rounded-2xl text-xs font-bold text-center border bg-slate-950 border-slate-800 hover:bg-slate-850 hover:text-indigo-400 transition-all cursor-pointer"
              >
                📁 Upload from Device
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
                    reader.onload = (event) => handleImageLoad(event.target?.result);
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <button 
                onClick={() => { setProfilePic(""); localStorage.removeItem("userProfilePic"); setShowChoiceModal(false); }}
                className="w-full py-3.5 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 text-red-400 rounded-2xl text-xs font-bold text-center transition-all cursor-pointer"
              >
                🗑️ Remove Current Photo
              </button>
              <button onClick={() => setShowChoiceModal(false)} className="w-full py-3.5 text-slate-400 hover:text-white transition-all cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Image Aspect Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
          <div className="w-[90%] max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white">
            <h3 className="text-lg font-black mb-1">Position & Crop Avatar</h3>
            <p className="text-xs text-slate-400 mb-6">Arrange your display picture in the square box below.</p>
            <div className="flex flex-col items-center gap-4">
              <div 
                className="relative w-72 h-72 overflow-hidden bg-slate-950 rounded-3xl border border-indigo-500/20 cursor-move flex items-center justify-center select-none"
                onMouseDown={(e) => {
                  setIsDragging(true);
                  setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                }}
                onMouseMove={(e) => {
                  if (!isDragging) return;
                  setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
              >
                {rawImage && (
                  <img 
                    src={rawImage} 
                    alt="Crop Source" 
                    draggable="false"
                    className="absolute max-w-none origin-center pointer-events-none"
                    style={{
                      width: `${imgDetails.wBase}px`,
                      height: `${imgDetails.hBase}px`,
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    }}
                  />
                )}
                <div className="absolute inset-4 border-2 border-white/60 pointer-events-none rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]"></div>
              </div>
              <div className="w-full flex items-center gap-3">
                <span className="text-xs text-slate-400 font-bold uppercase">Zoom</span>
                <input type="range" min={1} max={3} step={0.02} value={zoom} onChange={(e) => setZoom(+e.target.value)} className="flex-1 accent-indigo-500" />
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button onClick={() => setShowCropModal(false)} className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-400 cursor-pointer">
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setProfilePic(rawImage);
                    localStorage.setItem("userProfilePic", rawImage);
                    setShowCropModal(false);
                    triggerToast("Avatar cropped and updated successfully! 🎉");
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Apply & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Modern Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-6 left-6 z-[120] flex items-center gap-3 bg-slate-950 border border-indigo-500/30 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-[0_12px_40px_rgba(99,102,241,0.2)] animate-slide-in">
          <span className="text-indigo-400 font-black">🔔 Alert:</span>
          <span>{showNotification}</span>
          <button onClick={() => setShowNotification("")} className="ml-3 text-slate-400 hover:text-white font-extrabold cursor-pointer">✕</button>
        </div>
      )}

      {/* ── AI CHAT BOT ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {chatOpen && (
          <div className={`chat-pop w-80 rounded-3xl shadow-2xl border overflow-hidden flex flex-col transition-colors ${isNight ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-indigo-100 text-slate-800"}`} style={{ height: 420 }}>
            <div className="bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl">🤖</div>
              <div>
                <p className="text-white font-black text-sm">RentBot AI</p>
                <p className="text-indigo-200 text-xs">Always here to help!</p>
              </div>
              <button className="ml-auto text-white/70 hover:text-white text-xl" onClick={() => setChatOpen(false)}>×</button>
            </div>
            <div className={`flex-1 overflow-y-auto p-4 space-y-1 ${isNight ? "bg-slate-950" : "bg-slate-50"}`}>
              {messages.map((m, i) => <ChatMsg key={i} {...m} isNight={isNight} />)}
              <div ref={chatEndRef} />
            </div>
            <div className={`px-3 py-3 border-t flex gap-2 ${isNight ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Ask me anything..." className={`flex-1 border-2 rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors ${isNight ? "bg-slate-850 border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-200 focus:border-indigo-400"}`} />
              <button onClick={sendMessage} className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-md hover:scale-110 transition-all cursor-pointer">➤</button>
            </div>
          </div>
        )}
        <button
          onClick={() => setChatOpen((o) => !o)}
          className="relative w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full shadow-2xl flex items-center justify-center text-2xl hover:scale-110 transition-all duration-200 active:scale-95 cursor-pointer z-50"
        >
          {chatOpen ? "✕" : "🤖"}
        </button>

        {/* Post Product Modal */}
        <PostProductModal
          isOpen={postModalOpen}
          onClose={() => setPostModalOpen(false)}
          isNight={isNight}
          onProductCreated={() => {
            syncProducts();
            triggerToast("Product listing published successfully! 🚀");
          }}
        />
      </div>
    </div>
  );
}