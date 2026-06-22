import mongoose from "mongoose";

const auctionEligibilitySchema = new mongoose.Schema(
  {
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: true,
      unique: true,
      index: true
    },
    demandScore: { 
      type: Number, 
      default: 0 
    },
    metrics: {
      views: { type: Number, default: 0 },
      wishlistAdds: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      rentalRequests: { type: Number, default: 0 },
      chatInquiries: { type: Number, default: 0 },
    },
    isEligible: { 
      type: Boolean, 
      default: false 
    },
    notificationSent: { 
      type: Boolean, 
      default: false 
    },
    lastEvaluatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const AuctionEligibility = mongoose.model("AuctionEligibility", auctionEligibilitySchema);
export default AuctionEligibility;
