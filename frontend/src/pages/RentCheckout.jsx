import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import { CreditCard, MapPin, Plus } from "lucide-react";


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
  const [loadError, setLoadError] = useState("");
  // Inline field errors
  const [fieldErrors, setFieldErrors] = useState({});
  // Address state for SECOND_HAND checkout
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const getBackendId = (paramId) => {
    if (paramId === "r-1" || paramId === "rent_camera_1") return "60d5ecb8b5c9c93d98e8a8a1";
    if (paramId === "r-2" || paramId === "rent_activa_2") return "60d5ecb8b5c9c93d98e8a8a2";
    if (paramId === "r-3" || paramId === "rent_ps5_3") return "60d5ecb8b5c9c93d98e8a8a3";
    if (paramId === "r-4" || paramId === "rent_drill_4") return "60d5ecb8b5c9c93d98e8a8a4";
    return paramId;
  };

  useEffect(() => {
    // Checkout ONLY operates with a valid transaction ID — no product fallback
    API.get(`/rent/transactions/${id}`)
      .then((txRes) => {
        const tx = txRes.data;
        setTransactionDetails(tx);
        setProductDetails(tx.product);
        if (tx.startDate) setStartDate(new Date(tx.startDate).toISOString().split('T')[0]);
        if (tx.endDate) setEndDate(new Date(tx.endDate).toISOString().split('T')[0]);
        const d = Math.max(1, Math.ceil(Math.abs(new Date(tx.endDate) - new Date(tx.startDate)) / (1000 * 60 * 60 * 24)) + 1);
        setDays(d);
        // Load saved addresses for SECOND_HAND checkout
        if (tx.product?.productType === "SECOND_HAND") {
          API.get("/addresses")
            .then(r => {
              setSavedAddresses(r.data || []);
              const def = r.data?.find(a => a.isDefault);
              if (def) setSelectedAddressId(def._id);
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        setLoadError("This transaction could not be loaded. It may have been retracted or is no longer available.");
      });
  }, [id]);

  if (loadError) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
        <div className="max-w-md p-8 rounded-3xl border text-center space-y-4 border-red-500/20 bg-red-500/5 shadow-xl">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-black text-red-500">Transaction Unavailable</h2>
          <p className="text-sm text-slate-400">{loadError}</p>
          <button onClick={() => navigate("/orders")} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all">
            Back to Orders
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

  const isSecondHand = productDetails?.productType === "SECOND_HAND";
  // Use transaction data for all monetary values — never derive from product alone
  const price = transactionDetails?.dailyRate || productDetails?.rentalPrice || 0;
  const deposit = transactionDetails?.securityDeposit ?? productDetails?.securityDeposit ?? 0;
  const rentTotal = isSecondHand ? price : price * days;
  const serviceFee = Math.round(rentTotal * 0.08);
  const grandTotal = rentTotal + serviceFee + (isSecondHand ? 0 : deposit);
  const selectedAddress = savedAddresses.find(a => a._id === selectedAddressId);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    // ── Field-level validation ──────────────────────────────────────────────
    const errors = {};
    if (!agreed) errors.agreed = "Please accept the terms to continue.";
    if (!cardName.trim()) errors.cardName = "Cardholder name is required.";
    else if (!/^[A-Za-z\s]+$/.test(cardName.trim())) errors.cardName = "Name must contain letters only.";

    const rawDigits = cardNumber.replace(/\s/g, "");
    if (!rawDigits) errors.cardNumber = "Card number is required.";
    else if (!/^\d{16}$/.test(rawDigits)) errors.cardNumber = "Enter a valid 16-digit card number.";

    if (!cardExpiry) errors.cardExpiry = "Expiry date is required.";
    else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) errors.cardExpiry = "Use MM/YY format.";

    if (!cardCvv) errors.cardCvv = "CVV is required.";
    else if (!/^\d{3}$/.test(cardCvv)) errors.cardCvv = "CVV must be 3 digits.";

    if (isSecondHand && !selectedAddressId) errors.address = "Please select a delivery address before paying.";

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
                      className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-sm border rounded-xl focus:outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 ${fieldErrors.cardExpiry ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`}
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
                      className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-sm border rounded-xl focus:outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 ${fieldErrors.cardCvv ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`}
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
            <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg sticky top-24">
              <h3 className="font-semibold text-lg border-b border-slate-800 pb-4 mb-4">
                {isSecondHand ? "Purchase Summary" : "Rental Summary"}
              </h3>
              <div className="space-y-4 text-sm text-slate-300">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500">Item</label>
                  <p className="font-extrabold text-white text-base mt-0.5">{productDetails.title}</p>
                </div>

                {/* RENT — show editable date pickers */}
                {!isSecondHand && (
                  <>
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-800/60 pt-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={e => {
                            setStartDate(e.target.value);
                            const d = Math.max(1, Math.ceil((new Date(endDate) - new Date(e.target.value)) / (1000 * 60 * 60 * 24)) + 1);
                            setDays(d);
                          }}
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">End Date</label>
                        <input
                          type="date"
                          value={endDate}
                          min={startDate}
                          onChange={e => {
                            setEndDate(e.target.value);
                            const d = Math.max(1, Math.ceil((new Date(e.target.value) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1);
                            setDays(d);
                          }}
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="border-t border-slate-800/60 pt-3 flex justify-between">
                      <span>Duration</span>
                      <span className="font-semibold text-white">{days} day{days !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="border-t border-slate-800/60 pt-3 flex justify-between">
                      <span>Daily rate</span>
                      <span className="font-semibold text-white">₹{price}/day</span>
                    </div>
                    <div className="border-t border-slate-800/60 pt-3 flex justify-between text-xs">
                      <span>Refundable deposit</span>
                      <span>+₹{deposit}</span>
                    </div>
                    <div className="border-t border-slate-800/60 pt-3 flex justify-between text-xs">
                      <span>Service fee (8%)</span>
                      <span>+₹{serviceFee}</span>
                    </div>
                  </>
                )}

                {/* BUY — show price and address picker */}
                {isSecondHand && (
                  <>
                    <div className="border-t border-slate-800/60 pt-3 flex justify-between">
                      <span>Selling price</span>
                      <span className="font-semibold text-white">₹{price.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-800/60 pt-3 flex justify-between text-xs">
                      <span>Service fee (8%)</span>
                      <span>+₹{serviceFee}</span>
                    </div>
                    <div className="border-t border-slate-800/60 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Delivery Address</label>
                        <button type="button" onClick={() => window.open("/addresses", "_blank")} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-black flex items-center gap-0.5"><Plus className="w-3 h-3" /> Add New</button>
                      </div>
                      {savedAddresses.length === 0 ? (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                          No saved addresses. <button type="button" onClick={() => window.open("/addresses", "_blank")} className="underline font-bold">Add one</button> before paying.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {savedAddresses.map(addr => (
                            <label key={addr._id} className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${selectedAddressId === addr._id ? "border-indigo-500 bg-indigo-500/10" : "border-slate-700 bg-slate-800/40 hover:border-slate-600"}`}>
                              <input type="radio" name="deliveryAddress" value={addr._id} checked={selectedAddressId === addr._id} onChange={() => setSelectedAddressId(addr._id)} className="mt-0.5 accent-indigo-500" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white">{addr.firstName} {addr.lastName} {addr.isDefault && <span className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded ml-1">Default</span>}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{addr.fullAddress}</p>
                                <p className="text-[10px] text-slate-500">{addr.mobileNumber}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                      {fieldErrors.address && <p className="text-red-400 text-[11px] mt-1">{fieldErrors.address}</p>}
                    </div>
                  </>
                )}

                <div className="border-t border-slate-800 pt-4 flex justify-between items-end">
                  <span className="font-bold text-white">Grand Total</span>
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
