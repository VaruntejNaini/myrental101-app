import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DateRangePicker from "../components/rent-flow/DateRangePicker";
import PriceBreakdown from "../components/rent-flow/PriceBreakdown";

export default function RentConfigurator() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");

  // Mock catalog
  const catalog = {
    "camera": { title: "Sony FX3 Cinema Camera Kit", price: 450 },
    "ps5": { title: "PlayStation 5 Pro Console", price: 350 },
    "bike": { title: "Specialized Carbon Road Bike", price: 300 }
  };
  const item = catalog[id] || catalog["camera"];

  // Configurator States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);

  // Mock add-ons
  const ADDONS = [
    { id: "waiver", name: "Premium Damage Protection", price: 25, desc: "Zero liability for accidental scratches or spills.", perDay: true },
    { id: "accessories", name: "Pro Accessory Bundle", price: 40, desc: "Extra batteries, memory cards, or mounting gears.", perDay: false },
    { id: "delivery", name: "On-Demand Express Delivery", price: 15, desc: "Hand-delivered directly to your door at your time.", perDay: false }
  ];

  // Calculate rental duration in days
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
      setDays(isNaN(diffDays) ? 1 : diffDays);
    } else {
      setDays(1);
    }
  }, [startDate, endDate]);

  const handleDatesChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleToggleAddon = (addon) => {
    if (selectedAddons.find(a => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleNextStep = () => {
    if (!startDate || !endDate) {
      alert("Please select your rental start and end dates first!");
      return;
    }
    
    // Save selections in sessionStorage to carry to Checkout
    sessionStorage.setItem("rental_start", startDate);
    sessionStorage.setItem("rental_end", endDate);
    sessionStorage.setItem("rental_days", days.toString());
    sessionStorage.setItem("rental_addons", JSON.stringify(selectedAddons));
    
    navigate(`/rent/checkout/${id || "camera"}`);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 py-8 px-4 md:px-8 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Navigation and Flow Banner */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => navigate(`/rent/item/${id || "camera"}`)}
            className={`flex items-center gap-2 text-sm font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer ${
              isNight ? "bg-slate-900 border border-slate-800 hover:bg-slate-800" : "bg-white border border-slate-200 hover:bg-slate-100"
            }`}
          >
            ← Back to Item
          </button>
          
          <div className="flex gap-2">
            <span className="w-2.5 h-2.5 bg-violet-600 rounded-full" />
            <span className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-800 rounded-full" />
            <span className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-800 rounded-full" />
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-black mb-1">Configure Your Rental</h1>
        <p className="text-sm text-slate-400 font-medium">Customise dates and protection packages for {item.title}</p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Date Range and Add-ons */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Date Picker Component */}
          <DateRangePicker 
            startDate={startDate} 
            endDate={endDate} 
            onDatesChange={handleDatesChange}
            basePrice={item.price}
          />

          {/* Add-ons Configuration Cards */}
          <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl`}>
            <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span>🌟</span> Elevate Your Rental Experience
            </h3>
            
            <div className="space-y-4">
              {ADDONS.map(addon => {
                const isSelected = !!selectedAddons.find(a => a.id === addon.id);
                return (
                  <div 
                    key={addon.id}
                    onClick={() => handleToggleAddon(addon)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-start gap-4 ${
                      isSelected 
                        ? "border-violet-600 bg-violet-50/10" 
                        : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-950/20"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => {}} // toggled by outer card click
                          className="accent-violet-600 rounded"
                        />
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{addon.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{addon.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs bg-slate-200 dark:bg-slate-800 font-bold px-2 py-0.5 rounded-full text-slate-700 dark:text-slate-300">
                        +${addon.price}{addon.perDay ? "/day" : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Calculating price card */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            
            <PriceBreakdown 
              basePrice={item.price}
              days={days}
              selectedAddons={selectedAddons}
            />

            <button 
              onClick={handleNextStep}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-sm py-4 rounded-2xl shadow-lg shadow-violet-500/20 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>Proceed to Checkout</span>
              <span className="transition-transform group-hover:translate-x-1">➔</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
