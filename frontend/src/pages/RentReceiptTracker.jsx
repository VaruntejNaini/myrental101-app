import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StatusTimeline from "../components/rent-flow/StatusTimeline";

export default function RentReceiptTracker() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");

  // Read config values from SessionStorage (fallback to default mock values)
  const [itemName, setItemName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [days, setDays] = useState(1);

  // Status simulation: CONFIRMED, PICKUP, ACTIVE, RETURN, COMPLETED
  const [rentalStatus, setRentalStatus] = useState("CONFIRMED");

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 });

  // Host Direct Chat Message Board states
  const [chatMessages, setChatMessages] = useState([
    { sender: "host", text: "Hi Varun! Thanks for booking my kit. I'm preparing the package for you right now.", time: "12:40 PM" }
  ]);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    setItemName(sessionStorage.getItem("active_booking_item") || "Sony FX3 Cinema Camera Kit");
    setStartDate(sessionStorage.getItem("active_booking_start") || "2026-06-05");
    setEndDate(sessionStorage.getItem("active_booking_end") || "2026-06-10");
    setTotalCost(sessionStorage.getItem("active_booking_total") || "2450");
    setDays(parseInt(sessionStorage.getItem("active_booking_days") || "5"));
  }, []);

  // Simulates countdown clock decrease
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMsg = { sender: "user", text: messageText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, newMsg]);
    setMessageText("");

    // Simulate owner instant reply helper
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        sender: "host",
        text: "Sounds good! I'll make sure everything is fully charged. Let's sync up about the meetup point near Gachibowli.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 py-8 px-4 md:px-8 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Upper Success Header Banner */}
      <div className="max-w-5xl mx-auto text-center mb-10 mt-4 animate-fadeIn">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-emerald-500/10 animate-bounce">
          ✓
        </div>
        <h1 className="text-3xl font-black mb-2 tracking-tight">Rental Confirmed!</h1>
        <p className="text-sm text-slate-400 font-semibold">Booking ID: <span className="text-violet-500 font-bold uppercase">{bookingId || "BK-903827"}</span></p>
      </div>

      {/* Real-time Status Tracker Timeline */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-3 px-2">
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Live Booking Lifecycle</span>
          <select 
            value={rentalStatus} 
            onChange={(e) => setRentalStatus(e.target.value)}
            className={`text-xs px-2.5 py-1 rounded-lg border font-bold ${
              isNight ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            <option value="CONFIRMED">Stage 1: Confirmed</option>
            <option value="PICKUP">Stage 2: Key Handoff</option>
            <option value="ACTIVE">Stage 3: Rental Active</option>
            <option value="RETURN">Stage 4: Return Pending</option>
            <option value="COMPLETED">Stage 5: Completed</option>
          </select>
        </div>
        <StatusTimeline currentStatus={rentalStatus} />
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Countdown & Handoff Checklist */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Countdown Clock Widget */}
          <div className="bg-gradient-to-br from-violet-900 to-indigo-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-violet-200 mb-4">Time Until Key Handoff</h3>
            
            <div className="flex gap-4 items-center">
              <div className="text-center bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 min-w-[70px]">
                <span className="text-2xl font-black">{String(timeLeft.hours).padStart(2, '0')}</span>
                <p className="text-[10px] text-violet-300 font-semibold uppercase mt-0.5">Hours</p>
              </div>
              <span className="text-xl font-bold">:</span>
              <div className="text-center bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 min-w-[70px]">
                <span className="text-2xl font-black">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <p className="text-[10px] text-violet-300 font-semibold uppercase mt-0.5">Mins</p>
              </div>
              <span className="text-xl font-bold">:</span>
              <div className="text-center bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 min-w-[70px]">
                <span className="text-2xl font-black">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <p className="text-[10px] text-violet-300 font-semibold uppercase mt-0.5">Secs</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 text-xs text-violet-100">
              <span>📍</span> Meet host at <strong>Starbucks, Gachibowli Main Rd</strong> for handover inspection.
            </div>
          </div>

          {/* Secure Handoff Step-by-Step checklist */}
          <div className={`p-6 rounded-3xl border ${isNight ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200/60"}`}>
            <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
              <span>🗝️</span> Pre-Rental Verification Guidelines
            </h3>
            
            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 font-extrabold">✓</span>
                <div>
                  <h4 className="font-bold text-xs">Verify Owner Profile</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Match the owner profile details and chat history in person.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                <span className="text-emerald-500 font-extrabold">✓</span>
                <div>
                  <h4 className="font-bold text-xs">Conduct Damage Check & Capture Photos</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Take photos of the item's condition at handoff and upload them to the active rental tracker.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                <span className="text-emerald-500 font-extrabold">✓</span>
                <div>
                  <h4 className="font-bold text-xs">Verify Accessories & Cable Connections</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ensure all package items listed in specs are present inside the carry pouch before departing.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Direct Messaging Console & Receipt Summary */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Direct message module with item owner */}
          <div className={`p-5 rounded-3xl border flex flex-col h-[320px] ${
            isNight ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="flex items-center gap-3 border-b pb-3 mb-3 border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold font-mono">
                AK
              </div>
              <div>
                <h4 className="text-xs font-bold">Arjun K. (Host)</h4>
                <p className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Online
                </p>
              </div>
            </div>

            {/* Messages box container */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <div className={`p-3 rounded-2xl max-w-[85%] ${
                    msg.sender === "user" 
                      ? "bg-violet-600 text-white rounded-tr-none" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Input field */}
            <form onSubmit={handleSendMessage} className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <input 
                type="text" 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Ask Arjun a question..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-violet-500 text-xs text-slate-800 dark:text-slate-200"
              />
              <button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-3 py-2 rounded-xl text-xs">
                Send
              </button>
            </form>
          </div>

          {/* Mini receipt summary widget */}
          <div className={`p-6 rounded-3xl border text-sm ${isNight ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <h3 className="font-semibold text-sm border-b pb-3 mb-3 border-slate-100 dark:border-slate-800">Booking Summary</h3>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Rented Item:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{itemName}</span>
              </div>
              <div className="flex justify-between">
                <span>Rental Period:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{startDate} to {endDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{days} days</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2 text-slate-700 dark:text-slate-200">
                <span className="font-bold">Total Amount Authorized:</span>
                <span className="font-black text-violet-500">${Number(totalCost).toLocaleString()}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => alert("Downloading PDF Receipt...")}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-center"
              >
                📄 Receipt PDF
              </button>
              <button 
                onClick={() => navigate("/dashboard")}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer text-center"
              >
                🏠 Dashboard
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
