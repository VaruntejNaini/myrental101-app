import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { STORAGE_KEYS } from "../constants/auth";

export default function MyOrders() {
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");
  const [showNotification, setShowNotification] = useState("");

  // current logged-in user id — used to split renting vs lending
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userName, setUserName] = useState(() => localStorage.getItem("user_name") || "");

  // Two segregated lists
  const [rentingItems, setRentingItems] = useState([]);   // I am the borrower
  const [lendingItems, setLendingItems] = useState([]);   // I am the owner

  // OTP verify input mapped by txId (owner uses this to type in the code)
  const [verifyOtpInput, setVerifyOtpInput] = useState({});

  // Chat context maps
  const [chats, setChats] = useState({});
  const [chatInputs, setChatInputs] = useState({});

  // Damage reporting
  const [damageReports, setDamageReports] = useState({});
  const [claimAmounts, setClaimAmounts] = useState({});

  // Dispute messages
  const [disputeInputs, setDisputeInputs] = useState({});

  const triggerToast = (msg) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(""), 4000);
  };

  // Fetch current user id + split transactions into renting / lending
  const syncRentals = (uid) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) return;

    API.get("/rent/transactions")
      .then((res) => {
        if (!res.data || res.data.length === 0) return;

        const userId = uid || currentUserId;
        const mapped = res.data.map(tx => ({
          _id: tx._id,
          title: tx.product ? tx.product.title : "Deleted Listing",
          productType: tx.product?.productType || "RENT",
          rate: tx.product?.productType === "SECOND_HAND"
            ? `₹${tx.totalPaid} (buyout)`
            : `₹${tx.dailyRate}/day`,
          status: tx.status,
          startDate: new Date(tx.startDate).toLocaleDateString([], { month: "short", day: "numeric" }),
          endDate: new Date(tx.endDate).toLocaleDateString([], { month: "short", day: "numeric" }),
          borrower: tx.borrower || { name: "Borrower" },
          owner: tx.owner || { name: "Owner" },
          totalPaid: tx.totalPaid,
          securityDeposit: tx.securityDeposit,
          damageReport: tx.damageReport,
          claimAmount: tx.claimAmount,
          claimStatus: tx.claimStatus,
          disputeReason: tx.disputeReason,
        }));

        const borrowerId = (uid || currentUserId)?.toString();
        setRentingItems(mapped.filter(tx => tx.borrower?._id?.toString() === borrowerId));
        setLendingItems(mapped.filter(tx => tx.owner?._id?.toString() === borrowerId));
      })
      .catch(err => console.error("Error fetching transactions:", err));
  };

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) return;
    API.get("/auth/me")
      .then(res => {
        const uid = res.data?._id;
        if (res.data?.name) {
          setUserName(res.data.name);
          localStorage.setItem("user_name", res.data.name);
        }
        setCurrentUserId(uid);
        syncRentals(uid);
      })
      .catch(err => console.error("Error loading profile:", err));
  }, []);

  const handleGenerateOtp = async (txId, type) => {
    try {
      const res = await API.post(`/rent/transaction/${txId}/generate-otp`, { otpType: type });
      const expiryTime = res.data.expiry
        ? new Date(res.data.expiry).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "10 minutes";
      triggerToast(
        type === "HANDOFF"
          ? `Handoff OTP sent to your 🔔 notifications. Show it to the owner. Expires at ${expiryTime}.`
          : `Return OTP sent to your 🔔 notifications. Show it to the owner. Expires at ${expiryTime}.`
      );
      window.dispatchEvent(new Event("refreshNotificationCount"));
    } catch (err) {
      triggerToast(err.response?.data?.msg || "Failed to generate OTP");
    }
  };

  // Helper to update status in the correct list
  const updateTxStatus = (txId, newStatus, isBorrower) => {
    if (isBorrower) {
      setRentingItems(prev => prev.map(r => r._id === txId ? { ...r, status: newStatus } : r));
    } else {
      setLendingItems(prev => prev.map(r => r._id === txId ? { ...r, status: newStatus } : r));
    }
  };

  const handleVerifyOtp = async (txId, type, isBorrower = false) => {
    const inputOtp = verifyOtpInput[txId];
    if (!inputOtp) return;
    try {
      if (type === "HANDOFF") {
        await API.post(`/rent/transaction/${txId}/verify-handoff`, { otp: inputOtp });
        triggerToast("Handoff verified! Rental is now active.");
        updateTxStatus(txId, "IN_POSSESSION", isBorrower);
      } else {
        await API.post(`/rent/transaction/${txId}/verify-return`, { otp: inputOtp, reportDamage: false });
        triggerToast("Return verified! Escrow deposit released.");
        updateTxStatus(txId, "SETTLED", isBorrower);
      }
      setVerifyOtpInput(prev => ({ ...prev, [txId]: "" }));
    } catch (err) {
      triggerToast(err.response?.data?.msg || "Verification failed");
    }
  };

  const handleInitiateReturn = async (txId) => {
    try {
      await API.post(`/rent/transaction/${txId}/initiate-return`);
      triggerToast("Return initiated. Generate your return OTP to proceed.");
      setRentingItems(prev => prev.map(r => r._id === txId ? { ...r, status: "RETURN_INITIATED" } : r));
    } catch (err) {
      triggerToast(err.response?.data?.msg || "Failed to initiate return");
    }
  };

  const handleReportDamage = async (txId) => {
    const report = damageReports[txId];
    const claim = claimAmounts[txId];
    if (!report || !claim) {
      triggerToast("Please enter damage details and claim amount");
      return;
    }
    try {
      const otp = verifyOtpInput[txId];
      await API.post(`/rent/transaction/${txId}/verify-return`, {
        otp,
        reportDamage: true,
        damageReport: report,
        claimAmount: Number(claim),
      });
      triggerToast("Damage claim submitted. Status moved to DAMAGE_REVIEW.");
      setLendingItems(prev => prev.map(r => r._id === txId ? { ...r, status: "DAMAGE_REVIEW" } : r));
    } catch (err) {
      triggerToast(err.response?.data?.msg || "Failed to submit damage report");
    }
  };

  const handleRaiseDispute = async (txId) => {
    const reason = disputeInputs[txId];
    if (!reason) return;
    try {
      await API.post(`/rent/transaction/${txId}/dispute`, { disputeReason: reason });
      triggerToast("Transaction flagged as DISPUTED. Admin team notified.");
      setRentingItems(prev => prev.map(r => r._id === txId ? { ...r, status: "DISPUTED" } : r));
    } catch (err) {
      triggerToast(err.response?.data?.msg || "Failed to flag dispute");
    }
  };

  const handleCancelRequest = async (txId, isBorrower) => {
    try {
      await API.post(`/rent/transaction/${txId}/cancel`);
      triggerToast("Request cancelled successfully. -3 reputation deducted.");
      updateTxStatus(txId, "CANCELLED_BY_BORROWER", isBorrower);
    } catch (err) {
      triggerToast(err.response?.data?.msg || "Failed to cancel request");
    }
  };

  // Messaging console helpers
  const handleLoadChat = async (txId) => {
    try {
      const res = await API.get(`/rent/chat/${txId}`);
      setChats(prev => ({ ...prev, [txId]: res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChat = async (txId, receiverId) => {
    const text = chatInputs[txId];
    if (!text) return;
    try {
      const res = await API.post(`/rent/chat/${txId}`, { receiverId, content: text });
      setChats(prev => ({ ...prev, [txId]: [...(prev[txId] || []), res.data] }));
      setChatInputs(prev => ({ ...prev, [txId]: "" }));
    } catch (err) {
      triggerToast("Failed to send message");
    }
  };

  // ─── Shared card renderer — role drives which actions appear ──────────────
  const renderCard = (rent, role) => {
    const isBorrowerRole = role === "borrower";
    const otherPartyName = isBorrowerRole ? rent.owner?.name : rent.borrower?.name;
    const otherPartyId   = isBorrowerRole ? rent.owner?._id  : rent.borrower?._id;

    return (
      <div key={rent._id} className={`p-6 rounded-3xl border ${isNight ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        {/* Card header */}
        <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-800/40 pb-4 mb-4">
          <div>
            {rent.status === "RETRACTED"
              ? <span className="text-[10px] bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/20">RETRACTED</span>
              : rent.status === "CANCELLED_BY_BORROWER"
              ? <span className="text-[10px] bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/20">CANCELLED BY {rent.productType === "SECOND_HAND" ? "BUYER" : "BORROWER"}</span>
              : rent.status === "PENDING_NEGOTIATION"
              ? <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/20">⏳ Waiting for Owner Response</span>
              : rent.status === "NEGOTIATION_DECLINED"
              ? <span className="text-[10px] bg-slate-700/30 text-slate-400 font-bold px-2 py-0.5 rounded border border-slate-700/20">Offer Declined</span>
              : <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded border border-indigo-500/20">{rent.status}</span>
            }
            {rent.productType === "SECOND_HAND" && (
              <span className="ml-2 text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/20">SALE</span>
            )}
            <h3 className="font-extrabold text-base mt-2">{rent.title}</h3>
            <p className="text-xs text-slate-400 mt-1">{rent.rate} · {rent.startDate} → {rent.endDate}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBorrowerRole ? `Owner: ${otherPartyName || "—"}` : `Borrower: ${otherPartyName || "—"}`}
            </p>
          </div>

          {/* ── BORROWER ACTIONS ── */}
          {isBorrowerRole && (
            <div className="flex gap-2 flex-wrap items-start">
              {rent.status === "PENDING_NEGOTIATION" && (
                <div className="flex gap-2 flex-wrap items-center">
                  <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl text-xs max-w-sm">
                    <p className="font-extrabold text-amber-400 mb-1">⏳ Request Sent</p>
                    <p className="text-slate-400">Waiting for the owner to accept or reject your offer. You'll be notified once they respond.</p>
                  </div>
                  <button onClick={() => handleCancelRequest(rent._id, true)} className="bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl">
                    Cancel {rent.productType === "SECOND_HAND" ? "Buy" : "Rent"} Request
                  </button>
                </div>
              )}
              {rent.status === "AWAITING_PAYMENT" && (
                <div className="flex gap-2 flex-wrap items-center">
                  <button onClick={() => navigate(`/rent/checkout/${rent._id}`)} className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl">
                    Proceed to Checkout →
                  </button>
                  <button onClick={() => handleCancelRequest(rent._id, true)} className="bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl">
                    Cancel {rent.productType === "SECOND_HAND" ? "Buy" : "Rent"} Request
                  </button>
                </div>
              )}
              {rent.status === "NEGOTIATION_DECLINED" && (
                <div className="p-3 bg-slate-700/20 border border-slate-700/30 rounded-2xl text-xs">
                  <span className="font-extrabold text-slate-400">Offer Declined</span>
                  <p className="text-slate-500 mt-1">The owner declined your offer. You can make a new request.</p>
                </div>
              )}
              {rent.status === "CANCELLED_BY_BORROWER" && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs">
                  <span className="font-extrabold text-red-400">✓ Request Cancelled</span>
                  <p className="text-slate-400 mt-1">You cancelled this {rent.productType === "SECOND_HAND" ? "purchase" : "rental"} request. -3 reputation deducted.</p>
                </div>
              )}
              {rent.status === "RESERVED" && (
                <div className="flex flex-col gap-1">
                  <button onClick={() => handleGenerateOtp(rent._id, "HANDOFF")} className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl">
                    Generate Handoff OTP
                  </button>
                  <span className="text-[9px] text-slate-500 text-center">Your code appears in 🔔 notifications</span>
                </div>
              )}
              {rent.status === "IN_POSSESSION" && (
                <button onClick={() => handleInitiateReturn(rent._id)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl">
                  Initiate Return
                </button>
              )}
              {rent.status === "RETURN_INITIATED" && (
                <div className="flex flex-col gap-1">
                  <button onClick={() => handleGenerateOtp(rent._id, "RETURN")} className="bg-violet-600 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl">
                    Generate Return OTP
                  </button>
                  <span className="text-[9px] text-slate-500 text-center">Your code appears in 🔔 notifications</span>
                </div>
              )}
              {rent.status === "DAMAGE_REVIEW" && (
                <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl w-full max-w-sm space-y-2">
                  <p className="text-[10px] text-yellow-400 font-extrabold uppercase">⚠️ Damage Claim Filed Against You</p>
                  <input type="text" placeholder="Your dispute reason" value={disputeInputs[rent._id] || ""} onChange={(e) => setDisputeInputs(prev => ({ ...prev, [rent._id]: e.target.value }))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400" />
                  <button onClick={() => handleRaiseDispute(rent._id)} className="w-full bg-yellow-600 text-white text-[10px] font-bold py-2 rounded-xl">Escalate to Dispute</button>
                </div>
              )}
              {rent.status === "DISPUTED" && <div className="p-4 bg-red-600/10 border border-red-500/20 rounded-2xl text-xs"><span className="font-extrabold text-red-500">🔒 Under Admin Review</span><p className="text-slate-400 mt-1">Escrow locked. Admin will resolve.</p></div>}
              {rent.status === "SETTLED" && <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl text-xs"><span className="font-extrabold text-emerald-500">✓ Transaction Settled</span></div>}
              {rent.status === "RETRACTED" && <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-2xl text-xs"><span className="font-extrabold text-red-400">🔴 Listing Retracted by Owner</span></div>}
            </div>
          )}

          {/* ── OWNER / LENDING ACTIONS ── */}
          {!isBorrowerRole && (
            <div className="flex gap-2 flex-wrap items-start">
              {rent.status === "PENDING_NEGOTIATION" && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl text-xs max-w-sm space-y-2">
                  <p className="font-extrabold text-amber-400">📩 New Request Received</p>
                  <p className="text-slate-400">A borrower has made an offer. Respond from the notification panel or chat.</p>
                </div>
              )}
              {rent.status === "RESERVED" && (
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1.5">
                    <input type="text" placeholder="Enter borrower's OTP" value={verifyOtpInput[rent._id] || ""} onChange={(e) => setVerifyOtpInput(prev => ({ ...prev, [rent._id]: e.target.value }))} className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs w-36 focus:outline-none text-white placeholder-slate-400" />
                    <button onClick={() => handleVerifyOtp(rent._id, "HANDOFF", false)} className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-2 rounded-xl">Confirm Handoff</button>
                  </div>
                  <span className="text-[9px] text-slate-500">Ask borrower to show their 🔔 code</span>
                </div>
              )}
              {rent.status === "RETURN_INITIATED" && (
                <div className="space-y-3 w-full max-w-sm">
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1.5">
                      <input type="text" placeholder="Enter return OTP" value={verifyOtpInput[rent._id] || ""} onChange={(e) => setVerifyOtpInput(prev => ({ ...prev, [rent._id]: e.target.value }))} className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs w-28 focus:outline-none text-white placeholder-slate-400" />
                      <button onClick={() => handleVerifyOtp(rent._id, "RETURN", false)} className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-2 rounded-xl">Clean Release</button>
                    </div>
                    <span className="text-[9px] text-slate-500">Ask borrower to show their 🔔 return code</span>
                  </div>
                  <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-red-400 uppercase">Report Damage on Inspection</span>
                    <input type="text" placeholder="Describe damage evidence" value={damageReports[rent._id] || ""} onChange={(e) => setDamageReports(prev => ({ ...prev, [rent._id]: e.target.value }))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400" />
                    <input type="number" placeholder="Claim Amount (₹)" value={claimAmounts[rent._id] || ""} onChange={(e) => setClaimAmounts(prev => ({ ...prev, [rent._id]: e.target.value }))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400" />
                    <button onClick={() => handleReportDamage(rent._id)} className="w-full bg-red-600 text-white font-bold text-[10px] py-2 rounded-xl">Submit Damage Claim</button>
                  </div>
                </div>
              )}
              {rent.status === "DAMAGE_REVIEW" && <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl text-xs"><span className="font-extrabold text-yellow-400">⏳ Damage Claim Under Review</span><p className="text-slate-400 mt-1">Admin will resolve the escrow dispute.</p></div>}
              {rent.status === "DISPUTED" && <div className="p-4 bg-red-600/10 border border-red-500/20 rounded-2xl text-xs"><span className="font-extrabold text-red-500">🔒 Under Admin Review</span><p className="text-slate-400 mt-1">Escrow locked pending resolution.</p></div>}
              {rent.status === "SETTLED" && <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl text-xs"><span className="font-extrabold text-emerald-500">✓ Transaction Settled</span></div>}
              {rent.status === "RETRACTED" && <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-2xl text-xs"><span className="font-extrabold text-red-400">🔴 You Retracted This Listing</span></div>}
            </div>
          )}
        </div>

        {/* Chat panel */}
        <div className="mt-2 border-t border-slate-800/40 pt-4">
          <button onClick={() => handleLoadChat(rent._id)} className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider mb-2">💬 Open Chat</button>
          {chats[rent._id] && (
            <div className="mt-2 space-y-3 bg-slate-950 p-4 rounded-2xl max-h-48 overflow-y-auto">
              {chats[rent._id].map((msg, i) => (
                <div key={i} className="text-xs">
                  <span className="font-bold text-indigo-400">{msg.sender?.name || "User"}: </span>
                  <span className="text-slate-300">{msg.content}</span>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input type="text" disabled={rent.status === "RETRACTED"} placeholder={rent.status === "RETRACTED" ? "Transaction inactive" : "Type message..."} value={chatInputs[rent._id] || ""} onChange={(e) => setChatInputs(prev => ({ ...prev, [rent._id]: e.target.value }))} className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none disabled:opacity-50" />
                <button onClick={() => handleSendChat(rent._id, otherPartyId)} disabled={rent.status === "RETRACTED"} className="bg-indigo-500 text-white px-3 py-1 rounded-xl text-xs disabled:opacity-50">Send</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 py-8 px-4 md:px-8 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
      <div className="max-w-5xl mx-auto mb-8 flex justify-between items-center border-b pb-6 border-slate-800/40">
        <button onClick={() => navigate("/dashboard")} className="bg-slate-900 border border-slate-800 text-xs px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-all text-white">← Discovery</button>
        <h1 className="text-2xl font-black">🤝 My Orders</h1>
      </div>

      <div className="max-w-5xl mx-auto space-y-12">
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-lg">📥</span>
            <div>
              <h2 className="text-base font-black text-indigo-400">Renting / Buying</h2>
              <p className="text-xs text-slate-500">Products you've rented or purchased from others</p>
            </div>
          </div>
          {rentingItems.length === 0
            ? <div className={`p-8 rounded-3xl border text-center ${isNight ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}><p className="text-slate-500 text-sm">No active rentals or purchases yet.</p></div>
            : <div className="space-y-5">{rentingItems.map(r => renderCard(r, "borrower"))}</div>
          }
        </section>

        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-lg">📤</span>
            <div>
              <h2 className="text-base font-black text-violet-400">Lending / Selling</h2>
              <p className="text-xs text-slate-500">Your listings currently rented out or sold to buyers</p>
            </div>
          </div>
          {lendingItems.length === 0
            ? <div className={`p-8 rounded-3xl border text-center ${isNight ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}><p className="text-slate-500 text-sm">None of your listings are currently active.</p></div>
            : <div className="space-y-5">{lendingItems.map(r => renderCard(r, "owner"))}</div>
          }
        </section>
      </div>

      {showNotification && (
        <div className="fixed bottom-6 left-6 z-[120] flex items-center gap-3 bg-slate-950 border border-indigo-500/30 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl">
          <span>{showNotification}</span>
        </div>
      )}
    </div>
  );
}
