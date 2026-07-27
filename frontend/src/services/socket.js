import { io } from "socket.io-client";
import { STORAGE_KEYS } from "../constants/auth";

const SOCKET_URL = "";

let socket = null;

export function connectSocket() {
  if (socket && socket.connected) {
    return socket;
  }

  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

  const env = import.meta.env.MODE || "unknown";
  const isProd = env === "production";

  console.log(`[Socket] connectSocket called | env=${env} | SOCKET_URL="${SOCKET_URL}"`);

  socket = io(SOCKET_URL, {
    auth: { token: token || undefined },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  console.log(`[Socket] socket initialized | id=${socket.id} | connected=${socket.connected}`);

  socket.on("connect", () => {
    console.log(`[Socket] connect | id=${socket.id}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[Socket] disconnect | id=${socket.id || "none"} | reason=${reason}`);
  });

  socket.on("connect_error", (err) => {
    console.log(`[Socket] connect_error | message=${err.message} | name=${err.name} | stack=${err.stack}`);
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log(`[Socket] reconnect | id=${socket.id} | attempt=${attemptNumber}`);
  });

  socket.on("reconnect_attempt", (attemptNumber) => {
    console.log(`[Socket] reconnect_attempt | attempt=${attemptNumber}`);
  });

  socket.on("reconnect_error", (err) => {
    console.log(`[Socket] reconnect_error | message=${err.message} | name=${err.name}`);
  });

  socket.on("reconnect_failed", () => {
    console.log(`[Socket] reconnect_failed`);
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