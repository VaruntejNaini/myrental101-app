// ─────────────────────────────────────────────────────────────────────────────
// CHAT SOCKET HANDLERS
// Registers all real-time chat events on the existing Socket.IO server.
// ─────────────────────────────────────────────────────────────────────────────
import jwt from "jsonwebtoken";
import Message from "../models/Message.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import {
  canReadChat,
  canWriteChat,
  isChatParticipant,
  getChatReceiverId,
} from "../utils/chatPolicy.js";

// ── Room helpers ─────────────────────────────────────────────────────────────

export function getChatRoom(transactionId) {
  return `chat:transaction:${String(transactionId)}`;
}

export function getUserRoom(userId) {
  return `user:${String(userId)}`;
}

// ── Active-chat detection across all sockets of a user ──────────────────────

export async function isUserActivelyViewingTransaction(io, userId, transactionId) {
  const userRoom = getUserRoom(userId);
  let sockets = [];
  try {
    sockets = await io.in(userRoom).fetchSockets();
  } catch (err) {
    console.error("[Socket] Error fetching user sockets for activity check:", err);
    return false;
  }

  const normalizedTargetId = String(transactionId);

  return sockets.some((socket) => {
    const activeId = socket.activeChatTransactionId;
    return (
      activeId !== undefined &&
      activeId !== null &&
      String(activeId) === normalizedTargetId
    );
  });
}

// ── Register chat handlers on the shared io instance ─────────────────────────

