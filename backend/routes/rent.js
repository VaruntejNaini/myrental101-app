import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middleware/auth.js";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";
import Auction from "../models/Auction.js";
import Notification from "../models/Notification.js";
import Message from "../models/Message.js";
import Review from "../models/Review.js";

import { upload } from "../middleware/upload.js";
import { uploadToCloudinary, cloudinary } from "../utils/cloudinary.js";

const router = express.Router();

// --- STATE MACHINE VALIDATION DEFINITIONS ---
const VALID_TRANSITIONS = {
  PENDING_NEGOTIATION: ["AWAITING_PAYMENT", "PENDING_NEGOTIATION"],
  AWAITING_PAYMENT: ["RESERVED", "PENDING_NEGOTIATION"],
  RESERVED: ["IN_POSSESSION"],
  IN_POSSESSION: ["RETURN_INITIATED"],
  RETURN_INITIATED: ["DAMAGE_REVIEW", "SETTLED"],
  DAMAGE_REVIEW: ["REFUND_PROCESSING", "DISPUTED"],
  REFUND_PROCESSING: ["SETTLED"],
  DISPUTED: ["SETTLED"],
};

// Check Overlapping Availability Conflicting Reservations
async function checkOverlap(productId, start, end, session = null) {
  const overlapping = await Transaction.findOne({
    product: productId,
    status: { $in: ["RESERVED", "IN_POSSESSION", "RETURN_INITIATED", "DAMAGE_REVIEW", "REFUND_PROCESSING"] },
    $or: [
      { startDate: { $lte: new Date(end) }, endDate: { $gte: new Date(start) } }
    ]
  }).session(session);
  return !overlapping;
}

// Helper to push automated notifications
async function createNotification(userId, type, title, message, senderId = null, link = "", transactionId = null, session = null) {
  try {
    let newType = "SYSTEM";
    if (["NEW_NEGOTIATION_OFFER", "OFFER_ACCEPTED", "NEW_BID", "OUTBID_ALERT"].includes(type)) {
      newType = "NEGOTIATION";
    } else if (["RETURN_INITIATED", "DISPUTE_RAISED", "SETTLEMENT_COMPLETED"].includes(type)) {
      newType = "ORDER";
    }
    
    const notif = new Notification({
      recipient: userId,
      sender: senderId,
      message: `${title}: ${message}`,
      type: newType,
      link: link,
      transactionId: transactionId
    });
    await notif.save({ session });
  } catch (err) {
    console.error("Notification creation failed:", err);
  }
}

// ==========================================
// 1. PRODUCTS CATALOUGE LISTINGS
// ==========================================

// Get All Products (Filtered by Type / Proximity)
router.get("/products", async (req, res) => {
  try {
    const { productType, category, minPrice, maxPrice, search } = req.query;
    let query = { status: { $ne: "INACTIVE" } }; // Hide disabled products from public catalog
    if (productType) query.productType = productType;
    if (category && category !== "All") query.category = category;
    if (minPrice || maxPrice) {
      query.rentalPrice = {};
      if (minPrice) query.rentalPrice.$gte = Number(minPrice);
      if (maxPrice) query.rentalPrice.$lte = Number(maxPrice);
    }
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // Decode token optionally to exclude current user's products
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.id) {
          query.owner = { $ne: decoded.id };
        }
      } catch (err) {
        // Invalid or expired token; ignore filtering by owner
      }
    }

    const products = await Product.find(query).populate("owner", "name email");
    res.json(products);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get User's Own Listed Products
