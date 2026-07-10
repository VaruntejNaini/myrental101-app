import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Auction from '../models/Auction.js';
import Bid from '../models/Bid.js';
import { getChatRoom, getUserRoom } from './chatSockets.js';

let io;

export const initAuctionSockets = (server) => {
  io = new Server(server, {
    cors: { origin: '*' } // Update with specific frontend URL in prod
  });

  // ── Permissive JWT middleware ────────────────────────────────────────────
  // NEVER rejects a connection. Allows public auction viewing while enabling
  // authenticated chat events.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      socket.userId = null;
      socket.authState = 'anonymous';
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.authState = 'authenticated';
      socket.join(getUserRoom(decoded.id));
      console.log(`[Socket] Authenticated socket: ${socket.id} as user ${decoded.id}`);
      return next();
    } catch (err) {
      socket.userId = null;
      socket.authState = 'invalid_token';
      return next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id} (authState=${socket.authState}, userId=${socket.userId || 'null'})`);

    // Reconnection Recovery
    socket.on('auction:join', async (auctionId) => {
      socket.join(auctionId);
      console.log(`[Socket] User ${socket.id} joined auction ${auctionId}`);
      
      // Serve authoritative state immediately
      try {
        const auction = await Auction.findById(auctionId);
        const bids = await Bid.find({ auctionId }).sort({ createdAt: -1 }).limit(50);
        
        socket.emit('auction:sync', {
          auction,
          bids,
          serverTime: new Date()
        });
      } catch (err) {
        console.error('Error syncing auction state:', err);
      }
    });

    socket.on('auction:leave', (auctionId) => {
      socket.leave(auctionId);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id} (userId=${socket.userId || 'anonymous'})`);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export { getChatRoom, getUserRoom };
