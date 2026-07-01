import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import { CreditCard } from "lucide-react";


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
  const [transactionDetails, setTransactionDetails] = useState(null);
  // Inline field errors
  const [fieldErrors, setFieldErrors] = useState({});

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
    
    API.get(`/rent/transactions/${backendId}`)
      .then((txRes) => {
        setTransactionDetails(txRes.data);
        setProductDetails(txRes.data.product);
        if (txRes.data.startDate) {
          setStartDate(new Date(txRes.data.startDate).toISOString().split('T')[0]);
        }
        if (txRes.data.endDate) {
          setEndDate(new Date(txRes.data.endDate).toISOString().split('T')[0]);
        }
        const calculatedDays = Math.ceil(Math.abs(new Date(txRes.data.endDate) - new Date(txRes.data.startDate)) / (1000 * 60 * 60 * 24)) + 1;
        setDays(calculatedDays || 1);
      })
      .catch(() => {
        API.get(`/rent/products/${backendId}`)
          .then((res) => {
            setProductDetails(res.data.product);
          })
          .catch((err) => console.error("Error loading product for checkout:", err));
      });
  }, [id]);

  if (transactionDetails && transactionDetails.status === "RETRACTED") {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
        <div className="max-w-md p-8 rounded-3xl border text-center space-y-4 border-red-500/20 bg-red-500/5 shadow-xl">
          <div className="text-4xl">🔴</div>
          <h2 className="text-xl font-black text-red-500">Transaction Retracted</h2>
          <p className="text-sm text-slate-400">This listing has been withdrawn by the owner. You can no longer proceed to checkout.</p>
          <button onClick={() => navigate("/dashboard")} className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

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

    // ── Field-level validation ──────────────────────────────────────────────
    const errors = {};
    if (!agreed) errors.agreed = "Please accept the rental terms to continue.";
    if (!cardName.trim()) errors.cardName = "Cardholder name is required.";
    else if (!/^[A-Za-z\s]+$/.test(cardName.trim())) errors.cardName = "Name must contain letters only.";

    const rawDigits = cardNumber.replace(/\s/g, "");
    if (!rawDigits) errors.cardNumber = "Card number is required.";
    else if (!/^\d{16}$/.test(rawDigits)) errors.cardNumber = "Enter a valid 16-digit card number.";

    if (!cardExpiry) errors.cardExpiry = "Expiry date is required.";
    else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) errors.cardExpiry = "Use MM/YY format.";

    if (!cardCvv) errors.cardCvv = "CVV is required.";
    else if (!/^\d{3}$/.test(cardCvv)) errors.cardCvv = "CVV must be 3 digits.";

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    // ────────────────────────────────────────────────────────────────────────

    setIsProcessing(true);

    try {
      let transactionId;

      if (transactionDetails) {
        transactionId = transactionDetails._id;

        if (transactionDetails.status === "AWAITING_PAYMENT") {
          // Owner already accepted — go straight to checkout, no resolve needed
        } else if (transactionDetails.status === "RESERVED") {
          // Already paid — skip checkout entirely, just navigate to orders
          setIsProcessing(false);
          navigate("/orders");
          return;
        } else if (
          transactionDetails.status !== "ACCEPTED"
        ) {
          // Status is something unexpected — try to accept (owner may not have yet)
          await API.post(`/rent/negotiate/${transactionId}/resolve`, { action: "ACCEPT" });
        }
      } else {
        const backendId = getBackendId(id);
        const negotiationRes = await API.post("/rent/negotiate", {
          productId: backendId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          dailyRate: productDetails.rentalPrice,
          securityDeposit: productDetails.securityDeposit,
        });
        transactionId = negotiationRes.data._id;
        await API.post(`/rent/negotiate/${transactionId}/resolve`, { action: "ACCEPT" });
      }

      await API.post(`/rent/checkout/${transactionId}`);
      setIsProcessing(false);

      sessionStorage.setItem("active_booking_id", transactionId);
      sessionStorage.setItem("active_booking_item", productDetails.title);
      sessionStorage.setItem("active_booking_total", grandTotal.toString());
      sessionStorage.setItem("active_booking_days", days.toString());
      sessionStorage.setItem("active_booking_start", startDate);
      sessionStorage.setItem("active_booking_end", endDate);

      navigate("/orders");
    } catch (err) {
      setIsProcessing(false);
      setFieldErrors({ submit: err.response?.data?.msg || "Checkout failed. Please try again." });
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
                <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); if (fieldErrors.agreed) setFieldErrors(prev => ({ ...prev, agreed: "" })); }} className="accent-violet-600" />
                I accept the terms and authorize security deposit hold.
              </label>
              {fieldErrors.agreed && <p className="text-red-400 text-[11px] mt-1">{fieldErrors.agreed}</p>}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md">
              <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span><CreditCard className="w-4 h-4 inline mr-2" /></span> Billing & Card Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => {
                      // Letters and spaces only
                      const v = e.target.value.replace(/[^A-Za-z\s]/g, "");
                      setCardName(v);
                      if (fieldErrors.cardName) setFieldErrors(prev => ({ ...prev, cardName: "" }));
                    }}
                    placeholder="Varun Tej"
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-sm font-semibold border rounded-xl focus:outline-none focus:border-violet-500 text-slate-800 dark:text-slate-200 ${fieldErrors.cardName ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`}
                  />
                  {fieldErrors.cardName && <p className="text-red-400 text-[11px] mt-1">{fieldErrors.cardName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Credit Card Number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(e) => {
                      // Digits only, auto-space every 4
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                      const formatted = digits.replace(/(.{4})/g, "$1 ").trim();
                      setCardNumber(formatted);
                      if (fieldErrors.cardNumber) setFieldErrors(prev => ({ ...prev, cardNumber: "" }));
                    }}
                    placeholder="•••• •••• •••• ••••"
                    maxLength={19}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-sm border rounded-xl focus:outline-none focus:border-violet-500 text-slate-800 dark:text-slate-200 tracking-widest ${fieldErrors.cardNumber ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`}
                  />
                  {fieldErrors.cardNumber && <p className="text-red-400 text-[11px] mt-1">{fieldErrors.cardNumber}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Expiry Date</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardExpiry}
                      onChange={(e) => {
                        // Auto-insert slash after MM
                        let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
                        setCardExpiry(v);
                        if (fieldErrors.cardExpiry) setFieldErrors(prev => ({ ...prev, cardExpiry: "" }));
                      }}
                      placeholder="MM/YY"
                      maxLength={5}
                      className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-sm border rounded-xl focus:outline-none ${fieldErrors.cardExpiry ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`}
                    />
                    {fieldErrors.cardExpiry && <p className="text-red-400 text-[11px] mt-1">{fieldErrors.cardExpiry}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">CVV / CVC</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      value={cardCvv}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                        setCardCvv(v);
                        if (fieldErrors.cardCvv) setFieldErrors(prev => ({ ...prev, cardCvv: "" }));
                      }}
                      placeholder="•••"
                      maxLength={3}
                      className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-sm border rounded-xl focus:outline-none ${fieldErrors.cardCvv ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`}
                    />
                    {fieldErrors.cardCvv && <p className="text-red-400 text-[11px] mt-1">{fieldErrors.cardCvv}</p>}
                  </div>
                </div>

                {fieldErrors.submit && (
                  <p className="text-red-400 text-xs font-bold mt-2 p-3 bg-red-500/10 rounded-xl border border-red-500/20">{fieldErrors.submit}</p>
                )}
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
              <span><CreditCard className="w-4 h-4 inline mr-2" /> Securely Pay & Authorize ₹{grandTotal.toLocaleString()}</span>
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