router.get("/products/me", verifyToken, async (req, res) => {
  try {
    const products = await Product.find({ owner: req.userId }).populate("owner", "name email");
    res.json(products);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Toggle Status between ACTIVE and INACTIVE
router.put("/products/:id/toggle-status", verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "Invalid product ID format." });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product listing not found." });
    }

    if (product.owner.toString() !== req.userId) {
      return res.status(403).json({ msg: "Unauthorized: You do not own this listing." });
    }

    product.status = product.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get Product details
router.get("/products/:id", async (req, res) => {
  try {
    // Validate that req.params.id is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ msg: "Product not found" });
    }

    const product = await Product.findById(req.params.id).populate("owner", "name email");
    if (!product) return res.status(404).json({ msg: "Product not found" });

    // Enforce ownership checks for INACTIVE listings
    if (product.status === "INACTIVE") {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      let requesterId = null;

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          requesterId = decoded.id;
        } catch (err) {
          // Token is invalid/expired, leave requesterId as null
        }
      }

      if (!requesterId || product.owner._id.toString() !== requesterId) {
        return res.status(403).json({ msg: "Access denied: This listing has been deactivated by the owner." });
      }
    }
    
    // Attach current active auction context if applicable
    let auction = null;
    if (product.status === "AUCTION_ACTIVE") {
      auction = await Auction.findOne({ product: product._id, isResolved: false });
    }
    res.json({ product, auction });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Add Product Listing
router.post("/products", verifyToken, upload.array("productImages", 5), async (req, res) => {
  console.log("ROUTE TRIGGERED: POST /products");
  console.log("HEADERS:", req.headers);
  console.log("BODY:", req.body);
  console.log("FILES:", req.files);

  // 1. Environment Pre-Validation Safeguard
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === "ROOT") {
    return res.status(400).json({ msg: "Backend storage configuration error: Invalid or unconfigured Cloudinary Cloud Name." });
  }

  const uploadedAssets = [];
  try {
    if (!req.body) {
      throw new Error("req.body is undefined. Multipart parsing might have failed.");
    }
    const { title, description, category, rentalPrice, securityDeposit, city, area, productType } = req.body;
    
    // Process uploaded files if any
    if (req.files && req.files.length > 0) {
      const folder = productType === "RENT" ? "rentit/rent" : "rentit/secondhand";
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, folder);
        uploadedAssets.push(result.secure_url);
      }
    }

    // Explicitly parse and normalize stringified values from multipart form-data
    const sanitizedRentalPrice = rentalPrice && rentalPrice.trim() !== "" ? Number(rentalPrice) : 0;
    const sanitizedSecurityDeposit = securityDeposit && securityDeposit.trim() !== "" ? Number(securityDeposit) : 0;

    const product = await Product.create({
      title,
      description,
      category,
      images: uploadedAssets,
      rentalPrice: sanitizedRentalPrice,
      securityDeposit: sanitizedSecurityDeposit,
      city,
      area,
      productType,
      owner: req.userId,
    });
    
    res.status(201).json(product);
  } catch (err) {
    console.error("CRITICAL ERROR IN POST /products:", err);
    // Rollback uploaded Cloudinary assets on failure to prevent orphan storage leaks
    for (const asset of uploadedAssets) {
      if (asset.publicId) {
        await cloudinary.uploader.destroy(asset.publicId).catch(rollbackErr => {
          console.error(`Rollback error destroying asset ${asset.publicId}:`, rollbackErr);
        });
      }
    }
    res.status(500).json({ msg: err.message });
  }
});

// Delete Product Listing (Shared for Rent and Second-Hand)
router.delete("/products/:id", verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "Invalid product ID format." });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product listing not found." });
    }

    // Validate ownership
    if (product.owner.toString() !== req.userId) {
      return res.status(403).json({ msg: "Unauthorized: You do not own this listing." });
    }

    // Cleanup Cloudinary assets
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img && img.publicId) {
          await cloudinary.uploader.destroy(img.publicId).catch(err => {
            console.error(`Failed to delete Cloudinary asset ${img.publicId}:`, err);
          });
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: "Product listing deleted cleanly." });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ==========================================
// 2. STANDARD NEGOTIATION FLOW
// ==========================================

