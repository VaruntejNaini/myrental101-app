import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);
export default Review;
