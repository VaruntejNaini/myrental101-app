import React, { useState } from "react";
import ChatDrawer from "./ChatDrawer";

export default function ChatBell({ isNight }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsDrawerOpen(true)}
        className={`relative p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center ${
          isNight ? "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800" : "bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200"
        }`}
        title="Messages"
      >
        <span className="text-base select-none">💬</span>
      </button>

      <ChatDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
