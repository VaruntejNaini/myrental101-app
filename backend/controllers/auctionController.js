import express from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import Auction from '../models/Auction.js';
import Bid from '../models/Bid.js';
import { transitionState, AuctionStates } from '../services/auctionStateMachine.js';
import { scheduleAuctionEnd } from '../services/auctionSchedulerService.js';
import { analyzeBidForFraud } from '../services/fraudDetectionService.js';
import Product from '../models/Product.js';

const router = express.Router();

const bidRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per `window`
  message: 'Too many bids from this IP, please try again after a minute',
});

// Middleware to mock auth user (replace with actual auth middleware)
const requireAuth = (req, res, next) => {
  req.user = req.user || { _id: new mongoose.Types.ObjectId() };
  next();
};

// 1. Create/Initiate Auction
router.post('/initiate', requireAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId, startingBid, reservePrice, durationHours, type } = req.body;
    
    // Check Unique Active Auction Constraint
    const product = await Product.findById(productId).session(session);
    if (!product) throw new Error('Product not found');
    if (product.activeAuctionId) throw new Error('Listing already has an active auction');
    
    const endTime = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    
    const auction = new Auction({
      product: productId,
      ownerId: req.user._id,
      type,
      startingBid,
      reservePrice,
      durationHours,
      endTime,
      status: AuctionStates.ACTIVE
    });

    await auction.save({ session });
    
    product.activeAuctionId = auction._id;
    await product.save({ session });
    
    // Schedule End
    await scheduleAuctionEnd(auction._id, endTime);

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
router.post('/:id/bid', requireAuth, bidRateLimiter, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { amount, idempotencyKey } = req.body;
    const auctionId = req.params.id;
    
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
    
    if (auction.ownerId.toString() === req.user._id.toString()) {
      throw new Error('Owner cannot bid on their own auction');
    }

    if (amount < auction.currentHighestBid + auction.minimumIncrement) {
      throw new Error(`Bid must be at least ${auction.currentHighestBid + auction.minimumIncrement}`);
    }

    // Fraud check
    const fraudScore = await analyzeBidForFraud({ ipAddress: req.ip, bidderId: req.user._id }, auctionId, session);

    // Save bid
    const bid = new Bid({
      auctionId,
      bidderId: req.user._id,
      amount,
      idempotencyKey,
      ipAddress: req.ip
    });
    await bid.save({ session });

    // Update Auction (Optimistic Concurrency handles the 'version' bump on save)
    auction.currentHighestBid = amount;
    auction.highestBidderId = req.user._id;

    // Anti-sniping
    const timeRemaining = auction.endTime - new Date();
    if (timeRemaining < 2 * 60 * 1000) { // less than 2 mins
      auction.endTime = new Date(auction.endTime.getTime() + 2 * 60 * 1000);
      await scheduleAuctionEnd(auction._id, auction.endTime);
    }

    await auction.save({ session }); // Will throw VersionError if stale write
    
    await session.commitTransaction();

    // Trigger socket broadcast (handled elsewhere or here via event emitter)
    req.app.get('io').to(auctionId).emit('auction:update', auction);

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
