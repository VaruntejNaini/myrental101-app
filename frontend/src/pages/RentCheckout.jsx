import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";

export default function RentCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");

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
  const [productDetails, setProductDetails] = useState(null);

  const getBackendId = (paramId) => {
    if (paramId === "r-1" || paramId === "rent_camera_1") return "60d5ecb8b5c9c93d98e8a8a1";
    if (paramId === "r-2" || paramId === "rent_activa_2") return "60d5ecb8b5c9c93d98e8a8a2";
    if (paramId === "r-3" || paramId === "rent_ps5_3") return "60d5ecb8b5c9c93d98e8a8a3";
    if (paramId === "r-4" || paramId === "rent_drill_4") return "60d5ecb8b5c9c93d98e8a8a4";
    return paramId;
  };

  useEffect(() => {
    setStartDate(sessionStorage.getItem("rental_start") || "2026-06-08");
    setEndDate(sessionStorage.getItem("rental_end") || "2026-06-11");
    setDays(parseInt(sessionStorage.getItem("rental_days") || "3"));

    const backendId = getBackendId(id);
    API.get(`/rent/products/${backendId}`)
      .then((res) => {
        setProductDetails(res.data.product);
      })
      .catch((err) => console.error("Error loading product for checkout:", err));
  }, [id]);

  if (!productDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="animate-pulse">Loading checkout configurations...</p>
      </div>
    );
  }

  // Calculate totals
  const rentTotal = productDetails.rentalPrice * days;
  const addonsTotal = addons.reduce((acc, curr) => acc + (curr.price * (curr.perDay ? days : 1)), 0);
  const serviceFee = Math.round(rentTotal * 0.08);
  const deposit = productDetails.securityDeposit;
  const grandTotal = rentTotal + addonsTotal + serviceFee + deposit;

  const handlePaymentSubmit = async (e) => {
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

    try {
      // Create transaction first
      const backendId = getBackendId(id);
      const negotiationRes = await API.post("/rent/negotiate", {
        productId: backendId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        dailyRate: productDetails.rentalPrice,
        securityDeposit: productDetails.securityDeposit,
      });

      const transactionId = negotiationRes.data._id;

      // Update negotiation status to simulate accepting offer if needed
      await API.post(`/rent/negotiate/${transactionId}/resolve`, {
        action: "ACCEPT"
      });

      // Submit checkout details securely
      const checkoutRes = await API.post(`/rent/checkout/${transactionId}`);
      
      setIsProcessing(false);
      
      // Save details for the live progress timeline tracker
      sessionStorage.setItem("active_booking_id", transactionId);
      sessionStorage.setItem("active_booking_item", productDetails.title);
      sessionStorage.setItem("active_booking_total", grandTotal.toString());
      sessionStorage.setItem("active_booking_days", days.toString());
      sessionStorage.setItem("active_booking_start", startDate);
      sessionStorage.setItem("active_booking_end", endDate);
      
      navigate(`/orders`);
    } catch (err) {
      setIsProcessing(false);
      alert(err.response?.data?.msg || "Checkout failed. Overlapping booking conflict detected!");
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 py-8 px-4 md:px-8 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
      
      <div className="max-w-5xl mx-auto mb-8">
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
          
          <form onSubmit={handlePaymentSubmit} className="lg:col-span-7 space-y-6">
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md">
              <h3 className="font-semibold text-base mb-4">Rental Terms Agreements</h3>
              <div className="text-xs text-slate-400 max-h-32 overflow-y-auto mb-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl leading-relaxed">
                By ticking the agreement below, you commit to take good care of the device. Any structural damage or scratch reported by the owner will lock your security deposit amount (₹{deposit}) inside the secure escrow portal until platform administration audits the claims.
              </div>
              <label className="flex items-center gap-2 text-xs font-bold">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="accent-violet-600" />
                I accept the terms and authorize security deposit hold.
              </label>
            </div>

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
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-sm font-semibold border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Credit Card Number</label>
                  <input 
                    type="text" 
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="•••• •••• •••• ••••"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800 dark:text-slate-200"
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
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
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
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={!agreed}
              className={`w-full text-white font-extrabold text-sm py-4 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                agreed 
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95" 
                  : "bg-slate-400 dark:bg-slate-850 cursor-not-allowed opacity-50"
              }`}
            >
              <span>💳 Securely Pay & Authorize ₹{grandTotal.toLocaleString()}</span>
            </button>
          </form>

          <div className="lg:col-span-5">
            <div className={`p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg sticky top-24`}>
              <h3 className="font-semibold text-lg border-b border-slate-800 pb-4 mb-4">Rental Summary</h3>
              
              <div className="space-y-4 text-sm text-slate-300">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500">Item Name</label>
                  <p className="font-extrabold text-white text-base mt-0.5">{productDetails.title}</p>
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
                  <span className="font-semibold text-white">{days} days</span>
                </div>

                <div className="border-t border-slate-800/60 pt-3 flex justify-between text-xs">
                  <span>Refundable deposit hold</span>
                  <span>+₹{deposit}</span>
                </div>

                <div className="border-t border-slate-800 pt-4 flex justify-between items-end">
                  <span className="font-bold text-white">Grand Total Due</span>
                  <span className="text-2xl font-black text-violet-400">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
