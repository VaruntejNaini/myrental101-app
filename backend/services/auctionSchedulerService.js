import Agenda from 'agenda';
import mongoose from 'mongoose';
import Auction from '../models/Auction.js';
import { transitionState, AuctionStates } from './auctionStateMachine.js';
import { settleAuction } from './settlementService.js';
import { getIo } from '../sockets/auctionSockets.js';

// Singleton guard — scheduler must only initialize once
let agenda = null;
let schedulerStarted = false;

export const initAuctionScheduler = async () => {
  if (schedulerStarted) {
    console.log('[Scheduler] Already initialized — skipping duplicate init.');
    return;
  }

  agenda = new Agenda({
    db: { address: process.env.MONGO_URI, collection: 'agendaJobs' },
    processEvery: '30 seconds',
  });

  // ─── Job: auction-end ────────────────────────────────────────────────────
  agenda.define('auction-end', async (job) => {
    const { auctionId } = job.attrs.data;
    console.log(`[Scheduler] auction-end fired for auctionId: ${auctionId}`);

    const session = await mongoose.startSession();
    const hasReplicaSet =
      mongoose.connection.client?.topology?.s?.description?.type === 'ReplicaSetWithPrimary';

    if (hasReplicaSet) session.startTransaction();

    try {
      await job.touch(); // Prevent job timeout during long ops

      const auction = await Auction.findById(auctionId).session(hasReplicaSet ? session : null);

      if (!auction) {
        console.warn(`[Scheduler] Auction ${auctionId} not found — skipping.`);
        if (hasReplicaSet) await session.abortTransaction();
        return;
      }

      if (auction.status !== AuctionStates.ACTIVE) {
        console.log(`[Scheduler] Auction ${auctionId} is ${auction.status} — skipping.`);
        if (hasReplicaSet) await session.abortTransaction();
        return;
      }

      // Anti-sniping may have extended endTime — reschedule if still in the future
      if (new Date() < new Date(auction.endTime)) {
        console.log(`[Scheduler] Auction ${auctionId} end time extended — rescheduling.`);
        await agenda.schedule(auction.endTime, 'auction-end', { auctionId });
        if (hasReplicaSet) await session.abortTransaction();
        return;
      }

      const sessionArg = hasReplicaSet ? session : null;

      if (auction.currentHighestBid >= auction.reservePrice && auction.highestBidderId) {
        // Reserve met — transition and settle
        await transitionState(auctionId, AuctionStates.ENDED, null, { reason: 'Time expired' }, sessionArg);
        await transitionState(auctionId, AuctionStates.PAYMENT_PENDING, null, {}, sessionArg);

        let io = null;
        try { io = getIo(); } catch (_) {}
        await settleAuction(auctionId, sessionArg, io);

        // Schedule winner payment expiration (24 hours)
        const expireTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await agenda.schedule(expireTime, 'winner-payment-expired', { auctionId });
      } else {
        // Reserve not met
        await transitionState(auctionId, AuctionStates.ENDED, null, { reason: 'Time expired' }, sessionArg);
        await transitionState(auctionId, AuctionStates.RESERVE_NOT_MET, null, {}, sessionArg);

        // Broadcast no-winner end
        let io = null;
        try { io = getIo(); } catch (_) {}
        if (io) {
          io.to(auctionId.toString()).emit('auction:end', {
            auctionId: auctionId.toString(),
            winnerId: null,
            reason: 'reserve_not_met',
          });
        }

        console.log(`[Scheduler] Auction ${auctionId} ended — reserve not met.`);
      }

      if (hasReplicaSet) await session.commitTransaction();
    } catch (error) {
      if (hasReplicaSet) await session.abortTransaction();
      console.error(`[Scheduler] Error in auction-end for ${auctionId}:`, error.message);
      throw error; // Let Agenda mark the job as failed for retry
    } finally {
      session.endSession();
    }
  });

  // ─── Job: winner-payment-expired ─────────────────────────────────────────
  agenda.define('winner-payment-expired', async (job) => {
    const { auctionId } = job.attrs.data;
    console.log(`[Scheduler] winner-payment-expired fired for auctionId: ${auctionId}`);

    // If winner hasn't paid in 24h, transition to PAYMENT_EXPIRED
    // This is a no-op guard for now — the state machine handles the transition
    try {
      const auction = await Auction.findById(auctionId);
      if (!auction) return;
      if (auction.status === AuctionStates.PAYMENT_PENDING) {
        await transitionState(auctionId, AuctionStates.PAYMENT_EXPIRED, null, { reason: 'Payment window expired' }, null);
        console.log(`[Scheduler] Auction ${auctionId} marked PAYMENT_EXPIRED.`);
      }
    } catch (err) {
      console.error(`[Scheduler] winner-payment-expired error for ${auctionId}:`, err.message);
    }
  });

  // ─── Job: auction-reminder (stub — defined to avoid undefined job error) ──
  agenda.define('auction-reminder', async (job) => {
    const { auctionId } = job.attrs.data;
    // TODO: Send 30m / 10m / 2m remaining notifications
    console.log(`[Scheduler] auction-reminder for ${auctionId} (not yet implemented)`);
  });

  await agenda.start();
  schedulerStarted = true;
  console.log('[Scheduler] Auction scheduler started ✅');
};

/**
 * Schedule the auction-end job for a given auction.
 * Safe to call even if scheduler is disabled — silently no-ops.
 */
export const scheduleAuctionEnd = async (auctionId, endTime) => {
  if (!agenda) {
    console.warn('[Scheduler] scheduleAuctionEnd called but scheduler is not initialized.');
    return;
  }
  await agenda.schedule(endTime, 'auction-end', { auctionId: auctionId.toString() });
  console.log(`[Scheduler] auction-end scheduled for ${auctionId} at ${endTime}`);
};
