/**
 * AuctionService — Single source of truth for all auction business logic.
 *
 * Both entry points (owner-initiated via auctionController and auto-surge
 * via rent.js) MUST call this service. No controller or route should
 * construct Auction documents directly.
 *
 * Methods:
 *   createAuction(params, session, io) — creates auction, wires to product, schedules end, emits socket
 *   attachAuctionToProduct(productId, auctionId, session) — helper: set activeAuctionId + AUCTION_ACTIVE
 *   clearAuctionFromProduct(productId, session) — helper: clear activeAuctionId + reset status
 */

import mongoose from 'mongoose';
import Auction from '../models/Auction.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import { scheduleAuctionEnd } from './auctionSchedulerService.js';
import { AuctionStates } from './auctionStateMachine.js';

/**
 * Creates an auction atomically.
 *
 * @param {object} params
 * @param {string}  params.productId
 * @param {string}  params.ownerId       — real authenticated user ID
 * @param {string}  params.type          — "RENTAL" | "SECOND_HAND"
 * @param {number}  params.startingBid
 * @param {number}  params.reservePrice
 * @param {number}  params.durationHours
 * @param {object}  session              — existing Mongoose ClientSession (must already be in a transaction)
 * @param {object}  [io]                 — Socket.io server instance (optional)
 *
 * @returns {Promise<Auction>}           — the created Auction document
 * @throws  {Error}                      — throws on duplicate auction or validation failure
 */
export const createAuction = async (
  { productId, ownerId, type, startingBid, reservePrice, durationHours },
  session,
  io = null
) => {
  // Guard: no duplicate auction on same product
  const existing = await Auction.findOne({ product: productId, status: AuctionStates.ACTIVE }).session(session);
  if (existing) {
    throw new Error('An active auction already exists for this product.');
  }

  const product = await Product.findById(productId).session(session);
  if (!product) throw new Error('Product not found');
  if (product.activeAuctionId) throw new Error('Listing already has an active auction');
  if (product.status === 'AUCTION_ACTIVE') throw new Error('Listing is already in an active auction');

  const endTime = new Date(Date.now() + durationHours * 60 * 60 * 1000);

  const [auction] = await Auction.create([{
    product: productId,
    ownerId,
    type,
    startingBid,
    reservePrice,
    currentHighestBid: 0,
    endTime,
    durationHours,
    status: AuctionStates.ACTIVE,
  }], { session });

  // Attach auction to product atomically within the same transaction
  await attachAuctionToProduct(productId, auction._id, session);

  // Schedule auction end (no-op if scheduler is disabled)
  await scheduleAuctionEnd(auction._id, endTime);

  // Notify owner that auction has started
  await Notification.create([{
    recipient: ownerId,
    sender: null,
    message: `Your listing "${product.title}" has entered an active auction! Auction ends at ${endTime.toLocaleString()}.`,
    type: 'NEGOTIATION',
  }], { session });

  // Broadcast to product room (bidders who may be viewing the page)
  if (io) {
    io.to(productId.toString()).emit('auction:started', {
      auction,
      productId: productId.toString(),
    });
  }

  return auction;
};

/**
 * Attaches an auction to a product and sets product status to AUCTION_ACTIVE.
 * Must be called within an active session/transaction.
 */
export const attachAuctionToProduct = async (productId, auctionId, session) => {
  await Product.findByIdAndUpdate(
    productId,
    {
      activeAuctionId: auctionId,
      status: 'AUCTION_ACTIVE',
    },
    { session }
  );
};

/**
 * Clears the auction reference from a product after auction ends.
 * Resets product status to ACTIVE so it can be rented/negotiated again.
 * Must be called within an active session/transaction.
 */
export const clearAuctionFromProduct = async (productId, session) => {
  await Product.findByIdAndUpdate(
    productId,
    {
      activeAuctionId: null,
      status: 'ACTIVE',
    },
    { session }
  );
};
