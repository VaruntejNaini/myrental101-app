import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { broadcastAddressUpdate } from "../utils/addressSync";

// Pure validator functions
const validateFirstName = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "First name is required.";
  if (trimmed.length < 2) return "First name must be at least 2 characters.";
  if (trimmed.length > 50) return "First name cannot exceed 50 characters.";
  if (!/[A-Za-z]/.test(trimmed)) {
    return "First name must contain at least one alphabetic character.";
  }
  if (!/^[A-Za-z\s.\-]+$/.test(trimmed)) {
    return "First name can only contain letters, spaces, periods, and hyphens.";
  }
  return "";
};

const validateLastName = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "Last name is required.";
  if (trimmed.length < 2) return "Last name must be at least 2 characters.";
  if (trimmed.length > 50) return "Last name cannot exceed 50 characters.";
  if (!/[A-Za-z]/.test(trimmed)) {
    return "Last name must contain at least one alphabetic character.";
  }
  if (!/^[A-Za-z\s.\-]+$/.test(trimmed)) {
    return "Last name can only contain letters, spaces, periods, and hyphens.";
  }
  return "";
};

const validateMobileNumber = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "Mobile number is required.";
  if (!/^[6-9]\d{9}$/.test(trimmed)) {
    return "Mobile number must be a valid 10-digit Indian number starting with 6-9.";
  }
  return "";
};

const validateHouseFlatNumber = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "Flat/House number is required.";
  if (trimmed.length < 2) return "Flat/House number must be at least 2 characters.";
  if (trimmed.length > 100) return "Flat/House number cannot exceed 100 characters.";
  if (!/^[A-Za-z0-9\s/\-,.]+$/.test(trimmed)) {
    return "Flat/House number can only contain letters, numbers, spaces, and / - , .";
  }
  if (!/[A-Za-z/\-,.]/.test(trimmed)) {
    return "Flat/House number must contain at least one letter or separator (/ - , .).";
  }
  return "";
};

const validateLandmark = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return ""; // Optional
  if (trimmed.length < 3) return "Landmark must be at least 3 characters.";
  if (trimmed.length > 150) return "Landmark cannot exceed 150 characters.";
  if (/^\d+$/.test(trimmed.replace(/[\s\-,./]/g, ""))) {
    return "Landmark cannot be numeric-only.";
  }
  return "";
};

const validateLocality = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "Locality/Street is required.";
  if (trimmed.length < 3) return "Locality/Street must be at least 3 characters.";
  if (trimmed.length > 150) return "Locality/Street cannot exceed 150 characters.";
  if (!/^[A-Za-z0-9\s,\.\-\/]+$/.test(trimmed)) {
    return "Locality/Street can only contain letters, numbers, spaces, and , . - /";
  }
  if (/^\d+$/.test(trimmed.replace(/[\s,\.\-\/]/g, ""))) {
    return "Locality/Street cannot be numeric-only.";
  }
  return "";
};

const validateCity = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "City is required.";
  if (trimmed.length < 2) return "City must be at least 2 characters.";
  if (trimmed.length > 80) return "City cannot exceed 80 characters.";
  if (!/^[A-Za-z\s.\-]+$/.test(trimmed)) {
    return "City can only contain letters, spaces, periods, and hyphens.";
  }
  return "";
};

const validateState = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "State is required.";
  if (trimmed.length < 2) return "State must be at least 2 characters.";
  if (trimmed.length > 80) return "State cannot exceed 80 characters.";
  if (!/^[A-Za-z\s.\-]+$/.test(trimmed)) {
    return "State can only contain letters, spaces, periods, and hyphens.";
  }
  return "";
};

const validatePincode = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "Pincode is required.";
  if (!/^\d{6}$/.test(trimmed)) {
    return "Pincode must be exactly 6 digits.";
  }
  return "";
};

const validateAddressDescription = (value) => {
  const trimmed = (value || "").trim();
  if (trimmed.length > 300) {
    return "Delivery instructions cannot exceed 300 characters.";
  }
  return "";
};

