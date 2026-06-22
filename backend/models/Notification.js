import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    type: {
      type: String,
      enum: ["NEGOTIATION", "SYSTEM", "ORDER", "OFFER_RETRACTED"],
      required: true,
    },
    link: { type: String },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", default: null }
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
