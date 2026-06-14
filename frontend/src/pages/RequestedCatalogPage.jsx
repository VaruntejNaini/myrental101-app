import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

const WishCard = ({ wish, currentUser, isNight, handlePitchQuote, handleAcceptOffer, handleDeleteWish }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const cardRef = useRef(null);
  const hasTriggered = useRef(false);

  const isCreator = currentUser && (
    (wish.creator && wish.creator._id === currentUser._id) ||
    (wish.creator === currentUser._id)
  );

  useEffect(() => {
    if (hasTriggered.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTriggered.current) {
            hasTriggered.current = true;

            // Get anonymous id
            let anonId = localStorage.getItem("anonViewerId");
            if (!anonId) {
              anonId = "guest_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
              localStorage.setItem("anonViewerId", anonId);
            }

            API.post(`/wishes/${wish._id}/view`, { anonViewerId: anonId })
              .then(() => {
                if (cardRef.current && observer) {
                  observer.unobserve(cardRef.current);
                }
              })
              .catch((err) => console.error("Error logging view from catalog card:", err));
          }
        });
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current && observer) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [wish._id, currentUser]);

  return (
    <div ref={cardRef} className={`p-6 rounded-2xl border flex flex-col justify-between relative ${isNight ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
      {isCreator && (
        <button
          disabled={isDeleting}
          onClick={async (e) => {
            e.stopPropagation();
            if (window.confirm("Are you sure you wanna delete your request?")) {
              setIsDeleting(true);
              await handleDeleteWish(wish._id);
              setIsDeleting(false);
            }
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow transition-all cursor-pointer bg-slate-950/60 text-white hover:bg-red-500 hover:scale-110 disabled:opacity-50 z-20"
          title="Delete Request"
        >
          {isDeleting ? (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      )}
      <div>
        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded border border-indigo-500/20">{wish.category}</span>
        <h4 className="font-extrabold text-base mt-2">{wish.title}</h4>
        <p className="text-xs text-slate-400 mt-1">{wish.description}</p>
        <div className="mt-3 text-xs text-slate-450 border-b border-slate-850 dark:border-slate-800 pb-3 mb-3">
          <p>Budget: <strong>₹{wish.budget}/day</strong></p>
          <p>Duration: <strong>{wish.durationDays} Days</strong></p>
        </div>
      </div>

      {/* Submit Offer Quote or Views / Insights Display */}
      <div className="mt-auto">
        {isCreator ? (
          <div className="flex items-center justify-between border-t border-slate-800 pt-3">
            <a href="#insights" className="text-xs text-indigo-400 hover:underline font-bold">
              📊 Insights
            </a>
            <span className="text-xs text-slate-400">
              views: <strong className="text-indigo-400">{wish.views || 0}</strong>
            </span>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            <button onClick={() => handlePitchQuote(wish._id)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl transition-all duration-200 active:scale-95">
              Offer
            </button>
          </div>
        )}
      </div>

      {/* List of Incoming quote offers for creator */}
      {isCreator && wish.offers && wish.offers.length > 0 && (
        <div className="space-y-2 bg-slate-950 p-3 rounded-2xl mt-4">
          <span className="text-[9px] font-bold text-indigo-400 block">PITCHED OFFERS ({wish.offers.length})</span>
          {wish.offers.map(offer => (
            <div key={offer._id} className="flex justify-between items-center text-xs border-b border-slate-900 pb-2 last:border-0 last:pb-0">
              <div>
                <p className="font-bold">₹{offer.quoteAmount}/day</p>
                <p className="text-[10px] text-slate-400">{offer.productDetails}</p>
              </div>
              <button onClick={() => handleAcceptOffer(wish._id, offer._id)} className="bg-indigo-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg">
                Accept Offer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function RequestedCatalogPage() {
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");

  const [wishes, setWishes] = useState([]);
  const [pitchAmount, setPitchAmount] = useState({});
  const [pitchDetails, setPitchDetails] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState(1000);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [notification, setNotification] = useState("");
  
  // Custom wish creation fields
  const [newWishTitle, setNewWishTitle] = useState("");
  const [newWishDesc, setNewWishDesc] = useState("");
  const [newWishCategory, setNewWishCategory] = useState("Electronics");
  const [newWishBudget, setNewWishBudget] = useState("");
  const [newWishDuration, setNewWishDuration] = useState("");

  const syncWishes = () => {
    API.get("/wishes")
      .then(res => setWishes(res.data))
      .catch(err => console.error("Error fetching wishes:", err));
  };

  useEffect(() => {
    syncWishes();
    const existing = JSON.parse(localStorage.getItem("bookmarked_items") || "[]");
    setBookmarkedIds(existing.map(x => x.id));

    // Fetch logged in user profile
    if (localStorage.getItem("token")) {
      API.get("/auth/me")
        .then(res => setCurrentUser(res.data))
        .catch(err => console.error("Error fetching user profile:", err));
    }
  }, []);

  const triggerToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleCreateWish = async (e) => {
    e.preventDefault();
    if (!newWishTitle || !newWishBudget || !newWishDuration) return;
    try {
      await API.post("/wishes", {
        title: newWishTitle,
        description: newWishDesc || "Custom borrower need request.",
        category: newWishCategory,
        budget: Number(newWishBudget),
        durationDays: Number(newWishDuration)
      });
      triggerToast("Your Borrow Wish broadcast is now active! 📢");
      setNewWishTitle("");
      setNewWishDesc("");
      setNewWishBudget("");
      setNewWishDuration("");
      syncWishes();
    } catch (err) {
      triggerToast("Failed to post wish request");
    }
  };

  const handlePitchQuote = async (wishId) => {
    try {
      await API.post(`/wishes/${wishId}/pitch`, {
        productDetails: "I have this item in clean condition."
      });
      triggerToast("Offer proposal successfully pitched to borrower!");
      syncWishes();
    } catch (err) {
      triggerToast("Failed to pitch quote");
    }
  };

  const handleAcceptOffer = async (wishId, offerId) => {
    try {
      const res = await API.post(`/wishes/${wishId}/accept`, { offerId });
      triggerToast("Offer accepted! Redirecting to security deposit checkout...");
      const transactionId = res.data.transaction._id;
      // Setup configurator options
      sessionStorage.setItem("rental_start", new Date().toLocaleDateString());
      sessionStorage.setItem("rental_end", new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString());
      sessionStorage.setItem("rental_days", "3");
      sessionStorage.setItem("rental_addons", JSON.stringify([]));
      
      // Go directly to checkout
      setTimeout(() => navigate(`/rent/checkout/${transactionId}`), 1500);
    } catch (err) {
      triggerToast("Failed to accept quote");
    }
  };

  const handleDeleteWish = async (wishId) => {
    try {
      await API.delete(`/wishes/${wishId}`);
      triggerToast("Request deleted successfully. 🎉");
      setWishes(prev => prev.filter(w => w._id !== wishId));
    } catch (err) {
      const errMsg = err.response?.data?.msg || "Failed to delete request. Please try again.";
      triggerToast(errMsg);
    }
  };

  const filteredRequests = wishes.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesPrice = p.budget <= maxPrice;
    return matchesSearch && matchesCategory && matchesPrice;
  });

  return (
    <div className={`min-h-screen transition-colors duration-500 py-6 px-4 md:px-8 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center flex-wrap gap-4 border-b pb-4 border-slate-800">
        <button onClick={() => navigate("/dashboard")} className="bg-slate-900 border border-slate-800 text-xs px-4 py-2.5 rounded-xl text-white cursor-pointer transition-all duration-200 hover:scale-[1.05] active:scale-95 hover:bg-slate-800">
          ← Back to Discovery
        </button>
        <h1 className="text-xl md:text-3xl font-black">📢 Crowd-Sourced Wishlist Requests</h1>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Create Wish & Filters */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Create Broadcast form */}
          <div className={`p-6 rounded-2xl border ${isNight ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <h3 className="font-extrabold text-sm mb-4 uppercase text-indigo-400">Broadcast a Wish Request</h3>
            <form onSubmit={handleCreateWish} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1">Item Title Needed</label>
                <input type="text" value={newWishTitle} onChange={(e) => setNewWishTitle(e.target.value)} placeholder="e.g. High capacity generator" className={`w-full px-3 py-2 rounded-xl border focus:outline-none transition-colors ${isNight ? "bg-black border-slate-800 text-white placeholder-slate-500 caret-white" : "bg-white border-slate-300 text-black placeholder-slate-400 caret-black"}`} />
              </div>
              <div>
                <label className="block mb-1">Description / Requirements</label>
                <textarea value={newWishDesc} onChange={(e) => setNewWishDesc(e.target.value)} placeholder="Condition details, specific date parameters..." className={`w-full px-3 py-2 rounded-xl border resize-none focus:outline-none transition-colors ${isNight ? "bg-black border-slate-800 text-white placeholder-slate-500 caret-white" : "bg-white border-slate-300 text-black placeholder-slate-400 caret-black"}`} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1">Max Budget (₹/day)</label>
                  <input type="number" value={newWishBudget} onChange={(e) => setNewWishBudget(e.target.value)} placeholder="₹2000" className={`w-full px-3 py-2 rounded-xl border focus:outline-none transition-colors ${isNight ? "bg-black border-slate-800 text-white placeholder-slate-500 caret-white" : "bg-white border-slate-300 text-black placeholder-slate-400 caret-black"}`} />
                </div>
                <div>
                  <label className="block mb-1">Duration (Days)</label>
                  <input type="number" value={newWishDuration} onChange={(e) => setNewWishDuration(e.target.value)} placeholder="3" className={`w-full px-3 py-2 rounded-xl border focus:outline-none transition-colors ${isNight ? "bg-black border-slate-800 text-white placeholder-slate-500 caret-white" : "bg-white border-slate-300 text-black placeholder-slate-400 caret-black"}`} />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl mt-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                Broadcast Wish
              </button>
            </form>
          </div>

          {/* Filters */}
          <div className={`p-6 rounded-2xl border ${isNight ? "bg-slate-900 border-slate-800" : "bg-white border-slate-205"}`}>
            <h3 className="font-extrabold text-sm mb-4 uppercase text-indigo-400">Filter Wishes</h3>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search wishlist title..." className={`w-full px-3 py-2 text-xs rounded-xl border mb-4 focus:outline-none transition-colors ${isNight ? "bg-black border-slate-800 text-white placeholder-slate-500 caret-white" : "bg-white border-slate-300 text-black placeholder-slate-400 caret-black"}`} />
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className={`w-full px-3 py-2 rounded-xl border text-xs mb-4 focus:outline-none transition-colors ${isNight ? "bg-black border-slate-800 text-white caret-white" : "bg-white border-slate-300 text-black caret-black"}`}>
              <option value="All">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Tools">Tools</option>
              <option value="Music">Music</option>
            </select>
          </div>

        </div>

        {/* Right column: Wishes Catalog List Feed */}
        <div className="lg:col-span-8 space-y-6">
          {filteredRequests.length === 0 ? (
            <p className="text-slate-400 text-center py-12">No active wish requests match your filters.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRequests.map(wish => (
                <WishCard
                  key={wish._id}
                  wish={wish}
                  currentUser={currentUser}
                  isNight={isNight}
                  handlePitchQuote={handlePitchQuote}
                  handleAcceptOffer={handleAcceptOffer}
                  handleDeleteWish={handleDeleteWish}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {notification && (
        <div className="fixed bottom-6 left-6 z-[120] bg-slate-950 border border-indigo-500/30 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl">
          <span>{notification}</span>
        </div>
      )}

    </div>
  );
}