const sanitizeString = (val) => {
  if (typeof val !== "string") return val;
  return val.trim().replace(/\s+/g, " ");
};

// Extract locality and city from legacy `fullAddress` strings when explicit fields are missing.
// Example formats: "FlatNo, Locality, City, State - Pincode" or "FlatNo, Locality, City"
const extractLocalityCityFromFullAddress = (fullAddress) => {
  if (!fullAddress || typeof fullAddress !== "string") return { locality: "", city: "" };
  const parts = fullAddress.split(",").map(p => p.trim()).filter(Boolean);
  const locality = parts[1] || "";
  let city = "";
  if (parts[2]) {
    // parts[2] could contain "City" or "City - Pincode" or "City State"
    city = parts[2].split("-")[0].trim();
  } else if (parts[1]) {
    // Fallback: sometimes fullAddress may be "Flat, Locality City - ..."
    const maybe = parts[1].split("-")[0].trim();
    // only accept fallback if it looks like a city (length > 2)
    city = maybe.length > 2 ? maybe : "";
  }
  return { locality, city };
};

const validators = {
  firstName: validateFirstName,
  lastName: validateLastName,
  mobileNumber: validateMobileNumber,
  houseFlatNumber: validateHouseFlatNumber,
  landmark: validateLandmark,
  locality: validateLocality,
  city: validateCity,
  state: validateState,
  pincode: validatePincode,
  addressDescription: validateAddressDescription
};

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

  // Validation States
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  // Input Refs for Programmatic Focus/Scroll
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const mobileNumberRef = useRef(null);
  const houseFlatNumberRef = useRef(null);
  const landmarkRef = useRef(null);
  const localityRef = useRef(null);
  const cityRef = useRef(null);
  const stateRef = useRef(null);
  const pincodeRef = useRef(null);
  const addressDescriptionRef = useRef(null);

  const fieldRefs = {
    firstName: firstNameRef,
    lastName: lastNameRef,
    mobileNumber: mobileNumberRef,
    houseFlatNumber: houseFlatNumberRef,
    landmark: landmarkRef,
    locality: localityRef,
    city: cityRef,
    state: stateRef,
    pincode: pincodeRef,
    addressDescription: addressDescriptionRef
  };

  // Real-time validation sync
  useEffect(() => {
    const newErrors = {};
    Object.keys(validators).forEach(field => {
      newErrors[field] = validators[field](formData[field]);
    });
    setErrors(newErrors);
  }, [formData]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleFieldBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleMobileKeyDown = (e) => {
    const blockedKeys = ["e", "E", "+", "-", ".", " "];
    if (blockedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleMobileChange = (e) => {
    let val = e.target.value;
    val = val.replace(/\D/g, "").slice(0, 10);
    handleFieldChange("mobileNumber", val);
  };

  const handlePincodeChange = (e) => {
    let val = e.target.value;
    val = val.replace(/\D/g, "").slice(0, 6);
    handleFieldChange("pincode", val);
  };

  const getFieldClass = (field) => {
    const base = "w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none transition ";
    const theme = isNight 
      ? "bg-slate-950 text-white " 
      : "bg-slate-50 text-slate-800 ";
      
    if (touched[field]) {
      if (errors[field]) {
        return base + theme + "border-rose-500 focus:border-rose-500";
      } else {
        return base + theme + "border-emerald-500 focus:border-emerald-500";
      }
    }
    
    const defaultBorder = isNight 
      ? "border-slate-850 focus:border-indigo-500" 
      : "border-slate-200 focus:border-indigo-500";
      
    return base + theme + defaultBorder;
  };

  const hasErrors = Object.values(errors).some(err => err !== "");
  const isMissingRequired = 
    !formData.firstName ||
    !formData.lastName ||
    !formData.mobileNumber ||
    !formData.houseFlatNumber ||
    !formData.locality ||
    !formData.city ||
    !formData.state ||
    !formData.pincode;

  const isSubmitDisabled = hasErrors || isMissingRequired;

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
        setTouched(prev => ({
          ...prev,
          ...(postalCode ? { pincode: true } : {}),
          ...(locality ? { locality: true } : {}),
          ...(city ? { city: true } : {}),
          ...(state ? { state: true } : {})
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

    // Run every validator again
    const newErrors = {};
    let firstInvalidField = null;

    const fieldOrder = [
      "firstName",
      "lastName",
      "mobileNumber",
      "houseFlatNumber",
      "landmark",
      "locality",
      "pincode",
      "city",
      "state",
      "addressDescription"
    ];

    for (const field of fieldOrder) {
      const error = validators[field](formData[field]);
      newErrors[field] = error;
      if (error && !firstInvalidField) {
        firstInvalidField = field;
      }
    }

    setErrors(newErrors);
    
    // Mark all fields as touched to display validation styling
    const allTouched = {};
    fieldOrder.forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    if (firstInvalidField) {
      const ref = fieldRefs[firstInvalidField];
      if (ref && ref.current) {
        ref.current.focus();
        ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      triggerToast("Please check and correct the invalid fields highlighted in red.");
      return;
    }

    // Sanitization Rules (trim & space collapse)
    const sanitizedFormData = {
      ...formData,
      firstName: sanitizeString(formData.firstName),
      lastName: sanitizeString(formData.lastName),
      mobileNumber: sanitizeString(formData.mobileNumber),
      houseFlatNumber: sanitizeString(formData.houseFlatNumber),
      landmark: sanitizeString(formData.landmark),
      locality: sanitizeString(formData.locality),
      city: sanitizeString(formData.city),
      state: sanitizeString(formData.state),
      pincode: sanitizeString(formData.pincode),
      addressDescription: sanitizeString(formData.addressDescription)
    };

    // Generate combined address text
    const completeAddressStr = `${sanitizedFormData.houseFlatNumber}, ${sanitizedFormData.locality}, ${sanitizedFormData.landmark ? sanitizedFormData.landmark + ", " : ""}${sanitizedFormData.city}, ${sanitizedFormData.state} - ${sanitizedFormData.pincode}`;
    const payload = { ...sanitizedFormData, fullAddress: completeAddressStr };

    try {
      if (modalType === "new") {
        await API.post("/addresses", payload);
        triggerToast("Address saved successfully! 🎉");
      } else {
        await API.put(`/addresses/${editingId}`, payload);
        triggerToast("Address updated successfully! 🎉");
      }
      setModalOpen(false);
      await fetchAddresses();
      broadcastAddressUpdate({ type: modalType === "new" ? "created" : "updated" });
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.msg || "Failed to save address details.");
    }
  };

  // Edit address trigger
  const handleEdit = (addr) => {
    // For legacy addresses that may not have explicit `locality`/`city`,
    // attempt to derive them from `fullAddress` so validation doesn't block editing.
    const derived = extractLocalityCityFromFullAddress(addr.fullAddress);
    setFormData({
      firstName: addr.firstName,
      lastName: addr.lastName,
      mobileNumber: addr.mobileNumber,
      houseFlatNumber: addr.houseFlatNumber,
      landmark: addr.landmark || "",
      pincode: addr.pincode || "",
      locality: addr.locality || derived.locality || "",
      city: addr.city || derived.city || "",
      state: addr.state || "",
      fullAddress: addr.fullAddress,
      addressType: addr.addressType || "Home",
      addressDescription: addr.addressDescription || "",
      latitude: addr.latitude || 17.385044,
      longitude: addr.longitude || 78.486671,
      isDefault: addr.isDefault
    });
    setTouched({});
    setErrors({});
    setEditingId(addr._id);
    setModalType("edit");
    setModalOpen(true);
  };

  // Set default address trigger
  const handleSetDefault = async (id) => {
    try {
      await API.put(`/addresses/${id}/default`);
      triggerToast("Default address updated!");
      await fetchAddresses();
      broadcastAddressUpdate({ type: "default_changed" });
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
      await fetchAddresses();
      broadcastAddressUpdate({ type: "deleted" });
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
          className={`flex items-center gap-2 text-sm font-extrabold px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.05] active:scale-95 ${
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
                setTouched({});
                setErrors({});
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
                  setTouched({});
                  setErrors({});
                  setModalType("new");
                  setModalOpen(true);
                }}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 hover:from-violet-700 hover:to-indigo-700 dark:hover:from-violet-400 dark:hover:to-indigo-400 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 focus:ring-4 focus:ring-violet-300 focus:outline-none whitespace-nowrap cursor-pointer"
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
                    <div className="relative">
                      <input 
                        type="text"
                        ref={firstNameRef}
                        required
                        value={formData.firstName}
                        onChange={(e) => handleFieldChange("firstName", e.target.value)}
                        onBlur={() => handleFieldBlur("firstName")}
                        placeholder="John"
                        className={getFieldClass("firstName")}
                      />
                      {touched.firstName && !errors.firstName && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold pointer-events-none">✓</span>
                      )}
                    </div>
                    {touched.firstName && errors.firstName && (
                      <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Last Name *</label>
                    <div className="relative">
                      <input 
                        type="text"
                        ref={lastNameRef}
                        required
                        value={formData.lastName}
                        onChange={(e) => handleFieldChange("lastName", e.target.value)}
                        onBlur={() => handleFieldBlur("lastName")}
                        placeholder="Doe"
                        className={getFieldClass("lastName")}
                      />
                      {touched.lastName && !errors.lastName && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold pointer-events-none">✓</span>
                      )}
                    </div>
                    {touched.lastName && errors.lastName && (
                      <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.lastName}</p>
                    )}
                  </div>
                </div>
 
                <div className="mb-4">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Mobile Number *</label>
                  <div className="relative">
                    <input 
                      type="tel"
                      ref={mobileNumberRef}
                      required
                      maxLength={10}
                      value={formData.mobileNumber}
                      onKeyDown={handleMobileKeyDown}
                      onChange={handleMobileChange}
                      onBlur={() => handleFieldBlur("mobileNumber")}
                      placeholder="9876543210"
                      className={getFieldClass("mobileNumber")}
                    />
                    {touched.mobileNumber && !errors.mobileNumber && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold pointer-events-none">✓</span>
                    )}
                  </div>
                  {touched.mobileNumber && errors.mobileNumber && (
                    <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.mobileNumber}</p>
                  )}
                </div>
 
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Flat/House Number *</label>
                    <div className="relative">
                      <input 
                        type="text"
                        ref={houseFlatNumberRef}
                        required
                        value={formData.houseFlatNumber}
                        onChange={(e) => handleFieldChange("houseFlatNumber", e.target.value)}
                        onBlur={() => handleFieldBlur("houseFlatNumber")}
                        placeholder="Flat 304, Building C"
                        className={getFieldClass("houseFlatNumber")}
                      />
                      {touched.houseFlatNumber && !errors.houseFlatNumber && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold pointer-events-none">✓</span>
                      )}
                    </div>
                    {touched.houseFlatNumber && errors.houseFlatNumber && (
                      <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.houseFlatNumber}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Landmark</label>
                    <div className="relative">
                      <input 
                        type="text"
                        ref={landmarkRef}
                        value={formData.landmark}
                        onChange={(e) => handleFieldChange("landmark", e.target.value)}
                        onBlur={() => handleFieldBlur("landmark")}
                        placeholder="e.g. Near Metro Station"
                        className={getFieldClass("landmark")}
                      />
                      {touched.landmark && !errors.landmark && formData.landmark && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold pointer-events-none">✓</span>
                      )}
                    </div>
                    {touched.landmark && errors.landmark && (
                      <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.landmark}</p>
                    )}
                  </div>
                </div>
 
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Locality/Street *</label>
                    <div className="relative">
                      <input 
                        type="text"
                        ref={localityRef}
                        required
                        value={formData.locality}
                        onChange={(e) => handleFieldChange("locality", e.target.value)}
                        onBlur={() => handleFieldBlur("locality")}
                        placeholder="Kondapur Road"
                        className={getFieldClass("locality")}
                      />
                      {touched.locality && !errors.locality && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold pointer-events-none">✓</span>
                      )}
                    </div>
                    {touched.locality && errors.locality && (
                      <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.locality}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Pincode *</label>
                    <div className="relative">
                      <input 
                        type="text"
                        ref={pincodeRef}
                        required
                        maxLength={6}
                        value={formData.pincode}
                        onChange={handlePincodeChange}
                        onBlur={() => handleFieldBlur("pincode")}
                        placeholder="500084"
                        className={getFieldClass("pincode")}
                      />
                      {touched.pincode && !errors.pincode && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold pointer-events-none">✓</span>
                      )}
                    </div>
                    {touched.pincode && errors.pincode && (
                      <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.pincode}</p>
                    )}
                  </div>
                </div>
 
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">City *</label>
                    <div className="relative">
                      <input 
                        type="text"
                        ref={cityRef}
                        required
                        value={formData.city}
                        onChange={(e) => handleFieldChange("city", e.target.value)}
                        onBlur={() => handleFieldBlur("city")}
                        placeholder="Hyderabad"
                        className={getFieldClass("city")}
                      />
                      {touched.city && !errors.city && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold pointer-events-none">✓</span>
                      )}
                    </div>
                    {touched.city && errors.city && (
                      <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">State *</label>
                    <div className="relative">
                      <input 
                        type="text"
                        ref={stateRef}
                        required
                        value={formData.state}
                        onChange={(e) => handleFieldChange("state", e.target.value)}
                        onBlur={() => handleFieldBlur("state")}
                        placeholder="Telangana"
                        className={getFieldClass("state")}
                      />
                      {touched.state && !errors.state && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold pointer-events-none">✓</span>
                      )}
                    </div>
                    {touched.state && errors.state && (
                      <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.state}</p>
                    )}
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
                            : (isNight ? "bg-slate-950 border-slate-880 text-slate-400 hover:text-white" : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50")
                        }`}
                      >
                        {getIcon(type)} {type}
                      </button>
                    ))}
                  </div>
                </div>
 
                <div className="mb-6">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Delivery Instructions / Description</label>
                  <div className="relative">
                    <textarea 
                      rows={2}
                      ref={addressDescriptionRef}
                      value={formData.addressDescription}
                      onChange={(e) => handleFieldChange("addressDescription", e.target.value)}
                      onBlur={() => handleFieldBlur("addressDescription")}
                      placeholder="e.g. Ring the bell, drop at reception, call before arrival..."
                      className={getFieldClass("addressDescription")}
                    />
                    {touched.addressDescription && !errors.addressDescription && formData.addressDescription && (
                      <span className="absolute right-3.5 top-3.5 text-emerald-500 text-sm font-bold pointer-events-none">✓</span>
                    )}
                  </div>
                  {touched.addressDescription && errors.addressDescription && (
                    <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.addressDescription}</p>
                  )}
                </div>
              </div>
 
              <div className="flex gap-3 border-t dark:border-slate-850/60 pt-4">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isNight ? "border-slate-800 text-slate-400 hover:text-white" : "border-slate-200 text-slate-650 hover:text-slate-900"
                  }`}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitDisabled}
                  className={`flex-1 py-3 text-white rounded-xl text-xs font-bold transition-all shadow-md ${
                    isSubmitDisabled 
                      ? "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-50" 
                      : "bg-gradient-to-r from-indigo-500 to-violet-500 hover:scale-102 active:scale-98 cursor-pointer"
                  }`}
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
