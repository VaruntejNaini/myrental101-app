import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import API from "../api";

export default function ChatDrawer({ isOpen, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTx, setActiveTx] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  const currentUserId = localStorage.getItem("token") 
    ? JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id 
    : null;
  const myProfilePic = localStorage.getItem("userProfilePic") || "";
  const myName = localStorage.getItem("user_name") || "Me";

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await API.get("/rent/transactions");
      setTransactions(res.data);
    } catch (err) {
      console.error("Error fetching transactions for chats:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync / Poll messages inside the drawer when a thread is active
  const fetchMessages = async () => {
    if (!activeTx) return;
    try {
      const res = await API.get(`/rent/chat/${activeTx._id}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching chat messages in drawer:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setActiveTx(null);
      setMessages([]);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTx) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeTx]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTx]);

  const handleThreadClick = (tx) => {
    setActiveTx(tx);
    setMessages([]);
    setInputMessage("");
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !activeTx) return;

    const isOwner = activeTx.owner?._id === currentUserId;
    const otherUser = isOwner ? activeTx.borrower : activeTx.owner;
    if (!otherUser) return;

    try {
      const payload = {
        receiverId: otherUser._id,
        content: inputMessage.trim(),
      };
      const res = await API.post(`/rent/chat/${activeTx._id}`, payload);
      setMessages((prev) => [...prev, res.data]);
      setInputMessage("");
    } catch (err) {
      console.error("Failed to send message in drawer:", err);
    }
  };

  if (!isOpen) return null;

  const activeOtherUser = activeTx
    ? (activeTx.owner?._id === currentUserId ? activeTx.borrower : activeTx.owner)
    : null;

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
          {activeTx ? (
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setActiveTx(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-white font-black text-lg p-2 rounded-xl border border-gray-200 dark:border-zinc-700 cursor-pointer flex items-center justify-center w-9 h-9"
                title="Back to Chats"
              >
                ←
              </button>
              <div className="w-10 h-10 rounded-full flex-shrink-0 bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-extrabold text-sm border border-indigo-500/20 overflow-hidden">
                {activeOtherUser?.profilePic ? (
                  <img src={activeOtherUser.profilePic} alt={activeOtherUser.name} className="w-full h-full object-cover" />
                ) : (
                  activeOtherUser?.name ? activeOtherUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "👤"
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black text-slate-800 dark:text-white truncate">
                  {activeOtherUser?.name}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-450 truncate font-bold">
                  Regarding: <span className="text-indigo-500 font-black">{activeTx.product?.title || "Item"}</span>
                </span>
              </div>
            </div>
          ) : (
            <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              💬 Messages
            </h2>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-white font-black text-lg p-2 rounded-xl border border-gray-200 dark:border-zinc-700 cursor-pointer w-9 h-9 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Content View */}
        {!activeTx ? (
          /* Thread Selection State (List of chats) */
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-zinc-900">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-2">
                <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                <p className="text-xs text-slate-450 font-bold">Syncing conversations...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-zinc-600 space-y-3">
                <span className="text-5xl">💬</span>
                <p className="text-sm font-extrabold">No active chats</p>
                <p className="text-xs text-center max-w-[240px] leading-relaxed text-slate-450">
                  Start a rental proposal or buyout request to initiate chat channels.
                </p>
              </div>
            ) : (
              transactions.map((tx) => {
                const isOwner = tx.owner?._id === currentUserId;
                const otherUser = isOwner ? tx.borrower : tx.owner;
                if (!otherUser) return null;

                return (
                  <div
                    key={tx._id}
                    onClick={() => handleThreadClick(tx)}
                    className="p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500/50 bg-slate-50/50 dark:bg-zinc-850 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 cursor-pointer transition-all duration-200 flex items-center gap-3.5"
                  >
                    {/* User Profile Avatar */}
                    <div className="w-11 h-11 rounded-full flex-shrink-0 bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-extrabold text-sm border border-indigo-500/20 overflow-hidden">
                      {otherUser.profilePic ? (
                        <img src={otherUser.profilePic} alt={otherUser.name} className="w-full h-full object-cover" />
                      ) : (
                        otherUser.name ? otherUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "👤"
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-sm font-black text-slate-800 dark:text-zinc-150 truncate">
                          {otherUser.name}
                        </h4>
                        <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider">
                          {tx.product?.productType === "SECOND_HAND" ? "Buyout" : "Rent"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-400 truncate mt-0.5 font-bold">
                        Regarding: <span className="text-indigo-400 font-extrabold">{tx.product?.title || "Item"}</span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Active Chat State (WhatsApp/Reddit Conversation View inside Drawer) */
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col bg-zinc-900">  
              {/* Negotiation Subtext Banner */}
              <div className="text-center py-2 px-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/30 rounded-xl">
                <span className="text-[10px] uppercase font-black tracking-wider text-indigo-500 block">
                  negotiate price for the product text
                </span>
              </div>

              {/* Message Bubbles */}
              {messages.map((msg) => {
                const isMe = msg.sender?._id === currentUserId || msg.sender === currentUserId;
                const senderPic = isMe ? myProfilePic : activeOtherUser?.profilePic;
                const senderName = isMe ? myName : activeOtherUser?.name;

                return (
                  <div
                    key={msg._id}
                    className={`flex items-end gap-2 max-w-[85%] ${
                      isMe ? "self-end flex-row-reverse" : "self-start"
                    }`}
                  >
                    {/* Circle Avatar */}
                    <div className="w-8 h-8 rounded-full bg-slate-300 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-400/20 text-xs font-black text-slate-600">
                      {senderPic ? (
                        <img src={senderPic} alt={senderName} className="w-full h-full object-cover" />
                      ) : (
                        senderName ? senderName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "👤"
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed font-semibold shadow-sm ${
                       isMe
                          ? "bg-violet-600 text-white rounded-br-none"
                          : "bg-zinc-700 text-white border border-zinc-600 rounded-bl-none"
}`}
                    >
                      <p className="whitespace-pre-wrap text-white">
  {msg.content}
</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-slate-100 dark:border-zinc-850 flex items-center gap-2 bg-white dark:bg-zinc-900"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-zinc-800 focus:bg-zinc-800 border border-zinc-700 focus:border-violet-500 outline-none rounded-2xl py-2 px-4 text-sm font-medium text-white placeholder:text-zinc-400 transition-colors"/>
              <button
                type="submit"
                className="w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full cursor-pointer transition-colors shadow-md text-sm"
                title="Send Message"
              >
                ➔
              </button>
            </form>
          </>
        )}
      </div>
    </>,
    document.body
  );
}

