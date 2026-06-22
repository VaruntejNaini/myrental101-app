import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { STORAGE_KEYS } from "../constants/auth";

export default function MyOrders() {
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");
  const [profilePic] = useState(() => localStorage.getItem("userProfilePic") || "");
  const [showNotification, setShowNotification] = useState("");

  const [activeRentals, setActiveRentals] = useState([]);
  const [activeBorrowRequests, setActiveBorrowRequests] = useState([]);
  const [userName, setUserName] = useState(() => localStorage.getItem("user_name") || "Varun Tej");

  useEffect(() => {
    const activeToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (activeToken) {
      API.get("/auth/me")
        .then(res => {
          if (res.data?.name) {
            setUserName(res.data.name);
            localStorage.setItem("user_name", res.data.name);
          }
        })
        .catch(err => console.error("Error loading profile:", err));
    }
  }, []);
  
  // OTP generator codes mapped by transaction ID
  const [generatedOtps, setGeneratedOtps] = useState({});
  const [verifyOtpInput, setVerifyOtpInput] = useState({});
  
  // Chat context maps
  const [chats, setChats] = useState({});
  const [chatInputs, setChatInputs] = useState({});

  // Damage reporting structures
  const [damageReports, setDamageReports] = useState({});
  const [claimAmounts, setClaimAmounts] = useState({});

  // Dispute messages
  const [disputeInputs, setDisputeInputs] = useState({});

  const triggerToast = (msg) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(""), 4000);
  };

  // Sync state machine items
  const syncRentals = () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) return;

    API.get("/rent/transactions")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const mappedRentals = res.data.map(tx => ({
            _id: tx._id,
            title: tx.product ? tx.product.title : "Deleted Listing",
            rate: `₹${tx.dailyRate}/day`,
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
          setActiveRentals(mappedRentals);
        } else {
          // Fallback/Seed default list for testing if database has no entries yet
          setActiveRentals([
            {
              _id: "60d5ecb8b5c9c93d98e8a8e1",
              title: "Canon EOS R50 Camera",
              rate: "₹450/day",
               status: "RESERVED",
              startDate: "12 June",
              endDate: "15 June",
              borrower: { name: userName },
              owner: { name: "Arjun K." }
            },
            {
              _id: "60d5ecb8b5c9c93d98e8a8e2",
              title: "Honda Activa Scooter",
              rate: "₹250/day",
              status: "IN_POSSESSION",
              startDate: "08 June",
              endDate: "10 June",
              borrower: { name: userName },
              owner: { name: "Rahul P." }
            }
          ]);
        }
      })
      .catch(err => {
        console.error("Error fetching transactions:", err);
      });
  };

  useEffect(() => {
    syncRentals();
  }, [userName]);

  const handleGenerateOtp = async (txId, type) => {
    try {
      const res = await API.post(`/rent/transaction/${txId}/generate-otp`, { otpType: type });
      setGeneratedOtps(prev => ({ ...prev, [txId]: res.data.rawOtp }));
      triggerToast(`Verification OTP Generated: ${res.data.rawOtp}`);
    } catch (err) {
      triggerToast("Failed to generate OTP");
    }
  };

  const handleVerifyOtp = async (txId, type) => {
    const inputOtp = verifyOtpInput[txId];
    if (!inputOtp) return;
    try {
      if (type === "HANDOFF") {
        await API.post(`/rent/transaction/${txId}/verify-handoff`, { otp: inputOtp });
        triggerToast("Key handoff verified! Rental is now active.");
        setActiveRentals(prev =>
          prev.map(r => (r._id === txId ? { ...r, status: "IN_POSSESSION" } : r))
        );
      } else {
        await API.post(`/rent/transaction/${txId}/verify-return`, {
          otp: inputOtp,
          reportDamage: false
        });
        triggerToast("Return verification complete! Escrow deposit refunded.");
        setActiveRentals(prev =>
          prev.map(r => (r._id === txId ? { ...r, status: "SETTLED" } : r))
        );
      }
      setVerifyOtpInput(prev => ({ ...prev, [txId]: "" }));
    } catch (err) {
      triggerToast(err.response?.data?.msg || "Verification failed");
    }
  };

  const handleInitiateReturn = async (txId) => {
    try {
      await API.post(`/rent/transaction/${txId}/initiate-return`);
      triggerToast("Return initialized. Waiting for owner to confirm OTP.");
      setActiveRentals(prev =>
        prev.map(r => (r._id === txId ? { ...r, status: "RETURN_INITIATED" } : r))
      );
    } catch (err) {
      triggerToast("Failed to initiate return");
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
        claimAmount: Number(claim)
      });
      triggerToast("Damage claim submitted. State moved to DAMAGE_REVIEW.");
      setActiveRentals(prev =>
        prev.map(r => (r._id === txId ? { ...r, status: "DAMAGE_REVIEW" } : r))
      );
    } catch (err) {
      triggerToast("Failed to submit damage report");
    }
  };

  const handleRaiseDispute = async (txId) => {
    const reason = disputeInputs[txId];
    if (!reason) return;
    try {
      await API.post(`/rent/transaction/${txId}/dispute`, { disputeReason: reason });
      triggerToast("Transaction flagged as DISPUTED. Admin audit trail initiated.");
      setActiveRentals(prev =>
        prev.map(r => (r._id === txId ? { ...r, status: "DISPUTED" } : r))
      );
    } catch (err) {
      triggerToast("Failed to flag dispute");
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
      const res = await API.post(`/rent/chat/${txId}`, {
        receiverId,
        content: text
      });
      setChats(prev => ({
        ...prev,
        [txId]: [...(prev[txId] || []), res.data]
      }));
      setChatInputs(prev => ({ ...prev, [txId]: "" }));
    } catch (err) {
      triggerToast("Failed to send message");
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 py-8 px-4 md:px-8 ${isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8 flex justify-between items-center border-b pb-6 border-slate-800">
        <div>
          <button onClick={() => navigate("/dashboard")} className="bg-slate-900 border border-slate-800 text-xs px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-all">
            ← Discovery
          </button>
        </div>
        <h1 className="text-2xl font-black">🤝 Real-Time Rental State Console</h1>
      </div>

      {/* Main timeline tracker */}
      <div className="max-w-5xl mx-auto space-y-6">
        {activeRentals.map(rent => (
          <div key={rent._id} className={`p-6 rounded-3xl border ${isNight ? "bg-slate-900 border-slate-800" : "bg-white border-slate-205"}`}>
            <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-800/40 pb-4 mb-4">
              <div>
                {rent.status === "RETRACTED" ? (
                  <span className="text-[10px] bg-red-500/10 text-red-550 font-bold px-2 py-0.5 rounded border border-red-500/20">RETRACTED</span>
                ) : (
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded border border-indigo-500/20">{rent.status}</span>
                )}
                <h3 className="font-extrabold text-base mt-2">{rent.title}</h3>
                <p className="text-xs text-slate-450 mt-1">Daily Rent: {rent.rate}</p>
              </div>

              {/* Status Machine Interactive Step Controls */}
              <div className="flex gap-2 flex-wrap">
                {rent.status === "RESERVED" && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleGenerateOtp(rent._id, "HANDOFF")} className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl">
                      Show Handoff OTP
                    </button>
                    <input
                      type="text"
                      placeholder="Verify Handoff Code"
                      value={verifyOtpInput[rent._id] || ""}
                      onChange={(e) => setVerifyOtpInput(prev => ({ ...prev, [rent._id]: e.target.value }))}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs w-28 focus:outline-none"
                    />
                    <button onClick={() => handleVerifyOtp(rent._id, "HANDOFF")} className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-2 rounded-xl">
                      Verify
                    </button>
                  </div>
                )}

                {rent.status === "IN_POSSESSION" && (
                  <button onClick={() => handleInitiateReturn(rent._id)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl">
                    Initiate Return Check
                  </button>
                )}

                {rent.status === "RETURN_INITIATED" && (
                  <div className="space-y-3 w-full max-w-sm mt-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleGenerateOtp(rent._id, "RETURN")} className="bg-violet-600 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl">
                        Show Return OTP
                      </button>
                      <input
                        type="text"
                        placeholder="Verify Return Code"
                        value={verifyOtpInput[rent._id] || ""}
                        onChange={(e) => setVerifyOtpInput(prev => ({ ...prev, [rent._id]: e.target.value }))}
                        className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs w-28 focus:outline-none"
                      />
                      <button onClick={() => handleVerifyOtp(rent._id, "RETURN")} className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-2 rounded-xl">
                        Clean Release
                      </button>
                    </div>

                    {/* Damage Claim Form */}
                    <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-2">
                      <span className="text-[10px] font-bold text-red-400">REPORT DAMAGE ON INSPECTION</span>
                      <input
                        type="text"
                        placeholder="Describe damage evidence"
                        value={damageReports[rent._id] || ""}
                        onChange={(e) => setDamageReports(prev => ({ ...prev, [rent._id]: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Claim Amount (₹)"
                        value={claimAmounts[rent._id] || ""}
                        onChange={(e) => setClaimAmounts(prev => ({ ...prev, [rent._id]: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                      />
                      <button onClick={() => handleReportDamage(rent._id)} className="w-full bg-red-600 text-white font-bold text-[10px] py-2 rounded-xl">
                        Submit Claim (Hold Deposit)
                      </button>
                    </div>
                  </div>
                )}

                {rent.status === "DAMAGE_REVIEW" && (
                  <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl w-full max-w-sm space-y-2">
                    <p className="text-[10px] text-yellow-500 font-extrabold uppercase">⚠️ UNDER DAMAGE REVIEW</p>
                    <input
                      type="text"
                      placeholder="Reason for Dispute"
                      value={disputeInputs[rent._id] || ""}
                      onChange={(e) => setDisputeInputs(prev => ({ ...prev, [rent._id]: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                    />
                    <button onClick={() => handleRaiseDispute(rent._id)} className="w-full bg-yellow-600 text-white text-[10px] font-bold py-2 rounded-xl">
                      File Escalated Dispute
                    </button>
                  </div>
                )}

                {rent.status === "DISPUTED" && (
                  <div className="p-4 bg-red-600/10 border border-red-500/20 rounded-2xl text-xs">
                    <span className="font-extrabold text-red-500">🔒 TRANSACTION UNDER DISPUTED AUDIT</span>
                    <p className="text-slate-450 mt-1">Escrow funds locked. Administrative moderation team will review claim history.</p>
                  </div>
                )}

                {rent.status === "SETTLED" && (
                  <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl text-xs">
                    <span className="font-extrabold text-emerald-500">✓ TRANSACTION SETTLED</span>
                  </div>
                )}

                {rent.status === "RETRACTED" && (
                  <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-2xl text-xs">
                    <span className="font-extrabold text-red-500">🔴 Retracted</span>
                    <p className="text-slate-400 mt-1">This listing was removed by the owner. This transaction is no longer active.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dedicated Chat Console */}
            <div className="mt-4 border-t border-slate-800/40 pt-4">
              <button onClick={() => handleLoadChat(rent._id)} className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider mb-2">
                💬 Open Host Chat Panel
              </button>
              
              {chats[rent._id] && (
                <div className="mt-2 space-y-3 bg-slate-950 p-4 rounded-2xl max-h-48 overflow-y-auto">
                  {chats[rent._id].map((msg, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-bold text-indigo-400">{msg.sender?.name || "User"}: </span>
                      <span className="text-slate-300">{msg.content}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      disabled={rent.status === "RETRACTED"}
                      placeholder={rent.status === "RETRACTED" ? "Transaction is inactive" : "Type message..."}
                      value={chatInputs[rent._id] || ""}
                      onChange={(e) => setChatInputs(prev => ({ ...prev, [rent._id]: e.target.value }))}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button 
                      onClick={() => handleSendChat(rent._id, "60d5ecb8b5c9c93d98e8a8b1")} 
                      disabled={rent.status === "RETRACTED"}
                      className="bg-indigo-500 text-white px-3 py-1 rounded-xl text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

      {showNotification && (
        <div className="fixed bottom-6 left-6 z-[120] flex items-center gap-3 bg-slate-950 border border-indigo-500/30 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl">
          <span>{showNotification}</span>
        </div>
      )}

    </div>
  );
}
