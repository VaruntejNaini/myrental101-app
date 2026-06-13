import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import ChatBell from "../components/ChatBell";

export default function SavedPage() {
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");
  const [savedItems, setSavedItems] = useState([]);

  // Load saved items from localStorage on mount
  useEffect(() => {
    const loaded = JSON.parse(localStorage.getItem("bookmarked_items") || "[]");
    setSavedItems(loaded);
  }, []);

  const handleRemove = (itemId) => {
    const updated = savedItems.filter(item => item.id !== itemId);
    setSavedItems(updated);
    localStorage.setItem("bookmarked_items", JSON.stringify(updated));
  };

  const handleClearAll = () => {
    setSavedItems([]);
    localStorage.setItem("bookmarked_items", "[]");
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 py-8 px-4 md:px-8 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/dashboard")}
            className={`flex items-center gap-2 text-sm font-extrabold px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.05] active:scale-95 ${
              isNight ? "bg-slate-900 border border-slate-800 hover:bg-slate-800" : "bg-white border border-slate-200 hover:bg-slate-100"
            }`}
          >
            ← Back to Home
          </button>
          <ChatBell isNight={isNight} />
          <NotificationBell isNight={isNight} />
        </div>
        <div className="text-center md:text-right">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            💖 Your Bookmarked Items
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Manage and access your saved rentals and listings</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto">
        {savedItems.length === 0 ? (
          <div className={`text-center py-20 rounded-3xl border border-dashed ${isNight ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
            <span className="text-6xl block mb-4">🔖</span>
            <h2 className="text-xl font-bold mb-2">No bookmarks saved yet</h2>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">Click the bookmark icon on any product card in our catalogs to store them here for quick access.</p>
            <button 
              onClick={() => navigate("/dashboard")}
              className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-extrabold text-xs py-3 px-6 rounded-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              Discover Products
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4 border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-400">{savedItems.length} Saved Item{savedItems.length > 1 ? "s" : ""}</span>
              <button 
                onClick={handleClearAll}
                className="text-xs font-bold text-red-500 hover:text-red-400 hover:underline cursor-pointer"
              >
                Clear All Bookmarks
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`group relative rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border ${
                    isNight ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"
                  }`}
                >
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {item.rowType || "Saved"}
                  </div>

                  {/* Remove Button */}
                  <button 
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow transition-all duration-300 scale-110 cursor-pointer"
                    title="Remove Bookmark"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
                      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                    </svg>
                  </button>

                  <div className={`h-40 relative flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300 overflow-hidden ${
                    isNight ? "bg-gradient-to-br from-slate-800 to-slate-950" : "bg-gradient-to-br from-indigo-50 to-violet-50"
                  }`}>
                    {item.images && item.images.length > 0 ? (
                      <img 
                        src={typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url || ""} 
                        alt={item.title} 
                        className="w-full h-full object-contain p-3" 
                      />
                    ) : (
                      <span className="select-none">
                        {item.emoji || (item.title?.toLowerCase().includes("camera") ? "📷" : item.title?.toLowerCase().includes("scooter") || item.title?.toLowerCase().includes("activa") ? "🛵" : item.title?.toLowerCase().includes("playstation") || item.title?.toLowerCase().includes("ps5") ? "🎮" : "📦")}
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className={`font-black text-sm mb-1 truncate ${isNight ? "text-slate-100" : "text-slate-800"}`}>{item.title}</h3>
                    
                    <div className="flex items-center gap-1.5 mb-3 text-[11px] text-slate-400 font-semibold">
                      <span>👤 {item.owner?.name || item.owner || "Local Owner"}</span>
                      <span>•</span>
                      <span>📍 {item.area || item.distance || "Local"}</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="text-violet-500 font-black text-base">
                        ₹{item.price || item.rentalPrice || "N/A"}
                        <span className="text-[10px] text-slate-400 font-normal">/{item.unit || "day"}</span>
                      </span>
                      
                      <button 
                        onClick={() => alert(`Redirecting to item request flow...`)}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Request
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
