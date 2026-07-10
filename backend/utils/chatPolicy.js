// ─────────────────────────────────────────────────────────────────────────────
// SHARED CHAT AUTHORIZATION POLICY
// Single source of truth for chat status rules and participant logic.
// Used by REST routes and Socket.IO handlers.
// ─────────────────────────────────────────────────────────────────────────────

export const CHAT_READ_ALLOWED_STATES = [
  "PENDING_NEGOTIATION",
  "AWAITING_PAYMENT",
  "RESERVED",
  "IN_POSSESSION",
  "RETURN_INITIATED",
  "DAMAGE_REVIEW",
  "DISPUTED",
  "REFUND_PROCESSING",
  "SETTLED",
];

export const CHAT_WRITE_ALLOWED_STATES = [
  "PENDING_NEGOTIATION",
  "AWAITING_PAYMENT",
  "RESERVED",
  "IN_POSSESSION",
  "RETURN_INITIATED",
  "DAMAGE_REVIEW",
  "DISPUTED",
];

export function canReadChat(transaction) {
  return CHAT_READ_ALLOWED_STATES.includes(transaction.status);
}

export function canWriteChat(transaction) {
  return CHAT_WRITE_ALLOWED_STATES.includes(transaction.status);
}

export function isChatParticipant(transaction, userId) {
  const uid = String(userId);
  return String(transaction.owner) === uid || String(transaction.borrower) === uid;
}

export function getChatReceiverId(transaction, senderId) {
  const sid = String(senderId);
  if (String(transaction.owner) === sid) return transaction.borrower;
  if (String(transaction.borrower) === sid) return transaction.owner;
  return null;
}