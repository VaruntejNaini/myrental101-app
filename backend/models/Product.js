import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    images: { type: [mongoose.Schema.Types.Mixed], default: [] },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rentalPrice: { type: Number, required: true },
    securityDeposit: { type: Number, required: true },
    city: { type: String, required: true, index: true },
    area: { type: String, required: true, index: true },
    productType: { type: String, enum: ["RENT", "SECOND_HAND"], required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "AUCTION_ACTIVE", "RESERVED", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
    currentBid: { type: Number, default: 0 },
    auctionEndTime: { type: Date, index: true },
    activeAuctionId: { type: mongoose.Schema.Types.ObjectId, ref: "Auction", default: null },
    views: { type: Number, default: 0 },
    // Track which authenticated users and guest identifiers have already viewed
    // so we can deduplicate and ensure each viewer counts once per product.
    viewedByUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    viewedByGuests: [{ type: String, default: [] }],
    analytics: {
      dailyViews: [
        {
          date: { type: Date, default: Date.now },
          count: { type: Number, default: 0 }
        }
      ]
    },
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], default: [78.4867, 17.385] }, // [longitude, latitude], defaults to Hyd
    },
  },
  { timestamps: true }
);

productSchema.index({ location: "2dsphere" });

const Product = mongoose.model("Product", productSchema);
export default Product;
