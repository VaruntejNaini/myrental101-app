import express from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import Auction from '../models/Auction.js';
import Bid from '../models/Bid.js';
import { AuctionStates } from '../services/auctionStateMachine.js';
import { scheduleAuctionEnd } from '../services/auctionSchedulerService.js';
import { analyzeBidForFraud } from '../services/fraudDetectionService.js';
import Product from '../models/Product.js';
import { verifyToken } from '../middleware/auth.js';
import { createAuction } from '../services/auctionService.js';

const router = express.Router();

const bidRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many bids from this IP, please try again after a minute',
});

// 1. Create/Initiate Auction — owner-initiated path
router.post('/initiate', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId, startingBid, reservePrice, durationHours, type } = req.body;

    // Validate input
    if (!productId || !startingBid || !reservePrice || !durationHours || !type) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'productId, startingBid, reservePrice, durationHours, and type are required' });
    }

    // Ownership check — only the product owner can initiate an auction
    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product.owner.toString() !== req.userId) {
      await session.abortTransaction();
      return res.status(403).json({ error: 'Only the product owner can initiate an auction' });
    }

    const io = req.app.get('io');
    const auction = await createAuction(
      { productId, ownerId: req.userId, type, startingBid, reservePrice, durationHours },
      session,
      io
    );

    await session.commitTransaction();
    res.status(201).json(auction);
  } catch (error) {
    await session.abortTransaction();
    res.status(409).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// 2. Place Bid (Idempotent, Transaction-safe, Concurrency-safe)
router.post('/:id/bid', verifyToken, bidRateLimiter, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { amount, idempotencyKey } = req.body;
    const auctionId = req.params.id;

    if (!amount || !idempotencyKey) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'amount and idempotencyKey are required' });
    }

    // Idempotency check
    const existingBid = await Bid.findOne({ idempotencyKey }).session(session);
    if (existingBid) {
      await session.abortTransaction();
      return res.status(200).json(existingBid);
    }

    const auction = await Auction.findById(auctionId).session(session);
    if (!auction || auction.status !== AuctionStates.ACTIVE) {
      throw new Error('Auction is not active');
    }

    if (auction.ownerId.toString() === req.userId) {
      throw new Error('Owner cannot bid on their own auction');
    }

    if (amount < auction.currentHighestBid + auction.minimumIncrement) {
      throw new Error(`Bid must be at least ₹${auction.currentHighestBid + auction.minimumIncrement}`);
    }

    // Fraud check
    await analyzeBidForFraud({ ipAddress: req.ip, bidderId: req.userId }, auctionId, session);

    // Save bid
    const bid = new Bid({
      auctionId,
      bidderId: req.userId,
      amount,
      idempotencyKey,
      ipAddress: req.ip
    });
    await bid.save({ session });

    // Update Auction (Optimistic Concurrency handles the 'version' bump on save)
    auction.currentHighestBid = amount;
    auction.highestBidderId = req.userId;

    // Anti-sniping: extend by 2 min if bid arrives in last 2 min
    let extended = false;
    const timeRemaining = auction.endTime - new Date();
    if (timeRemaining < 2 * 60 * 1000) {
      auction.endTime = new Date(auction.endTime.getTime() + 2 * 60 * 1000);
      await scheduleAuctionEnd(auction._id, auction.endTime);
      extended = true;
    }

    await auction.save({ session }); // Will throw VersionError if stale write

    await session.commitTransaction();

    // Broadcast to auction room
    const io = req.app.get('io');
    if (io) {
      io.to(auctionId).emit('auction:update', auction);
      io.to(auctionId).emit('auction:new_bid', bid.toObject());
      if (extended) io.to(auctionId).emit('auction:extended', { endTime: auction.endTime });
    }

    res.status(201).json({ bid, auction });
  } catch (error) {
    await session.abortTransaction();
    if (error.name === 'VersionError') {
      return res.status(409).json({ error: 'Bid was outbid during processing. Please refresh and try again.' });
    }
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

export default router;
