import React, { useState, useEffect } from "react";
import API from "../api";

export default function PostProductModal({ isOpen, onClose, isNight, onProductCreated }) {
  const [productType, setProductType] = useState("RENT"); // RENT or SECOND_HAND
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [rentalPrice, setRentalPrice] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]); // Array of raw File objects
  const [showDepositInfo, setShowDepositInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Auto-calculate default security deposit when rental price changes
  useEffect(() => {
    if (productType === "RENT" && rentalPrice && !isNaN(rentalPrice)) {
      setSecurityDeposit(Math.round(Number(rentalPrice) * 2.5));
    } else if (productType === "SECOND_HAND") {
      setSecurityDeposit(0); // No deposit for standard second hand sales
    }
  }, [rentalPrice, productType]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    if (files.length > 5) {
      setError("You can upload a maximum of 5 images.");
      setSelectedFiles([]);
      e.target.value = null;
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        setSelectedFiles([]);
        e.target.value = null;
        return;
      }
      if (file.size > MAX_SIZE) {
        setError(`File "${file.name}" exceeds the 5MB size limit.`);
        setSelectedFiles([]);
        e.target.value = null;
        return;
      }
    }

    setError("");
    setSelectedFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !category || !rentalPrice || !city || !area) {
      setError("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("rentalPrice", rentalPrice);
      formData.append("securityDeposit", securityDeposit || 0);
      formData.append("city", city);
      formData.append("area", area);
      formData.append("productType", productType);

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      await API.post("/rent/products", formData);

      setIsSubmitting(false);
      
      // Reset state
      setTitle("");
      setRentalPrice("");
      setSecurityDeposit("");
      setArea("");
      setDescription("");
      setSelectedFiles([]);
      
      if (onProductCreated) onProductCreated();
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setError(err.response?.data?.msg || "Failed to post product listing.");
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/75 backdrop-blur-md px-4 py-6 overflow-y-auto">
      <div 
        className={`w-full max-w-lg rounded-3xl border p-6 md:p-8 shadow-2xl relative transition-all max-h-[90vh] overflow-y-auto ${
          isNight ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-xl font-bold hover:text-indigo-500 cursor-pointer"
        >
          ✕
        </button>

        <h2 className="text-xl md:text-2xl font-black mb-1">
          {productType === "RENT" ? "🚀 List Item for Rent" : "🤝 List Second-Hand Sale"}
        </h2>
        <p className="text-xs text-slate-450 mb-6">List your gear for the community to browse</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/35 text-red-400">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* Toggle Type */}
          <div className="flex gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setProductType("RENT")}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                productType === "RENT" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              For Rent
            </button>
            <button
              type="button"
              onClick={() => setProductType("SECOND_HAND")}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                productType === "SECOND_HAND" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Second-Hand Sale
            </button>
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-slate-400 text-[9px] font-black">Item Title *</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g. Sony FX3 Camera" 
                className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none ${
                  isNight ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                }`}
                required
              />
            </div>
            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-slate-400 text-[9px] font-black">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none ${
                  isNight ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                {["Electronics", "Vehicles", "Tools", "Outdoor", "Music"].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & Deposit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-slate-400 text-[9px] font-black">
                {productType === "RENT" ? "Daily Rate (₹/day) *" : "Selling Price (₹) *"}
              </label>
              <input 
                type="number" 
                value={rentalPrice} 
                onChange={e => setRentalPrice(e.target.value)} 
                placeholder={productType === "RENT" ? "500" : "15000"} 
                className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none ${
                  isNight ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                }`}
                required
              />
            </div>

            {productType === "RENT" && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="uppercase tracking-wider text-slate-400 text-[9px] font-black">Security Deposit (₹) *</label>
                  <button 
                    type="button"
                    onClick={() => setShowDepositInfo(!showDepositInfo)}
                    className="text-[10px] text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    Why?
                  </button>
                </div>
                <input 
                  type="number" 
                  value={securityDeposit} 
                  onChange={e => setSecurityDeposit(e.target.value)} 
                  placeholder="1250" 
                  className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none ${
                    isNight ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                  }`}
                  required
                />
              </div>
            )}
          </div>

          {/* Deposit Explanation banner */}
          {productType === "RENT" && showDepositInfo && (
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-[11px] leading-relaxed text-indigo-300">
              <span className="font-extrabold block mb-1">🔒 Why requires a security deposit?</span>
              A security deposit protects you (the owner) from potential loss, theft, late returns, or item damages. It is held securely in a neutral Escrow Vault during the active rental and fully returned to the renter once handoff & verification complete cleanly.
            </div>
          )}

          {/* City & Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-slate-400 text-[9px] font-black">City *</label>
              <input 
                type="text" 
                value={city} 
                onChange={e => setCity(e.target.value)} 
                placeholder="Hyderabad" 
                className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none ${
                  isNight ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
                required
              />
            </div>
            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-slate-400 text-[9px] font-black">Area/Locality *</label>
              <input 
                type="text" 
                value={area} 
                onChange={e => setArea(e.target.value)} 
                placeholder="e.g. Gachibowli" 
                className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none ${
                  isNight ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                }`}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1.5 uppercase tracking-wider text-slate-400 text-[9px] font-black">Description & Conditions</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Describe accessories included, item condition, rules..." 
              className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none resize-none ${
                isNight ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
              }`}
              rows={3}
            />
          </div>

          {/* Product Image File Upload */}
          <div>
            <label className="block mb-1.5 uppercase tracking-wider text-slate-400 text-[9px] font-black">Product Images (Max 5)</label>
            <div className="flex flex-col gap-4">
              <input 
                type="file" 
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 file:cursor-pointer"
              />
              {selectedFiles.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="relative group">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`Preview ${idx + 1}`} 
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shadow" 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full mt-4 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex justify-center items-center gap-2 ${
              productType === "RENT" ? "bg-gradient-to-r from-indigo-500 to-violet-600" : "bg-gradient-to-r from-emerald-500 to-teal-600"
            }`}
          >
            {isSubmitting ? (
              <span className="animate-pulse">📤 Uploading Images & Publishing...</span>
            ) : (
              <span>🚀 Publish Listing</span>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
