import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api";
import { Handshake, Search } from "lucide-react";

import NotificationBell from "../components/NotificationBell";
import ChatBell from "../components/ChatBell";
import PostProductModal from "../components/PostProductModal";
import { STORAGE_KEYS } from "../constants/auth";

const getImageUrl = (image) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.url || "";
};

const ProductCard = React.memo(({ p, isNight, bookmarkedIds, handleBookmarkToggle, navigate, coordsLoading, coordsError, calculateDistance, userCoords, currentUser, userNegotiations, handleBuyClick, handleNegotiationClick }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const images = p.images?.length ? p.images : [];

  const handlePrev = (e) => {
    e.stopPropagation();
    if (images.length > 1) {
      setImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (images.length > 1) {
      setImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    return `${diffDays} days ago`;
  };

  const isOwner = currentUser && String(p.owner?._id || p.owner) === String(currentUser._id);
  const isVisuallyLocked = p.isRentedOrReserved && !isOwner;

  const renderBadge = () => {
    if (isOwner) {
      if (p.activeNegotiationsCount > 0) {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 w-fit">
            💬 Active Negotiations ({p.activeNegotiationsCount})
          </span>
        );
      }
      if (p.currentUserTransactionStatus === "AWAITING_PAYMENT") {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
            🤝 Negotiation Accepted
          </span>
        );
      }
      if (p.currentUserTransactionStatus === "RESERVED") {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit">
            📅 Handover Scheduled
          </span>
        );
      }
      if (p.currentUserTransactionStatus === "IN_POSSESSION") {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 w-fit">
            📦 Rented Out
          </span>
        );
      }
      if (p.currentUserTransactionStatus === "RETURN_INITIATED") {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit">
            🔄 Return in Progress
          </span>
        );
      }
      if (p.status === "INACTIVE") {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 w-fit">
            ⏸️ Listing Paused
          </span>
        );
      }
      if (p.status === "ACTIVE" || p.status === "AUCTION_ACTIVE") {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
            🟢 Live
          </span>
        );
      }
    } else {
      if (p.currentUserTransactionStatus === "IN_POSSESSION") {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
            🔑 Currently Renting
          </span>
        );
      }
      if (p.currentUserTransactionStatus === "RETURN_INITIATED") {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit">
            🔄 Return Pending
          </span>
        );
      }
      if (p.currentUserTransactionStatus === "AWAITING_PAYMENT") {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
            🎉 Negotiation Accepted
          </span>
        );
      }
      if (p.currentUserTransactionStatus === "PENDING_NEGOTIATION") {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 w-fit">
            💬 Negotiation Active
          </span>
        );
      }
      if (p.currentUserTransactionStatus === "NEGOTIATION_DECLINED") {
        return (
          <div className="flex flex-col gap-0.5 w-fit">
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 w-fit">
              🔴 Negotiation Declined
            </span>
            <span className="text-[9px] text-red-400 font-semibold pl-1">
              Request declined {formatRelativeTime(p.transactionUpdatedAt)}
            </span>
          </div>
        );
      }
      if (bookmarkedIds.includes(p._id)) {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 w-fit">
            🔖 Saved
          </span>
        );
      }
      if (p.currentUserTransactionStatus !== null && p.currentUserTransactionStatus !== undefined) {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 w-fit">
            💬 Chat Active
          </span>
        );
      }
      
      if (p.isRentedOrReserved) {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 w-fit">
            🔴 Rented Out
          </span>
        );
      }
      if (p.status === "ACTIVE" || p.status === "AUCTION_ACTIVE") {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
            ✨ Available
          </span>
        );
      }
    }
    return null;
  };

  return (
    <div 
      onClick={isVisuallyLocked ? null : () => navigate(`/product/${p._id}`)}
      className={`group relative rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border p-4 cursor-pointer ${
        isNight ? "bg-slate-900/60 border-slate-850 text-white" : "bg-white border-slate-205 text-slate-800"
      } ${isVisuallyLocked ? "opacity-75 grayscale contrast-75 cursor-not-allowed" : ""}`}
    >
      {/* Bookmark Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); handleBookmarkToggle(p); }}
        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow transition-all cursor-pointer ${
          bookmarkedIds.includes(p._id) ? "bg-red-500 text-white hover:bg-red-600 scale-110" : "bg-slate-900/60 text-white hover:bg-indigo-500"
        }`}
        title={bookmarkedIds.includes(p._id) ? "Remove Bookmark" : "Bookmark Item"}
      >
        {bookmarkedIds.includes(p._id) ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
            <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
        )}
      </button>

      <div className="h-32 w-full flex items-center justify-center text-5xl mb-4 group-hover:scale-105 transition-transform overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950 relative">
        {images.length > 0 ? (
          <img src={getImageUrl(images[imgIndex])} alt={p.title} className="w-full h-full object-contain p-3" />
        ) : (
          <span>
            {p.emoji || (p.title === "DJI Mavic Air 2 Drone" ? "🚁" : p.title === "Bose Noise Cancelling Headphones" ? "🎧" : "📦")}
          </span>
        )}

        {/* Carousel controls */}
        {images.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:text-indigo-400 transition-colors z-20 cursor-pointer bg-slate-900/40 p-1.5 rounded-full hover:bg-slate-900/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
              title="Previous Image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5 filter drop-shadow">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
              </svg>
            </button>

            <button 
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:text-indigo-400 transition-colors z-20 cursor-pointer bg-slate-900/40 p-1.5 rounded-full hover:bg-slate-900/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
              title="Next Image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5 filter drop-shadow">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
              </svg>
            </button>

            {/* Position indicator */}
            <div className="absolute bottom-2 right-2 bg-slate-900/60 text-white text-[9px] font-black px-2 py-0.5 rounded-full z-20 select-none backdrop-blur-sm border border-white/10">
              {imgIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1.5">
        {renderBadge()}
        <h4 className="font-extrabold text-sm truncate">{p.title}</h4>
        
        <div className="flex items-baseline gap-1">
          <span className="text-violet-500 font-black text-sm">₹{p.rentalPrice.toLocaleString()}</span>
        </div>

        <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
          <span>👤</span> {p.owner?.name || "Owner"}
        </p>

        <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
          <span>📍</span> {p.area || "Local"}
        </p>

        <div className="mt-1.5 pt-2 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-wider text-slate-400 font-black">Proximity</span>
            {coordsLoading ? (
              <span className="text-[10px] text-indigo-400 font-bold animate-pulse">Calculating distance...</span>
            ) : coordsError ? (
              <span className="text-[9px] text-amber-500 font-bold" title={coordsError}>Distance unavailable ⚠️</span>
            ) : (
              <span className="text-xs text-indigo-400 font-black bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/25">
                ⚡ {p.distance != null ? `${p.distance} km away` : "Distance unavailable"}
              </span>
            )}
          </div>
          
          {isVisuallyLocked ? (
            <button 
              disabled 
              className="bg-slate-200 dark:bg-slate-800/80 text-slate-450 dark:text-slate-500 font-bold text-[10px] py-1.5 px-3.5 rounded-lg cursor-not-allowed opacity-60 text-center"
            >
              Temporarily Unavailable
            </button>
          ) : isOwner ? (
            <span className="text-[9px] font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-1.5 rounded-lg border border-indigo-500/25 text-center select-none w-20">
              Your Listing
            </span>
          ) : (
            <div className="flex flex-col gap-1 w-20">
              <button 
                onClick={(e) => { e.stopPropagation(); handleBuyClick(p._id, p.rentalPrice); }} 
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] py-1.5 rounded-lg transition-colors cursor-pointer text-center"
              >
                Buy
              </button>
              {userNegotiations[p._id] ? (
                <button 
                  disabled 
                  className="w-full bg-slate-700/60 dark:bg-zinc-800/60 text-slate-500 font-bold text-[9px] py-1.5 rounded-lg text-center cursor-not-allowed opacity-60"
                >
                  ✓ Negotiation Sent
                </button>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleNegotiationClick(p._id, p.rentalPrice, p.title); }} 
                  className="w-full bg-slate-800 hover:bg-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-[10px] py-1.5 rounded-lg transition-colors cursor-pointer text-center"
                >
                  Negotiate
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default function SecondHandCatalogPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");

  // Page index state
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  
  // Allowed values for sanitization
  const ALLOWED_CATEGORIES = ["Electronics", "Vehicles", "Tools", "Outdoor", "Music"];
  const ALLOWED_SORTS = ["price_asc", "price_desc", "newest", "distance_asc"];

  // Filter States initialized from URL or defaults
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const val = searchParams.get("category");
    return ALLOWED_CATEGORIES.includes(val) ? val : "All";
  });
  const [maxPrice, setMaxPrice] = useState(() => {
    const val = searchParams.get("maxPrice");
    return val !== null && !isNaN(Number(val)) && Number(val) >= 0 ? Number(val) : 50000;
  });
  const [maxDistance, setMaxDistance] = useState(() => {
    const val = searchParams.get("maxDistance");
    return val !== null && !isNaN(Number(val)) && Number(val) >= 0 ? Number(val) : 5000;
  });
  const [sort, setSort] = useState(() => {
    const val = searchParams.get("sort");
    return ALLOWED_SORTS.includes(val) ? val : "newest";
  });

  // Server results
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [notification, setNotification] = useState("");
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userNegotiations, setUserNegotiations] = useState({});

  const [userCoords, setUserCoords] = useState(null);
  const [coordsLoading, setCoordsLoading] = useState(true);
  const [coordsError, setCoordsError] = useState("");

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

  const syncProducts = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Sync state controls when URL params change (e.g. Back/Forward navigation)
  useEffect(() => {
    setSearchInput(searchParams.get("search") || "");
    
    const catVal = searchParams.get("category");
    setSelectedCategory(ALLOWED_CATEGORIES.includes(catVal) ? catVal : "All");
    
    const pVal = searchParams.get("maxPrice");
    setMaxPrice(pVal !== null && !isNaN(Number(pVal)) && Number(pVal) >= 0 ? Number(pVal) : 50000);
    
    const dVal = searchParams.get("maxDistance");
    setMaxDistance(dVal !== null && !isNaN(Number(dVal)) && Number(dVal) >= 0 ? Number(dVal) : 5000);
    
    const sortVal = searchParams.get("sort");
    setSort(ALLOWED_SORTS.includes(sortVal) ? sortVal : "newest");
  }, [searchParams]);

  // Update filters helper (resets page index to 1)
  const updateFilter = (newParams) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.keys(newParams).forEach(key => {
      const val = newParams[key];
      if (val === null || val === undefined || val === "" || val === "All") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(val));
      }
    });
    nextParams.set("page", "1"); // Enforce page 1 reset on filter changes
    setSearchParams(nextParams);
  };

  // Debounced search sync to URL
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const trimmed = searchInput.trim();
      const currentSearch = searchParams.get("search") || "";
      if (trimmed !== currentSearch) {
        updateFilter({ search: trimmed });
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  // Debounced price sync to URL
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const currentPrice = searchParams.get("maxPrice");
      if (maxPrice !== (currentPrice !== null ? Number(currentPrice) : 50000)) {
        updateFilter({ maxPrice });
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [maxPrice]);

  // Debounced distance sync to URL
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const currentDistance = searchParams.get("maxDistance");
      if (maxDistance !== (currentDistance !== null ? Number(currentDistance) : 5000)) {
        updateFilter({ maxDistance });
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [maxDistance]);

  // Geolocation lookup, bookmarks & session loading
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

    const activeToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (activeToken) {
      const existing = JSON.parse(localStorage.getItem("bookmarked_items") || "[]");
      setBookmarkedIds(existing.map(x => x.id));
      API.get("/rent/products/bookmarks/ids")
        .then(res => {
          if (res.data && Array.isArray(res.data)) {
            setBookmarkedIds(res.data);
            const synced = existing.filter(x => res.data.includes(x.id));
            localStorage.setItem("bookmarked_items", JSON.stringify(synced));
          }
        })
        .catch(err => console.error("Error fetching bookmarks from db in SecondHandCatalogPage:", err));

      API.get("/auth/me")
        .then((userRes) => {
          const user = userRes.data;
          setCurrentUser(user);

          return API.get("/rent/transactions").then((txRes) => {
            const activeStates = ["PENDING_NEGOTIATION", "NEGOTIATING", "ACCEPTED", "AWAITING_PAYMENT", "RESERVED"];
            const negotiationsMap = {};
            txRes.data.forEach((t) => {
              const borrowerId = t.borrower?._id || t.borrower;
              const prodId = t.product?._id || t.product;
              if (
                activeStates.includes(t.status) &&
                prodId &&
                borrowerId &&
                String(borrowerId) === String(user._id)
              ) {
                negotiationsMap[String(prodId)] = t.status;
              }
            });
            setUserNegotiations(negotiationsMap);
          });
        })
        .catch((err) => console.error("Error synchronizing user session & negotiations:", err));
    } else {
      setBookmarkedIds([]);
    }
  }, []);

  // Server-Side Data Fetch with AbortController for cancellation
  useEffect(() => {
    let active = true;
    setLoading(true);
    const controller = new AbortController();

    const categoryVal = searchParams.get("category") || "All";
    const searchVal = searchParams.get("search") || "";
    const pVal = searchParams.get("maxPrice");
    const dVal = searchParams.get("maxDistance");
    const sortVal = searchParams.get("sort") || "newest";
    const pageVal = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

    // Sanitize values
    const validCategory = ALLOWED_CATEGORIES.includes(categoryVal) ? categoryVal : "All";
    const validSort = ALLOWED_SORTS.includes(sortVal) ? sortVal : "newest";

    let apiUri = `/rent/products?paginated=true&productType=SECOND_HAND&page=${pageVal}&limit=12`;
    
    if (validCategory !== "All") apiUri += `&category=${encodeURIComponent(validCategory)}`;
    
    const trimmedSearch = searchVal.trim();
    if (trimmedSearch) apiUri += `&search=${encodeURIComponent(trimmedSearch)}`;
    
    if (pVal !== null && !isNaN(Number(pVal)) && Number(pVal) >= 0) {
      apiUri += `&maxPrice=${Number(pVal)}`;
    }
    
    if (userCoords) {
      if (dVal !== null && !isNaN(Number(dVal)) && Number(dVal) >= 0) {
        apiUri += `&latitude=${userCoords.latitude}&longitude=${userCoords.longitude}&maxDistance=${Number(dVal)}`;
      }
      if (validSort) {
        apiUri += `&sort=${encodeURIComponent(validSort)}`;
      }
    } else {
      const fallbackSort = validSort === "distance_asc" ? "newest" : validSort;
      apiUri += `&sort=${encodeURIComponent(fallbackSort)}`;
    }

    API.get(apiUri, { signal: controller.signal })
      .then(res => {
        if (!active) return;
        if (Array.isArray(res.data)) {
          setProducts(res.data);
          setTotalPages(1);
          setTotalCount(res.data.length);
        } else {
          setProducts(res.data.products || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalCount(res.data.totalCount || 0);
        }
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        if (err.name === "CanceledError" || err.message === "canceled" || API.isCancel(err)) {
          return;
        }
        console.error("Error fetching SecondHandCatalogPage products:", err);
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [searchParams, userCoords, refreshTrigger]);

  const handleBookmarkToggle = async (item) => {
    const itemId = item._id;
    if (!localStorage.getItem(STORAGE_KEYS.TOKEN)) {
      alert("Authentication Required: Please log in to bookmark products.");
      return;
    }

    try {
      const res = await API.post(`/rent/products/${itemId}/bookmark`);
      const isBookmarked = res.data.bookmarked;

      const existing = JSON.parse(localStorage.getItem("bookmarked_items") || "[]");
      let updated = [];

      if (!isBookmarked) {
        updated = existing.filter(x => x.id !== itemId);
        triggerToast(`Removed "${item.title}" from saved bookmarks!`);
      } else {
        const normalizedItem = {
          id: itemId,
          title: item.title,
          price: item.price || item.rentalPrice,
          unit: item.unit || "flat",
          owner: typeof item.owner === "object" ? item.owner?.name : (item.owner || "Local Owner"),
          area: item.area || "Local",
          images: item.images || [],
          emoji: item.emoji || (item.title?.toLowerCase().includes("camera") ? "📷" : item.title?.toLowerCase().includes("scooter") || item.title?.toLowerCase().includes("activa") ? "🛵" : item.title?.toLowerCase().includes("playstation") || item.title?.toLowerCase().includes("ps5") ? "🎮" : "📦"),
          rowType: "Second-Hand"
        };
        updated = [...existing, normalizedItem];
        triggerToast(`Saved "${item.title}" to bookmarks! 🔖`);
      }

      localStorage.setItem("bookmarked_items", JSON.stringify(updated));
      setBookmarkedIds(updated.map(x => x.id));
    } catch (err) {
      console.error("Error toggling bookmark on server in SecondHandCatalogPage:", err);
      // Fallback
      const existing = JSON.parse(localStorage.getItem("bookmarked_items") || "[]");
      const isCurrentlyBookmarked = bookmarkedIds.includes(itemId);
      let updated = [];
      if (isCurrentlyBookmarked) {
        updated = existing.filter(x => x.id !== itemId);
        triggerToast(`Removed "${item.title}" from saved bookmarks!`);
      } else {
        const normalizedItem = {
          id: itemId,
          title: item.title,
          price: item.price || item.rentalPrice,
          unit: item.unit || "flat",
          owner: typeof item.owner === "object" ? item.owner?.name : (item.owner || "Local Owner"),
          area: item.area || "Local",
          images: item.images || [],
          emoji: item.emoji || (item.title?.toLowerCase().includes("camera") ? "📷" : item.title?.toLowerCase().includes("scooter") || item.title?.toLowerCase().includes("activa") ? "🛵" : item.title?.toLowerCase().includes("playstation") || item.title?.toLowerCase().includes("ps5") ? "🎮" : "📦"),
          rowType: "Second-Hand"
        };
        updated = [...existing, normalizedItem];
        triggerToast(`Saved "${item.title}" to bookmarks! 🔖`);
      }
      localStorage.setItem("bookmarked_items", JSON.stringify(updated));
      setBookmarkedIds(updated.map(x => x.id));
    }
  };

  const triggerToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleBuyClick = async (productId, price) => {
    try {
      await API.post("/rent/negotiate", {
        productId,
        startDate: new Date(),
        endDate: new Date(),
        dailyRate: price,
        securityDeposit: 0
      });
      triggerToast(`Purchase request submitted successfully!`);
      setTimeout(() => navigate(`/rent/checkout/${productId}`), 1500);
    } catch (err) {
      triggerToast(err.response?.data?.msg || "Purchase request failed");
    }
  };

  const handleNegotiationClick = async (productId, currentPrice, title) => {
    if (userNegotiations[productId]) {
      triggerToast("You already have an active negotiation for this product.");
      return;
    }
    const offer = window.prompt(`Enter your custom buyout offer price for "${title}" (Current: ₹${currentPrice}):`);
    if (!offer) return;
    const numericOffer = parseFloat(offer);
    if (isNaN(numericOffer) || numericOffer <= 0) {
      triggerToast("Please enter a valid price.");
      return;
    }
    
    try {
      await API.post("/rent/negotiate", {
        productId,
        startDate: new Date(),
        endDate: new Date(),
        dailyRate: numericOffer,
        securityDeposit: 0
      });
      triggerToast(`Buyout negotiation request of ₹${numericOffer} sent!`);
      setUserNegotiations(prev => ({ ...prev, [productId]: "PENDING_NEGOTIATION" }));
    } catch (err) {
      if (err.response?.status === 409) {
        alert("You already have an active negotiation for this product.");
        setUserNegotiations(prev => ({ ...prev, [productId]: "PENDING_NEGOTIATION" }));
        return;
      }
      triggerToast(err.response?.data?.msg || "Negotiation request failed");
    }
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSelectedCategory("All");
    setMaxPrice(50000);
    setMaxDistance(5000);
    setSort("newest");
    setSearchParams({ page: "1" });
  };

  const handleSortChange = (e) => {
    updateFilter({ sort: e.target.value });
  };

  // Map products to inject client-side distance for ProductCard rendering compatibility
  const productsWithDistance = products.map(p => {
    let distance = null;
    if (userCoords && p.location?.coordinates) {
      const dist = calculateDistance(
        userCoords.latitude,
        userCoords.longitude,
        p.location.coordinates[1],
        p.location.coordinates[0]
      );
      if (dist) {
        distance = parseFloat(dist);
      }
    }
    return { ...p, distance };
  });

  return (
    <div className={`min-h-screen transition-colors duration-500 py-6 px-4 md:px-8 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center flex-wrap gap-4 border-b pb-4 border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/dashboard")}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.05] active:scale-95 ${
              isNight ? "bg-slate-900 border border-slate-850 hover:bg-slate-800" : "bg-white border border-slate-200 hover:bg-slate-100 shadow-sm"
            }`}
          >
            ← Back to Discovery
          </button>
          <button 
            onClick={() => setPostModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-colors shadow shadow-emerald-500/20 cursor-pointer"
          >
            + Sell an Item
          </button>
          <ChatBell isNight={isNight} />
          <NotificationBell isNight={isNight} />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-black text-right"><Handshake className="w-8 h-8 text-indigo-500 inline mr-2" /> Second-Hand Purchase Hub</h1>
          <p className="text-[10px] text-slate-400 text-right mt-0.5">Direct peer-to-peer buyouts and verified conditions</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side Panel (OLX/Amazon Style Filters) */}
        <div className="lg:col-span-3 space-y-6">
          <div className={`p-6 rounded-2xl border shadow-sm ${
            isNight ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200"
          }`}>
            <h3 className="font-extrabold text-sm border-b pb-3 mb-4 uppercase tracking-wider text-indigo-400">Filters</h3>
            
            {/* Search Input */}
            <div className="mb-5">
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Keyword Search</label>
              <input 
                type="text" 
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search drones, headphones..."
                className={`w-full px-3 py-2 text-xs rounded-xl border border-slate-350 focus:outline-none focus:border-indigo-500 transition-colors ${
                  isNight ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              />
            </div>

            {/* Category Select */}
            <div className="mb-5">
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Category</label>
              <div className="space-y-1.5 text-xs font-semibold">
                {["All", "Electronics", "Vehicles", "Tools", "Outdoor", "Music"].map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => updateFilter({ category: cat })}
                    className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-colors flex justify-between ${
                      selectedCategory === cat 
                        ? "bg-indigo-500 text-white" 
                        : "text-slate-400 hover:text-slate-850 dark:hover:text-white"
                    }`}
                  >
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Slider */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-black uppercase text-slate-400">Max Purchase Budget</label>
                <span className="text-xs font-bold text-violet-500">₹{maxPrice.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                min={500} 
                max={50000} 
                step={500}
                value={maxPrice}
                onChange={e => setMaxPrice(+e.target.value)}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Distance Slider (Only visible if userCoords is available) */}
            {userCoords && (
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black uppercase text-slate-400">Distance Radius</label>
                  <span className="text-xs font-bold text-violet-500">{maxDistance === 5000 ? "Anywhere" : `${maxDistance} km`}</span>
                </div>
                <input 
                  type="range" 
                  min={5} 
                  max={5000} 
                  step={25}
                  value={maxDistance}
                  onChange={e => setMaxDistance(+e.target.value)}
                  className="w-full accent-indigo-500"
                />
              </div>
            )}

            {/* Sort By Dropdown */}
            <div className="mb-5">
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Sort By</label>
              <select
                value={sort === "distance_asc" && !userCoords ? "newest" : sort}
                onChange={handleSortChange}
                className={`w-full px-3 py-2 text-xs rounded-xl border border-slate-350 focus:outline-none focus:border-indigo-500 transition-colors ${
                  isNight ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                {userCoords && <option value="distance_asc">Nearest First</option>}
              </select>
            </div>
            
            <button 
              onClick={handleResetFilters}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold py-2.5 rounded-xl uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {/* Right Side Grid (Product Cards list) */}
        <div className="lg:col-span-9">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : productsWithDistance.length === 0 ? (
            <div className={`text-center py-20 rounded-2xl border border-dashed ${isNight ? "bg-slate-900/40 border-slate-850" : "bg-white border-slate-205 text-slate-800"}`}>
              <Search className="w-10 h-10 mx-auto mb-2 text-slate-450" />
              <p className="font-bold text-slate-400 text-sm">No items found matching your filters</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting the keyword or expanding the pricing/distance radius.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsWithDistance.map(p => (
                  <ProductCard 
                    key={p._id}
                    p={p}
                    isNight={isNight}
                    bookmarkedIds={bookmarkedIds}
                    handleBookmarkToggle={handleBookmarkToggle}
                    navigate={navigate}
                    coordsLoading={coordsLoading}
                    coordsError={coordsError}
                    calculateDistance={calculateDistance}
                    userCoords={userCoords}
                    currentUser={currentUser}
                    userNegotiations={userNegotiations}
                    handleBuyClick={handleBuyClick}
                    handleNegotiationClick={handleNegotiationClick}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => {
                      const nextParams = new URLSearchParams(searchParams);
                      nextParams.set("page", String(page - 1));
                      setSearchParams(nextParams);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
                      page <= 1
                        ? "opacity-50 cursor-not-allowed border-slate-200 text-slate-405 dark:border-slate-800 dark:text-slate-600"
                        : isNight
                        ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-white"
                        : "bg-white border-slate-205 hover:bg-slate-100 text-slate-800"
                    }`}
                  >
                    ← Previous
                  </button>
                  
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => {
                      if (totalPages > 5 && Math.abs(page - pNum) > 1 && pNum !== 1 && pNum !== totalPages) {
                        if (pNum === 2 || pNum === totalPages - 1) {
                          return <span key={pNum} className="text-slate-400 px-1 text-xs">...</span>;
                        }
                        return null;
                      }

                      return (
                        <button
                          key={pNum}
                          onClick={() => {
                            const nextParams = new URLSearchParams(searchParams);
                            nextParams.set("page", String(pNum));
                            setSearchParams(nextParams);
                          }}
                          className={`w-8 h-8 rounded-xl text-xs font-extrabold flex items-center justify-center transition-all duration-200 cursor-pointer ${
                            page === pNum
                              ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                              : isNight
                              ? "bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300"
                              : "bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          {pNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={page >= totalPages}
                    onClick={() => {
                      const nextParams = new URLSearchParams(searchParams);
                      nextParams.set("page", String(page + 1));
                      setSearchParams(nextParams);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
                      page >= totalPages
                        ? "opacity-50 cursor-not-allowed border-slate-200 text-slate-405 dark:border-slate-800 dark:text-slate-600"
                        : isNight
                        ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-white"
                        : "bg-white border-slate-205 hover:bg-slate-100 text-slate-800"
                    }`}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Floating alert */}
      {notification && (
        <div className="fixed bottom-6 left-6 z-[110] flex items-center gap-3 bg-slate-950 border border-indigo-500/30 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl animate-slide-in">
          <span>{notification}</span>
        </div>
      )}

      {/* Post Product Modal */}
      <PostProductModal 
        isOpen={postModalOpen} 
        onClose={() => setPostModalOpen(false)} 
        isNight={isNight} 
        onProductCreated={() => {
          syncProducts();
          triggerToast("Sale listing published successfully! 🚀");
        }} 
      />
    </div>
  );
}
