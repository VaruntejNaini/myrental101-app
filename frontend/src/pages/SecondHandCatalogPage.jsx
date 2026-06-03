import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SecondHandCatalogPage() {
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");

  // Mock second-hand products
  const initialProducts = [
    { id: "sale_drone_1", title: "DJI Mavic Air 2 Drone", emoji: "🚁", price: 45000, category: "Electronics", owner: "Ravi M.", distance: "4.2 km away", condition: "Like New" },
    { id: "sale_bike_2", title: "Specialized Carbon Road Bike", emoji: "🚴", price: 78000, category: "Vehicles", owner: "Priya S.", distance: "1.8 km away", condition: "Excellent" },
    { id: "sale_headphones_3", title: "Bose Noise Cancelling Headphones", emoji: "🎧", price: 14500, category: "Electronics", owner: "Kiran T.", distance: "2.1 km away", condition: "Good" },
    { id: "sale_tent_4", title: "Quechua 4-Person Camping Tent", emoji: "⛺", price: 6500, category: "Outdoor", owner: "Meera N.", distance: "1.9 km away", condition: "Excellent" },
    { id: "sale_keyboard_5", title: "Keychron K2 Mechanical Keyboard", emoji: "⌨️", price: 5500, category: "Electronics", owner: "Arjun K.", distance: "0.8 km away", condition: "Like New" },
    { id: "sale_lens_6", title: "Sony 50mm f/1.8 Prime Lens", emoji: "🔍", price: 11000, category: "Electronics", owner: "Anish R.", distance: "3.5 km away", condition: "Good" }
  ];

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("All");
  const [maxPrice, setMaxPrice] = useState(100000);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [notification, setNotification] = useState("");

  // Load bookmarks on mount
  useEffect(() => {
    const existing = JSON.parse(localStorage.getItem("bookmarked_items") || "[]");
    setBookmarkedIds(existing.map(x => x.id));
  }, []);

  const handleBookmarkToggle = (item) => {
    const existing = JSON.parse(localStorage.getItem("bookmarked_items") || "[]");
    if (bookmarkedIds.includes(item.id)) {
      const updated = existing.filter(x => x.id !== item.id);
      localStorage.setItem("bookmarked_items", JSON.stringify(updated));
      setBookmarkedIds(updated.map(x => x.id));
      triggerToast(`Removed "${item.title}" from saved bookmarks!`);
    } else {
      const newItem = { ...item, rowType: "Second-Hand", unit: "flat" };
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
  const filteredProducts = initialProducts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesCondition = selectedCondition === "All" || p.condition === selectedCondition;
    const matchesPrice = p.price <= maxPrice;

    return matchesSearch && matchesCondition && matchesPrice;
  });

  return (
    <div className={`min-h-screen transition-colors duration-500 py-6 px-4 md:px-8 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center flex-wrap gap-4 border-b pb-4 border-slate-100 dark:border-slate-800">
        <button 
          onClick={() => navigate("/dashboard")}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            isNight ? "bg-slate-900 border border-slate-850 hover:bg-slate-800" : "bg-white border border-slate-200 hover:bg-slate-100 shadow-sm"
          }`}
        >
          ← Back to Discovery
        </button>
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
                  key={p.id} 
                  className={`group relative rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border p-4 ${
                    isNight ? "bg-slate-900/60 border-slate-850 text-white" : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  {/* Bookmark Button */}
                  <button 
                    onClick={() => handleBookmarkToggle(p)}
                    className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow transition-all cursor-pointer ${
                      bookmarkedIds.includes(p.id) ? "bg-indigo-600 text-white" : "bg-slate-900/60 text-white hover:bg-indigo-500"
                    }`}
                  >
                    🔖
                  </button>

                  <div className="h-32 flex items-center justify-center text-5xl mb-4 group-hover:scale-105 transition-transform">
                    {p.emoji}
                  </div>

                  <div>
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded-full border border-indigo-500/20">{p.condition}</span>
                    <h4 className="font-extrabold text-sm truncate mt-2">{p.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">👤 {p.owner} • 📍 {p.distance}</p>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                      <span className="text-violet-500 font-black text-sm">₹{p.price.toLocaleString()}</span>
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
    </div>
  );
}
