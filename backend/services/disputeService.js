import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Product from "../models/Product.js";
import { logAction, logFailure, validateSummaryText } from "./auditService.js";

const VALID_OUTCOMES = ["RELEASE_TO_OWNER", "REFUND_BORROWER", "SPLIT"];
const DISPUTE_STATUSES = ["DISPUTED", "DAMAGE_REVIEW"];

function resolvePercentages(outcome, ownerPercentage, borrowerPercentage) {
  if (outcome === "RELEASE_TO_OWNER") {
    return { ownerPercentage: 100, borrowerPercentage: 0 };
  }
  if (outcome === "REFUND_BORROWER") {
    return { ownerPercentage: 0, borrowerPercentage: 100 };
  }
  const owner = Number(ownerPercentage);
  const borrower = Number(borrowerPercentage);
  if (Number.isNaN(owner) || Number.isNaN(borrower)) {
    return { error: "Owner and borrower percentages are required for SPLIT outcomes." };
  }
  if (owner < 0 || owner > 100 || borrower < 0 || borrower > 100) {
    return { error: "Percentages must be between 0 and 100." };
  }
  if (owner + borrower !== 100) {
    return { error: "Owner and borrower percentages must sum to exactly 100." };
  }
  return { ownerPercentage: owner, borrowerPercentage: borrower };
}

function mapLegacyRatio(outcome, payoutReleaseRatio, ownerPercentage, borrowerPercentage) {
  if (outcome !== "SPLIT") {
    return resolvePercentages(outcome, ownerPercentage, borrowerPercentage);
  }
  if (ownerPercentage !== undefined || borrowerPercentage !== undefined) {
    return resolvePercentages(outcome, ownerPercentage, borrowerPercentage);
  }
  const ratio = Number(payoutReleaseRatio);
  if (Number.isNaN(ratio) || ratio < 0 || ratio > 1) {
    return { error: "Payout release ratio must be between 0 and 1." };
  }
  const owner = Math.round(ratio * 100);
  return { ownerPercentage: owner, borrowerPercentage: 100 - owner };
}

export async function resolveDispute({
  transactionId,
  adminId,
  adminDecision,
  outcome = "RELEASE_TO_OWNER",
  ownerPercentage,
  borrowerPercentage,
  payoutReleaseRatio,
}) {
  const decisionValidation = validateSummaryText(adminDecision);
  if (!decisionValidation.valid) {
    throw Object.assign(new Error(decisionValidation.msg), { statusCode: 400 });
  }

  if (!VALID_OUTCOMES.includes(outcome)) {
    throw Object.assign(new Error("Invalid dispute outcome."), { statusCode: 400 });
  }

  const percentages = mapLegacyRatio(outcome, payoutReleaseRatio, ownerPercentage, borrowerPercentage);
  if (percentages.error) {
    await logFailure({
      actor: adminId,
      actionType: "INVALID_SPLIT_REQUEST",
      summary: percentages.error,
      metadata: { transactionId, outcome, ownerPercentage, borrowerPercentage, payoutReleaseRatio },
      targetType: "Transaction",
      targetId: transactionId,
    });
    throw Object.assign(new Error(percentages.error), { statusCode: 400 });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existing = await Transaction.findById(transactionId).session(session);
    if (!existing) {
      throw Object.assign(new Error("Transaction not found."), { statusCode: 404 });
    }

    const heldFunds = existing.totalPaid || 0;
    const ownerPayout = (percentages.ownerPercentage / 100) * heldFunds;
    const borrowerRefund = (percentages.borrowerPercentage / 100) * heldFunds;

    if (ownerPayout + borrowerRefund > heldFunds + 0.001) {
      await logFailure({
        actor: adminId,
        actionType: "INVALID_SPLIT_REQUEST",
        summary: "Payout and refund amounts exceed held escrow funds.",
        metadata: { transactionId, ownerPayout, borrowerRefund, heldFunds },
        targetType: "Transaction",
        targetId: transactionId,
      });
      throw Object.assign(new Error("Payout and refund amounts exceed held escrow funds."), { statusCode: 400 });
    }

    const previousStatus = existing.status;
    const ratio = percentages.ownerPercentage / 100;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: transactionId, status: { $in: DISPUTE_STATUSES } },
      {
        $set: {
          adminDecision: decisionValidation.trimmed,
          adminOutcome: outcome,
          payoutReleaseRatio: ratio,
          resolvedByAdmin: adminId,
          decisionTimestamp: new Date(),
          status: "SETTLED",
          resolvedAt: new Date(),
          escrowStatus: outcome === "REFUND_BORROWER" ? "REFUNDED" : "RELEASED",
          refundStatus: outcome === "REFUND_BORROWER" || outcome === "SPLIT" ? "PROCESSED" : "NONE",
          payoutStatus: outcome === "RELEASE_TO_OWNER" || outcome === "SPLIT" ? "PROCESSED" : "NONE",
          claimStatus: "RESOLVED",
        },
      },
      { new: true, session }
    );

    if (!transaction) {
      await logFailure({
        actor: adminId,
        actionType: "DISPUTE_RESOLUTION_FAILED",
        summary: "Transaction is not in a disputable state or was already resolved.",
        metadata: { transactionId, previousStatus },
        targetType: "Transaction",
        targetId: transactionId,
      });
      throw Object.assign(new Error("Transaction is not currently flagged for audit review or was already resolved."), {
        statusCode: 409,
      });
    }

    await Product.findByIdAndUpdate(transaction.product, { status: "ACTIVE" }, { session });

    await logAction({
      actor: adminId,
      actionType: "DISPUTE_RESOLVED",
      targetType: "Transaction",
      targetId: transaction._id,
      summary: decisionValidation.trimmed,
      metadata: {
        outcome,
        ownerPercentage: percentages.ownerPercentage,
        borrowerPercentage: percentages.borrowerPercentage,
        ownerPayout,
        borrowerRefund,
        heldFunds,
        previousStatus,
      },
    });

    await session.commitTransaction();
    return transaction;
  } catch (err) {
    await session.abortTransaction();
    if (err.statusCode) throw err;
    await logFailure({
      actor: adminId,
      actionType: "DISPUTE_RESOLUTION_FAILED",
      summary: err.message || "Unexpected dispute resolution failure.",
      metadata: { transactionId },
      targetType: "Transaction",
      targetId: transactionId,
    });
    throw err;
  } finally {
    session.endSession();
  }
}

export async function listDisputes({ page = 1, limit = 20 }) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const filter = { status: { $in: DISPUTE_STATUSES } };
  const [disputes, total] = await Promise.all([
    Transaction.find(filter)
      .populate("borrower", "name email reputationScore")
      .populate("owner", "name email reputationScore")
      .populate("product", "title images rentalPrice")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Transaction.countDocuments(filter),
  ]);

  return {
    disputes,
    total,
    page: safePage,
    pages: Math.ceil(total / safeLimit) || 1,
  };
}
