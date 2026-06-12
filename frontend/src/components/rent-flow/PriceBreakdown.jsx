import React, { useState } from "react";

export default function PriceBreakdown({ basePrice, days, selectedAddons }) {
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);

  const parsedDays = isNaN(days) || days <= 0 ? 1 : days;
  const rentTotal = basePrice * parsedDays;
  
  // Calculate add-on cost
  const addonsTotal = selectedAddons.reduce((acc, curr) => acc + (curr.price * (curr.perDay ? parsedDays : 1)), 0);
  
  const serviceFee = Math.round(rentTotal * 0.08); // 8% fee
  const securityDeposit = Math.round(basePrice * 2.5); // Refundable deposit

  const promoDiscount = appliedPromo ? (appliedPromo === "RENT15" ? Math.round(rentTotal * 0.15) : 10) : 0;
  
  const finalTotal = rentTotal + addonsTotal + serviceFee + securityDeposit - promoDiscount;

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (promoCode.toUpperCase() === "RENT15") {
      setAppliedPromo("RENT15");
    } else if (promoCode.trim().length > 0) {
      setAppliedPromo("WELCOME10");
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Background soft glow effects */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <h3 className="font-semibold text-lg border-b border-slate-800 pb-4 mb-4 flex items-center justify-between">
        <span>Pricing Details</span>
        <span className="text-xs bg-violet-500/20 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full">
          Live Calculation
        </span>
      </h3>

      <div className="space-y-3.5 text-sm text-slate-300">
        <div className="flex justify-between">
          <span>Base rate (${basePrice} x {parsedDays} {parsedDays === 1 ? "day" : "days"})</span>
          <span className="font-semibold text-white">${rentTotal.toLocaleString()}</span>
        </div>

        {selectedAddons.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-slate-800/50">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Selected Add-ons</span>
            {selectedAddons.map(addon => (
              <div key={addon.id} className="flex justify-between text-xs text-slate-400 pl-2 border-l border-violet-500/30">
                <span>{addon.name} {addon.perDay ? "(Per Day)" : "(Flat)"}</span>
                <span>+${(addon.price * (addon.perDay ? parsedDays : 1)).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between pt-1">
          <span>Platform service fee (8%)</span>
          <span className="font-semibold text-white">${serviceFee.toLocaleString()}</span>
        </div>

        <div className="flex justify-between pt-1 border-t border-slate-800/50">
          <div className="flex items-center gap-1.5">
            <span>Refundable security deposit</span>
            <span className="group relative cursor-pointer text-slate-500 hover:text-slate-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.94 6.94a.75.75 0 1 1-1.061-1.061 3 3 0 1 1 2.871 5.026v.345a.75.75 0 0 1-1.5 0v-.5c0-.72.58-1.3 1.3-1.3a1.5 1.5 0 1 0-1.61-2.502.75.75 0 0 1-.611-.508ZM11 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" clipRule="evenodd" />
              </svg>
              <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-slate-950 text-xs p-2.5 rounded-lg border border-slate-800 text-slate-400 shadow-xl pointer-events-none leading-relaxed z-10">
                Fully returned within 48 hours after item inspect.
              </div>
            </span>
          </div>
          <span className="font-semibold text-white">${securityDeposit.toLocaleString()}</span>
        </div>

        {appliedPromo && (
          <div className="flex justify-between text-emerald-400 font-medium pt-1">
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M5.5 3A2.5 2.5 0 0 0 3 5.5v2.879a2.5 2.5 0 0 0 .732 1.767l6.5 6.5a2.5 2.5 0 0 0 3.536 0l2.878-2.878a2.5 2.5 0 0 0 0-3.536l-6.5-6.5A2.5 2.5 0 0 0 8.38 3H5.5ZM6 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
              Promo applied ({appliedPromo})
            </span>
            <span>-${promoDiscount}</span>
          </div>
        )}
      </div>

      {/* Promo Code Input Form */}
      <form onSubmit={handleApplyPromo} className="mt-5 pt-4 border-t border-slate-800 flex gap-2">
        <input 
          type="text" 
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          placeholder="Promo code (RENT15)" 
          className="flex-1 bg-slate-950 text-xs px-3 py-2.5 rounded-xl border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors uppercase tracking-wider font-semibold"
        />
        <button 
          type="submit" 
          className="bg-slate-800 hover:bg-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all hover:text-violet-400"
        >
          Apply
        </button>
      </form>

      {/* Total Due Section */}
      <div className="mt-6 pt-5 border-t border-slate-800 flex justify-between items-end">
        <div>
          <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Estimated Total</span>
          <p className="text-xs text-slate-400 italic">Includes refundable deposit</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-white">${finalTotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
