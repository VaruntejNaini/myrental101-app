import Product from '../models/Product.js';
import AuctionEligibility from '../models/AuctionEligibility.js';

// Weights prioritizing intent
const WEIGHTS = {
  views: 1,
  wishlistAdds: 5,
  shares: 3,
  chatInquiries: 20,
  rentalRequests: 50,
  verifiedUserMultiplier: 2
};

const DEMAND_THRESHOLD = 200;

export const evaluateDemand = async () => {
  // Normally this would aggregate analytics.
  // For MVP, we query products without active auctions.
  const products = await Product.find({ activeAuctionId: null, status: 'ACTIVE' });

  for (const product of products) {
    // Generate a mock or real demand score
    // MVP uses base views and pseudo-metrics 
    const viewsScore = (product.views || 0) * WEIGHTS.views;
    
    // In a real scenario, we would count actual wishlist/chats from other collections.
    // For now we mock the sub-metrics from analytics if needed or random for testing
    let eligibility = await AuctionEligibility.findOne({ productId: product._id });
    
    if (!eligibility) {
      eligibility = new AuctionEligibility({ productId: product._id, metrics: {} });
    }

    const totalScore = viewsScore + 
      (eligibility.metrics.wishlistAdds * WEIGHTS.wishlistAdds) + 
      (eligibility.metrics.chatInquiries * WEIGHTS.chatInquiries) + 
      (eligibility.metrics.rentalRequests * WEIGHTS.rentalRequests);

    eligibility.demandScore = totalScore;
    
    if (totalScore >= DEMAND_THRESHOLD) {
      eligibility.isEligible = true;
      
      // Notification Deduplication
      if (!eligibility.notificationSent) {
        await notifyOwner(product.owner, product._id);
        eligibility.notificationSent = true;
      }
    }
    
    eligibility.lastEvaluatedAt = new Date();
    await eligibility.save();
  }
};

const notifyOwner = async (ownerId, productId) => {
  // In Phase 1 MVP, we can insert into a Notification collection or trigger Queue
  console.log(`[DemandScoring] Notifying owner ${ownerId} for product ${productId}`);
  // Import Notification model and insert
};
