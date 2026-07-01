import mongoose from 'mongoose';
import Auction from '../models/Auction.js';
import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import { clearAuctionFromProduct } from './auctionService.js';

/**
 * Settles a completed auction.
 *
 * Called by the scheduler (auctionSchedulerService) after auction-end job fires
 * and currentHighestBid >= reservePrice.
 *
 * Within one atomic operation:
 *   1. Creates a Transaction in AWAITING_PAYMENT for the winner
 *   2. Notifies the winner to proceed to checkout
 *   3. Notifies the owner that their item was won
 *   4. Clears activeAuctionId from the product and resets status to ACTIVE
 *
 * @param {string}  auctionId
 * @param {object}  session    — Mongoose ClientSession (already in a transaction)
 * @param {object}  [io]       — Socket.io server (optional, for auction:end broadcast)
 */
export const settleAuction = async (auctionId, session, io = null) => {
  const auction = await Auction.findById(auctionId).session(session);
  if (!auction) throw new Error(`Auction ${auctionId} not found during settlement`);

  const product = await Product.findById(auction.product).session(session);
  if (!product) throw new Error(`Product for auction ${auctionId} not found during settlement`);

  // No bids — reserve not met, nothing to settle beyond clearing product state
  if (!auction.highestBidderId || auction.currentHighestBid === 0) {
    console.log(`[Settlement] Auction ${auctionId}: no winner. Clearing product state.`);
    await clearAuctionFromProduct(auction.product, session);
    return null;
  }

  const isRental = auction.type === 'RENTAL';
  const now = new Date();
  const defaultDurationDays = 3; // winner sets actual dates at checkout
  const endDate = new Date(now.getTime() + defaultDurationDays * 24 * 60 * 60 * 1000);

  const totalPaid = isRental
    ? (auction.currentHighestBid * defaultDurationDays) + (product.securityDeposit || 0)
    : auction.currentHighestBid;

  // Create Transaction for the winner — status AWAITING_PAYMENT so they can checkout
  const [transaction] = await Transaction.create([{
    product: auction.product,
    borrower: auction.highestBidderId,
    owner: auction.ownerId,
    startDate: now,
    endDate,
    dailyRate: auction.currentHighestBid,
    securityDeposit: isRental ? (product.securityDeposit || 0) : 0,
    totalPaid,
    status: 'AWAITING_PAYMENT',
    negotiationHistory: [{
      offeredBy: auction.highestBidderId,
      rate: auction.currentHighestBid,
    }],
  }], { session });

  // Notify winner
  await Notification.create([{
    recipient: auction.highestBidderId,
    sender: auction.ownerId,
    message: `🏆 You won the auction for "${product.title}"! Proceed to checkout to complete your ${isRental ? 'rental' : 'purchase'}.`,
    type: 'NEGOTIATION',
    transactionId: transaction._id,
  }], { session });

  // Notify owner
  await Notification.create([{
    recipient: auction.ownerId,
    sender: auction.highestBidderId,
    message: `Your listing "${product.title}" was won at ₹${auction.currentHighestBid}. Awaiting buyer checkout.`,
    type: 'NEGOTIATION',
    transactionId: transaction._id,
  }], { session });

  // Clear auction from product — reset to ACTIVE so it can be used again if checkout fails
  await clearAuctionFromProduct(auction.product, session);

  // Broadcast auction end to all viewers
  if (io) {
    io.to(auctionId.toString()).emit('auction:end', {
      auctionId: auctionId.toString(),
      winnerId: auction.highestBidderId.toString(),
      winningBid: auction.currentHighestBid,
      transactionId: transaction._id.toString(),
    });
  }

  console.log(`[Settlement] Auction ${auctionId} settled. Winner: ${auction.highestBidderId}, Transaction: ${transaction._id}`);
  return transaction;
};
