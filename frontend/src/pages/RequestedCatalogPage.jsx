import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RequestedCatalogPage() {
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");

  // Mock borrow wishlist requests
  const initialRequests = [
    { id: "wish_camera_1", title: "Premium DSLR Camera (Wedding Shoot)", emoji: "📷", price: 350, category: "Electronics", owner: "Varun Tej", distance: "0.2 km away", duration: "5 Days" },
    { id: "wish_drone_2", title: "Looking to rent: DJI Mavic Pro Drone", emoji: "🚁", price: 800, category: "Electronics", owner: "Rohit S.", distance: "2.1 km away", duration: "3 Days" },
    { id: "wish_projector_3", title: "Need projector for screening tonight", emoji: "📽️", price: 400, category: "Electronics", owner: "Anish R.", distance: "2.7 km away", duration: "1 Day" },
    { id: "wish_drill_4", title: "Looking for DeWalt Drill set to buy/rent", emoji: "🔧", price: 100, category: "Tools", owner: "Suresh B.", distance: "0.8 km away", duration: "2 Days" },
    { id: "wish_guitar_5", title: "Acoustic Guitar wanted for 1 week", emoji: "🎸", price: 150, category: "Music", owner: "Kiran T.", distance: "3.5 km away", duration: "7 Days" }
  ];

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState(1000);
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
      const newItem = { ...item, rowType: "Requested Products", unit: "day" };
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
  const filteredRequests = initialRequests.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesPrice = p.price <= maxPrice;

    return matchesSearch && matchesCategory && matchesPrice;
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
          <h1 className="text-xl md:text-3xl font-black text-right">📢 Crowd-Sourced Wishlist Requests</h1>
          <p className="text-[10px] text-slate-400 text-right mt-0.5">Explore borrow requests and pitch offers as a lender</p>
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
                placeholder="Search cameras, guitars..."
                className={`w-full px-3 py-2 text-xs rounded-xl border border-slate-350 focus:outline-none focus:border-indigo-500 transition-colors ${
                  isNight ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              />
            </div>

            {/* Category Select */}
            <div className="mb-5">
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Category</label>
              <div className="space-y-1.5 text-xs font-semibold">
                {["All", "Electronics", "Tools", "Music"].map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-colors flex justify-between ${
                      selectedCategory === cat 
                        ? "bg-indigo-500 text-white" 
                        : "text-slate-400 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Proposal Slider */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-black uppercase text-slate-400">Max Budget Proposal</label>
                <span className="text-xs font-bold text-violet-500">₹{maxPrice}/day</span>
              </div>
              <input 
                type="range" 
                min={100} 
                max={1000} 
                step={50}
                value={maxPrice}
                onChange={e => setMaxPrice(+e.target.value)}
                className="w-full accent-indigo-500"
              />
            </div>
            
            <button 
              onClick={() => { setSearch(""); setSelectedCategory("All"); setMaxPrice(1000); }}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold py-2.5 rounded-xl uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {/* Right Side Grid (Product Cards list) */}
        <div className="lg:col-span-9">
          {filteredRequests.length === 0 ? (
            <div className={`text-center py-20 rounded-2xl border border-dashed ${isNight ? "bg-slate-900/40 border-slate-850" : "bg-white border-slate-200"}`}>
              <span className="text-4xl block mb-2">🔍</span>
              <p className="font-bold text-slate-400 text-sm">No requests found matching your filters</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting the filters or keyword search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map(p => (
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
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded-full border border-indigo-500/20">Proposal</span>
                    <h4 className="font-extrabold text-sm truncate mt-2">{p.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">👤 Requested by: {p.owner} • 📍 {p.distance}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">🕒 Duration Needed: {p.duration}</p>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                      <span className="text-violet-500 font-black text-sm">₹{p.price}<span className="text-[10px] text-slate-400 font-normal">/day</span></span>
                      <button className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors">Pitch Offer</button>
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
