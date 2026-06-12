import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function AddressManagement() {
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");

  // API Lists State
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form / Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("new"); // "new" or "edit"
  const [editingId, setEditingId] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Google Maps SDK Load Status
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobileNumber: "",
    houseFlatNumber: "",
    landmark: "",
    pincode: "",
    locality: "",
    city: "",
    state: "",
    fullAddress: "",
    addressType: "Home",
    addressDescription: "",
    latitude: 17.385044, // Default center
    longitude: 78.486671,
    isDefault: false
  });

  // Map Refs
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  // Load Google Maps JavaScript API dynamically
  // useEffect(() => {
  //   if (window.google && window.google.maps) {
  //     setMapsLoaded(true);
  //     return;
  //   }

  //   const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
  //   if (!apiKey) {
  //     setMapsError(true);
  //     return;
  //   }

  //   const script = document.createElement("script");
  //   script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
  //   script.async = true;
  //   script.defer = true;
  //   script.onload = () => setMapsLoaded(true);
  //   script.onerror = () => setMapsError(true);
  //   document.head.appendChild(script);
  // }, []);/
  useEffect(() => {
  if (window.google?.maps) {
    setMapsLoaded(true);
    return;
  }

  const existingScript = document.querySelector(
    'script[src*="maps.googleapis.com/maps/api/js"]'
  );

  if (existingScript) {
    existingScript.addEventListener("load", () => {
      setMapsLoaded(true);
    });
    return;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
  script.async = true;
  script.defer = true;

  script.onload = () => setMapsLoaded(true);
  script.onerror = () => setMapsError(true);

  document.head.appendChild(script);
}, []);

  // Fetch addresses from backend database
  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await API.get("/addresses");
      setAddresses(response.data);
      // Sync default address to caching localStorage for Dashboard display
      const defaultAddr = response.data.find(a => a.isDefault);
      if (defaultAddr) {
        localStorage.setItem("saved_delivery_address", `${defaultAddr.firstName} ${defaultAddr.lastName} - ${defaultAddr.fullAddress}`);
      } else if (response.data.length === 0) {
        localStorage.setItem("saved_delivery_address", "Add address");
      }
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.msg || "Failed to load addresses from backend database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Initialize Map when modal is active
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || !modalOpen) return;

    const initialLat = formData.latitude || 17.385044;
    const initialLng = formData.longitude || 78.486671;

    const googleMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: initialLat, lng: initialLng },
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
    });

    const googleMarker = new window.google.maps.Marker({
      position: { lat: initialLat, lng: initialLng },
      map: googleMap,
      draggable: true,
      animation: window.google.maps.Animation.DROP
    });

    setMap(googleMap);
    setMarker(googleMarker);

    // Map Tap Selection
    googleMap.addListener("click", (e) => {
      const pos = e.latLng;
      googleMarker.setPosition(pos);
      googleMap.panTo(pos);
      handleCoordsChange(pos.lat(), pos.lng());
    });

    // Draggable Pin Event
    googleMarker.addListener("dragend", () => {
      const pos = googleMarker.getPosition();
      googleMap.panTo(pos);
      handleCoordsChange(pos.lat(), pos.lng());
    });

    // Attach Autocomplete
    if (searchInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        fields: ["geometry", "formatted_address"]
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const loc = place.geometry.location;
          googleMap.setCenter(loc);
          googleMap.setZoom(17);
          googleMarker.setPosition(loc);
          handleCoordsChange(loc.lat(), loc.lng(), place.formatted_address);
        }
      });
    }
  }, [mapsLoaded, modalOpen]);

  // Handle Drag / Click Coordinates & Reverse Geocoding
  const handleCoordsChange = (lat, lng, formattedAddress = null) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));

    if (!navigator.onLine) {
      triggerToast("No internet connection. Unable to fetch geocoding details.");
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        const result = results[0];
        const comps = result.address_components;

        let postalCode = "";
        let locality = "";
        let city = "";
        let state = "";

        for (const comp of comps) {
          if (comp.types.includes("postal_code")) postalCode = comp.long_name;
          if (comp.types.includes("sublocality") || comp.types.includes("neighborhood")) locality = comp.long_name;
          if (comp.types.includes("locality")) city = comp.long_name;
          if (comp.types.includes("administrative_area_level_1")) state = comp.long_name;
        }

        if (!locality) {
          for (const comp of comps) {
            if (comp.types.includes("route")) locality = comp.long_name;
          }
        }

        setFormData(prev => ({
          ...prev,
          pincode: postalCode || prev.pincode,
          locality: locality || prev.locality,
          city: city || prev.city,
          state: state || prev.state,
          fullAddress: formattedAddress || result.formatted_address
        }));
      } else {
        console.error("Reverse geocoding failed due to:", status);
        triggerToast("Invalid reverse geocoding response. Pin location adjusted.");
      }
    });
  };

  // Browser Geolocation GPS Button
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      triggerToast("Browser Geolocation is not supported by your device.");
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGeoLoading(false);

        if (map && marker) {
          const newPos = new window.google.maps.LatLng(lat, lng);
          map.setCenter(newPos);
          map.setZoom(17);
          marker.setPosition(newPos);
          handleCoordsChange(lat, lng);
          triggerToast("Current location centered!");
        }
      },
      (error) => {
        setGeoLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          triggerToast("Geolocation permission denied. Please allow location access in your browser settings.");
        } else {
          triggerToast("Could not locate your current position.");
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Save / Submit Form Changes
  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.mobileNumber || !formData.houseFlatNumber || !formData.locality || !formData.city) {
      triggerToast("Please fill in all required fields.");
      return;
    }

    // Generate combined address text
    const completeAddressStr = `${formData.houseFlatNumber}, ${formData.locality}, ${formData.landmark ? formData.landmark + ", " : ""}${formData.city}, ${formData.state} - ${formData.pincode}`;
    const payload = { ...formData, fullAddress: completeAddressStr };

    try {
      if (modalType === "new") {
        await API.post("/addresses", payload);
        triggerToast("Address saved successfully! 🎉");
      } else {
        await API.put(`/addresses/${editingId}`, payload);
        triggerToast("Address updated successfully! 🎉");
      }
      setModalOpen(false);
      fetchAddresses();
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.msg || "Failed to save address details.");
    }
  };

  // Edit address trigger
  const handleEdit = (addr) => {
    setFormData({
      firstName: addr.firstName,
      lastName: addr.lastName,
      mobileNumber: addr.mobileNumber,
      houseFlatNumber: addr.houseFlatNumber,
      landmark: addr.landmark || "",
      pincode: addr.pincode || "",
      locality: addr.locality || "",
      city: addr.city || "",
      state: addr.state || "",
      fullAddress: addr.fullAddress,
      addressType: addr.addressType || "Home",
      addressDescription: addr.addressDescription || "",
      latitude: addr.latitude || 17.385044,
      longitude: addr.longitude || 78.486671,
      isDefault: addr.isDefault
    });
    setEditingId(addr._id);
    setModalType("edit");
    setModalOpen(true);
  };

  // Set default address trigger
  const handleSetDefault = async (id) => {
    try {
      await API.put(`/addresses/${id}/default`);
      triggerToast("Default address updated!");
      fetchAddresses();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update default address.");
    }
  };

  // Delete address handler
  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await API.delete(`/addresses/${deleteConfirmId}`);
      triggerToast("Address removed successfully.");
      setDeleteConfirmId(null);
      fetchAddresses();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to delete address.");
    }
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Helper type icons
  const getIcon = (type) => {
    switch (type) {
      case "Home": return "🏠";
      case "Office": return "🏢";
      case "College": return "🎓";
      case "Hostel": return "🏨";
      default: return "📍";
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 py-8 px-4 md:px-8 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`} style={{ fontFamily: "'Nunito', 'Poppins', sans-serif" }}>
      
      {/* Header breadcrumb */}
      <div className="max-w-4xl mx-auto mb-8 flex flex-wrap justify-between items-center gap-4 border-b pb-6 border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => navigate("/dashboard")}
          className={`flex items-center gap-2 text-sm font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            isNight ? "bg-slate-900 border border-slate-800 hover:bg-slate-800" : "bg-white border border-slate-200 hover:bg-slate-100"
          }`}
        >
          ← Back to Home
        </button>
        <div className="text-center md:text-right">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            📍 Manage Addresses
          </h1>
          <p className="text-xs text-slate-450 font-semibold mt-1">Review, add, and adjust your active delivery locations</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        
        {/* Main List / Loader Display */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-28 w-full bg-slate-200 dark:bg-slate-900 rounded-3xl animate-pulse"></div>
            <div className="h-28 w-full bg-slate-200 dark:bg-slate-900 rounded-3xl animate-pulse"></div>
          </div>
        ) : addresses.length === 0 ? (
          
          /* EMPTY STATE */
          <div className={`text-center py-16 px-6 rounded-3xl border border-dashed ${
            isNight ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <span className="text-6xl block mb-4 select-none">🗺️</span>
            <h2 className="text-xl font-black mb-2">No addresses saved yet</h2>
            <p className="text-sm text-slate-450 max-w-sm mx-auto mb-6">Add your delivery address to explore rentals and checkout seamlessly.</p>
            <button 
              onClick={() => {
                setFormData({
                  firstName: "",
                  lastName: "",
                  mobileNumber: "",
                  houseFlatNumber: "",
                  landmark: "",
                  pincode: "",
                  locality: "",
                  city: "",
                  state: "",
                  fullAddress: "",
                  addressType: "Home",
                  addressDescription: "",
                  latitude: 17.385044,
                  longitude: 78.486671,
                  isDefault: false
                });
                setModalType("new");
                setModalOpen(true);
              }}
              className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-extrabold text-xs py-3.5 px-8 rounded-2xl hover:scale-105 active:scale-95 transition-transform shadow-lg cursor-pointer"
            >
              Add Address
            </button>
          </div>
        ) : (
          
          /* ADDRESS LIST STATE */
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Saved addresses ({addresses.length})</span>
              <button 
                onClick={() => {
                  setFormData({
                    firstName: "",
                    lastName: "",
                    mobileNumber: "",
                    houseFlatNumber: "",
                    landmark: "",
                    pincode: "",
                    locality: "",
                    city: "",
                    state: "",
                    fullAddress: "",
                    addressType: "Home",
                    addressDescription: "",
                    latitude: 17.385044,
                    longitude: 78.486671,
                    isDefault: false
                  });
                  setModalType("new");
                  setModalOpen(true);
                }}
                className="bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow"
              >
                + New Address
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((addr) => (
                <div 
                  key={addr._id}
                  className={`p-6 rounded-3xl border transition-all flex flex-col justify-between relative ${
                    addr.isDefault 
                      ? (isNight ? "bg-indigo-950/20 border-indigo-500/40 shadow-lg shadow-indigo-500/5" : "bg-indigo-50/20 border-indigo-400 shadow-md shadow-indigo-500/5")
                      : (isNight ? "bg-slate-900 border-slate-850 text-white" : "bg-white border-slate-100 text-slate-850 shadow-sm")
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xl font-bold flex items-center gap-2">
                        {getIcon(addr.addressType)} 
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">{addr.addressType}</span>
                      </span>
                      {addr.isDefault && (
                        <span className="text-[9px] font-black uppercase bg-indigo-500 text-white px-2 py-0.5 rounded-lg border border-indigo-400/20">
                          Default
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-sm mb-1">{addr.firstName} {addr.lastName}</h4>
                    <p className="text-xs text-slate-400 font-bold mb-3">📞 {addr.mobileNumber}</p>
                    <p className="text-xs text-slate-450 leading-relaxed mb-4">{addr.fullAddress}</p>
                    {addr.addressDescription && (
                      <p className={`text-[10px] italic p-2 rounded-xl mb-4 ${isNight ? "bg-slate-950/60 text-slate-450" : "bg-slate-50 text-slate-500"}`}>
                        💬 "{addr.addressDescription}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-850/60">
                    <button 
                      onClick={() => handleEdit(addr)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                        isNight ? "bg-slate-950 border-slate-800 text-slate-350 hover:bg-slate-850" : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                      }`}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(addr._id)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                    >
                      Delete
                    </button>
                    {!addr.isDefault && (
                      <button 
                        onClick={() => handleSetDefault(addr._id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                          isNight ? "bg-slate-950 border-slate-800 text-slate-350 hover:text-indigo-400" : "bg-white border-slate-200 text-slate-650 hover:text-indigo-650"
                        }`}
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FORM MODAL PANEL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setModalOpen(false)}>
          <div 
            className={`w-full max-w-4xl rounded-3xl shadow-2xl border overflow-y-auto max-h-[90vh] md:max-h-none flex flex-col md:flex-row transition-all duration-300 ${
              isNight ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Left side: Maps selector panel */}
            <div className="w-full md:w-1/2 h-72 md:h-auto min-h-[300px] relative bg-slate-950 flex flex-col justify-end">
              
              {mapsError && (
                <div className="absolute inset-0 bg-red-950/90 text-white flex flex-col items-center justify-center p-6 text-center z-10">
                  <span className="text-4xl block mb-2">⚠️</span>
                  <h4 className="font-extrabold text-sm mb-1">Google Maps API Error</h4>
                  <p className="text-xs text-slate-400">Failed to initialize location coordinates. Please verify your connection status and API keys.</p>
                </div>
              )}

              {!mapsLoaded && !mapsError && (
                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center z-10 animate-pulse">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Map SDK...</p>
                </div>
              )}

              {/* Map Mount Target Container */}
              <div ref={mapRef} className="absolute inset-0 w-full h-full z-0"></div>

              {/* Search bar inside Map container */}
              <div className="absolute top-4 left-4 right-4 z-10">
                <input 
                  type="text" 
                  ref={searchInputRef}
                  placeholder="🔍 Search for street name or city..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold shadow-lg focus:outline-none transition ${
                    isNight ? "bg-slate-900 border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-200 text-slate-800 focus:border-indigo-500"
                  }`}
                />
              </div>

              {/* Use Current Location Button inside bottom-left map overlay */}
              <div className="absolute bottom-4 left-4 z-10">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={geoLoading}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-xl transition-all cursor-pointer focus:outline-none ${
                    geoLoading 
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 active:scale-95"
                  }`}
                >
                  {geoLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Locating...
                    </>
                  ) : (
                    <>🎯 Use Current Location</>
                  )}
                </button>
              </div>

              {/* Map coordinates display */}
              <div className={`absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-lg text-[9px] font-bold ${isNight ? "bg-slate-950/80 text-slate-450" : "bg-white/80 text-slate-500"}`}>
                {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
              </div>
            </div>

            {/* Right side: Address Details Form */}
            <form onSubmit={handleSave} className="w-full md:w-1/2 p-6 overflow-y-auto max-h-[50vh] md:max-h-[85vh] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <span>📍</span> {modalType === "new" ? "Add Delivery Address" : "Edit Address Details"}
                  </h3>
                  <button 
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className={`p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer`}
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">First Name *</label>
                    <input 
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none transition ${
                        isNight ? "bg-slate-950 border-slate-850 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Last Name *</label>
                    <input 
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none transition ${
                        isNight ? "bg-slate-950 border-slate-855 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                      }`}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Mobile Number *</label>
                  <input 
                    type="tel"
                    required
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value.replace(/\D/g, "") })}
                    placeholder="9876543210"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none transition ${
                      isNight ? "bg-slate-950 border-slate-850 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Flat/House Number *</label>
                    <input 
                      type="text"
                      required
                      value={formData.houseFlatNumber}
                      onChange={(e) => setFormData({ ...formData, houseFlatNumber: e.target.value })}
                      placeholder="Flat 304, Building C"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none transition ${
                        isNight ? "bg-slate-950 border-slate-850 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Landmark</label>
                    <input 
                      type="text"
                      value={formData.landmark}
                      onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                      placeholder="e.g. Near Metro Station"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none transition ${
                        isNight ? "bg-slate-950 border-slate-850 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Locality/Street *</label>
                    <input 
                      type="text"
                      required
                      value={formData.locality}
                      onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                      placeholder="Kondapur Road"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none transition ${
                        isNight ? "bg-slate-950 border-slate-850 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Pincode *</label>
                    <input 
                      type="text"
                      required
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })}
                      placeholder="500084"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none transition ${
                        isNight ? "bg-slate-950 border-slate-850 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">City *</label>
                    <input 
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Hyderabad"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none transition ${
                        isNight ? "bg-slate-950 border-slate-850 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">State *</label>
                    <input 
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Telangana"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none transition ${
                        isNight ? "bg-slate-950 border-slate-850 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                      }`}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Address Type</label>
                  <div className="flex gap-2">
                    {["Home", "Office", "College", "Hostel", "Other"].map(type => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setFormData({ ...formData, addressType: type })}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all border cursor-pointer ${
                          formData.addressType === type
                            ? "bg-indigo-500 text-white border-indigo-500 shadow-md"
                            : (isNight ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-white" : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50")
                        }`}
                      >
                        {getIcon(type)} {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Delivery Instructions / Description</label>
                  <textarea 
                    rows={2}
                    value={formData.addressDescription}
                    onChange={(e) => setFormData({ ...formData, addressDescription: e.target.value })}
                    placeholder="e.g. Ring the bell, drop at reception, call before arrival..."
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none resize-none transition-colors ${
                      isNight ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-200 text-slate-800 focus:border-indigo-400"
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-3 border-t dark:border-slate-850/60 pt-4">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isNight ? "border-slate-800 text-slate-400 hover:text-white" : "border-slate-200 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-xs font-bold hover:scale-102 active:scale-98 transition-all shadow-md cursor-pointer"
                >
                  {modalType === "new" ? "Save Address" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in" onClick={() => setDeleteConfirmId(null)}>
          <div 
            className={`w-[90%] max-w-sm rounded-3xl p-6 border shadow-2xl transition-colors text-center ${
              isNight ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-4xl block mb-2 select-none">🗑️</span>
            <h3 className="text-lg font-black mb-1">Remove Address</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">Are you absolutely sure you want to remove this delivery address from your database account? This cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isNight ? "border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white" : "border-slate-200 hover:bg-slate-50 text-slate-650"
                }`}
              >
                No, Keep it
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast popup */}
      {toastMsg && (
        <div className="fixed bottom-6 left-6 z-[140] flex items-center gap-3 bg-slate-950 border border-indigo-500/30 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-[0_12px_40px_rgba(99,102,241,0.2)] animate-slide-in">
          <span className="text-indigo-400 font-black">🔔 Alert:</span>
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg("")} className="ml-3 text-slate-400 hover:text-white font-extrabold cursor-pointer">✕</button>
        </div>
      )}

    </div>
  );
}
