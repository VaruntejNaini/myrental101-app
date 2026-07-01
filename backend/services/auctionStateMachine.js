import AuctionAuditLog from '../models/AuctionAuditLog.js';
import Auction from '../models/Auction.js';
import Product from '../models/Product.js';

export const AuctionStates = {
  DRAFT: 'DRAFT',
  ELIGIBLE: 'ELIGIBLE',
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
  RESERVE_NOT_MET: 'RESERVE_NOT_MET',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_EXPIRED: 'PAYMENT_EXPIRED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  PAYMENT_DISPUTED: 'PAYMENT_DISPUTED',
  RENTAL_CONFIRMED: 'RENTAL_CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
};

/**
 * Ensures strict transitions between states.
 */
export const transitionState = async (auctionId, newState, userId = null, metadata = {}, session = null) => {
  const options = session ? { session } : {};
  const auction = await Auction.findById(auctionId).session(session);

  if (!auction) {
    throw new Error('Auction not found');
  }

  const currentState = auction.status;

  // Validation Matrix (Simplified for clarity)
  // Define allowed transitions
  const validTransitions = {
    [AuctionStates.DRAFT]: [AuctionStates.ELIGIBLE, AuctionStates.PENDING, AuctionStates.CANCELLED],
    [AuctionStates.ELIGIBLE]: [AuctionStates.PENDING, AuctionStates.CANCELLED],
    [AuctionStates.PENDING]: [AuctionStates.ACTIVE, AuctionStates.CANCELLED],
    [AuctionStates.ACTIVE]: [AuctionStates.ENDED, AuctionStates.CANCELLED], // Cancelled by Admin due to fraud
    [AuctionStates.ENDED]: [AuctionStates.RESERVE_NOT_MET, AuctionStates.PAYMENT_PENDING],
    [AuctionStates.PAYMENT_PENDING]: [AuctionStates.PAYMENT_COMPLETED, AuctionStates.PAYMENT_FAILED, AuctionStates.PAYMENT_EXPIRED],
    [AuctionStates.PAYMENT_COMPLETED]: [AuctionStates.COMPLETED, AuctionStates.RENTAL_CONFIRMED, AuctionStates.PAYMENT_REFUNDED, AuctionStates.PAYMENT_DISPUTED],
    [AuctionStates.PAYMENT_EXPIRED]: [AuctionStates.CANCELLED],
  };

  const allowedNext = validTransitions[currentState] || [];
  if (!allowedNext.includes(newState)) {
    // Audit log the rejection
    await AuctionAuditLog.create([{
      auctionId,
      userId,
      action: `INVALID_STATE_TRANSITION_ATTEMPT`,
      metadata: { ...metadata, currentState, attemptedState: newState }
    }], options);
    
    throw new Error(`Invalid state transition from ${currentState} to ${newState}`);
  }

  // Handle Cancellation Rules
  if (newState === AuctionStates.CANCELLED) {
    if (currentState === AuctionStates.ACTIVE && auction.currentHighestBid > 0 && !metadata.isAdminForced) {
      throw new Error('Cannot cancel an active auction with existing bids unless forced by admin');
    }
    // Release activeAuctionId on product
    await Product.findByIdAndUpdate(auction.product, { activeAuctionId: null }, options);
  }

  // Update State
  auction.status = newState;
  await auction.save(options);

  // Log transition
  await AuctionAuditLog.create([{
    auctionId,
    userId,
    action: `STATE_TRANSITION_${newState}`,
    metadata: { ...metadata, previousState: currentState }
  }], options);

  return auction;
};
