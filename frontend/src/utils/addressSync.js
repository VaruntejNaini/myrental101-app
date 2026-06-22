// frontend/src/utils/addressSync.js
import { useEffect } from "react";

const CHANNEL_NAME = "address_sync_channel";

// Dispatch a local window event to synchronize within the same tab/window context
export const notifyLocalUpdate = (eventData) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("address-sync-update", { detail: eventData }));
  }
};

// Broadcast an update payload to all active tabs and windows
export const broadcastAddressUpdate = (eventData = { type: "bulk_refresh" }) => {
  if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
    try {
      const ch = new BroadcastChannel(CHANNEL_NAME);
      ch.postMessage(eventData);
      ch.close(); // Close immediate channel to prevent active port leaks
    } catch (err) {
      console.error("Failed to broadcast address sync event:", err);
    }
  }
  notifyLocalUpdate(eventData);
};

// Hook to register memory-safe cross-tab and focus listeners
export const useAddressSync = (onRefresh) => {
  useEffect(() => {
    if (typeof window === "undefined" || !onRefresh) return;

    // 1. Same-tab listener
    const handleLocalUpdate = (event) => {
      onRefresh(event.detail || { type: "bulk_refresh" });
    };
    window.addEventListener("address-sync-update", handleLocalUpdate);

    // 2. Cross-tab listener using BroadcastChannel
    let ch = null;
    const handleMessage = (event) => {
      onRefresh(event.data || { type: "bulk_refresh" });
    };
    
    if (typeof BroadcastChannel !== "undefined") {
      try {
        ch = new BroadcastChannel(CHANNEL_NAME);
        ch.addEventListener("message", handleMessage);
      } catch (err) {
        console.error("Failed to open BroadcastChannel for sync:", err);
      }
    }

    // 3. Fallback Storage event listener for older browser compatibility
    const handleStorage = (event) => {
      if (event.key === "saved_delivery_address" || event.key === "address-sync-trigger") {
        onRefresh({ type: "bulk_refresh" });
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Tab Activation & Window Focus listeners
    const handleFocus = () => {
      onRefresh({ type: "bulk_refresh" });
    };
    window.addEventListener("focus", handleFocus);
    
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        onRefresh({ type: "bulk_refresh" });
      }
    };
    window.addEventListener("visibilitychange", handleVisibility);

    // Memory-safe cleanup callback to unregister all listeners and prevent leaks
    return () => {
      window.removeEventListener("address-sync-update", handleLocalUpdate);
      if (ch) {
        ch.removeEventListener("message", handleMessage);
        ch.close();
      }
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [onRefresh]);
};
