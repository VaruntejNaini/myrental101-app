import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MyOrders() {
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");

  // Load avatar if any
  const [profilePic] = useState(() => localStorage.getItem("userProfilePic") || "");

  // Notification / Toast
  const [showNotification, setShowNotification] = useState("");

  // States copied and enhanced from the sidebar
  const [activeRentals, setActiveRentals] = useState([
    { id: "active-1", title: "Canon EOS R50 Camera", rate: "₹450/day", progress: 75, startDate: "12 May", endDate: "30 May" },
    { id: "active-2", title: "Honda Activa Scooter", rate: "₹250/day", progress: 40, startDate: "18 May", endDate: "05 June" }
  ]);

  const [activeBorrowRequests, setActiveBorrowRequests] = useState([
    { id: "borrow-1", title: "2-Person Camping Tent", duration: "2 days", status: "Negotiating", statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { id: "borrow-2", title: "Fender Stratocaster Guitar", duration: "5 days", status: "Accepted Deal", statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }
  ]);

  const [orderHistory, setOrderHistory] = useState([
    { id: "history-1", title: "MacBook Pro 14\"", detail: "Leased to Priya S. • 15 May - 02 June", role: "Lender" },
    { id: "history-2", title: "DJI Mavic Air 2 Drone", detail: "Purchased outright • Delivered 15 May", role: "Buyer" },
    { id: "history-3", title: "Fender Stratocaster Guitar", detail: "Purchased outright • In Transit", role: "Buyer" }
  ]);

  // Adjust Possession Modal States
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustRental, setAdjustRental] = useState(null);
  const [adjustType, setAdjustType] = useState("extend");
  const [adjustDays, setAdjustDays] = useState(1);
  const [adjustReason, setAdjustReason] = useState("");

  const triggerToast = (msg) => {
    setShowNotification(msg);
  };

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => setShowNotification(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  return (
    <div className={`min-h-screen transition-colors duration-500 py-8 px-4 md:px-8 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`} style={{ fontFamily: "'Nunito', 'Poppins', sans-serif" }}>
      
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10 flex flex-wrap justify-between items-center gap-4 border-b pb-6 border-slate-100 dark:border-slate-800">
        <div>
          <button 
            onClick={() => navigate("/dashboard")}
            className={`flex items-center gap-2 text-sm font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              isNight ? "bg-slate-900 border border-slate-800 hover:bg-slate-800" : "bg-white border border-slate-200 hover:bg-slate-100"
            }`}
          >
            ← Back to Home
          </button>
        </div>
        <div className="text-center md:text-right">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            📦 My Orders & Rentals
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Track your active rentals, lease requests, and purchase orders</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Summary Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className={`p-6 rounded-3xl border transition-all ${
            isNight ? "bg-slate-900 border-slate-850" : "bg-white border-slate-100"
          }`}>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl overflow-hidden border-2 border-indigo-500/30">
                  {profilePic ? (
                    <img src={profilePic} alt="Varun Tej" className="w-full h-full object-cover" />
                  ) : (
                    "VT"
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-indigo-500">Varun Tej</h3>
                <span className="inline-block text-[10px] bg-indigo-500/15 text-indigo-400 font-bold px-2 py-0.5 rounded-lg border border-indigo-500/20 mt-1">
                  [Newbie] Flair Badge
                </span>
                <p className="text-xs text-slate-450 mt-3 font-semibold">
                  Reputation Score: <span className="text-emerald-400 font-black">98 / 100 Trust</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className={`p-6 rounded-3xl border transition-all ${
            isNight ? "bg-slate-900 border-slate-850" : "bg-white border-slate-100"
          }`}>
            <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider mb-4">Rental Summary</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className={`p-3 rounded-2xl ${isNight ? "bg-slate-950" : "bg-slate-50"}`}>
                <span className="text-lg font-black text-indigo-500">{activeRentals.length}</span>
                <span className="block text-[9px] text-slate-400 font-bold uppercase mt-1">Possessing</span>
              </div>
              <div className={`p-3 rounded-2xl ${isNight ? "bg-slate-950" : "bg-slate-50"}`}>
                <span className="text-lg font-black text-indigo-500">{activeBorrowRequests.length}</span>
                <span className="block text-[9px] text-slate-400 font-bold uppercase mt-1">Borrowing</span>
              </div>
              <div className={`p-3 rounded-2xl ${isNight ? "bg-slate-950" : "bg-slate-50"}`}>
                <span className="text-lg font-black text-indigo-500">{orderHistory.length}</span>
                <span className="block text-[9px] text-slate-400 font-bold uppercase mt-1">History</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Main Content Areas */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Active Rentals Period */}
          <div className={`p-6 rounded-3xl border transition-all ${
            isNight ? "bg-slate-900 border-slate-850" : "bg-white border-slate-100"
          }`}>
            <h3 className="text-lg font-black uppercase tracking-wider text-indigo-450 mb-6 flex items-center gap-2">
              📥 Active Rentals Period
            </h3>
            
            <div className="space-y-6">
              {activeRentals.map(rent => (
                <div key={rent.id} className={`p-5 rounded-2xl border transition-all ${
                  isNight ? "bg-slate-950 border-slate-900" : "bg-indigo-50/20 border-indigo-100/40"
                }`}>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-200 dark:text-white">{rent.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">Rate: <span className="text-indigo-400 font-bold">{rent.rate}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => triggerToast(`Return request initiated for: ${rent.title}`)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        Initiate Return
                      </button>
                      <button 
                        onClick={() => { setAdjustRental(rent); setAdjustDays(1); setAdjustReason(""); setAdjustType("extend"); setShowAdjustModal(true); }}
                        className={`text-[10px] font-black px-3.5 py-2 rounded-xl transition-all border cursor-pointer ${
                          isNight ? "bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white" : "bg-white border-slate-200 text-slate-650 hover:bg-slate-100"
                        }`}
                      >
                        Extend/Shrink
                      </button>
                    </div>
                  </div>

                  {/* Progress bar timeline */}
                  <div className="mt-5">
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                      <span>Start: {rent.startDate}</span>
                      <span>End: {rent.endDate}</span>
                    </div>
                    <div className="relative w-full h-2 bg-slate-800 rounded-full flex items-center">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${rent.progress}%` }}></div>
                      <div className="absolute w-3 h-3 rounded-full bg-indigo-500 border border-white" style={{ left: `calc(${rent.progress}% - 6px)` }}></div>
                    </div>
                    <div className="text-right text-[10px] text-indigo-400 font-bold mt-1.5">{rent.progress}% Elapsed</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Active Borrow Requests */}
          <div className={`p-6 rounded-3xl border transition-all ${
            isNight ? "bg-slate-900 border-slate-850" : "bg-white border-slate-100"
          }`}>
            <h3 className="text-lg font-black uppercase tracking-wider text-indigo-450 mb-6">
              🛍️ Active Borrow Requests
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-850">
              {activeBorrowRequests.map(req => (
                <div key={req.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-sm">{req.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Duration: {req.duration}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${req.statusColor}`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: History */}
          <div className={`p-6 rounded-3xl border transition-all ${
            isNight ? "bg-slate-900 border-slate-850" : "bg-white border-slate-100"
          }`}>
            <h3 className="text-lg font-black uppercase tracking-wider text-indigo-450 mb-6">
              🚚 Order History
            </h3>
            <div className="space-y-4">
              {orderHistory.map(history => (
                <div key={history.id} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                  isNight ? "bg-slate-950 border-slate-900" : "bg-slate-50/50 border-slate-200"
                }`}>
                  <div>
                    <h4 className="font-extrabold text-sm">{history.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">{history.detail}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
                    history.role === "Lender" 
                      ? "bg-violet-500/10 text-violet-400 border border-violet-500/25" 
                      : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25"
                  }`}>
                    {history.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Adjust Possession Modal */}
      {showAdjustModal && adjustRental && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowAdjustModal(false)}>
          <div className={`w-[90%] max-w-md rounded-3xl p-6 border shadow-2xl transition-colors ${
            isNight ? "bg-slate-900 border-slate-850 text-white" : "bg-white border-slate-200 text-slate-800"
          }`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black mb-1">Adjust Possession Period</h3>
            <p className="text-xs text-slate-400 mb-6">Modify rental details for: <span className="text-indigo-400 font-bold">{adjustRental.title}</span></p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Adjustment Type</label>
                <div className={`flex rounded-xl p-1 gap-1 ${isNight ? "bg-slate-950" : "bg-slate-100"}`}>
                  <button 
                    onClick={() => setAdjustType("extend")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${adjustType === "extend" ? "bg-indigo-500 text-white shadow" : "text-slate-450 hover:text-indigo-500"}`}
                  >
                    Extension
                  </button>
                  <button 
                    onClick={() => setAdjustType("shrink")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${adjustType === "shrink" ? "bg-indigo-500 text-white shadow" : "text-slate-450 hover:text-indigo-500"}`}
                  >
                    Shrinkage
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Select Number of Days</label>
                <select 
                  value={adjustDays}
                  onChange={(e) => setAdjustDays(+e.target.value)}
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none transition-colors ${
                    isNight ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-200 text-slate-800 focus:border-indigo-400"
                  }`}
                >
                  {[1, 2, 3, 5, 7, 10, 14].map(d => (
                    <option key={d} value={d}>{d} Day{d > 1 ? "s" : ""}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Reason for Request</label>
                <textarea 
                  rows={3}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Describe your reasoning..."
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none resize-none transition-colors ${
                    isNight ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-200 text-slate-800 focus:border-indigo-400"
                  }`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowAdjustModal(false)}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isNight ? "border-slate-800 text-slate-400 hover:text-white" : "border-slate-200 text-slate-500 hover:text-slate-850"
                  }`}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowAdjustModal(false);
                    triggerToast(`Adjustment request sent: ${adjustType === "extend" ? "Extension" : "Shrinkage"} of ${adjustDays} day(s) requested.`);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-xs font-bold hover:scale-102 transition-transform shadow-md cursor-pointer"
                >
                  Submit Request
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

    </div>
  );
}
