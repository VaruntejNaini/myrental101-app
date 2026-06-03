import React, { useState } from "react";

export default function RentalAgreement({ onAgreeChange }) {
  const [agreed, setAgreed] = useState(false);
  const [signatureName, setSignatureName] = useState("");

  const handleAgreeToggle = () => {
    const nextVal = !agreed;
    setAgreed(nextVal);
    onAgreeChange(nextVal && signatureName.trim().length > 0);
  };

  const handleSigChange = (e) => {
    const val = e.target.value;
    setSignatureName(val);
    onAgreeChange(agreed && val.trim().length > 0);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md transition-all duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Rental & Policy Agreement</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Please review and sign electronically</p>
        </div>
      </div>

      {/* Scrollable Terms */}
      <div className="h-32 overflow-y-scroll bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-3 scrollbar-thin scrollbar-thumb-slate-300">
        <p className="font-bold text-slate-700 dark:text-slate-300">1. GENERAL TERMS</p>
        <p>By renting this item, the Renter acknowledges that the item is delivered in excellent working order. The Renter agrees to utilize the item strictly for its intended purpose and in compliance with all relevant municipal regulations.</p>
        <p className="font-bold text-slate-700 dark:text-slate-300">2. SECURITY DEPOSIT & INSPECTION</p>
        <p>A hold is placed on the Renter's card for the security deposit. Following the safe return of the item, our technical support team will inspect the item for physical, structural, or electronic damages within 48 hours. If the item is returned undamaged, the security deposit is fully refunded immediately.</p>
        <p className="font-bold text-slate-700 dark:text-slate-300">3. DAMAGES & DELAY PENALTIES</p>
        <p>In the event of physical damage, structural breakdown, or late returns exceeding 2 hours past the scheduled time window, the platform reserves the right to deduct appropriate sums from the security deposit or charge the credit card on file.</p>
      </div>

      {/* Signature Input and Checkbox */}
      <div className="mt-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Electronic Signature (Type Full Name)</label>
          <input 
            type="text" 
            value={signatureName}
            onChange={handleSigChange}
            placeholder="John Doe" 
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-sm font-medium border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200 transition-colors"
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={agreed}
            onChange={handleAgreeToggle}
            className="mt-1 accent-emerald-500 w-4 h-4 rounded border-slate-300 focus:ring-emerald-500/20"
          />
          <span className="text-xs text-slate-600 dark:text-slate-400 leading-normal select-none group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
            I certify that I have read, understood, and voluntarily agree to the rental policy, security deposit guidelines, and late return penalties.
          </span>
        </label>
      </div>
    </div>
  );
}
