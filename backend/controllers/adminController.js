import AdminAction from "../models/AdminAction.js";
import User from "../models/User.js";
import * as disputeService from "../services/disputeService.js";
import * as metricsService from "../services/metricsService.js";

function handleError(res, err) {
  const status = err.statusCode || 500;
  return res.status(status).json({ msg: err.message || "Internal server error" });
}

export async function listDisputes(req, res) {
  try {
    const result = await disputeService.listDisputes({
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
}

export async function resolveDispute(req, res) {
  try {
    const transaction = await disputeService.resolveDispute({
      transactionId: req.params.id,
      adminId: req.userId,
      adminDecision: req.body.adminDecision,
      outcome: req.body.outcome,
      ownerPercentage: req.body.ownerPercentage,
      borrowerPercentage: req.body.borrowerPercentage,
      payoutReleaseRatio: req.body.payoutReleaseRatio,
    });
    res.json({ success: true, transaction });
  } catch (err) {
    handleError(res, err);
  }
}

export async function getAuditLogs(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.actionType) {
      filter.actionType = req.query.actionType;
    }
    if (req.query.search) {
      filter.summary = { $regex: req.query.search.trim(), $options: "i" };
    }

    const [logs, total] = await Promise.all([
      AdminAction.find(filter)
        .populate("actor", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AdminAction.countDocuments(filter),
    ]);

    res.json({
      logs,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function getMetrics(req, res) {
  try {
    const metrics = await metricsService.getPlatformMetrics(req.userId);
    res.json(metrics);
  } catch (err) {
    handleError(res, err);
  }
}

export async function listUsers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      const term = req.query.search.trim();
      filter.$or = [
        { name: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -emailOtp -mobileOtp")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function blockUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    if (user.role === "ADMIN") {
      return res.status(403).json({ msg: "Cannot block another admin." });
    }
    if (user._id.toString() === req.userId) {
      return res.status(403).json({ msg: "Cannot block yourself." });
    }
    user.isBlocked = true;
    await user.save();
    res.json({ success: true, msg: `User ${user.email} has been blocked.` });
  } catch (err) {
    handleError(res, err);
  }
}

export async function unblockUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    user.isBlocked = false;
    await user.save();
    res.json({ success: true, msg: `User ${user.email} has been unblocked.` });
  } catch (err) {
    handleError(res, err);
  }
}
