import React, { useState, useEffect } from "react";
import ChatDrawer from "./ChatDrawer";
import API from "../api";
import { STORAGE_KEYS } from "../constants/auth";

export default function ChatBell({ isNight }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!localStorage.getItem(STORAGE_KEYS.TOKEN)) return;
    try {
      const res = await API.get("/rent/chat/unread-count");
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Set up polling
    const interval = setInterval(fetchUnreadCount, 4000);

    // Listen for custom event triggers
    window.addEventListener("refreshUnreadChatCount", fetchUnreadCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener("refreshUnreadChatCount", fetchUnreadCount);
    };
  }, []);

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
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-950 select-none shadow animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <ChatDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        refreshUnreadCount={fetchUnreadCount}
      />
    </>
  );
}

