import React, { useState, useEffect, useRef } from "react";
import { Rocket, Handshake, UploadCloud, Plus, Edit2, Lock, X } from "lucide-react";
import API from "../api";
import { useAddressSync } from "../utils/addressSync";

// Pure Validators
const validateTitle = (val) => {
  const trimmed = (val || "").trim();
  if (!trimmed) return "Item title is required.";
  if (trimmed.length < 3) return "Title must be at least 3 characters.";
  if (trimmed.length > 80) return "Title cannot exceed 80 characters.";
  if (!/[A-Za-z]/.test(trimmed)) return "Title must contain at least one letter.";
  return "";
};

const validateCity = (val) => {
  const trimmed = (val || "").trim();
  if (!trimmed) return "City is required.";
  if (!/^[A-Za-z\s.\-]+$/.test(trimmed)) return "City can only contain letters, spaces, dots, and hyphens.";
  return "";
};

const validateArea = (val) => {
  const trimmed = (val || "").trim();
  if (!trimmed) return "Area/Locality is required.";
  if (!/^[A-Za-z0-9\s.,\-]+$/.test(trimmed)) {
    return "Area can only contain letters, numbers, spaces, dots, commas, and hyphens.";
  }
  return "";
};

const validateDescription = (val) => {
  const trimmed = (val || "").trim();
  if (!trimmed) return "Description is required.";
  if (trimmed.length < 20) return "Description must be at least 20 characters long.";
  if (trimmed.length > 2000) return "Description cannot exceed 2000 characters.";
  return "";
};

const validatePrice = (val) => {
  if (val === "" || val === undefined || val === null) return "Price is required.";
  if (Number(val) < 1) return "Price must be greater than ₹0.";
  return "";
};

const validateDeposit = (val, isRentMode) => {
  if (!isRentMode) return "";
  if (val === "" || val === undefined || val === null) return "Security deposit is required.";
  if (Number(val) < 0) return "Security deposit cannot be negative.";
  return "";
};

const validateImages = (filesArray) => {
  if (!filesArray || filesArray.length < 1) return "Upload at least one image before publishing.";
  return "";
};

