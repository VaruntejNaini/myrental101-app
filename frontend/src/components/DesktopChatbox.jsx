import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User, Plus, Minus, X, Send } from "lucide-react";
import API from "../api";
import { STORAGE_KEYS } from "../constants/auth";
import { getSocket } from "../services/socket";

export default function DesktopChatbox() {
  const [activeChats, setActiveChats] = useState([]);
  const [focusedChatId, setFocusedChatId] = useState(null);

  // Listen for the universal "openChatbox" custom event
  useEffect(() => {
    const handleOpen = (e) => {
      const { transactionId, otherUser, productTitle } = e.detail;
      if (!transactionId) return;

      setActiveChats((prev) => {
        const existingIndex = prev.findIndex((c) => c.transactionId === transactionId);
        
        if (existingIndex !== -1) {
          // If already open, unminimize it and bring it to focus
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            isMinimized: false,
            lastFocusedAt: Date.now(),
          };
          setFocusedChatId(transactionId);
          return updated;
        } else {
          // If a new chat is being opened
          const newSession = {
            transactionId,
            otherUser,
            productTitle,
            isMinimized: false,
            lastFocusedAt: Date.now(),
          };

          setFocusedChatId(transactionId);

          if (prev.length >= 3) {
            // Find all minimized chats first (excluding currently focused, though a new one wouldn't be in prev anyway)
            const minimizedChats = prev.filter((c) => c.isMinimized);
            let indexToRemove = -1;

            if (minimizedChats.length > 0) {
              // Close the minimized chat with the oldest lastFocusedAt
              const oldestMinimized = minimizedChats.reduce((oldest, current) => {
                return current.lastFocusedAt < oldest.lastFocusedAt ? current : oldest;
              });
              indexToRemove = prev.findIndex((c) => c.transactionId === oldestMinimized.transactionId);
            } else {
              // If no chat is minimized, close the inactive (unfocused) chat with the oldest lastFocusedAt
              const inactiveChats = prev.filter((c) => c.transactionId !== focusedChatId);
              if (inactiveChats.length > 0) {
                const oldestInactive = inactiveChats.reduce((oldest, current) => {
                  return current.lastFocusedAt < oldest.lastFocusedAt ? current : oldest;
                });
                indexToRemove = prev.findIndex((c) => c.transactionId === oldestInactive.transactionId);
              } else {
                // Fallback (should not normally happen since activeChats.length >= 3 and only 1 can be focused)
                indexToRemove = 0;
              }
            }

            const updated = [...prev];
            if (indexToRemove !== -1) {
              updated.splice(indexToRemove, 1);
            }
            return [...updated, newSession];
          } else {
            return [...prev, newSession];
          }
        }
      });
    };

    window.addEventListener("openChatbox", handleOpen);
    return () => window.removeEventListener("openChatbox", handleOpen);
  }, [focusedChatId]);

  const handleFocus = (transactionId) => {
    setFocusedChatId(transactionId);
    setActiveChats((prev) =>
      prev.map((c) =>
        c.transactionId === transactionId ? { ...c, lastFocusedAt: Date.now() } : c
      )
    );
  };

  const handleMinimize = (transactionId, isMinimized) => {
    setActiveChats((prev) =>
      prev.map((c) =>
        c.transactionId === transactionId
          ? { ...c, isMinimized, lastFocusedAt: Date.now() }
          : c
      )
    );
    if (isMinimized && focusedChatId === transactionId) {
      setFocusedChatId(null);
    } else if (!isMinimized) {
      setFocusedChatId(transactionId);
    }
  };

  const handleClose = (transactionId) => {
    setActiveChats((prev) => prev.filter((c) => c.transactionId !== transactionId));
    if (focusedChatId === transactionId) {
      setFocusedChatId(null);
    }
  };

  return (
    <div className="fixed bottom-0 right-4 z-[100] flex flex-row-reverse items-end gap-4 pointer-events-none">
      {activeChats.map((chat, index) => (
        <div key={chat.transactionId} className="pointer-events-auto">
          <SingleChatbox
            chat={chat}
            index={index}
            isFocused={focusedChatId === chat.transactionId}
            onFocus={() => handleFocus(chat.transactionId)}
            onMinimize={(minVal) => handleMinimize(chat.transactionId, minVal)}
            onClose={() => handleClose(chat.transactionId)}
          />
        </div>
      ))}
    </div>
  );
}

