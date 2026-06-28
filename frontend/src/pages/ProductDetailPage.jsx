import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import { STORAGE_KEYS } from "../constants/auth";

export const getImageUrl = (image) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.url || "";
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");

  const [product, setProduct] = useState(null);
  const [auction, setAuction] = useState(null);
  const [duration, setDuration] = useState(3);
  const [bidAmount, setBidAmount] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState("Product information");
  const [loading, setLoading] = useState(true);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeNegotiationStatus, setActiveNegotiationStatus] = useState(null);
  const [imgIndex, setImgIndex] = useState(0);

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

  useEffect(() => {
    console.log("Route ID:", id);
    API.get(`/rent/products/${id}`)
      .then((res) => {
        console.log("API Response:", res.data);
        setProduct(res.data.product);
        setAuction(res.data.auction);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching product:", err);
        setLoading(false);
      });

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
  }, [id]);

  // Ensure a stable anon id for guest viewers so we can deduplicate guest views
  const ensureAnonViewerId = () => {
    let anon = localStorage.getItem("anon_viewer_id");
    if (!anon) {
      anon = "anon_" + Math.random().toString(36).slice(2, 12);
      localStorage.setItem("anon_viewer_id", anon);
    }
    return anon;
  };

  // Record a view via dedicated endpoint once the product object is available
  useEffect(() => {
    if (!product) return;
    const anonId = ensureAnonViewerId();
    API.post(`/rent/products/${id}/view`, { anonViewerId: anonId }).catch(err => {
      // Non-fatal: just log
      console.debug("Failed to post product view:", err?.response?.data || err.message || err);
    });
  }, [product, id]);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      API.get("/auth/me")
        .then((userRes) => {
          const user = userRes.data;
          setCurrentUser(user);

          return API.get("/rent/transactions").then((txRes) => {
            const activeStates = ["PENDING_NEGOTIATION", "NEGOTIATING", "ACCEPTED", "AWAITING_PAYMENT", "RESERVED"];
            const activeTx = txRes.data.find(
              (t) =>
                activeStates.includes(t.status) &&
                String(t.product?._id || t.product) === String(id) &&
                String(t.borrower?._id || t.borrower) === String(user._id)
            );
            if (activeTx) {
              setActiveNegotiationStatus(activeTx.status);
            } else {
              setActiveNegotiationStatus(null);
            }
          });
        })
        .catch((err) => console.error("Error fetching transactions in detail page:", err));
    } else {
      setCurrentUser(null);
      setActiveNegotiationStatus(null);
    }
  }, [id]);

  useEffect(() => {
    setImgIndex(0);
  }, [id]);

  useEffect(() => {
    if (product && product.category) {
      API.get(`/rent/products?category=${product.category}`)
        .then(res => {
          setSimilarProducts(res.data.filter(p => p._id !== id).slice(0, 3));
        })
        .catch(err => console.error("Error loading similar products:", err));
    }
  }, [product, id]);

  useEffect(() => {
    if (!isNegotiationModalOpen) return;
    const timer = setTimeout(() => {
      setIsNegotiationModalOpen(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, [isNegotiationModalOpen]);

  const images = product?.images?.length ? product.images : [];

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

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

 const handleNegotiateClick = async () => {
  if (!product) return;
  if (activeNegotiationStatus !== null) {
    triggerToast("You already have an active negotiation for this product.");
    return;
  }
  const offer = window.prompt(`Enter your custom daily rate for "${product.title}" (Current: ₹${product.rentalPrice}/day):`);
  if (!offer) return;
  const numericOffer = parseFloat(offer);
  if (isNaN(numericOffer) || numericOffer <= 0) {
    triggerToast("Please enter a valid price.");
    return;
  }
  try {
    await API.post("/rent/negotiate", {
      productId: id,
      startDate: new Date(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
      dailyRate: numericOffer,
      securityDeposit: product.securityDeposit
    });
    setActiveNegotiationStatus("PENDING_NEGOTIATION");
    setIsNegotiationModalOpen(true);
  } catch (err) {
    if (err.response?.status === 409) {
      alert("You already have an active negotiation for this product.");
      setActiveNegotiationStatus("PENDING_NEGOTIATION");
      return;
    }
    triggerToast(err.response?.data?.msg || "Negotiation request failed");
  }
};


  const handleSecondHandNegotiateClick = async () => {
    if (!product) return;
    if (activeNegotiationStatus !== null) {
      triggerToast("You already have an active negotiation for this product.");
      return;
    }
    const offer = window.prompt(`Enter your custom buyout offer price for "${product.title}" (Current: ₹${product.rentalPrice}):`);
    if (!offer) return;
    const numericOffer = parseFloat(offer);
    if (isNaN(numericOffer) || numericOffer <= 0) {
      triggerToast("Please enter a valid price.");
      return;
    }
    
    try {
      await API.post("/rent/negotiate", {
        productId: id,
        startDate: new Date(),
        endDate: new Date(),
        dailyRate: numericOffer,
        securityDeposit: 0
      });
      setActiveNegotiationStatus("PENDING_NEGOTIATION");
      setIsNegotiationModalOpen(true);
    } catch (err) {
      if (err.response?.status === 409) {
        alert("You already have an active negotiation for this product.");
        setActiveNegotiationStatus("PENDING_NEGOTIATION");
        return;
      }
      triggerToast(err.response?.data?.msg || "Negotiation request failed");
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!bidAmount) return;
    try {
      const res = await API.post(`/rent/auction/${id}/bid`, {
        amount: Number(bidAmount),
        durationDays: duration
      });
      setAuction(res.data);
      if (product) {
        setProduct({ ...product, currentBid: Number(bidAmount) });
      }
      triggerToast(`Successfully placed bid of ₹${bidAmount}!`);
      setBidAmount("");
    } catch (err) {
      triggerToast(err.response?.data?.msg || "Failed to place bid");
    }
  };

  const handleAction = async () => {
    if (!product) return;
    if (product.productType === "SECOND_HAND") {
      try {
        const res = await API.post("/rent/negotiate", {
          productId: id,
          startDate: new Date(),
          endDate: new Date(),
          dailyRate: product.rentalPrice,
          securityDeposit: 0
        });
        triggerToast(`Purchase request for ${product.title} submitted! Checkout pending.`);
        setTimeout(() => navigate(`/rent/checkout/${id}`), 1500);
      } catch (err) {
        triggerToast(err.response?.data?.msg || "Purchase request failed");
      }
    } else {
      // Direct standard lease creation
      try {
        const res = await API.post("/rent/negotiate", {
          productId: id,
          startDate: new Date(),
          endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
          dailyRate: product.rentalPrice,
          securityDeposit: product.securityDeposit
        });
        
        // Save details inside Session Storage for checkout
        sessionStorage.setItem("rental_start", new Date().toLocaleDateString());
        sessionStorage.setItem("rental_end", new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toLocaleDateString());
        sessionStorage.setItem("rental_days", duration.toString());
        sessionStorage.setItem("rental_addons", JSON.stringify([]));

        triggerToast(`Rental configuration locked. Proceeding to payment Checkout!`);
        setTimeout(() => navigate(`/rent/checkout/${id}`), 1500);
      } catch (err) {
        triggerToast(err.response?.data?.msg || "Rental request failed");
      }
    }
  };

  console.log("Product State:", product);
  const isOwner = currentUser && product && String(product.owner?._id || product.owner) === String(currentUser._id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="animate-pulse text-sm font-bold">Loading product specifics...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
        <div className="max-w-md p-8 rounded-3xl border text-center space-y-4 border-red-500/20 bg-red-500/5 shadow-xl">
          <div className="text-4xl">🚫</div>
          <h2 className="text-xl font-black text-red-500">Listing Unavailable</h2>
          <p className="text-sm text-slate-400">This listing is no longer available.</p>
          <button 
            onClick={() => navigate("/dashboard")} 
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const emojiMap = {
    "Canon EOS R50 Camera": "📷",
    "Honda Activa Scooter": "🛵",
    "PlayStation 5 Console": "🎮",
    "DeWalt Power Drill Set": "🔧"
  };
  const emoji = emojiMap[product.title] || "📦";

  return (
    <div className={`min-h-screen transition-colors duration-500 py-8 px-4 md:px-8 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`} style={{ fontFamily: "'Nunito', 'Poppins', sans-serif" }}>
      
      {/* Navigation Breadcrumbs */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
        <button 
          onClick={() => navigate("/dashboard")}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.05] active:scale-95 ${
            isNight ? "bg-slate-900 border border-slate-800 hover:bg-slate-800" : "bg-white border border-slate-200 hover:bg-slate-100 shadow-sm"
          }`}
        >
          ← Back to Discovery
        </button>
        <h1 className="text-sm font-black text-indigo-500 uppercase tracking-widest">Product Specifics</h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        {/* 1. Product Images Carousel / Hero Image */}
        <div className={`p-8 rounded-3xl border text-center transition-all ${
          isNight ? "bg-slate-900/60 border-slate-850" : "bg-white border-slate-200/60 shadow-sm"
        }`}>
          <div className={`w-48 h-48 md:w-64 md:h-64 mx-auto rounded-3xl flex items-center justify-center shadow-md overflow-hidden relative group ${
            isNight ? "bg-gradient-to-br from-slate-800 to-slate-950" : "bg-gradient-to-br from-indigo-50 to-violet-50"
          }`}>
            {images.length > 0 ? (
              <img src={getImageUrl(images[imgIndex])} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[110px] select-none">{emoji}</span>
            )}

            {/* Carousel controls */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:text-indigo-400 transition-colors z-20 cursor-pointer bg-slate-900/40 p-1.5 rounded-full hover:bg-slate-900/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
                  title="Previous Image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 filter drop-shadow">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                  </svg>
                </button>

                <button 
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:text-indigo-400 transition-colors z-20 cursor-pointer bg-slate-900/40 p-1.5 rounded-full hover:bg-slate-900/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
                  title="Next Image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 filter drop-shadow">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                </button>

                {/* Position indicator */}
                <div className="absolute bottom-2 right-2 bg-slate-900/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20 select-none backdrop-blur-sm border border-white/10">
                  {imgIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info Block */}
        <div className={`p-6 md:p-8 rounded-3xl border shadow-sm ${
          isNight ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200"
        } space-y-6`}>
          
          {/* 2. Product Name */}
          <h1 className="text-2xl md:text-3xl font-black">{product.title}</h1>

          {/* 3. Price */}
          <div className="border-t border-b border-slate-100 dark:border-slate-850 py-4 flex justify-between items-center">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-black block">Price Rate</span>
              <span className="text-3xl font-black text-indigo-500">₹{product.rentalPrice}</span>
              <span className="text-xs text-slate-400">/{product.productType === "RENT" ? "day" : "flat"}</span>
            </div>

            {/* 4. Security Deposit */}
            {product.productType === "RENT" && (
              <div className="text-right">
                <span className="text-slate-400 text-[10px] uppercase font-black block">Escrow Security Deposit</span>
                <span className="text-xl font-bold text-indigo-400">₹{product.securityDeposit}</span>
              </div>
            )}
          </div>

          {/* Config options based on listing type */}
          {product.productType === "RENT" && product.status !== "AUCTION_ACTIVE" && (
            <div className="mb-4">
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Duration Required (Days)</label>
              <select 
                value={duration}
                onChange={e => setDuration(+e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none transition-colors ${
                  isNight ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-200 text-slate-850 focus:border-indigo-400"
                }`}
              >
                {[1, 2, 3, 5, 7, 10, 14, 30].map(d => (
                  <option key={d} value={d}>{d} Day{d > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
          )}

          {/* Actions grid */}
          <div className="space-y-3">
            {isOwner ? (
              <div className={`p-6 rounded-2xl border text-center space-y-4 ${
                isNight ? "bg-slate-900/80 border-indigo-500/30 text-white" : "bg-indigo-50/50 border-indigo-200/50 text-slate-800"
              }`}>
                <div className="text-3xl">📦</div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-indigo-500">This is your listing.</h3>
                  <p className="text-xs text-slate-400">Manage it from your Dashboard.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  ← Back to Dashboard
                </button>
              </div>
            ) : (
              <>
                {/* 5. Rent / Buy Button */}
                {product.status !== "AUCTION_ACTIVE" ? (
                  <button 
                    onClick={handleAction}
                    className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-extrabold text-xs py-4 rounded-2xl shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {product.productType === "SECOND_HAND" ? (
                      <span>Buy Out Now (₹{product.rentalPrice})</span>
                    ) : (
                      <span>Rent Now (₹{product.rentalPrice * duration} Total)</span>
                    )}
                  </button>
                ) : (
                  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-xs">
                    <span className="font-extrabold text-orange-500">🔥 SURGE DEMAND AUCTION ACTIVE</span>
                    <p className="text-slate-400 mt-1">Countdown: Ending soon. Top bid: <strong>₹{auction?.currentTopBid}</strong></p>
                    <form onSubmit={handlePlaceBid} className="mt-3 flex gap-2">
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`Bid > ₹${auction?.currentTopBid}`}
                        className={`flex-1 px-3 py-2 border rounded-xl focus:outline-none text-xs ${
                          isNight ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200"
                        }`}
                      />
                      <button type="submit" className="bg-orange-500 text-white font-bold px-4 py-2 rounded-xl">
                        Bid
                      </button>
                    </form>
                  </div>
                )}

                {/* 6. Negotiate Button */}
                {product.productType === "RENT" && product.status !== "AUCTION_ACTIVE" && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleNegotiateClick}
                      disabled={activeNegotiationStatus !== null}
                      className={`w-full text-xs font-bold py-3.5 rounded-2xl transition-all border flex items-center justify-center gap-2 ${
                        activeNegotiationStatus !== null
                          ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-60"
                          : isNight ? "bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300 cursor-pointer" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                      }`}
                    >
                      {activeNegotiationStatus === "AWAITING_PAYMENT" || activeNegotiationStatus === "ACCEPTED"
                        ? "✓ Accepted - Checkout Required"
                        : activeNegotiationStatus !== null
                        ? "✓ Negotiation Request Sent"
                        : "💬 Propose Custom Price Negotiation"}
                    </button>
                  </div>
                )}

                {product.productType === "SECOND_HAND" && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleSecondHandNegotiateClick}
                      disabled={activeNegotiationStatus !== null}
                      className={`w-full text-xs font-bold py-3.5 rounded-2xl transition-all border flex items-center justify-center gap-2 ${
                        activeNegotiationStatus !== null
                          ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-60"
                          : isNight ? "bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300 cursor-pointer" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                      }`}
                    >
                      {activeNegotiationStatus === "AWAITING_PAYMENT" || activeNegotiationStatus === "ACCEPTED"
                        ? "✓ Accepted - Checkout Required"
                        : activeNegotiationStatus !== null
                        ? "✓ Buyout Negotiation Sent"
                        : "💬 Propose Buyout Offer Price"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 7. Real-Time Distance */}
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Owner Location Proximity</span>
            {coordsLoading ? (
              <span className="text-xs text-slate-455 animate-pulse font-bold">Calculating distance...</span>
            ) : coordsError ? (
              <span className="text-xs text-amber-500 font-bold">{coordsError}</span>
            ) : (
              <span className="text-sm font-black text-indigo-450">
                ⚡ calculated at {calculateDistance(
                  userCoords?.latitude,
                  userCoords?.longitude,
                  product.location?.coordinates?.[1],
                  product.location?.coordinates?.[0]
                )} km away from you
              </span>
            )}
          </div>

          {/* 8. Owner Information */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Listed By</span>
            <p className="text-sm font-black">👤 {product.owner?.name || "Owner"}</p>
            <p className="text-xs text-slate-450">{product.owner?.email || "owner@rentit.com"}</p>
          </div>

          {/* 9. Product Description */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-base">Product Description</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{product.description}</p>
          </div>

          {/* 10. Specifications */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-base">Specifications</h3>
            <div className="grid grid-cols-2 gap-4 text-xs font-bold bg-slate-50 dark:bg-slate-955 p-4 rounded-2xl border border-slate-200 dark:border-slate-850">
              <div>
                <span className="text-slate-450 block text-[9px] uppercase">Category</span>
                <span>{product.category}</span>
              </div>
              <div>
                <span className="text-slate-455 block text-[9px] uppercase">State/Status</span>
                <span className="text-indigo-400">{product.status}</span>
              </div>
              <div>
                <span className="text-slate-455 block text-[9px] uppercase">Locality Area</span>
                <span>{product.area}</span>
              </div>
              <div>
                <span className="text-slate-455 block text-[9px] uppercase">City</span>
                <span>{product.city}</span>
              </div>
            </div>
          </div>

          {/* 11. Reviews Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-base">Community Reviews</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black">⭐⭐⭐⭐⭐ Aman G.</span>
                  <span className="text-slate-550">2 weeks ago</span>
                </div>
                <p className="text-slate-400">Excellent item quality! Works flawlessly and clean delivery.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black">⭐⭐⭐⭐⭐ Meera N.</span>
                  <span className="text-slate-550">1 month ago</span>
                </div>
                <p className="text-slate-400">Friendly owner and smooth handoff mechanism. Def rental choice!</p>
              </div>
            </div>
          </div>

          {/* 12. Similar Products */}
          {similarProducts.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-base">Similar Products</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {similarProducts.map(sp => (
                  <div 
                    key={sp._id} 
                    onClick={() => navigate(`/product/${sp._id}`)}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-950 flex flex-col gap-1.5"
                  >
                    <div className="h-20 w-full flex items-center justify-center text-4xl mb-1 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden">
                      {sp.images && sp.images.length > 0 ? (
                        <img src={getImageUrl(sp.images[0])} alt={sp.title} className="w-full h-full object-cover" />
                      ) : (
                        <span>📦</span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs truncate">{sp.title}</h4>
                    <span className="text-indigo-400 font-extrabold text-xs">₹{sp.rentalPrice}/day</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Floating alert */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-[120] flex items-center gap-3 bg-slate-950 border border-indigo-500/30 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl animate-slide-in">
          <span className="text-indigo-400 font-black">🔔 Alert:</span>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage("")} className="ml-3 text-slate-400 hover:text-white font-extrabold cursor-pointer">✕</button>
        </div>
      )}

      {/* Premium Center-Popped Notification Modal */}
      {isNegotiationModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-md flex items-center justify-center animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center text-center w-80 h-80 aspect-square border border-gray-100 dark:border-zinc-800">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mb-4 text-2xl">
              📩
            </div>
            <p className="text-slate-800 dark:text-white font-bold text-sm leading-relaxed px-2">
              Negotiation request sent to {product.owner?.name || "owner"}. You'll receive a push alert once reviewed!
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
