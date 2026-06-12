import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
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
      const newItem = { ...item, id: item._id, rowType: "Second-Hand", unit: "flat" };
      existing.push(newItem);
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
    <div className="min-h-screen font-sans overflow-x-hidden bg-[#F4E8D6] text-slate-900 transition-colors duration-500 py-6 px-4 md:px-8">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center flex-wrap gap-4 border-b pb-4 border-slate-100">
        <div className="flex gap-3">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer bg-white border border-[#EADEC9] hover:bg-[#F9F8F6] text-[#1F3123] shadow-sm"
          >
            ← Back to Discovery
          </button>
          <button 
            onClick={() => setPostModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-colors shadow shadow-emerald-500/20 cursor-pointer"
          >
            + Sell an Item
          </button>
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-right text-[#1F3123]" style={{ fontFamily: "'Playfair Display', serif" }}>🤝 Second-Hand Purchase Hub</h1>
          <p className="text-[10px] text-slate-500 text-right mt-0.5 font-semibold">Direct peer-to-peer buyouts and verified conditions</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side Panel (Filters) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="p-6 rounded-[16px] bg-white border border-[#EADEC9] shadow-sm">
            <h3 className="font-extrabold text-sm border-b border-[#EADEC9] pb-3 mb-4 uppercase tracking-wider text-[#204138]">Filters</h3>
            
            {/* Search Input */}
            <div className="mb-5">
              <label className="block text-xs font-black uppercase text-slate-500 mb-2">Keyword Search</label>
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search drones, headphones..."
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#EADEC9] focus:outline-none focus:border-[#204138] focus:ring-1 focus:ring-[#204138] transition-colors bg-[#F9F8F6] text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Condition select */}
            <div className="mb-5">
              <label className="block text-xs font-black uppercase text-slate-500 mb-2">Item Condition</label>
              <div className="space-y-1.5 text-xs font-semibold">
                {["All", "Like New", "Excellent", "Good"].map(cond => (
                  <button 
                    key={cond} 
                    onClick={() => setSelectedCondition(cond)}
                    className={`w-full text-left py-2 px-3 rounded-xl transition-colors flex justify-between ${
                      selectedCondition === cond 
                        ? "bg-[#204138] text-white shadow-sm" 
                        : "text-slate-500 hover:text-[#204138] hover:bg-[#F9F8F6]"
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
                <label className="text-xs font-black uppercase text-slate-500">Max Purchase Budget</label>
                <span className="text-xs font-bold text-[#204138]">₹{maxPrice.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                min={5000} 
                max={100000} 
                step={5000}
                value={maxPrice}
                onChange={e => setMaxPrice(+e.target.value)}
                className="w-full accent-[#204138]"
              />
            </div>
            
            <button 
              onClick={() => { setSearch(""); setSelectedCondition("All"); setMaxPrice(100000); }}
              className="w-full bg-[#F9F8F6] hover:bg-[#EADEC9] text-[10px] font-black py-3 rounded-xl uppercase tracking-wider text-[#1F3123] transition-colors shadow-sm border border-[#EADEC9]"
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {/* Right Side Grid (Product Cards list) */}
        <div className="lg:col-span-9">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-[16px] border border-[#EADEC9] bg-white shadow-sm">
              <span className="text-5xl block mb-4">🔍</span>
              <p className="font-bold text-[#1F3123] text-lg">No items found matching your filters</p>
              <p className="text-sm text-slate-500 mt-1 max-w-md text-center">Try resetting your keyword search or expanding the pricing to see more results.</p>
              <button 
                onClick={() => { setSearch(""); setSelectedCondition("All"); setMaxPrice(100000); }}
                className="mt-6 bg-[#204138] text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-sm hover:bg-[#152e27] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(p => (
                <div 
                  key={p._id} 
                  onClick={() => navigate(`/product/${p._id}`)}
                  className="group relative hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden rounded-[12px] bg-white border border-[#EADEC9] shadow-sm hover:shadow-md flex flex-col"
                >
                  {/* Category/Status Badge */}
                  <div className="absolute top-3 left-3 z-10 bg-[#E6F0E6] text-[#2F5938] text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#408B4E]"></div>
                    {p.condition || "ACTIVE"}
                  </div>

                  {/* Bookmark Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleBookmarkToggle(p); }}
                    className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm transition-all cursor-pointer ${
                      bookmarkedIds.includes(p._id) ? "bg-indigo-600 text-white" : "bg-white/90 text-slate-400 hover:text-indigo-500"
                    }`}
                  >
                    🔖
                  </button>

                  <div className="h-44 relative flex items-center justify-center text-6xl group-hover:scale-[1.02] transition-transform duration-300 overflow-hidden bg-[#E2E8F0]">
                    {p.images && p.images.length > 0 ? (
                      <img src={getImageUrl(p.images[0])} alt={p.title} className="w-full h-full object-cover mix-blend-multiply" />
                    ) : (
                      <span className="select-none">
                        {p.emoji || (p.title === "DJI Mavic Air 2 Drone" ? "🚁" : p.title === "Bose Noise Cancelling Headphones" ? "🎧" : "📦")}
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex flex-col gap-1.5 flex-grow bg-white">
                    <h3 className="font-bold text-[17px] text-slate-800 truncate mb-0.5">{p.title}</h3>
                    
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-[#183028] font-black text-xl">₹{p.rentalPrice.toLocaleString()}</span>
                    </div>

                    <div className="flex flex-col gap-1.5 mb-3">
                      <p className="text-[11px] text-slate-700 font-medium flex items-center gap-1.5">
                        Seller: <span className="font-bold">{p.owner?.name || "Owner"}</span>
                      </p>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[11px] text-slate-700 font-medium flex items-center gap-1">
                          <span className="text-[#A42530] text-[13px]">📍</span> {p.area || "Local Area"}
                        </p>

                        <div className="text-[11px] text-slate-700 font-medium flex items-center gap-1">
                          <span className="text-[#D4A373] text-[13px]">⚡</span> 
                          {coordsLoading ? (
                            <span className="animate-pulse">Calc...</span>
                          ) : coordsError ? (
                            <span title={coordsError}>N/A</span>
                          ) : (
                            <span>
                              {calculateDistance(
                                userCoords?.latitude,
                                userCoords?.longitude,
                                p.location?.coordinates?.[1],
                                p.location?.coordinates?.[0]
                              )} km away
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-200 flex justify-between items-center">
                       <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-[#2C3E50] text-white flex items-center justify-center text-[10px] font-bold">
                           <img src={`https://ui-avatars.com/api/?name=${p.owner?.name || 'User'}&background=random`} alt="avatar" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-800 truncate max-w-[80px]">
                          {p.owner?.name || "User"}
                        </span>
                      </div>
                      <button className="bg-[#204138] text-white hover:bg-[#152e27] text-[12px] px-5 py-1.5 rounded-full font-bold transition-colors shadow-sm cursor-pointer ml-auto">Buy</button>
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
