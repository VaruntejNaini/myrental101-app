import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "";

export const useAuctionSocket = (auctionId) => {
  const [socket, setSocket] = useState(null);
  const [auctionState, setAuctionState] = useState(null);
  const [bids, setBids] = useState([]);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  useEffect(() => {
    if (!auctionId) return;

    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      // Reconnection Recovery triggers refetch immediately
      newSocket.emit('auction:join', auctionId);
    });

    newSocket.on('auction:sync', (data) => {
      setAuctionState(data.auction);
      setBids(data.bids);
      // Calculate server time offset to keep local countdown accurate
      const offset = new Date(data.serverTime).getTime() - Date.now();
      setServerTimeOffset(offset);
    });

    newSocket.on('auction:update', (updatedAuction) => {
      setAuctionState(updatedAuction);
    });

    newSocket.on('auction:new_bid', (newBid) => {
      setBids(prev => [newBid, ...prev]);
    });

    newSocket.on('auction:end', (finalState) => {
      setAuctionState(finalState);
    });

    return () => {
      newSocket.emit('auction:leave', auctionId);
      newSocket.disconnect();
    };
  }, [auctionId]);

  return { socket, auctionState, bids, serverTimeOffset };
};