function SingleChatbox({ chat, index, isFocused, onFocus, onMinimize, onClose }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [txDetails, setTxDetails] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const sendingRef = useRef(false);

  const currentUserId = localStorage.getItem(STORAGE_KEYS.TOKEN)
    ? JSON.parse(atob(localStorage.getItem(STORAGE_KEYS.TOKEN).split(".")[1])).id
    : null;
  const myProfilePic = localStorage.getItem("userProfilePic") || "";
  const myName = localStorage.getItem("user_name") || "Me";

  const socket = getSocket();

  // Stable handler refs for socket listeners
  const handleNewMessageRef = useRef(null);
  const handleMessagesReadRef = useRef(null);
  const handleUnreadCountRef = useRef(null);
  const handleTypingRef = useRef(null);

  // Fetch populated transaction details
  const fetchTxDetails = useCallback(async () => {
    try {
      const res = await API.get(`/rent/transactions/${chat.transactionId}`);
      setTxDetails(res.data);
    } catch (err) {
      console.error("Error fetching transaction details in chatbox:", err);
    }
  }, [chat.transactionId]);

  useEffect(() => {
    fetchTxDetails();
  }, [fetchTxDetails]);

  const resolvedProductTitle = txDetails?.product?.title || chat.productTitle || "Negotiation Chat";
  const isOwner = String(txDetails?.owner?._id || txDetails?.owner) === String(currentUserId);
  const resolvedOtherUser = txDetails
    ? (isOwner ? txDetails.borrower : txDetails.owner)
    : chat.otherUser;

  // Fetch messages via REST with merge+dedup to prevent race-condition loss
  const fetchMessages = useCallback(async () => {
    try {
      const res = await API.get(`/rent/chat/${chat.transactionId}`);
      const historyMessages = res.data;

      setMessages((prev) => {
        const existingIds = new Set();
        prev.forEach((msg) => existingIds.add(msg._id));

        const newFromHistory = historyMessages.filter(
          (msg) => !existingIds.has(msg._id)
        );

        const merged = [...prev, ...newFromHistory];
        merged.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        return merged;
      });
    } catch (err) {
      console.error("Error fetching messages in chatbox:", err);
    }
    // Refresh tx status on every poll cycle
    try {
      const txRes = await API.get(`/rent/transactions/${chat.transactionId}`);
      setTxDetails(txRes.data);
    } catch (err) {
      // non-fatal
    }
  }, [chat.transactionId]);

  // ── Socket event registration ────────────────────────────────────────────

  useEffect(() => {
    if (!socket || !chat.transactionId) return;

    // ── chat:new_message handler ──────────────────────────────────────────
    const handleNewMessage = (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) {
          return prev; // Defensive dedup
        }

        const updated = [...prev, message];
        updated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return updated;
      });
    };

    // ── chat:messages_read handler ────────────────────────────────────────
    const handleMessagesRead = ({ transactionId }) => {
      if (String(transactionId) !== String(chat.transactionId)) return;

      setMessages((prev) =>
        prev.map((msg) => {
          const isMe = String(msg.sender?._id || msg.sender) === String(currentUserId);
          if (!isMe && msg.readStatus === false) {
            return { ...msg, readStatus: true };
          }
          return msg;
        })
      );
    };

    // ── chat:unread_count_updated handler ─────────────────────────────────
    const handleUnreadCountUpdated = () => {
      window.dispatchEvent(new Event("refreshUnreadChatCount"));
    };

    // ── chat:typing handler ───────────────────────────────────────────────
    const handleTyping = ({ userId, isTyping }) => {
      // Could be extended to show typing indicator in UI
      // Currently no-op to keep implementation minimal
    };

    // Store stable refs
    handleNewMessageRef.current = handleNewMessage;
    handleMessagesReadRef.current = handleMessagesRead;
    handleUnreadCountRef.current = handleUnreadCountUpdated;
    handleTypingRef.current = handleTyping;

    socket.on("chat:new_message", handleNewMessage);
    socket.on("chat:messages_read", handleMessagesRead);
    socket.on("chat:unread_count_updated", handleUnreadCountUpdated);
    socket.on("chat:typing", handleTyping);

    return () => {
      socket.off("chat:new_message", handleNewMessage);
      socket.off("chat:messages_read", handleMessagesRead);
      socket.off("chat:unread_count_updated", handleUnreadCountUpdated);
      socket.off("chat:typing", handleTyping);
      handleNewMessageRef.current = null;
      handleMessagesReadRef.current = null;
      handleUnreadCountRef.current = null;
      handleTypingRef.current = null;
    };
  }, [socket, chat.transactionId, currentUserId]);

  // ── Room join/leave on transaction change ────────────────────────────────

  useEffect(() => {
    if (!socket || !chat.transactionId) return;

    // Join the transaction room
    socket.emit("chat:join", { transactionId: chat.transactionId });

    // If chat is focused and not minimized, set active and mark read
    if (isFocused && !chat.isMinimized) {
      socket.emit("chat:set_active", { transactionId: chat.transactionId });
      socket.emit("chat:mark_read", { transactionId: chat.transactionId });
    }

    return () => {
      socket.emit("chat:leave", { transactionId: chat.transactionId });
    };
  }, [chat.transactionId, socket, isFocused, chat.isMinimized]);

  // ── Reconnect room restoration ──────────────────────────────────────────

  useEffect(() => {
    if (!socket || !chat.transactionId) return;

    const handleConnect = () => {
      const currentTxId = chat.transactionId;
      const isChatVisible = !chat.isMinimized && isFocused;

      socket.emit("chat:join", { transactionId: currentTxId }, (response) => {
        if (response?.success) {
          // Re-fetch messages to catch any missed during disconnect
          fetchMessages();

          if (isChatVisible) {
            socket.emit("chat:set_active", { transactionId: currentTxId });
            socket.emit("chat:mark_read", { transactionId: currentTxId });
          }
        }
      });
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket, chat.transactionId, chat.isMinimized, isFocused, fetchMessages]);

  // ── Active state management ──────────────────────────────────────────────

  useEffect(() => {
    if (!socket || !chat.transactionId) return;

    if (isFocused && !chat.isMinimized) {
      socket.emit("chat:set_active", { transactionId: chat.transactionId });
    } else {
      socket.emit("chat:clear_active");
    }
  }, [socket, chat.transactionId, isFocused, chat.isMinimized]);

  // ── REST history polling (kept for history reload, reduced frequency) ────

  useEffect(() => {
    if (chat.isMinimized) return;

    fetchMessages();
    const interval = setInterval(fetchMessages, 8000); // Reduced from 4s since we have socket
    return () => clearInterval(interval);
  }, [chat.transactionId, chat.isMinimized, fetchMessages]);

  // ── Transaction notification clearing ────────────────────────────────────

  useEffect(() => {
    if (!chat.transactionId || chat.isMinimized) return;
    const clearNotifications = async () => {
      try {
        await API.post(`/rent/notifications/transaction/${chat.transactionId}/read`);
        window.dispatchEvent(new Event("refreshNotificationCount"));
      } catch (err) {
        console.error("Error clearing transaction notifications:", err);
      }
    };
    clearNotifications();
  }, [chat.transactionId, chat.isMinimized]);

  // ── Mark messages as read when focused and unread messages exist ──────────

  useEffect(() => {
    if (isFocused && !chat.isMinimized && messages.length > 0) {
      const hasUnread = messages.some((msg) => {
        const isMe = String(msg.sender?._id || msg.sender) === String(currentUserId);
        return !isMe && !msg.readStatus;
      });
      if (hasUnread) {
        socket?.emit("chat:mark_read", { transactionId: chat.transactionId });
      }
    }
  }, [isFocused, chat.isMinimized, messages, socket, chat.transactionId, currentUserId]);

  // ── Smart Auto-Scroll ────────────────────────────────────────────────────

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    const lastMsg = messages[messages.length - 1];
    const isSentByMe = lastMsg && (lastMsg.sender === currentUserId || lastMsg.sender?._id === currentUserId);

    if (isNearBottom || isSentByMe || messages.length <= 2) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chat.isMinimized, currentUserId]);

  // ── Send message (NO optimistic insertion) ────────────────────────────────

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();

    // Synchronous double-send guard
    if (sendingRef.current) return;

    const textToSend = inputMessage.trim();
    if (!textToSend || !chat.transactionId || !resolvedOtherUser?._id) return;

    sendingRef.current = true;
    setSending(true);

    try {
      const currentSocket = getSocket();

      await new Promise((resolve, reject) => {
        if (!currentSocket || currentSocket.connected !== true) {
          return reject(new Error("Socket not connected"));
        }

        currentSocket.emit(
          "chat:send_message",
          {
            transactionId: chat.transactionId,
            content: textToSend,
          },
          (response) => {
            if (response?.success) {
              resolve(response);
            } else {
              reject(new Error(response?.error || "Failed to send message"));
            }
          }
        );
      });

      // Success: clear input
      setInputMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
      // Keep input text on error so user can retry
      setInputMessage(textToSend);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const handleResolveNegotiation = async (action) => {
    try {
      await API.post(`/rent/negotiate/${chat.transactionId}/resolve`, { action });
      // Re-fetch immediately so both parties' chatboxes update without waiting for next poll
      await fetchTxDetails();
      window.dispatchEvent(new Event("refreshNotificationCount"));
    } catch (err) {
      console.error("Error resolving negotiation in chat:", err);
    }
  };

  return (
    <div
      onClick={onFocus}
      className={`w-80 bg-white dark:bg-zinc-950 border rounded-t-2xl shadow-[0_-5px_25px_rgba(0,0,0,0.15)] flex flex-col transition-all duration-300 ${
        isFocused 
          ? "border-indigo-500 ring-2 ring-indigo-500/20" 
          : "border-slate-300 dark:border-zinc-850"
      }`}
      style={{
        height: chat.isMinimized ? "48px" : "400px",
        fontFamily: "'Nunito', 'Poppins', sans-serif",
      }}
    >
      {/* Header */}
      <div
        className={`h-12 px-3 flex items-center justify-between rounded-t-2xl text-white cursor-pointer transition-colors duration-250 select-none ${
          isFocused 
            ? "bg-gradient-to-r from-indigo-600 to-violet-600" 
            : "bg-slate-500 dark:bg-zinc-800"
        }`}
        onClick={() => onMinimize(!chat.isMinimized)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0">
            {resolvedOtherUser?.profilePic ? (
              <img src={resolvedOtherUser.profilePic} alt={resolvedOtherUser.name} className="w-full h-full object-cover" />
            ) : (
              resolvedOtherUser?.name ? resolvedOtherUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : <User className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black truncate">{resolvedOtherUser?.name || "Chat"}</span>
            <span className="text-[9px] text-white/85 truncate font-extrabold line-clamp-1">{resolvedProductTitle}</span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onMinimize(!chat.isMinimized)}
            className="w-5 h-5 flex items-center justify-center hover:bg-white/15 rounded cursor-pointer text-xs font-extrabold focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none"
            title={chat.isMinimized ? "Expand" : "Minimize"}
          >
            {chat.isMinimized ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center hover:bg-white/15 rounded cursor-pointer text-xs font-extrabold focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Message Area */}
      {!chat.isMinimized && (
        <>
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 flex flex-col bg-slate-50/50 dark:bg-zinc-950/80"
          >
            {/* Negotiation Subtext Banner & Actions */}
            {txDetails?.status === "RETRACTED" ? (
              <div className="text-center py-2 px-3 bg-red-50 dark:bg-red-950/10 border border-red-100/30 dark:border-red-900/30 rounded-xl m-1 animate-fadeIn">
                <span className="text-[10px] uppercase font-black tracking-wider text-red-600 dark:text-red-400 block leading-tight">
                  This listing was withdrawn by the owner.
                </span>
                <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 block mt-0.5">
                  This transaction has been closed.
                </span>
              </div>
            ) : (
              <div className="text-center py-2 px-3 bg-indigo-50 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/30 rounded-xl">
                <span className="text-[10px] uppercase font-black tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  Negotiate price for the product
                </span>
                {txDetails?.status === "PENDING_NEGOTIATION" && (
                  isOwner ? (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleResolveNegotiation("ACCEPT")}
                        className="flex-1 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black tracking-wide shadow transition-all active:scale-95 cursor-pointer text-center"
                      >
                        Accept Offer
                      </button>
                      <button
                        onClick={() => handleResolveNegotiation("REJECT")}
                        className="flex-1 py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-black tracking-wide shadow transition-all active:scale-95 cursor-pointer text-center"
                      >
                        Reject Offer
                      </button>
                    </div>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 block mt-1">
                      Waiting for owner to accept or reject your offer...
                    </span>
                  )
                )}
                {txDetails?.status === "AWAITING_PAYMENT" && (
                  !isOwner ? (
                    <button
                      onClick={() => navigate(`/rent/checkout/${chat.transactionId}`)}
                      className="w-full py-1 px-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[9px] font-black tracking-wide shadow transition-all active:scale-95 cursor-pointer text-center mt-2"
                    >
                      Proceed to Checkout →
                    </button>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 block mt-1">
                      Waiting for borrower payment checkout...
                    </span>
                  )
                )}
                {txDetails?.status === "RESERVED" && (
                  <span className="text-[9px] font-bold text-emerald-500 block mt-1">
                    ✓ Payment secured. Check your Orders panel for OTP handoff.
                  </span>
                )}
                {txDetails?.status === "NEGOTIATION_DECLINED" && (
                  <span className="text-[9px] font-bold text-red-400 block mt-1">
                    Offer rejected. This negotiation is closed.
                  </span>
                )}
              </div>
            )}

            {/* Message Thread */}
            {messages.map((msg) => {
              const isMe = String(msg.sender?._id || msg.sender) === String(currentUserId);

              return (
                <div
                  key={msg._id}
                  className={`flex items-end gap-2 max-w-[85%] ${
                    isMe ? "self-end" : "self-start"
                  }`}
                >
                  {/* Message Bubble */}
                  <div
                    className={`p-2.5 rounded-2xl text-xs leading-normal font-semibold shadow-sm ${
                      isMe
                        ? "bg-indigo-500 text-white rounded-br-none"
                        : "bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700/60 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-2 border-t border-slate-200/80 dark:border-zinc-850 flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-900"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onFocus={onFocus}
              disabled={txDetails?.status === "RETRACTED" || !txDetails || sending}
              placeholder={!txDetails? "Loading chat...": txDetails?.status === "RETRACTED"? "Transaction is inactive": "Type a message..."}
              className="flex-1 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 focus:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500/30 outline-none rounded-2xl py-1.5 px-3.5 text-xs font-semibold text-slate-800 dark:text-white placeholder-[#9CA3AF] disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={txDetails?.status === "RETRACTED" || !resolvedOtherUser?._id || sending}
              className="w-7 h-7 flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white rounded-full cursor-pointer transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}