import User from "../models/User.js";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";
import { logFailure } from "./auditService.js";

export async function getPlatformMetrics(adminId) {
  try {
    const [totalUsers, activeListings, activeRentals, settledRentals, disputedTransactions] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ status: "ACTIVE" }),
      Transaction.countDocuments({ status: { $in: ["RESERVED", "IN_POSSESSION", "RETURN_INITIATED"] } }),
      Transaction.countDocuments({ status: "SETTLED" }),
      Transaction.countDocuments({ status: "DISPUTED" }),
    ]);

    return {
      totalUsers,
      activeListings,
      activeRentals,
      settledRentals,
      disputedTransactions,
    };
  } catch (err) {
    await logFailure({
      actor: adminId,
      actionType: "METRICS_QUERY_FAILURE",
      summary: err.message || "Failed to query platform metrics.",
      metadata: { error: err.message },
    });
    throw err;
  }
}
