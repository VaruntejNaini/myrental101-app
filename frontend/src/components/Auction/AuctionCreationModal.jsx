import React, { useState } from 'react';

export const AuctionCreationModal = ({ isOpen, onClose, onSubmit, isRental }) => {
  const [startingBid, setStartingBid] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [durationHours, setDurationHours] = useState('24');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const start = Number(startingBid);
    const reserve = Number(reservePrice);

    if (isNaN(start) || start <= 0) {
      return setError('Starting bid must be greater than 0');
    }
    if (isNaN(reserve) || reserve < start) {
      return setError('Reserve price must be greater than or equal to starting bid');
    }

    onSubmit({ 
      startingBid: start, 
      reservePrice: reserve, 
      durationHours: Number(durationHours),
      type: isRental ? 'RENTAL' : 'SECOND_HAND'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-md shadow-2xl text-white">
        <h2 className="text-2xl font-bold mb-1">Initiate Auction</h2>
        <p className="text-neutral-400 text-sm mb-6">Convert this listing into a live bidding experience.</p>
        
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Starting Bid (₹)</label>
            <input 
              type="number" 
              value={startingBid}
              onChange={(e) => setStartingBid(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="e.g. 500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Reserve Price (₹)</label>
            <input 
              type="number" 
              value={reservePrice}
              onChange={(e) => setReservePrice(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="Minimum price you're willing to accept"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Duration</label>
            <select 
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="1">1 Hour</option>
              <option value="6">6 Hours</option>
              <option value="12">12 Hours</option>
              <option value="24">24 Hours</option>
              <option value="48">48 Hours</option>
              <option value="72">3 Days</option>
              <option value="168">7 Days</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors font-semibold shadow-lg shadow-amber-500/20"
            >
              Start Auction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
