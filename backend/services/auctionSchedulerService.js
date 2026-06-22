import Agenda from 'agenda';
import mongoose from 'mongoose';
import Auction from '../models/Auction.js';
import { transitionState, AuctionStates } from './auctionStateMachine.js';
import { settleAuction } from './settlementService.js';

let agenda;
agenda = new Agenda({
  mongo: mongoose.connection.db
});
export const initAuctionScheduler = () => {
  // Initialize Agenda using connection string (compatible with Agenda 6.x)
  agenda = new Agenda({
    db: { address: process.env.MONGO_URI, collection: 'agendaJobs' }
  });

  // Define jobs
  agenda.define('auction-end', async (job) => {
    const { auctionId } = job.attrs.data;
    const session = await mongoose.startSession();
    
    // Check if replica set is available for transactions
    const hasReplicaSet = mongoose.connection.client.topology.s.description.type === 'ReplicaSetWithPrimary';
    
    if (hasReplicaSet) {
      session.startTransaction();
    }
    
    try {
      // Refresh lock to prevent timeout during long ops
      await job.touch();
      
      const auction = hasReplicaSet 
        ? await Auction.findById(auctionId).session(session)
        : await Auction.findById(auctionId);
      
      if (!auction || auction.status !== AuctionStates.ACTIVE) {
        if (hasReplicaSet) await session.abortTransaction();
        session.endSession();
        return;
      }

      // Check if time is actually up (anti-sniping might have extended it)
      if (new Date() < auction.endTime) {
        // Reschedule
        await agenda.schedule(auction.endTime, 'auction-end', { auctionId });
        if (hasReplicaSet) await session.abortTransaction();
        session.endSession();
        return;
      }

      if (auction.currentHighestBid >= auction.reservePrice) {
        await transitionState(auctionId, AuctionStates.ENDED, null, { reason: 'Time expired' }, hasReplicaSet ? session : null);
        await transitionState(auctionId, AuctionStates.PAYMENT_PENDING, null, {}, hasReplicaSet ? session : null);
        
        // Trigger Settlement
        await settleAuction(auctionId, hasReplicaSet ? session : null);
        
        // Schedule winner payment expiration (e.g., 24 hours)
        const expireTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await agenda.schedule(expireTime, 'winner-payment-expired', { auctionId });
      } else {
        await transitionState(auctionId, AuctionStates.ENDED, null, { reason: 'Time expired' }, hasReplicaSet ? session : null);
        await transitionState(auctionId, AuctionStates.RESERVE_NOT_MET, null, {}, hasReplicaSet ? session : null);
      }

      if (hasReplicaSet) await session.commitTransaction();
    } catch (error) {
      if (hasReplicaSet) await session.abortTransaction();
      console.error('Error in auction-end job:', error);
    } finally {
      session.endSession();
    }
  });


  agenda.define('auction-reminder', async (job) => {
    // Send 30m / 10m / 2m remaining notifications via notificationQueueService
  });
};

export const scheduleAuctionEnd = async (auctionId, endTime) => {
  if (agenda) {
    await agenda.schedule(endTime, 'auction-end', { auctionId });
  }
};
