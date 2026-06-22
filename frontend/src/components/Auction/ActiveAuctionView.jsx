import React, { useState, useEffect } from 'react';
import { useAuctionSocket } from '../../hooks/useAuctionSocket';
import { BidHistoryList } from './BidHistoryList';
import { v4 as uuidv4 } from 'uuid';

export const ActiveAuctionView = ({ auctionId, initialAuction, currentUser }) => {
  const { socket, auctionState, bids, serverTimeOffset } = useAuctionSocket(auctionId);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');

  const displayAuction = auctionState || initialAuction;

  useEffect(() => {
    if (!displayAuction?.endTime) return;

    const interval = setInterval(() => {
      // Server-authoritative countdown calculation
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

    const amount = Number(bidAmount);
    const minRequired = (displayAuction.currentHighestBid || displayAuction.startingBid) + displayAuction.minimumIncrement;

    if (isNaN(amount) || amount < minRequired) {
      return setError(`Bid must be at least ₹${minRequired}`);
    }

    try {
      // Create idempotency key
      const idempotencyKey = uuidv4();
      
      // REST call for transaction-safe bid (assuming fetch or axios)
      const res = await fetch(`/api/auctions/${auctionId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, idempotencyKey })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to place bid');
      }

      setBidAmount('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (!displayAuction) return <div>Loading Auction...</div>;

  const isOwner = currentUser?._id === displayAuction.ownerId;
  const isEnded = displayAuction.status === 'ENDED' || timeRemaining === 'Auction Ended';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto p-4">
      {/* Left Column: Product & Bidding */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">Live Auction: Product #{displayAuction.product}</h1>
              <div className="inline-block bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-sm font-medium">
                {displayAuction.status}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-400 mb-1">Time Remaining</p>
              <p className={`text-xl font-mono font-bold ${timeRemaining === 'Auction Ended' ? 'text-red-500' : 'text-amber-500'}`}>
                {timeRemaining || '--:--:--'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-neutral-800/50 rounded-lg p-4 mb-6 border border-neutral-700/50">
            <div>
              <p className="text-sm text-neutral-400">Current Highest Bid</p>
              <p className="text-3xl font-bold text-white mt-1">
                ₹{displayAuction.currentHighestBid || displayAuction.startingBid}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-400">Reserve Price</p>
              <p className="text-xl font-medium text-neutral-300 mt-1">₹{displayAuction.reservePrice}</p>
            </div>
          </div>

          {!isOwner && !isEnded && (
            <form onSubmit={handleBidSubmit} className="space-y-4 border-t border-neutral-800 pt-6">
              {error && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">{error}</div>}
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Place Your Bid (Min: ₹{(displayAuction.currentHighestBid || displayAuction.startingBid) + displayAuction.minimumIncrement})
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-amber-500"
                    placeholder="Enter amount"
                  />
                  <button 
                    type="submit"
                    className="px-8 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors shadow-lg shadow-amber-500/20"
                  >
                    Place Bid
                  </button>
                </div>
              </div>
            </form>
          )}

          {isOwner && (
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm flex items-center gap-2">
                <span className="text-lg">ℹ️</span> You are the owner of this auction. You cannot place bids.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Bid History */}
      <div className="lg:col-span-1">
        <BidHistoryList bids={bids} minimumIncrement={displayAuction.minimumIncrement} />
      </div>
    </div>
  );
};