export function registerChatSocketHandlers(io) {
  // ── Helper: consistent acknowledgment response ──────────────────────────

  const respond = (callback, success, data = null, code = null, error = null) => {
    if (typeof callback !== "function") return;
    if (success) {
      callback({ success: true, data });
    } else {
      callback({ success: false, code, error });
    }
  };

  // ── Helper: JWT auth guard for chat events ──────────────────────────────

  const requireAuth = (socket, callback) => {
    if (!socket.userId || socket.authState !== "authenticated") {
      respond(callback, false, null, "AUTH_REQUIRED", "Authentication required");
      return false;
    }
    return true;
  };

  // ── chat:join ──────────────────────────────────────────────────────────

  io.on("connection", (socket) => {
    socket.on("chat:join", async ({ transactionId }, callback) => {
      try {
        if (!requireAuth(socket, callback)) return;

        if (!transactionId || !String(transactionId).match(/^[0-9a-fA-F]{24}$/)) {
          return respond(callback, false, null, "INVALID_TRANSACTION_ID", "Invalid transaction ID");
        }

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
          return respond(callback, false, null, "TRANSACTION_NOT_FOUND", "Transaction not found");
        }

        if (!isChatParticipant(transaction, socket.userId)) {
          return respond(callback, false, null, "FORBIDDEN", "Access denied: you are not a participant");
        }

        if (!canReadChat(transaction)) {
          return respond(callback, false, null, "CHAT_NOT_AVAILABLE", "Chat not available for this transaction status");
        }

        const room = getChatRoom(transactionId);
        socket.join(room);
        console.log(`[Socket] User ${socket.userId} joined chat room ${room}`);

        return respond(callback, true, { transactionId });
      } catch (err) {
        console.error("[Socket] Error in chat:join:", err);
        return respond(callback, false, null, "INTERNAL_ERROR", "An internal error occurred. Please try again.");
      }
    });

    // ── chat:leave ────────────────────────────────────────────────────────

    socket.on("chat:leave", ({ transactionId }, callback) => {
      try {
        if (!requireAuth(socket, callback)) return;

        const room = getChatRoom(transactionId);
        socket.leave(room);

        if (String(transactionId) === String(socket.activeChatTransactionId)) {
          socket.activeChatTransactionId = null;
        }

        console.log(`[Socket] User ${socket.userId} left chat room ${room}`);
        return respond(callback, true, { transactionId });
      } catch (err) {
        console.error("[Socket] Error in chat:leave:", err);
        return respond(callback, false, null, "INTERNAL_ERROR", "An internal error occurred. Please try again.");
      }
    });

    // ── chat:send_message ─────────────────────────────────────────────────

    socket.on("chat:send_message", async ({ transactionId, content }, callback) => {
      try {
        if (!requireAuth(socket, callback)) return;

        if (!transactionId || !String(transactionId).match(/^[0-9a-fA-F]{24}$/)) {
          return respond(callback, false, null, "INVALID_TRANSACTION_ID", "Invalid transaction ID");
        }

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
          return respond(callback, false, null, "TRANSACTION_NOT_FOUND", "Transaction not found");
        }

        if (!isChatParticipant(transaction, socket.userId)) {
          return respond(callback, false, null, "FORBIDDEN", "Access denied: you are not a participant");
        }

        if (!canWriteChat(transaction)) {
          return respond(callback, false, null, "CHAT_NOT_AVAILABLE", "Sending messages is not allowed for this transaction status");
        }

        const cleanContent = typeof content === "string" ? content.trim() : "";
        if (!cleanContent) {
          return respond(callback, false, null, "INVALID_MESSAGE", "Message cannot be empty");
        }
        if (cleanContent.length > 2000) {
          return respond(callback, false, null, "MESSAGE_TOO_LONG", "Message must be under 2000 characters");
        }

        const receiverId = getChatReceiverId(transaction, socket.userId);
        if (!receiverId) {
          return respond(callback, false, null, "FORBIDDEN", "Could not determine message receiver");
        }

        // Create the message
        const savedMessage = await Message.create({
          transaction: transactionId,
          sender: socket.userId,
          receiver: receiverId,
          content: cleanContent,
        });

        // Populate sender info for the frontend
        const populatedMessage = await Message.findById(savedMessage._id).populate(
          "sender",
          "name"
        );

        if (!populatedMessage) {
          return respond(callback, false, null, "INTERNAL_ERROR", "Failed to save message");
        }

        // Determine if receiver is actively viewing and update readStatus
        const receiverActive = await isUserActivelyViewingTransaction(
          io,
          receiverId,
          transactionId
        );

        if (receiverActive) {
          await Message.findByIdAndUpdate(populatedMessage._id, { readStatus: true });
          Object.assign(populatedMessage, { readStatus: true });
        }

        // Emit to transaction room
        const chatRoom = getChatRoom(transactionId);
        io.to(chatRoom).emit("chat:new_message", populatedMessage);

        // Calculate authoritative unread count for receiver
        const unreadCount = await Message.countDocuments({
          receiver: receiverId,
          readStatus: false,
        });

        const userRoom = getUserRoom(receiverId);
        io.to(userRoom).emit("chat:unread_count_updated", { unreadCount });

        return respond(callback, true, { messageId: populatedMessage._id });
      } catch (err) {
        console.error("[Socket] Error in chat:send_message:", err);
        return respond(callback, false, null, "INTERNAL_ERROR", "An internal error occurred. Please try again.");
      }
    });

    // ── chat:mark_read ────────────────────────────────────────────────────

    socket.on("chat:mark_read", async ({ transactionId }, callback) => {
      try {
        if (!requireAuth(socket, callback)) return;

        if (!transactionId || !String(transactionId).match(/^[0-9a-fA-F]{24}$/)) {
          return respond(callback, false, null, "INVALID_TRANSACTION_ID", "Invalid transaction ID");
        }

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
          return respond(callback, false, null, "TRANSACTION_NOT_FOUND", "Transaction not found");
        }

        if (!isChatParticipant(transaction, socket.userId)) {
          return respond(callback, false, null, "FORBIDDEN", "Access denied");
        }

        await Message.updateMany(
          {
            transaction: transactionId,
            receiver: socket.userId,
            readStatus: false,
          },
          { readStatus: true }
        );

        const unreadCount = await Message.countDocuments({
          receiver: socket.userId,
          readStatus: false,
        });

        const userRoom = getUserRoom(socket.userId);
        io.to(userRoom).emit("chat:unread_count_updated", { unreadCount });

        io.to(getChatRoom(transactionId)).emit("chat:messages_read", {
          transactionId,
          readBy: socket.userId,
        });

        return respond(callback, true, { unreadCount });
      } catch (err) {
        console.error("[Socket] Error in chat:mark_read:", err);
        return respond(callback, false, null, "INTERNAL_ERROR", "An internal error occurred. Please try again.");
      }
    });

    // ── chat:set_active ───────────────────────────────────────────────────

    socket.on("chat:set_active", async ({ transactionId }, callback) => {
      try {
        if (!requireAuth(socket, callback)) return;

        if (!transactionId || !String(transactionId).match(/^[0-9a-fA-F]{24}$/)) {
          return respond(callback, false, null, "INVALID_TRANSACTION_ID", "Invalid transaction ID");
        }

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
          return respond(callback, false, null, "TRANSACTION_NOT_FOUND", "Transaction not found");
        }

        if (!isChatParticipant(transaction, socket.userId)) {
          return respond(callback, false, null, "FORBIDDEN", "Access denied: you are not a participant");
        }

        if (!canReadChat(transaction)) {
          return respond(callback, false, null, "CHAT_NOT_AVAILABLE", "Chat not available for this transaction status");
        }

        // Ensure socket is in the room (same authorization logic)
        const room = getChatRoom(transactionId);
        socket.join(room);

        socket.activeChatTransactionId = String(transactionId);
        console.log(`[Socket] User ${socket.userId} set active chat to ${transactionId}`);

        return respond(callback, true, { transactionId });
      } catch (err) {
        console.error("[Socket] Error in chat:set_active:", err);
        return respond(callback, false, null, "INTERNAL_ERROR", "An internal error occurred. Please try again.");
      }
    });

    // ── chat:clear_active ─────────────────────────────────────────────────

    socket.on("chat:clear_active", (_, callback) => {
      try {
        if (!requireAuth(socket, callback)) return;

        const previous = socket.activeChatTransactionId;
        socket.activeChatTransactionId = null;
        console.log(`[Socket] User ${socket.userId} cleared active chat (was ${previous})`);

        return respond(callback, true, {});
      } catch (err) {
        console.error("[Socket] Error in chat:clear_active:", err);
        return respond(callback, false, null, "INTERNAL_ERROR", "An internal error occurred. Please try again.");
      }
    });

    // ── chat:typing (optional) ────────────────────────────────────────────

    socket.on("chat:typing", ({ transactionId, isTyping }, callback) => {
      try {
        if (!requireAuth(socket, callback)) return;

        if (!transactionId || !String(transactionId).match(/^[0-9a-fA-F]{24}$/)) {
          // Don't block on typing validation
          if (typeof callback === "function") {
            respond(callback, true, {});
          }
          return;
        }

        const room = getChatRoom(transactionId);
        socket.to(room).emit("chat:typing", {
          transactionId,
          userId: socket.userId,
          isTyping: !!isTyping,
        });

        if (typeof callback === "function") {
          respond(callback, true, {});
        }
      } catch (err) {
        console.error("[Socket] Error in chat:typing:", err);
        if (typeof callback === "function") {
          respond(callback, false, null, "INTERNAL_ERROR", "An internal error occurred. Please try again.");
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${socket.id} (userId=${socket.userId || "anonymous"})`);
    });
  });
}