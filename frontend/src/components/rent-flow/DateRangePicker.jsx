import React, { useState } from "react";

export default function DateRangePicker({ startDate, endDate, onDatesChange, basePrice }) {
  const [showCalendar, setShowCalendar] = useState(false);

  // Helper to generate calendar days
  const today = new Date();
  const currentMonth = today.toLocaleString("default", { month: "long", year: "numeric" });
  
  const handleStartDateChange = (e) => {
    onDatesChange(e.target.value, endDate);
  };

  const handleEndDateChange = (e) => {
    onDatesChange(startDate, e.target.value);
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-violet-500/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-violet-100 dark:bg-violet-950/50 rounded-xl text-violet-600 dark:text-violet-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Select Rental Period</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Base Rate: <span className="font-semibold text-violet-600 dark:text-violet-400">${basePrice}/day</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
          <div className="relative">
            <input 
              type="date" 
              value={startDate} 
              onChange={handleStartDateChange}
              min={today.toISOString().split("T")[0]}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">End Date</label>
          <div className="relative">
            <input 
              type="date" 
              value={endDate} 
              onChange={handleEndDateChange}
              min={startDate || today.toISOString().split("T")[0]}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Calendar Preview Visualizer */}
      <div className="mt-6 border-t border-slate-100 dark:border-slate-800/60 pt-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Availability Calendar ({currentMonth})</span>
          <button 
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
            className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
          >
            {showCalendar ? "Collapse" : "Expand"}
          </button>
        </div>

        {showCalendar && (
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40 animate-fadeIn">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d} className="font-bold text-slate-400 py-1">{d}</div>)}
            {Array.from({ length: 30 }).map((_, i) => {
              const dayNum = i + 1;
              const isToday = dayNum === today.getDate();
              const isSelected = startDate && endDate && dayNum >= new Date(startDate).getDate() && dayNum <= new Date(endDate).getDate();
              
              return (
                <div 
                  key={i} 
                  className={`py-2 rounded-lg font-medium transition-all ${
                    isSelected 
                      ? "bg-violet-600 text-white shadow-md shadow-violet-500/20" 
                      : isToday 
                        ? "border border-violet-500 text-violet-600 dark:text-violet-400 font-bold" 
                        : "hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
