import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    auctionId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Auction", 
      required: true,
      index: true
    },
    bidderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    amount: { 
      type: Number, 
      required: true 
    },
    idempotencyKey: { 
      type: String, 
      required: true,
      unique: true, // Prevents duplicate bids with same idempotency key
      index: true
    },
    ipAddress: {
      type: String,
    },
    deviceSignature: {
      type: String,
    },
    status: {
      type: String,
      enum: ['ACCEPTED', 'REJECTED'],
      default: 'ACCEPTED'
    },
    rejectionReason: {
      type: String
    }
  },
  { timestamps: true }
);

const Bid = mongoose.model("Bid", bidSchema);
export default Bid;
