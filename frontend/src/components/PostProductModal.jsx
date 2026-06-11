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
  const [previewUrls, setPreviewUrls] = useState([]); // Array of Object URLs for display
  const [showDepositInfo, setShowDepositInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Clean up object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Auto-calculate default security deposit when rental price changes
  useEffect(() => {
    if (productType === "RENT" && rentalPrice && !isNaN(rentalPrice)) {
      setSecurityDeposit(Math.round(Number(rentalPrice) * 2.5));
    } else if (productType === "SECOND_HAND") {
      setSecurityDeposit(0); // No deposit for standard second hand sales
    }
  }, [rentalPrice, productType]);

  if (!isOpen) return null;

  const handleClose = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError("");
    onClose();
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    if (selectedFiles.length + files.length > 5) {
      setError("You can upload a maximum of 5 images.");
      e.target.value = "";
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        e.target.value = "";
        return;
      }
      if (file.size > MAX_SIZE) {
        setError(`File "${file.name}" exceeds the 5MB size limit.`);
        e.target.value = "";
        return;
      }
    }

    setError("");
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setSelectedFiles((prev) => [...prev, ...files]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
    e.target.value = ""; // Reset value to allow selecting same file/triggering change
  };

  const removeImage = (indexToRemove) => {
    if (previewUrls[indexToRemove]) {
      URL.revokeObjectURL(previewUrls[indexToRemove]);
    }
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
        formData.append("productImages", file);
      });

      await API.post("/rent/products", formData);

      setIsSubmitting(false);
      
      // Reset state and revoke URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setTitle("");
      setRentalPrice("");
      setSecurityDeposit("");
      setArea("");
      setDescription("");
      setSelectedFiles([]);
      setPreviewUrls([]);
      
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
          onClick={handleClose} 
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
            <label className="block mb-1.5 uppercase tracking-wider text-slate-400 text-[9px] font-black">
              Product Images ({selectedFiles.length}/5)
            </label>
            <div className="flex flex-wrap gap-4 p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
              
              {/* Thumbnail Previews */}
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow group">
                  <img 
                    src={url} 
                    alt={`Preview ${idx + 1}`} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  />
                  <button 
                    type="button" 
                    onClick={() => removeImage(idx)} 
                    className="absolute top-1 right-1 bg-black/70 hover:bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black cursor-pointer shadow-md transition-all z-10"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Add Photo Button (only shows if total < 5) */}
              {selectedFiles.length < 5 && (
                <button
                  type="button"
                  onClick={() => document.getElementById("product-image-upload").click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-100/50 dark:bg-slate-900/50 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center text-slate-400 hover:text-indigo-400 cursor-pointer gap-1.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[9px] font-black uppercase tracking-wider">Add Photo</span>
                </button>
              )}

              {/* Hidden file input */}
              <input 
                id="product-image-upload"
                type="file" 
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
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
