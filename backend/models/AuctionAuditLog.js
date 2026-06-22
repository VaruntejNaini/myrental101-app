import mongoose from "mongoose";

const auctionAuditLogSchema = new mongoose.Schema(
  {
    auctionId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Auction", 
      required: true,
      index: true
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      // nullable for system events
    },
    action: { 
      type: String, 
      required: true 
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    fraudScore: {
      type: Number,
    },
    suspiciousAuctionFlag: {
      type: Boolean,
      default: false
    },
    ipAddress: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { 
    timestamps: true,
    // Audit logs should generally be immutable. We can set capped true, 
    // but just standard collection is fine as long as we don't update.
  }
);

const AuctionAuditLog = mongoose.model("AuctionAuditLog", auctionAuditLogSchema);
export default AuctionAuditLog;
