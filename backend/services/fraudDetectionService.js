import Bid from '../models/Bid.js';
import AuctionAuditLog from '../models/AuctionAuditLog.js';

export const analyzeBidForFraud = async (bidData, auctionId, session) => {
  let fraudScore = 0;
  
  // Rule 1: IP Similarity / Rapid bidding from same IP
  const recentBidsFromIP = await Bid.countDocuments({ 
    auctionId, 
    ipAddress: bidData.ipAddress,
    createdAt: { $gte: new Date(Date.now() - 60000) } // last 1 minute
  }).session(session);

  if (recentBidsFromIP > 5) {
    fraudScore += 30; // Suspicious rapid bidding
  }

  // Rule 2: Account Age (Mock check, normally query User)
  // If account is < 24 hours old, add to fraud score
  
  // Rule 3: Rapid Bid Escalation (huge jumps in price)
  // Evaluated at controller level where we know previous bid

  if (fraudScore > 0) {
    await AuctionAuditLog.create([{
      auctionId,
      userId: bidData.bidderId,
      action: 'FRAUD_FLAG_EVALUATION',
      fraudScore,
      suspiciousAuctionFlag: fraudScore >= 50,
      metadata: { reason: 'Suspicious bidding patterns detected' },
      ipAddress: bidData.ipAddress
    }], { session });
  }

  return fraudScore;
};
