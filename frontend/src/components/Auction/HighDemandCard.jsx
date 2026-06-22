import React from 'react';

export const HighDemandCard = ({ metrics, demandScore, onInitiate }) => {
  return (
    <div className="bg-neutral-900 border border-amber-500/30 rounded-xl p-6 shadow-xl shadow-amber-500/10 mb-6 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full"></div>
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span className="text-amber-500">🔥</span> High Demand Listing
          </h3>
          <p className="text-neutral-400 text-sm mt-1 mb-4">
            This listing has attracted significant user attention and is eligible for an auction.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-neutral-500">Views</p>
              <p className="font-semibold">{metrics?.views || 0}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Wishlist Adds</p>
              <p className="font-semibold">{metrics?.wishlistAdds || 0}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Demand Score</p>
              <p className="font-semibold text-amber-500">{demandScore || 0}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-neutral-800 pt-4 relative z-10">
        <p className="text-sm text-neutral-400 mb-3">Recommended Action: Start an Auction</p>
        <button 
          onClick={onInitiate}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold py-2 px-4 rounded-lg hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20"
        >
          Initiate Auction
        </button>
      </div>
    </div>
  );
};
