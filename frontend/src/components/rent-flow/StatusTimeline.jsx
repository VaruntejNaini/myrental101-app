import React from "react";

const STAGES = [
  { id: "CONFIRMED", label: "Confirmed", desc: "Booking secured" },
  { id: "PICKUP", label: "Key Handoff", desc: "Meet the owner" },
  { id: "ACTIVE", label: "Rental Active", desc: "In your possession" },
  { id: "RETURN", label: "Return Pending", desc: "Inspection & return" },
  { id: "COMPLETED", label: "Completed", desc: "Deposit refunded" },
];

export default function StatusTimeline({ currentStatus = "CONFIRMED" }) {
  const currentIndex = STAGES.findIndex(s => s.id === currentStatus);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 md:gap-4 relative">
        
        {/* Horizontal Connector Line for desktop */}
        <div className="hidden md:block absolute top-6 left-12 right-12 h-1 bg-slate-100 dark:bg-slate-800 z-0">
          <div 
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700 ease-out" 
            style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
          />
        </div>

        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          const isPending = idx > currentIndex;

          return (
            <div key={stage.id} className="flex md:flex-col items-center gap-4 md:gap-3 text-center z-10 w-full md:w-1/5 relative">
              {/* Node Indicator */}
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-all duration-500 shadow-md ${
                  isCompleted 
                    ? "bg-emerald-500 border-emerald-100 dark:border-emerald-950 text-white" 
                    : isActive 
                      ? "bg-violet-600 border-violet-100 dark:border-violet-950 text-white animate-pulse" 
                      : "bg-slate-100 dark:bg-slate-800 border-white dark:border-slate-900 text-slate-400"
                }`}
              >
                {isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Text description */}
              <div className="text-left md:text-center">
                <h4 className={`font-semibold text-sm transition-colors ${isActive ? "text-violet-600 dark:text-violet-400 font-extrabold" : isCompleted ? "text-slate-700 dark:text-slate-300" : "text-slate-400"}`}>
                  {stage.label}
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 max-w-[120px] mx-auto hidden md:block">
                  {stage.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
