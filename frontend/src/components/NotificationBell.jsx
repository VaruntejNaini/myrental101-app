import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import API from "../api";
import NotificationDrawer from "./NotificationDrawer";


export default function NotificationBell({ isNight }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const res = await API.get("/rent/notifications");
      setUnreadCount(res.data.length);
    } catch (err) {
      console.error("Error fetching notification count:", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Poll notifications every 5 seconds
    const intervalId = setInterval(fetchUnreadCount, 5000);

    // Listen to custom refresh events
    window.addEventListener("refreshNotificationCount", fetchUnreadCount);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("refreshNotificationCount", fetchUnreadCount);
    };
  }, []);

  return (
    <>
      <button
        onClick={() => setIsDrawerOpen(true)}
        className={`relative p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center ${
          isNight ? "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
        }`}
        title="Notifications"
      >
        <Bell className="w-5 h-5 select-none" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-[9px] border-2 border-white dark:border-slate-950 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
