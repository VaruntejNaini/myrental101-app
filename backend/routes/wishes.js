import express from "express";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middleware/auth.js";
import Wish from "../models/Wish.js";
import Notification from "../models/Notification.js";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// Helper to push automated notifications
async function createNotification(userId, type, title, message, senderId = null) {
  try {
    let newType = "SYSTEM";
    if (["WISH_OFFER_RECEIVED", "OFFER_ACCEPTED"].includes(type)) {
      newType = "NEGOTIATION";
    }
    const notif = new Notification({
      recipient: userId,
      sender: senderId,
      message: `${title}: ${message}`,
      type: newType
    });
    await notif.save();
  } catch (err) {
    console.error("Notification creation failed:", err);
  }
}

// 1. Get Active Wishes Broadcast Feed (Sorted by distance / creation date)
router.get("/", async (req, res) => {
  try {
    const wishes = await Wish.find({ status: "ACTIVE" })
      .populate("creator", "name")
      .sort({ createdAt: -1 });

    

    res.json(wishes);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// 2. Broadcast / Post a Wish Request
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, description, category, budget, durationDays } = req.body;
    const wish = await Wish.create({
      title,
      description,
      category,
      budget,
      durationDays,
      creator: req.userId,
    });
    
    res.status(201).json(wish);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// 3. Pitch Quote Offer as a Lender
router.post("/:id/pitch", verifyToken, async (req, res) => {
  try {
    const { quoteAmount, productDetails } = req.body;
    const wish = await Wish.findById(req.params.id);
    if (!wish) return res.status(404).json({ msg: "Wish request not found" });

    const finalQuoteAmount = quoteAmount || wish.budget;
    const finalProductDetails = productDetails || "Offered borrower wish request item.";

    // Create a mock/real product mapped for negotiation/chat context
    const p = await Product.create({
      title: wish.title,
      description: finalProductDetails,
      category: wish.category,
      rentalPrice: finalQuoteAmount,
      securityDeposit: Math.round(finalQuoteAmount * 2.5),
      city: "Hyderabad",
      area: "Madhapur",
      productType: "RENT",
      owner: req.userId,
      status: "RESERVED",
    });

    const durationDays = wish.durationDays || 1;
    const deposit = Math.round(finalQuoteAmount * 2.5);
    const totalPaid = (finalQuoteAmount * durationDays) + deposit;

    const transaction = await Transaction.create({
      product: p._id,
      borrower: wish.creator,
      owner: req.userId,
      startDate: new Date(),
      endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      dailyRate: finalQuoteAmount,
      securityDeposit: deposit,
      totalPaid,
      status: "PENDING_NEGOTIATION",
    });

    // Append quotes pitch to the array
    wish.offers.push({
      owner: req.userId,
      quoteAmount: finalQuoteAmount,
      productDetails: finalProductDetails,
    });

    await wish.save();

    // Create custom NEGOTIATION notification with transactionId
    const notif = new Notification({
      recipient: wish.creator,
      sender: req.userId,
      message: `New Offer for your wish "${wish.title}". Click Chat Now to discuss about the requested product.`,
      type: "NEGOTIATION",
      transactionId: transaction._id
    });
    await notif.save();

    res.json(wish);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// 4. Accept Quote Offer & Convert to Payment Lease Process
router.post("/:id/accept", verifyToken, async (req, res) => {
  try {
    const { offerId, productId } = req.body;
    const wish = await Wish.findById(req.params.id);
    if (!wish) return res.status(404).json({ msg: "Wish request not found" });

    const selectedOffer = wish.offers.id(offerId);
    if (!selectedOffer) return res.status(404).json({ msg: "Quote offer not found" });

    wish.status = "FULFILLED";
    await wish.save();

    // Create a physical mock/real product if owner maps their quote proposal details or select one
    let targetProductId = productId;
    if (!targetProductId) {
      const p = await Product.create({
        title: wish.title,
        description: selectedOffer.productDetails || wish.description,
        category: wish.category,
        rentalPrice: selectedOffer.quoteAmount,
        securityDeposit: Math.round(selectedOffer.quoteAmount * 2.5),
        city: "Hyderabad",
        area: "Madhapur",
        productType: "RENT",
        owner: selectedOffer.owner,
        status: "RESERVED",
      });
      targetProductId = p._id;
    }

    const durationDays = wish.durationDays;
    const dailyPrice = selectedOffer.quoteAmount;
    const deposit = Math.round(dailyPrice * 2.5);
    const totalPaid = (dailyPrice * durationDays) + deposit;

    // Direct transition to escrow checkout process
    const transaction = await Transaction.create({
      product: targetProductId,
      borrower: req.userId,
      owner: selectedOffer.owner,
      startDate: new Date(),
      endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      dailyRate: dailyPrice,
      securityDeposit: deposit,
      totalPaid,
      status: "AWAITING_PAYMENT",
    });

    await createNotification(selectedOffer.owner, "OFFER_ACCEPTED", "Quote Offer Selected!", `Your quote for "${wish.title}" was selected. Awaiting borrower payment.`, req.userId);

    res.json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// 5. Track/increment views with deduplication
router.post("/:id/view", async (req, res) => {
  try {
    const { anonViewerId } = req.body;
    const wish = await Wish.findById(req.params.id);
    if (!wish) return res.status(404).json({ msg: "Wish not found" });

    // Try to extract userId if token is present
    let viewerId = null;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        viewerId = decoded.id;
      } catch (err) {
        // Ignore invalid token, treat as guest
      }
      
    }

    // 1. Ignore if viewer is the creator
    const creatorId = wish.creator.toString();
    if (viewerId && creatorId === viewerId.toString()) {
      return res.json({ success: true, views: wish.views, msg: "Creator view ignored" });
    }

    let isNewView = false;
console.log("isNewView:", isNewView);
    if (viewerId) {
      // Authenticated user
   console.log("VIEW REQUEST");
console.log("wishId:", req.params.id);
console.log("viewerId:", viewerId);
console.log("referer:", req.headers.referer);
      console.log("VIEW REQUEST");
console.log("viewerId:", viewerId);
console.log("viewedByUsers:", wish.viewedByUsers);
      if (!wish.viewedByUsers.includes(viewerId)) {
        wish.viewedByUsers.push(viewerId);
        isNewView = true;
      }
    } else if (anonViewerId) {
      // Guest user
      if (!wish.viewedByGuests.includes(anonViewerId)) {
        wish.viewedByGuests.push(anonViewerId);
        isNewView = true;
      }
    }

    if (isNewView) {
      wish.views = (wish.views || 0) + 1;
      await wish.save();
    }

    res.json({ success: true, views: wish.views });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;
