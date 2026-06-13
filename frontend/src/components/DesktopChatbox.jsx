import React, { useState, useEffect, useRef } from "react";
import API from "../api";

export default function DesktopChatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [productTitle, setProductTitle] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  const currentUserId = localStorage.getItem("token") 
    ? JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id 
    : null;
  const myProfilePic = localStorage.getItem("userProfilePic") || "";
  const myName = localStorage.getItem("user_name") || "Me";

  // Listen to open event
  useEffect(() => {
    const handleOpen = (e) => {
      const { transactionId, otherUser, productTitle } = e.detail;
      setTransactionId(transactionId);
      setOtherUser(otherUser);
      setProductTitle(productTitle);
      setIsOpen(true);
      setIsMinimized(false);
      setInputMessage("");
      setMessages([]);
    };

    window.addEventListener("openChatbox", handleOpen);
    return () => window.removeEventListener("openChatbox", handleOpen);
  }, []);

  // Sync / Poll messages
  const fetchMessages = async () => {
    if (!transactionId) return;
    try {
      const res = await API.get(`/rent/chat/${transactionId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching chat messages:", err);
    }
  };

  useEffect(() => {
    if (isOpen && !isMinimized && transactionId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, isMinimized, transactionId]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isMinimized]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !transactionId || !otherUser) return;

    try {
      const payload = {
        receiverId: otherUser._id,
        content: inputMessage.trim(),
      };
      const res = await API.post(`/rent/chat/${transactionId}`, payload);
      setMessages((prev) => [...prev, res.data]);
      setInputMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-0 right-4 z-[100] w-80 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-t-2xl shadow-[0_-5px_25px_rgba(0,0,0,0.15)] flex flex-col transition-all duration-300"
      style={{
        height: isMinimized ? "48px" : "400px",
        fontFamily: "'Nunito', 'Poppins', sans-serif",
      }}
    >
      {/* Header */}
      <div className="h-12 px-3 border-b border-slate-100 dark:border-zinc-850 flex items-center justify-between bg-indigo-600 rounded-t-2xl text-white">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0">
            {otherUser?.profilePic ? (
              <img src={otherUser.profilePic} alt={otherUser.name} className="w-full h-full object-cover" />
            ) : (
              otherUser?.name ? otherUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "👤"
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black truncate">{otherUser?.name || "Chat"}</span>
            <span className="text-[9px] text-indigo-200 truncate font-semibold line-clamp-1">{productTitle}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded cursor-pointer text-sm"
            title="Minimize"
          >
            ➖
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded cursor-pointer text-sm"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Message Area */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 flex flex-col bg-slate-50 dark:bg-zinc-900/40">
            {/* Negotiation Subtext Banner */}
            <div className="text-center py-2 px-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/30 rounded-xl">
              <span className="text-[10px] uppercase font-black tracking-wider text-indigo-500 block">
                negotiate price for the product text
              </span>
            </div>

            {/* Message Thread */}
            {messages.map((msg) => {
              const isMe = msg.sender?._id === currentUserId || msg.sender === currentUserId;
              const senderPic = isMe ? myProfilePic : otherUser?.profilePic;
              const senderName = isMe ? myName : otherUser?.name;

              return (
                <div
                  key={msg._id}
                  className={`flex items-end gap-2 max-w-[85%] ${
                    isMe ? "self-end flex-row-reverse" : "self-start"
                  }`}
                >
                  {/* Circle DP */}
                  <div className="w-6 h-6 rounded-full bg-[#374151] flex-shrink-0 flex items-center justify-center overflow-hidden text-[9px] font-black text-white">
                    {senderPic ? (
                      <img src={senderPic} alt={senderName} className="w-full h-full object-cover" />
                    ) : (
                      senderName ? senderName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "👤"
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-2.5 rounded-2xl text-xs leading-normal font-semibold shadow-sm ${
                      isMe
                        ? "bg-[#7C3AED] text-white rounded-br-none"
                        : "bg-[#374151] text-white rounded-bl-none"
                    }`}
                  >
                    <p className="text-white">{msg.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Facebook-style footer input */}
          <form
            onSubmit={handleSendMessage}
            className="p-2 border-t border-slate-100 dark:border-zinc-850 flex items-center gap-1.5 bg-white dark:bg-zinc-950"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-slate-100 dark:bg-zinc-850 focus:bg-white dark:focus:bg-zinc-900 border border-transparent focus:border-slate-200 dark:focus:border-zinc-800 outline-none rounded-2xl py-1.5 px-3.5 text-xs font-semibold text-slate-800 dark:text-white placeholder-[#9CA3AF]"
            />
            <button
              type="submit"
              className="w-7 h-7 flex items-center justify-center bg-[#7C3AED] hover:bg-indigo-700 text-white rounded-full cursor-pointer transition-colors shadow-sm"
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
