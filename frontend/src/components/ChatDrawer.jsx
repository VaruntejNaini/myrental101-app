import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import API from "../api";

// Helper to format relative timestamps cleanly (e.g., "5m ago", "Yesterday")
const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

export default function ChatDrawer({ isOpen, onClose, refreshUnreadCount }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentUserId = localStorage.getItem("token") 
    ? JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id 
    : null;

  const fetchTransactions = async () => {
    try {
      const res = await API.get("/rent/transactions");
      setTransactions(res.data);
    } catch (err) {
      console.error("Error fetching transactions for chats:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchTransactions().finally(() => setLoading(false));
      document.body.style.overflow = "hidden";

      // Poll conversations list while open to update unread counts and last messages
      const interval = setInterval(fetchTransactions, 4000);
      return () => {
        clearInterval(interval);
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleThreadSelect = (tx, otherUser) => {
    // Dispatch universal open chat box event
    window.dispatchEvent(
      new CustomEvent("openChatbox", {
        detail: {
          transactionId: tx._id,
          otherUser: otherUser,
          productTitle: tx.product?.title || "Item"
        }
      })
    );
    
    // Close side drawer immediately
    onClose();

    // Trigger parent refresh if exists
    if (refreshUnreadCount) {
      refreshUnreadCount();
    }
  };

  return createPortal(
    <>
      {/* Backdrop mask */}
      <div
        className="fixed inset-0 bg-black/40 z-[125]"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div
        className="fixed top-0 right-0 h-full w-full sm:w-[480px] z-[130] bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-2xl flex flex-col transition-transform duration-300"
        style={{ fontFamily: "'Nunito', 'Poppins', sans-serif" }}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-150 dark:border-zinc-850 flex justify-between items-center bg-gray-50 dark:bg-zinc-900/50">
          <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            💬 Messages
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-750 dark:text-zinc-400 dark:hover:text-white font-black text-lg p-2 rounded-xl border border-gray-200 dark:border-zinc-700 cursor-pointer w-9 h-9 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-zinc-900">
          {loading && transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-2">
              <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
              <p className="text-xs text-slate-450 font-bold">Syncing conversations...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-zinc-650 space-y-3">
              <span className="text-5xl">💬</span>
              <p className="text-sm font-extrabold text-slate-500">No active chats</p>
              <p className="text-xs text-center max-w-[240px] leading-relaxed text-slate-450">
                Start a rental proposal or buyout request to initiate chat channels.
              </p>
            </div>
          ) : (
            transactions.map((tx) => {
              const isOwner = tx.owner?._id === currentUserId;
              const otherUser = isOwner ? tx.borrower : tx.owner;
              if (!otherUser) return null;

              const hasUnread = tx.unreadCount > 0;
              const lastMsgTime = tx.lastMessage ? tx.lastMessage.createdAt : tx.updatedAt;

              // Format message preview
              let previewText = "No messages yet. Click to start chatting!";
              if (tx.lastMessage) {
                const isSentByMe = tx.lastMessage.sender === currentUserId || tx.lastMessage.sender?._id === currentUserId;
                previewText = `${isSentByMe ? "You: " : ""}${tx.lastMessage.content}`;
              }

              return (
                <div
                  key={tx._id}
                  onClick={() => handleThreadSelect(tx, otherUser)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center gap-3.5 ${
                    hasUnread
                      ? "border-indigo-500/80 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-sm"
                      : "border-gray-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-850 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  {/* User Profile Avatar */}
                  <div className="relative w-11 h-11 rounded-full flex-shrink-0 bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-extrabold text-sm border border-indigo-500/20 overflow-hidden">
                    {otherUser.profilePic ? (
                      <img src={otherUser.profilePic} alt={otherUser.name} className="w-full h-full object-cover" />
                    ) : (
                      otherUser.name ? otherUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "👤"
                    )}
                  </div>

                  {/* Thread Information */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className={`text-sm truncate ${
                        hasUnread ? "font-black text-slate-900 dark:text-white" : "font-bold text-slate-800 dark:text-zinc-200"
                      }`}>
                        {otherUser.name}
                      </h4>
                      <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider flex-shrink-0">
                        {tx.product?.productType === "SECOND_HAND" ? "Buyout" : "Rent"}
                      </span>
                    </div>

                    {/* Product Name */}
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-black truncate mt-0.5">
                      {tx.product?.title || "Product Item"}
                    </p>

                    {/* Latest Message Preview */}
                    <div className="flex justify-between items-center gap-1.5 mt-1">
                      <p className={`text-xs truncate flex-1 ${
                        hasUnread ? "font-bold text-slate-900 dark:text-zinc-100" : "font-medium text-slate-400 dark:text-zinc-400"
                      }`}>
                        {previewText}
                      </p>
                      
                      {/* Message Timestamp */}
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold flex-shrink-0">
                        {formatRelativeTime(lastMsgTime)}
                      </span>
                    </div>
                  </div>

                  {/* Thread Unread Count Badge */}
                  {hasUnread && (
                    <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-[10px] font-black text-white shadow ring-1 ring-white dark:ring-zinc-900 animate-pulse">
                      {tx.unreadCount}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
