import mongoose from "mongoose";

const wishSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    budget: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["ACTIVE", "FULFILLED", "EXPIRED"], default: "ACTIVE", index: true },
    views: { type: Number, default: 0 },
    viewedByUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    viewedByGuests: [{ type: String }],
    offers: [
      {
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        quoteAmount: { type: Number, required: true },
        productDetails: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Wish = mongoose.model("Wish", wishSchema);
export default Wish;
