import express from "express";
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

    // Append quotes pitch to the array
    wish.offers.push({
      owner: req.userId,
      quoteAmount,
      productDetails,
    });

    await wish.save();

    await createNotification(wish.creator, "WISH_OFFER_RECEIVED", "New Quote Received", `An owner offered a product quote for your wish request: "${wish.title}".`, req.userId);

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

export default router;
