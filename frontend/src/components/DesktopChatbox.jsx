import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { STORAGE_KEYS } from "../constants/auth";

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
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const currentUserId = localStorage.getItem(STORAGE_KEYS.TOKEN)
    ? JSON.parse(atob(localStorage.getItem(STORAGE_KEYS.TOKEN).split(".")[1])).id
    : null;
  const myProfilePic = localStorage.getItem("userProfilePic") || "";
  const myName = localStorage.getItem("user_name") || "Me";

  // Fetch populated transaction details from backend for robust header info
  useEffect(() => {
    const fetchTxDetails = async () => {
      try {
        const res = await API.get(`/rent/transactions/${chat.transactionId}`);
        setTxDetails(res.data);
      } catch (err) {
        console.error("Error fetching transaction details in chatbox:", err);
      }
    };
    fetchTxDetails();
  }, [chat.transactionId]);

  const resolvedProductTitle = txDetails?.product?.title || chat.productTitle || "Negotiation Chat";
  const isOwner = txDetails?.owner?._id === currentUserId || txDetails?.owner === currentUserId;
  const resolvedOtherUser = txDetails
    ? (isOwner ? txDetails.borrower : txDetails.owner)
    : chat.otherUser;

  // Poll chat messages
  const fetchMessages = async () => {
    try {
      const res = await API.get(`/rent/chat/${chat.transactionId}`);
      setMessages((prev) => {
        // Retain optimistic messages that haven't been replaced yet
        const optimisticMsgs = prev.filter((m) => m.isOptimistic);
        
        // Remove duplicate optimistic messages if the actual message has arrived
        const filteredOptimistic = optimisticMsgs.filter(
          (opt) => !res.data.some((real) => real.content === opt.content && real.sender === opt.sender)
        );
        
        return [...res.data, ...filteredOptimistic];
      });
    } catch (err) {
      console.error("Error fetching messages in chatbox:", err);
    }
  };

  useEffect(() => {
    if (!chat.isMinimized) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [chat.transactionId, chat.isMinimized]);

  // Clear any transaction-level notifications when entering/opening a thread
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

  // Read message triggers: mark thread as read when focused and unread messages from other user exist
  const handleMarkAsRead = async () => {
    try {
      await API.post(`/rent/chat/${chat.transactionId}/read`);
      // Dispatch global unread count update for navbar ChatBell
      window.dispatchEvent(new Event("refreshUnreadChatCount"));
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  useEffect(() => {
    if (isFocused && !chat.isMinimized && messages.length > 0) {
      const hasUnread = messages.some((msg) => {
        const isMe = msg.sender === currentUserId || msg.sender?._id === currentUserId;
        return !isMe && !msg.readStatus;
      });
      if (hasUnread) {
        handleMarkAsRead();
      }
    }
  }, [isFocused, chat.isMinimized, messages]);

  // Smart Auto-Scroll: Auto-scroll only when user is already near bottom or last message is from me
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    const lastMsg = messages[messages.length - 1];
    const isSentByMe = lastMsg && (lastMsg.sender === currentUserId || lastMsg.sender?._id === currentUserId);

    if (isNearBottom || isSentByMe || messages.length <= 2) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chat.isMinimized]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const textToSend = inputMessage.trim();
    if (!textToSend || !chat.transactionId || !resolvedOtherUser) return;

    // Optimistic message update
    const tempId = `optimistic_${Date.now()}`;
    const tempMsg = {
      _id: tempId,
      sender: currentUserId,
      receiver: resolvedOtherUser._id,
      content: textToSend,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInputMessage("");

    try {
      const payload = {
        receiverId: resolvedOtherUser._id,
        content: textToSend,
      };
      const res = await API.post(`/rent/chat/${chat.transactionId}`, payload);
      
      // Replace optimistic message with actual backend response
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? res.data : m))
      );

      // Trigger unread count sync
      window.dispatchEvent(new Event("refreshUnreadChatCount"));
    } catch (err) {
      console.error("Failed to send message optimistically:", err);
      // Rollback optimistic message on error
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setInputMessage(textToSend); // Restore user input
    }
  };

  const handleResolveNegotiation = async (action) => {
    try {
      const res = await API.post(`/rent/negotiate/${chat.transactionId}/resolve`, { action });
      setTxDetails(res.data);
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
              resolvedOtherUser?.name ? resolvedOtherUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "👤"
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
            {chat.isMinimized ? "➕" : "➖"}
          </button>
          <button
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center hover:bg-white/15 rounded cursor-pointer text-xs font-extrabold focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none"
            title="Close"
          >
            ✕
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
                      Proceed to Checkout
                    </button>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 block mt-1">
                      Waiting for borrower payment checkout...
                    </span>
                  )
                )}
              </div>
            )}

            {/* Message Thread */}
            {messages.map((msg) => {
              const isMe = msg.sender === currentUserId || msg.sender?._id === currentUserId;

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
              disabled={txDetails?.status === "RETRACTED"}
              placeholder={txDetails?.status === "RETRACTED" ? "Transaction is inactive" : "Type a message..."}
              className="flex-1 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 focus:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500/30 outline-none rounded-2xl py-1.5 px-3.5 text-xs font-semibold text-slate-800 dark:text-white placeholder-[#9CA3AF] disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={txDetails?.status === "RETRACTED"}
              className="w-7 h-7 flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white rounded-full cursor-pointer transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send"
            >
              ➔
            </button>
          </form>
        </>
      )}
    </div>
  );
}
