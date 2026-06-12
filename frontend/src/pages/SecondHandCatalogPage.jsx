import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import NotificationBell from "../components/NotificationBell";
import PostProductModal from "../components/PostProductModal";

const getImageUrl = (image) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.url || "";
};

export default function SecondHandCatalogPage() {
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");

  const [products, setProducts] = useState([]);

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("All");
  const [maxPrice, setMaxPrice] = useState(100000);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [notification, setNotification] = useState("");
  const [postModalOpen, setPostModalOpen] = useState(false);

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
    API.get("/rent/products?productType=SECOND_HAND")
      .then(res => setProducts(res.data))
      .catch(err => console.error("Error fetching SecondHandCatalogPage products:", err));
  };

  // Load products & bookmarks on mount
  useEffect(() => {
    syncProducts();

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

    const existing = JSON.parse(localStorage.getItem("bookmarked_items") || "[]");
    setBookmarkedIds(existing.map(x => x.id));
  }, []);

  const handleBookmarkToggle = (item) => {
    const existing = JSON.parse(localStorage.getItem("bookmarked_items") || "[]");
    if (bookmarkedIds.includes(item._id)) {
      const updated = existing.filter(x => x.id !== item._id);
      localStorage.setItem("bookmarked_items", JSON.stringify(updated));
      setBookmarkedIds(updated.map(x => x.id));
      triggerToast(`Removed "${item.title}" from saved bookmarks!`);
    } else {
      const normalizedItem = {
        id: item._id,
        title: item.title,
        price: item.price || item.rentalPrice,
        unit: item.unit || "flat",
        owner: typeof item.owner === "object" ? item.owner?.name : (item.owner || "Local Owner"),
        area: item.area || "Local",
        images: item.images || [],
        emoji: item.emoji || (item.title?.toLowerCase().includes("camera") ? "📷" : item.title?.toLowerCase().includes("scooter") || item.title?.toLowerCase().includes("activa") ? "🛵" : item.title?.toLowerCase().includes("playstation") || item.title?.toLowerCase().includes("ps5") ? "🎮" : "📦"),
        rowType: "Second-Hand"
      };
      existing.push(normalizedItem);
      localStorage.setItem("bookmarked_items", JSON.stringify(existing));
      setBookmarkedIds(existing.map(x => x.id));
      triggerToast(`Saved "${item.title}" to bookmarks! 🔖`);
    }
  };

  const triggerToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  // Filter logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesCondition = selectedCondition === "All" || (p.condition || "Excellent") === selectedCondition;
    const matchesPrice = p.rentalPrice <= maxPrice;

    return matchesSearch && matchesCondition && matchesPrice;
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
          <NotificationBell isNight={isNight} />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-black text-right">🤝 Second-Hand Purchase Hub</h1>
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
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search drones, headphones..."
                className={`w-full px-3 py-2 text-xs rounded-xl border border-slate-350 focus:outline-none focus:border-indigo-500 transition-colors ${
                  isNight ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              />
            </div>

            {/* Condition select */}
            <div className="mb-5">
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Item Condition</label>
              <div className="space-y-1.5 text-xs font-semibold">
                {["All", "Like New", "Excellent", "Good"].map(cond => (
                  <button 
                    key={cond} 
                    onClick={() => setSelectedCondition(cond)}
                    className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-colors flex justify-between ${
                      selectedCondition === cond 
                        ? "bg-indigo-500 text-white" 
                        : "text-slate-400 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    <span>{cond}</span>
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
                min={5000} 
                max={100000} 
                step={5000}
                value={maxPrice}
                onChange={e => setMaxPrice(+e.target.value)}
                className="w-full accent-indigo-500"
              />
            </div>
            
            <button 
              onClick={() => { setSearch(""); setSelectedCondition("All"); setMaxPrice(100000); }}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold py-2.5 rounded-xl uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {/* Right Side Grid (Product Cards list) */}
        <div className="lg:col-span-9">
          {filteredProducts.length === 0 ? (
            <div className={`text-center py-20 rounded-2xl border border-dashed ${isNight ? "bg-slate-900/40 border-slate-850" : "bg-white border-slate-200"}`}>
              <span className="text-4xl block mb-2">🔍</span>
              <p className="font-bold text-slate-400 text-sm">No items found matching your filters</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting the keyword or expanding the pricing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(p => (
                <div 
                  key={p._id} 
                  onClick={() => navigate(`/product/${p._id}`)}
                  className={`group relative rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border p-4 cursor-pointer ${
                    isNight ? "bg-slate-900/60 border-slate-850 text-white" : "bg-white border-slate-205 text-slate-800"
                  }`}
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

                  <div className="h-32 w-full flex items-center justify-center text-5xl mb-4 group-hover:scale-105 transition-transform overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950">
                    {p.images && p.images.length > 0 ? (
                      <img src={getImageUrl(p.images[0])} alt={p.title} className="w-full h-full object-contain p-3" />
                    ) : (
                      <span>
                        {p.emoji || (p.title === "DJI Mavic Air 2 Drone" ? "🚁" : p.title === "Bose Noise Cancelling Headphones" ? "🎧" : "📦")}
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex flex-col gap-1.5">
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
                            ⚡ {calculateDistance(
                              userCoords?.latitude,
                              userCoords?.longitude,
                              p.location?.coordinates?.[1],
                              p.location?.coordinates?.[0]
                            )} km away
                          </span>
                        )}
                      </div>
                      <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors">Buy</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
