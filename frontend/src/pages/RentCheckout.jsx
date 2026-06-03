import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RentalAgreement from "../components/rent-flow/RentalAgreement";

export default function RentCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");

  // Mock catalog
  const catalog = {
    "camera": { title: "Sony FX3 Cinema Camera Kit", price: 450 },
    "ps5": { title: "PlayStation 5 Pro Console", price: 350 },
    "bike": { title: "Specialized Carbon Road Bike", price: 300 }
  };
  const item = catalog[id] || catalog["camera"];

  // Config values from SessionStorage
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState(1);
  const [addons, setAddons] = useState([]);

  // Payment states
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setStartDate(sessionStorage.getItem("rental_start") || "2026-06-05");
    setEndDate(sessionStorage.getItem("rental_end") || "2026-06-10");
    setDays(parseInt(sessionStorage.getItem("rental_days") || "5"));
    try {
      setAddons(JSON.parse(sessionStorage.getItem("rental_addons") || "[]"));
    } catch (_) {}
  }, []);

  // Calculate totals
  const rentTotal = item.price * days;
  const addonsTotal = addons.reduce((acc, curr) => acc + (curr.price * (curr.perDay ? days : 1)), 0);
  const serviceFee = Math.round(rentTotal * 0.08);
  const deposit = Math.round(item.price * 2.5);
  const grandTotal = rentTotal + addonsTotal + serviceFee + deposit;

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!agreed) {
      alert("Please review and electronically sign the Rental Agreement!");
      return;
    }
    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
      alert("Please fill out all credit card details!");
      return;
    }

    setIsProcessing(true);
    
    // Simulate secure network transaction delay
    setTimeout(() => {
      setIsProcessing(false);
      const mockBookingId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Cache details in session storage for the confirmation page
      sessionStorage.setItem("active_booking_id", mockBookingId);
      sessionStorage.setItem("active_booking_item", item.title);
      sessionStorage.setItem("active_booking_total", grandTotal.toString());
      sessionStorage.setItem("active_booking_days", days.toString());
      sessionStorage.setItem("active_booking_start", startDate);
      sessionStorage.setItem("active_booking_end", endDate);
      
      navigate(`/rent/tracker/${mockBookingId}`);
    }, 2500);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 py-8 px-4 md:px-8 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Navigation Banner */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => navigate(`/rent/configure/${id || "camera"}`)}
            className={`flex items-center gap-2 text-sm font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer ${
              isNight ? "bg-slate-900 border border-slate-800 hover:bg-slate-800" : "bg-white border border-slate-200 hover:bg-slate-100"
            }`}
          >
            ← Adjust Selection
          </button>
          
          <div className="flex gap-2">
            <span className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-800 rounded-full" />
            <span className="w-2.5 h-2.5 bg-violet-600 rounded-full" />
            <span className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-800 rounded-full" />
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-black mb-1">Payment & Security Authorization</h1>
        <p className="text-sm text-slate-400 font-medium">Verify your payment credentials and secure your deposit hold</p>
      </div>

      {isProcessing ? (
        <div className="max-w-md mx-auto text-center py-20 animate-fadeIn">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-black mb-2 text-slate-800 dark:text-slate-100">Securing Payment Channel...</h2>
          <p className="text-sm text-slate-400">Verifying authorization and holding refundable security deposit.</p>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Agreement & Payment Fields */}
          <form onSubmit={handlePaymentSubmit} className="lg:col-span-7 space-y-6">
            
            {/* Agreement Signature Component */}
            <RentalAgreement onAgreeChange={(val) => setAgreed(val)} />

            {/* Credit Card payment details */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md">
              <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span>💳</span> Billing & Card Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Cardholder Name</label>
                  <input 
                    type="text" 
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Varun Tej"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-sm font-semibold border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800 dark:text-slate-200 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Credit Card Number</label>
                  <input 
                    type="text" 
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, "").replace(/(\d{4})/g, "$1 ").trim())}
                    maxLength="19"
                    placeholder="•••• •••• •••• ••••"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-sm font-mono font-semibold border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800 dark:text-slate-200 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Expiry Date</label>
                    <input 
                      type="text" 
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      maxLength="5"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-sm font-mono font-semibold border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800 dark:text-slate-200 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">CVV / CVC</label>
                    <input 
                      type="password" 
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      maxLength="3"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-sm font-mono font-semibold border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800 dark:text-slate-200 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pay primary button */}
            <button 
              type="submit"
              disabled={!agreed}
              className={`w-full text-white font-extrabold text-sm py-4 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                agreed 
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20 active:scale-95" 
                  : "bg-slate-400 dark:bg-slate-800 cursor-not-allowed opacity-50"
              }`}
            >
              <span>💳 Securely Pay & Authorize ${grandTotal.toLocaleString()}</span>
            </button>
          </form>

          {/* Right Column: Mini Checkout Receipt Summary */}
          <div className="lg:col-span-5">
            <div className={`p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg sticky top-24`}>
              <h3 className="font-semibold text-lg border-b border-slate-800 pb-4 mb-4">Rental Summary</h3>
              
              <div className="space-y-4 text-sm text-slate-300">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500">Item Name</label>
                  <p className="font-extrabold text-white text-base mt-0.5">{item.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-800/60 pt-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500">Start Date</label>
                    <p className="font-semibold text-white mt-0.5">{startDate}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500">End Date</label>
                    <p className="font-semibold text-white mt-0.5">{endDate}</p>
                  </div>
                </div>

                <div className="border-t border-slate-800/60 pt-3 flex justify-between">
                  <span>Rental Duration</span>
                  <span className="font-semibold text-white">{days} {days === 1 ? "day" : "days"}</span>
                </div>

                {addons.length > 0 && (
                  <div className="border-t border-slate-800/60 pt-3 space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Selected Add-ons</label>
                    {addons.map(a => (
                      <div key={a.id} className="flex justify-between text-xs text-slate-400">
                        <span>• {a.name}</span>
                        <span>+${a.price * (a.perDay ? days : 1)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-slate-800/60 pt-3 flex justify-between text-xs">
                  <span>Refundable deposit hold</span>
                  <span>+${deposit}</span>
                </div>

                <div className="border-t border-slate-800 pt-4 flex justify-between items-end">
                  <span className="font-bold text-white">Grand Total Due</span>
                  <span className="text-2xl font-black text-violet-400">${grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