// Submit Initial Offer / Counter Offer
router.post("/negotiate", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId, startDate, endDate, dailyRate, securityDeposit } = req.body;

    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: "Product not found" });
    }

    // Conflict Check
    const available = await checkOverlap(productId, startDate, endDate, session);
    if (!available) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Product is already reserved during these dates!" });
    }

    const durationDays = Math.ceil(Math.abs(new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    const totalPaid = (dailyRate * durationDays) + securityDeposit;

    // Check if an existing negotiation exists for this user/product
    let transaction = await Transaction.findOne({
      product: productId,
      borrower: req.userId,
      status: "PENDING_NEGOTIATION",
    }).session(session);

    if (transaction) {
      transaction.negotiationHistory.push({ offeredBy: req.userId, rate: dailyRate });
      transaction.dailyRate = dailyRate;
      transaction.totalPaid = totalPaid;
      await transaction.save({ session });
    } else {
      const createdDocs = await Transaction.create([{
        product: productId,
        borrower: req.userId,
        owner: product.owner,
        startDate,
        endDate,
        dailyRate,
        securityDeposit,
        totalPaid,
        status: "PENDING_NEGOTIATION",
        negotiationHistory: [{ offeredBy: req.userId, rate: dailyRate }],
      }], { session });
      transaction = createdDocs[0];
    }

    // Trigger Proximity/Surge monitor check
    const recentRequestsCount = await Transaction.countDocuments({
      product: productId,
      createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // past 2 hours
    }).session(session);

    if (recentRequestsCount >= 5 && product.status === "ACTIVE") {
      // Auto Escalation to Active Micro-Auction
      product.status = "AUCTION_ACTIVE";
      await product.save({ session });

      const endsInHours = 3;
      await Auction.create([{
        product: product._id,
        floorPrice: product.rentalPrice,
        currentTopBid: dailyRate,
        currentTopBidder: req.userId,
        endsAt: new Date(Date.now() + endsInHours * 60 * 60 * 1000)
      }], { session });

      await createNotification(product.owner, "NEW_BID", "Surge Demand Triggered!", `High demand detected. Listing "${product.title}" has been escalated to a micro-auction.`, req.userId, `/product/${product._id}`, null, session);
    } else {
      const isSecondHand = product.productType === "SECOND_HAND";
      const title = isSecondHand ? "New Purchase Request" : "New Rental Negotiation";
      const message = isSecondHand
        ? `You have received a buyout request for "${product.title}" for ₹${dailyRate}.`
        : `You have received an offer for ${product.title}.`;
      await createNotification(product.owner, "NEW_NEGOTIATION_OFFER", title, message, req.userId, `/product/${product._id}?tx=${transaction._id}`, transaction._id, session);
    }

    await session.commitTransaction();
    session.endSession();
    res.json(transaction);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ msg: err.message });
  }
});

