import React from 'react';

export const BidHistoryList = ({ bids, minimumIncrement }) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col h-[400px]">
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-800/50">
        <h3 className="font-semibold text-white">Bid History</h3>
        <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded-full">
          Min Increment: ₹{minimumIncrement || 50}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {bids.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500">
            <p>No bids yet.</p>
            <p className="text-sm">Be the first to bid!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bids.map((bid, index) => (
              <div 
                key={bid._id || index} 
                className={`flex items-center justify-between p-3 rounded-lg ${index === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-neutral-800/30'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-amber-500 text-black' : 'bg-neutral-700 text-neutral-300'}`}>
                    {index === 0 ? '1st' : '...'}
                  </div>
                  <div>
                    <p className={`font-medium ${index === 0 ? 'text-amber-500' : 'text-neutral-300'}`}>
                      User {bid.bidderId ? bid.bidderId.substring(bid.bidderId.length - 4) : 'Unknown'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {new Date(bid.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className={`font-bold ${index === 0 ? 'text-amber-500' : 'text-white'}`}>
                  ₹{bid.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
