import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, X, Activity, Mail, Phone, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function NotificationDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await API.get("/rent/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleResolveNegotiation = async (notifId, txId, action, otherUser = null, productTitle = "") => {
    try {
      await API.post(`/rent/negotiate/${txId}/resolve`, { action });
      await handleMarkAsRead(notifId);
      if (action === "ACCEPT" && otherUser) {
        window.dispatchEvent(
          new CustomEvent("openChatbox", {
            detail: {
              transactionId: txId,
              otherUser: otherUser,
              productTitle: productTitle || "Item"
            }
          })
        );
      }
    } catch (err) {
      console.error(`Error resolving negotiation (${action}):`, err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await API.put(`/rent/notifications/${id}/read`);
      setNotifications(notifications.filter((n) => n._id !== id));
      // Dispatch global count update
      window.dispatchEvent(new Event("refreshNotificationCount"));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleClearTransactionNotifications = async (txId, otherUser, productTitle) => {
    try {
      // Step 1: Mark notifications as read
      await API.post(`/rent/notifications/transaction/${txId}/read`);
      // Update local state immediately (no flicker)
      setNotifications(prev => prev.filter(n => {
        const txMatch = n.link ? n.link.match(/tx=([^&#=]*)/) : null;
        const currentTxId = n.transactionId || (txMatch ? txMatch[1] : null);
        return currentTxId !== txId;
      }));
      window.dispatchEvent(new Event("refreshNotificationCount"));

      // Step 2: OPEN THE CHATBOX FIRST (critical user action - happens immediately)
      window.dispatchEvent(
        new CustomEvent("openChatbox", {
          detail: {
            transactionId: txId,
            otherUser,
            productTitle: productTitle || "Item"
          }
        })
      );

      // Step 3: Notify borrower that owner wants to negotiate (secondary - can fail without blocking)
      // This runs in the background and doesn't block the chat from opening
      API.post(`/rent/negotiate/${txId}/chat-now`)
        .then(response => {
          // If we got productTitle from backend, dispatch event to update chat header
          if (response.data?.productTitle) {
            window.dispatchEvent(
              new CustomEvent("updateChatProductTitle", {
                detail: {
                  transactionId: txId,
                  productTitle: response.data.productTitle
                }
              })
            );
          }
        })
        .catch(notifyErr => {
          console.warn("Failed to notify borrower:", notifyErr);
        });

      onClose();
    } catch (err) {
      console.error("Error clearing transaction notifications:", err);
    }
  };

  const handleOwnerReadyNegotiationChat = async (txId, sender, productTitle) => {
    try {
      // Mark notifications as read
      await API.post(`/rent/notifications/transaction/${txId}/read`);
      setNotifications(prev => prev.filter(n => {
        const txMatch = n.link ? n.link.match(/tx=([^&#=]*)/) : null;
        const currentTxId = n.transactionId || (txMatch ? txMatch[1] : null);
        return currentTxId !== txId;
      }));
      window.dispatchEvent(new Event("refreshNotificationCount"));

      // Open the chatbox - sender is the owner
      window.dispatchEvent(
        new CustomEvent("openChatbox", {
          detail: {
            transactionId: txId,
            otherUser: sender,
            productTitle: productTitle || "Item"
          }
        })
      );
      
      onClose();
    } catch (err) {
      console.error("Error handling owner ready negotiation chat:", err);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.preventDefault();
    try {
      await API.put("/rent/notifications/read-all");
      setNotifications([]);
      window.dispatchEvent(new Event("refreshNotificationCount"));
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop mask */}
      <div
        className="fixed inset-0 bg-black/40 z-[125]"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div
        className="fixed top-0 right-0 h-full w-full sm:w-[480px] z-[130] bg-white dark:bg-zinc-900 border-l border-gray-205 dark:border-zinc-800 shadow-2xl flex flex-col transition-transform duration-300"
        style={{ fontFamily: "'Nunito', 'Poppins', sans-serif" }}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-150 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-500" /> Notifications
              {notifications.length > 0 && (
                <span className="text-xs bg-indigo-500 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {notifications.length}
                </span>
              )}
            </h2>
            {notifications.length > 0 && (
              <a
                href="#read-all"
                onClick={handleMarkAllAsRead}
                className="text-xs text-indigo-500 hover:text-indigo-650 font-bold mt-1 inline-block"
              >
                Mark all as read
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-white font-black text-lg p-2 rounded-xl border border-gray-200 dark:border-zinc-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-zinc-900">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-2">
              <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
              <p className="text-xs text-slate-450 font-bold">Syncing alerts...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-zinc-600 space-y-3">
              <Activity className="w-12 h-12 text-slate-400 dark:text-zinc-650" />
              <p className="text-sm font-extrabold">All caught up!</p>
              <p className="text-xs text-center max-w-[200px] leading-relaxed text-slate-450">
                Any negotiation offers, order requests, or updates will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const typeColors = {
                NEGOTIATION: "border-l-indigo-500 border-indigo-500/15 bg-indigo-500/5 dark:border-indigo-500/25 dark:bg-indigo-500/10",
                ORDER: "border-l-emerald-500 border-emerald-500/15 bg-emerald-500/5 dark:border-emerald-500/25 dark:bg-emerald-500/10",
                SYSTEM: "border-l-amber-500 border-amber-500/15 bg-amber-500/5 dark:border-amber-500/25 dark:bg-amber-500/10",
                OFFER_RETRACTED: "border-l-rose-500 border-rose-500/15 bg-rose-500/5 dark:border-rose-500/25 dark:bg-rose-500/10",
                OTP_HANDOFF: "border-l-violet-500 border-violet-500/15 bg-violet-500/5 dark:border-violet-500/25 dark:bg-violet-500/10",
                OTP_RETURN: "border-l-violet-500 border-violet-500/15 bg-violet-500/5 dark:border-violet-500/25 dark:bg-violet-500/10",
                OWNER_WANTS_TO_NEGOTIATE: "border-l-violet-500 border-violet-500/15 bg-violet-500/5 dark:border-violet-500/25 dark:bg-violet-500/10",
              };
              const emojiMap = {
                NEGOTIATION: "💬",
                ORDER: "📦",
                SYSTEM: "🔔",
                OFFER_RETRACTED: "🚫",
                OTP_HANDOFF: "🔑",
                OTP_RETURN: "🔄",
                OWNER_WANTS_TO_NEGOTIATE: "💬",
              };
              const labelMap = {
                NEGOTIATION: "NEGOTIATION",
                ORDER: "ORDER",
                SYSTEM: "SYSTEM",
                OFFER_RETRACTED: "Offer Retracted",
                OTP_HANDOFF: "Handoff Code",
                OTP_RETURN: "Return Code",
                OWNER_WANTS_TO_NEGOTIATE: "Negotiation",
              };

              const isOtpNotif = notif.type === "OTP_HANDOFF" || notif.type === "OTP_RETURN";

              // Detect embedded OTP code for display
              const otpMatch = notif.message.match(/(?:code|OTP|is):\s*(\d{6})/i);
              const embeddedOtp = otpMatch ? otpMatch[1] : null;
              return (
                <div
                  key={notif._id}
                  className={`p-4 rounded-2xl border-l-4 border shadow-sm transition-all duration-200 flex flex-col gap-2 ${
                    typeColors[notif.type] || "border-l-gray-400 border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                      <span>{emojiMap[notif.type]}</span>
                      {labelMap[notif.type] || notif.type}
                    </span>
                    <button
                      onClick={() => handleMarkAsRead(notif._id)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-300 px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 leading-relaxed">
                    {notif.message}
                  </p>
                  {/* OTP highlight block — only shown when the notification carries a 6-digit code */}
                  {embeddedOtp && (
                    <div className="mt-2 mb-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                      <span className="text-[9px] font-black uppercase tracking-widest text-violet-400">Your Verification Code</span>
                      <span className="text-3xl font-black tracking-[0.35em] text-violet-300 select-all">
                        {embeddedOtp}
                      </span>
                      <span className="text-[9px] text-violet-400/70">Show this to the other party · Expires in 10 min</span>
                    </div>
                  )}
                  {(() => {
                    const txMatch = notif.link ? notif.link.match(/tx=([^&#=]*)/) : null;
                    const txId = notif.transactionId || (txMatch ? txMatch[1] : null);
                    return (
                      <>
                        {notif.sender && (
                          <div className="mt-2 p-3 rounded-xl bg-slate-900 dark:bg-black border border-slate-800/80 flex flex-col gap-2 shadow-inner">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-1.5">
                              <span className="text-xs font-black text-white flex items-center gap-1">
                                👤 {notif.sender.name}
                              </span>
                              {notif.sender.isVerified ? (
                                <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-500/20">
                                  ✓ Verified
                                </span>
                              ) : (
                                <span className="text-[9px] font-black text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/20">
                                  Unverified
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-100 flex flex-col gap-1 font-bold">
                              {notif.sender.email && (
                                <span className="truncate flex items-center gap-1.5 text-slate-200">
                                  <Mail className="w-3 h-3 text-slate-350" /> {notif.sender.email}
                                </span>
                              )}
                              {notif.sender.phone && (
                                <span className="flex items-center gap-1.5 text-slate-200">
                                  <Phone className="w-3 h-3 text-slate-350" /> {notif.sender.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {txId && !notif.message.startsWith("Negotiation Rejected ❌") && (
                          <div className="mt-3 flex flex-col gap-1.5">
                            {notif.type === "NEGOTIATION" && !notif.message.startsWith("Negotiation Accepted 🎉") && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleResolveNegotiation(notif._id, txId, "ACCEPT", notif.sender, notif.message)}
                                  className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black tracking-wide shadow transition-all active:scale-95 cursor-pointer text-center"
                                >
                                  ACCEPT
                                </button>
                                <button
                                  onClick={() => handleResolveNegotiation(notif._id, txId, "REJECT", notif.sender, notif.message)}
                                  className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black tracking-wide shadow transition-all active:scale-95 cursor-pointer text-center"
                                >
                                  REJECT
                                </button>
                              </div>
                            )}
                            {isOtpNotif ? (
                              <button
                                onClick={async () => {
                                  await handleMarkAsRead(notif._id);
                                  navigate("/orders");
                                  onClose();
                                }}
                                className="w-full py-1.5 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-black tracking-wide shadow transition-all active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1"
                              >
                                <ArrowRight className="w-3 h-3" /> Go to Your Orders Page
                              </button>
                            ) : notif.type === "OWNER_WANTS_TO_NEGOTIATE" ? (
                              <button
                                onClick={() => handleOwnerReadyNegotiationChat(txId, notif.sender, notif.message)}
                                className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black tracking-wide shadow transition-all active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1"
                              >
                                💬 CHAT NOW
                              </button>
                            ) : (
                              <button
                                onClick={() => handleClearTransactionNotifications(txId, notif.sender, notif.message)}
                                className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black tracking-wide shadow transition-all active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1"
                              >
                                💬 CHAT NOW
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 text-right">
                    {new Date(notif.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
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