// Resolve Negotiation (Accept/Counter/Reject)
router.post("/negotiate/:id/resolve", verifyToken, async (req, res) => {
  try {
    const { action, counterRate } = req.body; // 'ACCEPT', 'REJECT', 'COUNTER'
    const transaction = await Transaction.findById(req.params.id).populate("product");
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    if (transaction.status !== "PENDING_NEGOTIATION") {
      return res.status(400).json({ msg: "Transaction not in negotiation state" });
    }

    const isSecondHand = transaction.product?.productType === "SECOND_HAND";

    if (action === "ACCEPT") {
      // Transition to AWAITING_PAYMENT
      transaction.status = "AWAITING_PAYMENT";
      await transaction.save();
      const notifMsg = isSecondHand
        ? `Your purchase request for ₹${transaction.dailyRate} has been accepted! Please checkout.`
        : `Your negotiation for ${transaction.dailyRate}/day has been accepted! Please checkout.`;
      await createNotification(transaction.borrower, "OFFER_ACCEPTED", "Negotiation Accepted 🎉", notifMsg, req.userId, `/product/${transaction.product._id}?tx=${transaction._id}`, transaction._id);
    } else if (action === "COUNTER") {
      transaction.negotiationHistory.push({ offeredBy: req.userId, rate: counterRate });
      transaction.dailyRate = counterRate;
      const durationDays = Math.ceil(Math.abs(new Date(transaction.endDate) - new Date(transaction.startDate)) / (1000 * 60 * 60 * 24)) + 1;
      transaction.totalPaid = (counterRate * durationDays) + transaction.securityDeposit;
      await transaction.save();
      
      const receiver = req.userId.toString() === transaction.owner.toString() ? transaction.borrower : transaction.owner;
      const notifMsg = isSecondHand
        ? `New counter price proposal of ₹${counterRate} received.`
        : `New counter price proposal of ₹${counterRate}/day received.`;
      await createNotification(receiver, "NEW_NEGOTIATION_OFFER", "Counter Offer Made", notifMsg, req.userId, `/product/${transaction.product._id}?tx=${transaction._id}`, transaction._id);
    } else {
      const notifMsg = isSecondHand
        ? `Your purchase request for ₹${transaction.dailyRate} has been rejected.`
        : `Your negotiation for ₹${transaction.dailyRate}/day has been rejected.`;
      await createNotification(transaction.borrower, "OFFER_REJECTED", "Negotiation Rejected ❌", notifMsg, req.userId, "", transaction._id);
      await Transaction.findByIdAndDelete(transaction._id);
      return res.json({ msg: "Offer rejected and closed." });
    }

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ==========================================
// 3. SECURE CHECKOUT / ESCROW VAULT INTENT
// ==========================================
router.post("/checkout/:id", verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    // Validate transition AWAITING_PAYMENT -> RESERVED
    if (!VALID_TRANSITIONS[transaction.status]?.includes("RESERVED")) {
      return res.status(400).json({ msg: `Invalid state transition from ${transaction.status} to RESERVED` });
    }

    // Availability validation check before charging
    const available = await checkOverlap(transaction.product, transaction.startDate, transaction.endDate);
    if (!available) {
      return res.status(400).json({ msg: "This slot was booked by someone else during checkout!" });
    }

    // Simulate Stripe/Razorpay Escrow Creation
    transaction.paymentIntentId = `pi_mock_${Math.random().toString(36).substring(2, 12)}`;
    transaction.escrowStatus = "HELD";
    transaction.status = "RESERVED";
    await transaction.save();

    await createNotification(transaction.owner, "OFFER_ACCEPTED", "Escrow Secured 🔒", `Funds for listing are safely held in escrow. Setup pickup!`, null, "", transaction._id);

    res.json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ==========================================
// 4. SECURE VERIFIABLE HANDOFF & RETURN OTPS
// ==========================================

// Generate Verification OTPs
router.post("/transaction/:id/generate-otp", verifyToken, async (req, res) => {
  try {
    const { otpType } = req.body; // 'HANDOFF' or 'RETURN'
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(rawOtp, 10);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    if (otpType === "HANDOFF") {
      transaction.handoffOtpHash = hash;
      transaction.handoffOtpExpiry = expiry;
    } else {
      transaction.returnOtpHash = hash;
      transaction.returnOtpExpiry = expiry;
    }

    await transaction.save();
    
    // Return OTP to generate UI QR codes/SMS triggers securely
    res.json({ rawOtp, expiry });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Verify Handoff OTP (Done by Owner scanning Borrower OTP code)
router.post("/transaction/:id/verify-handoff", verifyToken, async (req, res) => {
  try {
    const { otp } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    if (transaction.status !== "RESERVED") {
      return res.status(400).json({ msg: "Transaction not in RESERVED status" });
    }

    if (!transaction.handoffOtpHash || new Date() > new Date(transaction.handoffOtpExpiry)) {
      return res.status(400).json({ msg: "Handoff OTP is invalid or expired" });
    }

    const isMatch = await bcrypt.compare(otp, transaction.handoffOtpHash);
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect validation code" });
    }

    // Unset to prevent OTP replay attacks
    transaction.status = "IN_POSSESSION";
    transaction.handoffOtpHash = undefined;
    transaction.handoffOtpExpiry = undefined;
    await transaction.save();

    await createNotification(transaction.borrower, "OTP_GENERATED", "Handoff Complete 🚀", "Rental is now active. Ensure safe usage!", null, "", transaction._id);

    res.json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Initiate Return Cycle (Borrower declares return check)
router.post("/transaction/:id/initiate-return", verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    if (transaction.status !== "IN_POSSESSION") {
      return res.status(400).json({ msg: "Only active rentals can be returned" });
    }

    transaction.status = "RETURN_INITIATED";
    await transaction.save();

    await createNotification(transaction.owner, "RETURN_INITIATED", "Return Initiated", "Check physical device and verify OTP to confirm return.", null, "", transaction._id);

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Complete Return Verification (Owner inspects and verifies return OTP)
router.post("/transaction/:id/verify-return", verifyToken, async (req, res) => {
  try {
    const { otp, reportDamage, damageReport, claimAmount } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    if (transaction.status !== "RETURN_INITIATED") {
      return res.status(400).json({ msg: "Return is not initiated for verification" });
    }

    if (!transaction.returnOtpHash || new Date() > new Date(transaction.returnOtpExpiry)) {
      return res.status(400).json({ msg: "Return verification code has expired" });
    }

    const isMatch = await bcrypt.compare(otp, transaction.returnOtpHash);
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect verification code" });
    }

    // OTP verification valid, invalidate immediately
    transaction.returnOtpHash = undefined;
    transaction.returnOtpExpiry = undefined;

    if (reportDamage) {
      transaction.status = "DAMAGE_REVIEW";
      transaction.damageReport = damageReport;
      transaction.claimAmount = claimAmount;
      transaction.claimStatus = "FILED";
      await transaction.save();
      await createNotification(transaction.borrower, "DISPUTE_RAISED", "Damage Claim Submitted ⚠️", `Owner reported damage. Escrow deposit lock has been suspended.`, null, "", transaction._id);
    } else {
      transaction.status = "SETTLED";
      transaction.escrowStatus = "RELEASED";
      transaction.refundStatus = "PROCESSED";
      transaction.payoutStatus = "PROCESSED";
      await transaction.save();

      // Free product listing back to active status
      await Product.findByIdAndUpdate(transaction.product, { status: "ACTIVE" });

      await createNotification(transaction.borrower, "SETTLEMENT_COMPLETED", "Deposit Refunded", "Deposit returned successfully!", null, "", transaction._id);
      await createNotification(transaction.owner, "SETTLEMENT_COMPLETED", "Earnings Disbursed", "Earnings are added to your wallet.", null, "", transaction._id);
    }

    res.json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Raise Dispute (Under Damage claim resolution / Dispute escalations)
router.post("/transaction/:id/dispute", verifyToken, async (req, res) => {
  try {
    const { disputeReason } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    transaction.status = "DISPUTED";
    transaction.disputeReason = disputeReason;
    transaction.escrowStatus = "HELD_DISPUTED";
    await transaction.save();

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Admin Resolve Dispute Audit Route
router.post("/admin/disputes/:id/resolve", verifyToken, async (req, res) => {
  try {
    const { adminDecision, payoutReleaseRatio } = req.body; // e.g. release ratio to owner (0 to 1)
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    if (transaction.status !== "DISPUTED" && transaction.status !== "DAMAGE_REVIEW") {
      return res.status(400).json({ msg: "Transaction is not currently flagged for audit review" });
    }

    transaction.adminDecision = adminDecision;
    transaction.decisionTimestamp = new Date();
    transaction.status = "SETTLED";
    transaction.escrowStatus = "RELEASED";
    await transaction.save();

    await Product.findByIdAndUpdate(transaction.product, { status: "ACTIVE" });

    res.json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ==========================================
// 5. USER MESSAGING SERVICES
// ==========================================

// Get Messages
router.get("/chat/:transactionId", verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    const isBorrower = transaction.borrower.toString() === req.userId;
    const isOwner = transaction.owner.toString() === req.userId;
    if (!isBorrower && !isOwner) {
      return res.status(403).json({ msg: "Access denied" });
    }

    const CHAT_ALLOWED_READ_STATES = [
      "PENDING_NEGOTIATION",
      "AWAITING_PAYMENT",
      "RESERVED",
      "IN_POSSESSION",
      "RETURN_INITIATED",
      "DAMAGE_REVIEW",
      "DISPUTED",
      "REFUND_PROCESSING",
      "SETTLED"
    ];
    if (!CHAT_ALLOWED_READ_STATES.includes(transaction.status)) {
      return res.status(400).json({ msg: `Read access is not permitted for transaction status: ${transaction.status}` });
    }

    const messages = await Message.find({ transaction: req.params.transactionId })
      .populate("sender", "name")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Send Chat Message
router.post("/chat/:transactionId", verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    const isBorrower = transaction.borrower.toString() === req.userId;
    const isOwner = transaction.owner.toString() === req.userId;
    if (!isBorrower && !isOwner) {
      return res.status(403).json({ msg: "Access denied" });
    }

    const CHAT_ALLOWED_WRITE_STATES = [
      "PENDING_NEGOTIATION",
      "AWAITING_PAYMENT",
      "RESERVED",
      "IN_POSSESSION",
      "RETURN_INITIATED",
      "DAMAGE_REVIEW",
      "DISPUTED"
    ];
    if (!CHAT_ALLOWED_WRITE_STATES.includes(transaction.status)) {
      return res.status(400).json({ msg: `Sending messages is not permitted for transaction status: ${transaction.status}` });
    }

    const { receiverId, content } = req.body;
    const message = await Message.create({
      transaction: req.params.transactionId,
      sender: req.userId,
      receiver: receiverId,
      content,
    });
    res.json(message);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ==========================================
// 6. MICRO-AUCTIONS HIGH-TRAFFIC BIDDING
// ==========================================
router.post("/auction/:productId/bid", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { amount, durationDays } = req.body;
    const auction = await Auction.findOne({ product: req.params.productId, isResolved: false }).session(session);
    if (!auction) {
      await session.abortTransaction();
      return res.status(404).json({ msg: "No active micro-auction running on this listing" });
    }

    if (new Date() > new Date(auction.endsAt)) {
      await session.abortTransaction();
      return res.status(400).json({ msg: "Bidding window has expired!" });
    }

    if (amount <= auction.currentTopBid) {
      await session.abortTransaction();
      return res.status(400).json({ msg: "Bid amount must be higher than current top bid" });
    }

    // Set new bid details
    auction.currentTopBid = amount;
    const prevBidder = auction.currentTopBidder;
    auction.currentTopBidder = req.userId;
    auction.bids.push({ bidder: req.userId, amount, durationDays });
    await auction.save({ session });

    // Update current bid in product collection atomically
    await Product.findByIdAndUpdate(req.params.productId, { currentBid: amount }).session(session);

    await session.commitTransaction();
    session.endSession();

    if (prevBidder) {
      await createNotification(prevBidder, "OUTBID_ALERT", "You have been outbid!", `Someone placed a higher bid on auction for ${req.params.productId}`);
    }

    res.json(auction);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ msg: err.message });
  }
});

// ==========================================
// 7. USER NOTIFICATIONS ENDPOINTS
// ==========================================
router.get("/notifications", verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId, isRead: false })
      .populate("sender", "name email phone isVerified profilePic")
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Mark All Read
router.put("/notifications/read-all", verifyToken, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.userId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Mark Single Read
router.put("/notifications/:id/read", verifyToken, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ==========================================
// 8. PRODUCT REVIEWS SUBMISSION
// ==========================================
router.post("/reviews", verifyToken, async (req, res) => {
  try {
    const { transactionId, targetUserId, rating, comment } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ msg: "Transaction record not found" });

    if (transaction.status !== "SETTLED") {
      return res.status(400).json({ msg: "Feedback reviews are blocked until transaction is fully settled." });
    }

    const review = await Review.create({
      reviewer: req.userId,
      targetUser: targetUserId,
      transaction: transactionId,
      rating,
      comment,
    });

    res.json(review);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get User's Active Transactions / Chats
router.get("/transactions", verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ owner: req.userId }, { borrower: req.userId }]
    })
    .populate("product", "title productType rentalPrice")
    .populate("owner", "name email phone isVerified profilePic")
    .populate("borrower", "name email phone isVerified profilePic")
    .sort({ updatedAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;