export default function PostProductModal({ isOpen, onClose, initialProduct, isNight, onProductChanged }) {
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
  const [existingImages, setExistingImages] = useState([]); // Retained images from edit
  const [showDepositInfo, setShowDepositInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [duplicateError, setDuplicateError] = useState("");

  // Derived from props (not state)
  const isEditMode = Boolean(initialProduct);
  const effectiveProductType = isEditMode ? initialProduct.productType : productType;

  // Address Selection States
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [userSelectedAddressId, setUserSelectedAddressId] = useState(null);
  const [isManualLocation, setIsManualLocation] = useState(false);

  // Refs for Autofocus
  const titleRef = useRef(null);
  const priceRef = useRef(null);
  const depositRef = useRef(null);
  const cityRef = useRef(null);
  const areaRef = useRef(null);
  const descriptionRef = useRef(null);
  const addressContainerRef = useRef(null);

  // Validation States
  const [touched, setTouched] = useState({
    title: false,
    city: false,
    area: false,
    description: false,
    rentalPrice: false,
    securityDeposit: false
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Derived Errors
  const errors = {
    title: validateTitle(title),
    city: isManualLocation ? validateCity(city) : "",
    area: isManualLocation ? validateArea(area) : "",
    address: !isManualLocation && !selectedAddressId ? "Please select a saved address before publishing." : "",
    description: validateDescription(description),
    rentalPrice: validatePrice(rentalPrice),
    securityDeposit: validateDeposit(securityDeposit, effectiveProductType === "RENT"),
    images: isEditMode ? "" : validateImages(selectedFiles) // In edit mode, combined existing+new must be >= 1
  };

const isPublishDisabled =
  Object.values(errors).some(Boolean) ||
  !!duplicateError;

  // Helper to compute CSS classes for inputs
  const getFieldClass = (field, value, hasError) => {
    const isTouched = touched[field] || submitAttempted;
    if (isTouched && hasError) {
      return "border-rose-500 bg-rose-50/10 dark:bg-rose-950/5 focus:border-rose-500";
    }
    if (touched[field] && (value !== "" && value !== undefined && value !== null && String(value).trim() !== "") && !hasError) {
      return "border-emerald-500 focus:border-emerald-500 border-2";
    }
    return isNight 
      ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500";
  };

  // Clean up object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Handle resets on listing type change (CREATE mode only)
  useEffect(() => {
    if (isEditMode) return; // Skip in edit mode; type is locked
    setTouched(prev => ({ ...prev, securityDeposit: false }));
    if (productType === "SECOND_HAND") {
      setSecurityDeposit("");
    } else if (productType === "RENT" && rentalPrice && !isNaN(rentalPrice)) {
      setSecurityDeposit(Math.round(Number(rentalPrice) * 2.5));
    }
  }, [productType, isEditMode]);

  // Initialize form when modal opens or product selection changes
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode) {
      // EDIT MODE: Prefill from initialProduct
      setTitle(initialProduct.title || "");
      setDescription(initialProduct.description || "");
      setCategory(initialProduct.category || "Electronics");
      setRentalPrice(String(initialProduct.rentalPrice) || "");
      setSecurityDeposit(initialProduct.productType === "RENT" ? String(initialProduct.securityDeposit) || "" : "");
      setExistingImages(initialProduct.images || []);
      setSelectedFiles([]);
      setPreviewUrls([]);
    } else {
      // CREATE MODE: Reset form (but keep productType for RENT/SELL toggle)
      setTitle("");
      setDescription("");
      setCategory("Electronics");
      setRentalPrice("");
      setSecurityDeposit("");
      setExistingImages([]);
      setSelectedFiles([]);
      setPreviewUrls([]);
    }

    fetchListingAddresses();
  }, [isOpen, initialProduct]);

  const fetchListingAddresses = () => {
    if (!isOpen) return;
    API.get("/addresses")
      .then(res => {
        const addrList = res.data || [];
        setSavedAddresses(addrList);

        if (addrList.length === 0) {
          setIsManualLocation(true);
          setSelectedAddressId(null);
          setUserSelectedAddressId(null);
          setCity("");
          setArea("");
          return;
        }

        let targetAddr = null;

        // Case B: User manually selected an address during the current modal session
        if (userSelectedAddressId) {
          const found = addrList.find(a => a._id === userSelectedAddressId);
          if (found) {
            targetAddr = found;
          } else {
            // It was deleted! Clear manual choice
            setUserSelectedAddressId(null);
          }
        }

        // Case A: No manual selection or manual selection was deleted
        if (!targetAddr) {
          // Auto-select latest default address
          const defaultAddr = addrList.find(a => a.isDefault);
          if (defaultAddr) {
            targetAddr = defaultAddr;
          } else if (addrList.length > 0) {
            targetAddr = addrList[0];
          }
        }

        if (targetAddr) {
          setSelectedAddressId(targetAddr._id);
          setCity(targetAddr.city);
          setArea(targetAddr.locality);
          setIsManualLocation(false);
        } else {
          setSelectedAddressId(null);
          setCity("");
          setArea("");
          setIsManualLocation(true);
        }
      })
      .catch(err => {
        console.error("Failed to load saved addresses for listing:", err);
        setIsManualLocation(true);
      });
  };

  useAddressSync(fetchListingAddresses);

  // Fetch saved addresses from server on modal load
  useEffect(() => {
    if (isOpen) {
      fetchListingAddresses();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setExistingImages([]);
    setError("");
    setDuplicateError("");
    setTouched({
      title: false,
      city: false,
      area: false,
      description: false,
      rentalPrice: false,
      securityDeposit: false
    });
    setSubmitAttempted(false);
    setTitle("");
    setRentalPrice("");
    setSecurityDeposit("");
    setArea("");
    setDescription("");
    // Reset address states
    setSelectedAddressId(null);
    setUserSelectedAddressId(null);
    setIsManualLocation(false);
    setSavedAddresses([]);
    onClose();
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    let hasDuplicate = false;
    const filteredFiles = [];

    for (const file of files) {
      const isDup = selectedFiles.some(
        (existing) => existing.name === file.name && existing.size === file.size
      );
      if (isDup) {
        hasDuplicate = true;
      } else {
        filteredFiles.push(file);
      }
    }

    if (hasDuplicate) {
      setDuplicateError("cannot upload same img multiple times");
    } else {
      setDuplicateError("");
    }

    if (filteredFiles.length === 0) {
      e.target.value = "";
      return;
    }

    if (selectedFiles.length + filteredFiles.length > 5) {
      setError("You can upload a maximum of 5 images.");
      e.target.value = "";
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    for (const file of filteredFiles) {
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
    const newPreviews = filteredFiles.map(file => URL.createObjectURL(file));
    setSelectedFiles((prev) => [...prev, ...filteredFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
    e.target.value = ""; // Reset value to allow selecting same file/triggering change
  };

  const removeImage = (indexToRemove) => {
    if (previewUrls[indexToRemove]) {
      URL.revokeObjectURL(previewUrls[indexToRemove]);
    }
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setError("");
    setDuplicateError("");
  };

  const removeExistingImage = (indexToRemove) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setError("");
  };

  const handleNumericKeyDown = (e) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitAttempted(true);

  // In edit mode, check combined image count
  if (isEditMode) {
    const totalImages = existingImages.length + previewUrls.length;
    if (totalImages < 1) {
      setError("At least 1 image is required. You have 0.");
      return;
    }
    if (totalImages > 5) {
      setError(`Maximum 5 images allowed. You have ${totalImages}.`);
      return;
    }
  }

  const hasErrors = Object.values(errors).some(Boolean);
  if (hasErrors) {
    // Find first invalid field in form order and focus it
    if (errors.title) titleRef.current?.focus();
    else if (errors.rentalPrice) priceRef.current?.focus();
    else if (effectiveProductType === "RENT" && errors.securityDeposit) depositRef.current?.focus();
    else if (!isManualLocation && errors.address) {
      addressContainerRef.current?.focus();
      addressContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    else if (isManualLocation && errors.city) cityRef.current?.focus();
    else if (isManualLocation && errors.area) areaRef.current?.focus();
    else if (errors.description) descriptionRef.current?.focus();
    return;
  }

  setIsSubmitting(true);
  setError("");
  setDuplicateError("");

  try {
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("category", category);
    formData.append("rentalPrice", rentalPrice);
    formData.append("securityDeposit", effectiveProductType === "RENT" ? securityDeposit : 0);
    formData.append("productType", effectiveProductType);

    const activeAddress = !isManualLocation && selectedAddressId
      ? savedAddresses.find(a => a._id === selectedAddressId)
      : null;

    const submittedCity = activeAddress?.city || city;
    const submittedArea = activeAddress?.locality || area;
    const normalizedCity = (submittedCity || "").trim();
    const normalizedArea = (submittedArea || "").trim();

    formData.append("city", normalizedCity);
    formData.append("area", normalizedArea);

    if (activeAddress) {
      formData.append("latitude", activeAddress.latitude);
      formData.append("longitude", activeAddress.longitude);
    }

    // Add new files
    selectedFiles.forEach((file) => {
      formData.append("productImages", file);
    });

    // In edit mode, include retained existing images
    if (isEditMode) {
      formData.append("retainedExistingImages", JSON.stringify(existingImages));
    }

    // POST for create, PATCH for edit
    if (isEditMode) {
      await API.patch(`/rent/products/${initialProduct._id}`, formData);
    } else {
      await API.post("/rent/products", formData);
    }

    setIsSubmitting(false);

    // Success: Call callback then reset via handleClose
    if (onProductChanged) onProductChanged();
    handleClose();
  } catch (err) {
    console.error("Product submission error:", err.response?.data || err);
    setIsSubmitting(false);
    setError(
      err.response?.data?.msg ||
      err.response?.data?.message ||
      JSON.stringify(err.response?.data) ||
      "Failed to save product listing."
    );
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
          className="absolute top-4 right-4 text-xl font-bold hover:text-indigo-500 cursor-pointer z-10 p-1.5 rounded-lg border border-slate-205 dark:border-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 pr-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black mb-1 flex items-center gap-2">
              {effectiveProductType === "RENT" ? (
                <>
                  <Rocket className="w-6 h-6 text-indigo-500" />
                  <span>{isEditMode ? "Edit Rental Listing" : "List Item for Rent"}</span>
                </>
              ) : (
                <>
                  <Handshake className="w-6 h-6 text-violet-500" />
                  <span>{isEditMode ? "Edit Sale Listing" : "List Second-Hand Sale"}</span>
                </>
              )}
            </h2>
            <p className="text-xs text-slate-450">{isEditMode ? "Update your listing details" : "List your gear for the community to browse"}</p>
          </div>

          {/* Compact Rent/Sell Switch - Hidden in edit mode */}
          {!isEditMode && (
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 self-start sm:self-auto shadow-inner">
              <button
                type="button"
                onClick={() => setProductType("RENT")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  productType === "RENT" 
                    ? "bg-indigo-500 text-white shadow-sm" 
                    : "text-slate-405 hover:text-slate-200"
                }`}
              >
                Rent
              </button>
              <button
                type="button"
                onClick={() => setProductType("SECOND_HAND")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  productType === "SECOND_HAND" 
                    ? "bg-emerald-500 text-white shadow-sm" 
                    : "text-slate-405 hover:text-slate-200"
                }`}
              >
                Sell
              </button>
            </div>
          )}

          {/* Product type badge in edit mode */}
          {isEditMode && (
            <div className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider self-start sm:self-auto bg-slate-700 text-slate-200">
              {effectiveProductType === "RENT" ? "🔴 Rental" : "🟢 Sale"}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/35 text-red-400">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-slate-400 text-[9px] font-black">Item Title *</label>
              <div className="relative">
                <input 
                  ref={titleRef}
                  type="text" 
                  value={title} 
                  onChange={e => { setTitle(e.target.value); setError(""); }} 
                  onBlur={() => setTouched(prev => ({ ...prev, title: true }))}
                  placeholder="e.g. Sony FX3 Camera" 
                  className={`w-full px-3 py-2.5 pr-8 rounded-xl border focus:outline-none transition-all ${
                    getFieldClass("title", title, errors.title)
                  }`}
                />
                {touched.title && title && !errors.title && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm pointer-events-none">✓</span>
                )}
              </div>
              <div className="flex justify-between items-start mt-1 gap-2">
                <div>
                  {(touched.title || submitAttempted) && errors.title && (
                    <p className="text-[10px] text-rose-500 font-medium">{errors.title}</p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap ml-auto">
                  {title.length}/80
                </span>
              </div>
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
                {effectiveProductType === "RENT" ? "Daily Rate (₹/day) *" : "Selling Price (₹) *"}
              </label>
              <div className="relative">
                <input 
                  ref={priceRef}
                  type="number" 
                  value={rentalPrice} 
                  onChange={e => { setRentalPrice(e.target.value); setError(""); }} 
                  onBlur={() => setTouched(prev => ({ ...prev, rentalPrice: true }))}
                  onKeyDown={handleNumericKeyDown}
                  placeholder={productType === "RENT" ? "500" : "15000"} 
                  className={`w-full px-3 py-2.5 pr-8 rounded-xl border focus:outline-none transition-all ${
                    getFieldClass("rentalPrice", rentalPrice, errors.rentalPrice)
                  }`}
                />
                {touched.rentalPrice && rentalPrice !== "" && !errors.rentalPrice && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm pointer-events-none">✓</span>
                )}
              </div>
              {(touched.rentalPrice || submitAttempted) && errors.rentalPrice && (
                <p className="mt-1 text-[10px] text-rose-500 font-medium">{errors.rentalPrice}</p>
              )}
            </div>

            {effectiveProductType === "RENT" && (
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
                <div className="relative">
                  <input 
                    ref={depositRef}
                    type="number" 
                    value={securityDeposit} 
                    onChange={e => { setSecurityDeposit(e.target.value); setError(""); }} 
                    onBlur={() => setTouched(prev => ({ ...prev, securityDeposit: true }))}
                    onKeyDown={handleNumericKeyDown}
                    placeholder="1250" 
                    className={`w-full px-3 py-2.5 pr-8 rounded-xl border focus:outline-none transition-all ${
                      getFieldClass("securityDeposit", securityDeposit, errors.securityDeposit)
                    }`}
                  />
                  {touched.securityDeposit && securityDeposit !== "" && !errors.securityDeposit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm pointer-events-none">✓</span>
                  )}
                </div>
                {(touched.securityDeposit || submitAttempted) && errors.securityDeposit && (
                  <p className="mt-1 text-[10px] text-rose-500 font-medium">{errors.securityDeposit}</p>
                )}
              </div>
            )}
          </div>

          {/* Deposit Explanation banner */}
          {effectiveProductType === "RENT" && showDepositInfo && (
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-[11px] leading-relaxed text-slate-300">
              <span className="font-extrabold block mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-indigo-400" /> Why requires a security deposit?
              </span>
              A security deposit protects you (the owner) from potential loss, theft, late returns, or item damages. It is held securely in a neutral Escrow Vault during the active rental and fully returned to the renter once handoff & verification complete cleanly.
            </div>
          )}

          {/* Listing Location Address Selector */}
          <div>
            {!isManualLocation && savedAddresses.length > 0 ? (
              <div>
                <label className="block mb-2 uppercase tracking-wider text-slate-400 text-[9px] font-black">
                  Listing Location *
                </label>
                <div 
                  ref={addressContainerRef}
                  tabIndex={-1}
                  className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin pr-1 focus:outline-none"
                >
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr._id;
                    return (
                      <button
                        key={addr._id}
                        type="button"
                        onClick={() => {
                          setSelectedAddressId(addr._id);
                          setUserSelectedAddressId(addr._id);
                          setCity(addr.city);
                          setArea(addr.locality);
                          setError("");
                        }}
                        className={`flex-shrink-0 w-44 p-3 rounded-2xl border text-left transition-all relative cursor-pointer focus:outline-none ${
                          isSelected 
                            ? "border-emerald-500 bg-emerald-50/5 dark:bg-emerald-950/5 ring-2 ring-emerald-500/20" 
                            : isNight ? "border-slate-800 bg-slate-950/50 hover:bg-slate-900" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isSelected 
                              ? "bg-emerald-500 text-white" 
                              : isNight ? "bg-slate-800 text-slate-300" : "bg-slate-200 text-slate-650"
                          }`}>
                            {addr.addressType || "Home"}
                          </span>
                          {isSelected && (
                            <span className="text-emerald-500 font-bold text-[10px]">✓ Selected</span>
                          )}
                        </div>
                        <p className="font-extrabold text-[10px] truncate">{addr.firstName} {addr.lastName}</p>
                        <p className="text-[9px] text-slate-450 font-mono truncate">{addr.mobileNumber}</p>
                        <p className="text-[10px] text-slate-450 leading-tight mt-1 line-clamp-2 h-[28px] overflow-hidden">
                          {addr.houseFlatNumber}, {addr.locality}, {addr.city}
                        </p>
                      </button>
                    );
                  })}
                  <a
                    href="/addresses"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-shrink-0 w-44 p-3 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isNight 
                        ? "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-indigo-500 hover:bg-slate-900/60 hover:text-indigo-400" 
                        : "border-slate-300 bg-slate-50 text-slate-650 hover:border-indigo-600 hover:bg-slate-100 hover:text-indigo-600 shadow-sm hover:shadow"
                    }`}
                  >
                    <Plus className="w-5 h-5 mb-1 text-slate-450" />
                    <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                      Manage Addresses
                    </span>
                  </a>
                </div>
                {submitAttempted && errors.address && (
                  <p className="mt-1 text-[10px] text-rose-500 font-medium">{errors.address}</p>
                )}
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualLocation(true);
                      setSelectedAddressId(null);
                      setUserSelectedAddressId(null);
                      setCity("");
                      setArea("");
                    }}
                    className="text-[10px] text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Or enter listing location manually
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="uppercase tracking-wider text-slate-400 text-[9px] font-black">Listing Location *</label>
                  {savedAddresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualLocation(false);
                        const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
                        setSelectedAddressId(defaultAddr._id);
                        setUserSelectedAddressId(defaultAddr._id);
                        setCity(defaultAddr.city);
                        setArea(defaultAddr.locality);
                      }}
                      className="text-[10px] text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      📍 Choose from Saved Addresses
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 uppercase tracking-wider text-slate-400 text-[9px] font-black text-[10px]">City *</label>
                    <div className="relative">
                      <input 
                        ref={cityRef}
                        type="text" 
                        value={city} 
                        onChange={e => { setCity(e.target.value); setError(""); }} 
                        onBlur={() => setTouched(prev => ({ ...prev, city: true }))}
                        placeholder="Hyderabad" 
                        className={`w-full px-3 py-2.5 pr-8 rounded-xl border focus:outline-none transition-all ${
                          getFieldClass("city", city, errors.city)
                        }`}
                      />
                      {touched.city && city && !errors.city && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm pointer-events-none">✓</span>
                      )}
                    </div>
                    {(touched.city || submitAttempted) && errors.city && (
                      <p className="mt-1 text-[10px] text-rose-500 font-medium">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1.5 uppercase tracking-wider text-slate-400 text-[9px] font-black text-[10px]">Area/Locality *</label>
                    <div className="relative">
                      <input 
                        ref={areaRef}
                        type="text" 
                        value={area} 
                        onChange={e => { setArea(e.target.value); setError(""); }} 
                        onBlur={() => setTouched(prev => ({ ...prev, area: true }))}
                        placeholder="e.g. Gachibowli" 
                        className={`w-full px-3 py-2.5 pr-8 rounded-xl border focus:outline-none transition-all ${
                          getFieldClass("area", area, errors.area)
                        }`}
                      />
                      {touched.area && area && !errors.area && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm pointer-events-none">✓</span>
                      )}
                    </div>
                    {(touched.area || submitAttempted) && errors.area && (
                      <p className="mt-1 text-[10px] text-rose-500 font-medium">{errors.area}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1.5 uppercase tracking-wider text-slate-400 text-[9px] font-black">Description & Conditions</label>
            <div className="relative">
              <textarea 
                ref={descriptionRef}
                value={description} 
                onChange={e => { setDescription(e.target.value); setError(""); }} 
                onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
                placeholder="Describe accessories included, item condition, rules..." 
                className={`w-full px-3 py-2.5 pr-8 rounded-xl border focus:outline-none resize-none transition-all ${
                  getFieldClass("description", description, errors.description)
                }`}
                rows={3}
              />
              {touched.description && description && !errors.description && (
                <span className="absolute right-3 top-3 text-emerald-500 font-bold text-sm pointer-events-none">✓</span>
              )}
            </div>
            <div className="flex justify-between items-start mt-1 gap-2">
              <div>
                {(touched.description || submitAttempted) && errors.description && (
                  <p className="text-[10px] text-rose-500 font-medium">{errors.description}</p>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap ml-auto">
                {description.length}/2000
              </span>
            </div>
          </div>

          {/* Product Image File Upload */}
          <div>
            <label className="block mb-1.5 uppercase tracking-wider text-slate-400 text-[9px] font-black">
              Product Images ({existingImages.length + selectedFiles.length}/5)
            </label>
            
            {/* Existing Images (Edit Mode) */}
            {isEditMode && existingImages.length > 0 && (
              <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <p className="text-[9px] text-slate-400 font-semibold mb-2 uppercase">Retained Images</p>
                <div className="flex flex-wrap gap-4">
                  {existingImages.map((img, idx) => {
                    const imgUrl = typeof img === "string" ? img : (img.url || "");
                    return (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow group">
                        <img 
                          src={imgUrl} 
                          alt={`Existing ${idx + 1}`} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        />
                        <button 
                          type="button" 
                          onClick={() => removeExistingImage(idx)} 
                          className="absolute top-1 right-1 bg-black/70 hover:bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black cursor-pointer shadow-md transition-all z-10"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-4 p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
              
              {/* Thumbnail Previews (New Files) */}
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
              {existingImages.length + selectedFiles.length < 5 && (
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
            {submitAttempted && errors.images && (
              <p className="mt-1 text-[10px] text-rose-500 font-medium">{errors.images}</p>
            )}
          </div>

          {/* Submit Action */}
          {duplicateError && (
            <div className="text-red-500 font-extrabold text-xs text-center mb-2">
              {duplicateError}
            </div>
          )}
          <button
            type="submit"
            disabled={isPublishDisabled || isSubmitting}
            className={`w-full mt-4 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg transition-transform flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
              isPublishDisabled ? "" : "hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            } ${
              effectiveProductType === "RENT" ? "bg-gradient-to-r from-indigo-500 to-violet-600" : "bg-gradient-to-r from-emerald-500 to-teal-600"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5 animate-pulse"><UploadCloud className="w-4 h-4 animate-bounce" /> {isEditMode ? "Updating Listing..." : "Uploading Images & Publishing..."}</span>
            ) : (
              <span className="flex items-center gap-1.5">
                {isEditMode ? (
                  <>
                    <Edit2 className="w-4 h-4" /> Update Listing
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" /> Publish Listing
                  </>
                )}
              </span>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
