import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    borrower: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    dailyRate: { type: Number, required: true },
    securityDeposit: { type: Number, required: true },
    addonsTotal: { type: Number, default: 0 },
    totalPaid: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "PENDING_NEGOTIATION",
        "AWAITING_PAYMENT",
        "RESERVED",
        "IN_POSSESSION",
        "RETURN_INITIATED",
        "DAMAGE_REVIEW",
        "REFUND_PROCESSING",
        "DISPUTED",
        "SETTLED",
      ],
      default: "PENDING_NEGOTIATION",
      index: true,
    },
    // Negotiation History
    negotiationHistory: [
      {
        offeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rate: { type: Number },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    // Hashed OTP fields
    handoffOtpHash: { type: String },
    handoffOtpExpiry: { type: Date },
    returnOtpHash: { type: String },
    returnOtpExpiry: { type: Date },

    // Escrow Fields
    paymentIntentId: { type: String },
    escrowStatus: { type: String, enum: ["HELD", "RELEASED", "REFUNDED", "HELD_DISPUTED"], default: "HELD" },
    refundStatus: { type: String, enum: ["NONE", "PENDING", "PROCESSED"], default: "NONE" },
    payoutStatus: { type: String, enum: ["NONE", "PENDING", "PROCESSED"], default: "NONE" },

    // Damage claims
    damageReport: { type: String },
    evidenceImages: [{ type: String }],
    claimAmount: { type: Number, default: 0 },
    claimStatus: { type: String, enum: ["NONE", "FILED", "RESOLVED", "REJECTED"], default: "NONE" },

    // Dispute Resolution
    disputeReason: { type: String },
    disputeEvidence: { type: String },
    adminDecision: { type: String },
    decisionTimestamp: { type: Date },
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
