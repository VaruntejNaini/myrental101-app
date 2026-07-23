import { io } from "socket.io-client";
import { STORAGE_KEYS } from "../constants/auth";

const SOCKET_URL = "";

let socket = null;

export function connectSocket() {
  if (socket && socket.connected) {
    return socket;
  }

  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

  socket = io(SOCKET_URL, {
    auth: { token: token || undefined },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function reconnectSocketWithAuth() {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

  if (socket) {
    socket.auth = { token: token || undefined };
    socket.disconnect();
    socket.connect();
  } else {
    connectSocket();
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}