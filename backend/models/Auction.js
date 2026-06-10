import mongoose from "mongoose";

const auctionSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, unique: true, index: true },
    floorPrice: { type: Number, required: true },
    currentTopBid: { type: Number, default: 0 },
    currentTopBidder: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    endsAt: { type: Date, required: true, index: true },
    isResolved: { type: Boolean, default: false, index: true },
    bids: [
      {
        bidder: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
        durationDays: { type: Number, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Auction = mongoose.model("Auction", auctionSchema);
export default Auction;
