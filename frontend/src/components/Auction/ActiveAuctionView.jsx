import React, { useState, useEffect } from 'react';
import { useAuctionSocket } from '../../hooks/useAuctionSocket';
import { BidHistoryList } from './BidHistoryList';
import { v4 as uuidv4 } from 'uuid';
import API from '../../api';

export const ActiveAuctionView = ({ auctionId, initialAuction, currentUser }) => {
  const { socket, auctionState, bids, serverTimeOffset } = useAuctionSocket(auctionId);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  const displayAuction = auctionState || initialAuction;

  useEffect(() => {
    if (!displayAuction?.endTime) return;

    const interval = setInterval(() => {
      const serverNow = Date.now() + serverTimeOffset;
      const end = new Date(displayAuction.endTime).getTime();
      const diff = end - serverNow;

      if (diff <= 0) {
        setTimeRemaining('Auction Ended');
        clearInterval(interval);
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${h}h ${m}m ${s}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [displayAuction?.endTime, serverTimeOffset]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const amount = Number(bidAmount);
    const minRequired = (displayAuction.currentHighestBid || displayAuction.startingBid) + (displayAuction.minimumIncrement || 50);

    if (isNaN(amount) || amount < minRequired) {
      return setError(`Bid must be at least ₹${minRequired}`);
    }

    setSubmitting(true);
    try {
      const idempotencyKey = uuidv4();
      // Uses API instance — auth token injected automatically via interceptor
      await API.post(`/auctions/${auctionId}/bid`, { amount, idempotencyKey });
      setBidAmount('');
      setSuccess(`Bid of ₹${amount} placed successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  if (!displayAuction) return (
    <div className="flex items-center justify-center py-12 text-slate-400 text-sm font-bold animate-pulse">
      Loading auction...
    </div>
  );

  const isOwner = currentUser?._id === displayAuction.ownerId?.toString?.() ||
                  currentUser?._id === displayAuction.ownerId;
  const isEnded = displayAuction.status === 'ENDED' ||
                  displayAuction.status === 'RESERVE_NOT_MET' ||
                  displayAuction.status === 'PAYMENT_PENDING' ||
                  timeRemaining === 'Auction Ended';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {/* Left Column: Bidding */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-white">
          {/* Header */}
          <div className="flex justify-between items-start mb-5">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-500">🔥 Live Auction</span>
              <div className="mt-1 inline-block bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                {displayAuction.status}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-0.5">Time Remaining</p>
              <p className={`text-xl font-mono font-black ${isEnded ? 'text-red-400' : 'text-amber-400'}`}>
                {timeRemaining || '--:--:--'}
              </p>
            </div>
          </div>

          {/* Bid stats */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/60 rounded-xl p-4 mb-5 border border-slate-800">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Current Highest Bid</p>
              <p className="text-2xl font-black text-white">
                ₹{displayAuction.currentHighestBid || displayAuction.startingBid}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Reserve Price</p>
              <p className="text-lg font-bold text-slate-300">₹{displayAuction.reservePrice}</p>
            </div>
          </div>

          {/* Bid form */}
          {!isOwner && !isEnded && (
            <form onSubmit={handleBidSubmit} className="space-y-3 border-t border-slate-800 pt-4">
              {error && (
                <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 p-3 rounded-xl">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-emerald-400 text-xs bg-emerald-400/10 border border-emerald-400/20 p-3 rounded-xl">
                  {success}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Your Bid — Min: ₹{(displayAuction.currentHighestBid || displayAuction.startingBid) + (displayAuction.minimumIncrement || 50)}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    placeholder="Enter amount"
                    disabled={submitting}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black rounded-xl transition-colors shadow-lg shadow-amber-500/20 text-sm"
                  >
                    {submitting ? '...' : 'Bid'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {isOwner && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-blue-400 text-xs font-bold">
                ℹ️ You are the owner — you cannot place bids.
              </p>
            </div>
          )}

          {isEnded && (
            <div className="mt-4 p-3 bg-slate-800 border border-slate-700 rounded-xl">
              <p className="text-slate-400 text-xs font-bold text-center">
                {displayAuction.status === 'RESERVE_NOT_MET'
                  ? '⚠️ Auction ended — reserve price was not met.'
                  : '🏁 Auction has ended.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Bid History */}
      <div className="lg:col-span-1">
        <BidHistoryList bids={bids} minimumIncrement={displayAuction.minimumIncrement || 50} />
      </div>
    </div>
  );
};
