import AdminAction from "../models/AdminAction.js";

const MIN_SUMMARY_LENGTH = 10;
const MAX_SUMMARY_LENGTH = 1000;

export function validateSummaryText(text) {
  if (!text || typeof text !== "string") {
    return { valid: false, msg: "Explanation is required." };
  }
  const trimmed = text.trim();
  if (trimmed.length < MIN_SUMMARY_LENGTH) {
    return { valid: false, msg: `Explanation must be at least ${MIN_SUMMARY_LENGTH} characters.` };
  }
  if (trimmed.length > MAX_SUMMARY_LENGTH) {
    return { valid: false, msg: `Explanation must not exceed ${MAX_SUMMARY_LENGTH} characters.` };
  }
  return { valid: true, trimmed };
}

async function insertAuditEntry({ actor, actionType, targetType, targetId, summary, metadata = {} }) {
  await AdminAction.create({
    actor,
    actionType,
    targetType,
    targetId,
    summary,
    metadata,
  });
}

export async function logAction({ actor, actionType, targetType, targetId, summary, metadata = {} }) {
  const validation = validateSummaryText(summary);
  if (!validation.valid) {
    throw new Error(validation.msg);
  }
  await insertAuditEntry({
    actor,
    actionType,
    targetType,
    targetId,
    summary: validation.trimmed,
    metadata,
  });
}

export async function logFailure({ actor, actionType, summary, metadata = {}, targetType = "System", targetId = actor }) {
  try {
    const fallbackSummary =
      summary && summary.trim().length >= MIN_SUMMARY_LENGTH
        ? summary.trim().slice(0, MAX_SUMMARY_LENGTH)
        : `${actionType}: ${JSON.stringify(metadata).slice(0, MAX_SUMMARY_LENGTH - 20)}`;

    await insertAuditEntry({
      actor: actor || undefined,
      actionType,
      targetType,
      targetId: targetId || actor,
      summary: fallbackSummary,
      metadata,
    });
  } catch (err) {
    console.error("[AuditService] Failed to log failure event:", err.message);
  }
}
