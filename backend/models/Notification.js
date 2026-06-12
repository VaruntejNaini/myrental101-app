import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "NEW_BID",
        "OUTBID_ALERT",
        "NEW_NEGOTIATION_OFFER",
        "WISH_OFFER_RECEIVED",
        "OFFER_ACCEPTED",
        "OTP_GENERATED",
        "RETURN_INITIATED",
        "DISPUTE_RAISED",
        "SETTLEMENT_COMPLETED",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
