import { getVerificationTemplate } from "./templates/verification.js";
import { getPasswordResetTemplate } from "./templates/passwordReset.js";
import { getTransactionOtpTemplate } from "./templates/transactionOtp.js";
import { sendResendEmail } from "../../utils/mailer.js";

const EMAIL_TIMEOUT_MS = 15000;

function mapToAppError(error) {
  if (error?.name === "ValidationException" || error?.name === "BadRequest") {
    return new Error("Email delivery failed. Please try again later.");
  }

  if (error?.name === "TimeoutError") {
    return new Error("Email service timed out. Please try again.");
  }

  return new Error("Email service temporarily unavailable. Please try again.");
}

async function withTimeout(promise) {
  let timeoutHandle;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      const error = new Error("Email request timed out");
      error.name = "TimeoutError";
      reject(error);
    }, EMAIL_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle);
    throw error;
  }
}

async function sendEmailInternal({
  to,
  cc,
  bcc,
  replyTo,
  subject,
  text,
  html,
}) {
  if (!to) {
    throw new Error("Recipient email address is required");
  }

  const context = {
    recipient: to,
    subject,
    messageId: null,
  };

  try {
    const response = await withTimeout(
      sendResendEmail({
        to,
        cc,
        bcc,
        replyTo,
        subject,
        text,
        html,
      })
    );

    context.messageId = response.messageId;

    console.log("[EmailService] Email sent successfully:", context);

    return {
      success: true,
      messageId: response.messageId,
      requestId: response.requestId,
    };
  } catch (error) {
    console.error("[EmailService] Email delivery failed:", {
      recipient: to,
      subject,
      errorName: error.name,
      message: error.message,
    });

    const appError = mapToAppError(error);
    throw appError;
  }
}

export async function sendEmail({
  to,
  cc,
  bcc,
  replyTo,
  subject,
  text,
  html,
  tags,
  configurationSetName,
}) {
  if (!to) {
    throw new Error("Recipient email address is required");
  }

  return sendEmailInternal({
    to,
    cc,
    bcc,
    replyTo,
    subject,
    text,
    html,
    tags,
    configurationSetName,
  });
}

export async function sendOTPEmail({ to, otp, type = "EMAIL_VERIFICATION" }) {
  const normalizedType = type.toUpperCase();

  let html;
  if (normalizedType === "PASSWORD_RESET") {
    html = getPasswordResetTemplate(otp);
  } else {
    html = getVerificationTemplate(otp);
  }

  const subject = normalizedType === "PASSWORD_RESET" ? "Password Reset Code" : "Email Verification Code";

  return sendEmail({
    to,
    subject,
    html,
  });
}

export async function sendTransactionOTPEmail({
  to,
  otp,
  type = "HANDOFF",
  productTitle,
}) {
  const normalizedType = type.toUpperCase();

  if (!["HANDOFF", "RETURN"].includes(normalizedType)) {
    throw new Error("Invalid transaction OTP type. Must be HANDOFF or RETURN");
  }

  const html = getTransactionOtpTemplate(otp, normalizedType, productTitle || "your item");
  const subject = normalizedType === "HANDOFF" ? "Your Handoff OTP" : "Your Return OTP";

  return sendEmail({
    to,
    subject,
    html,
  });
}

export async function sendGenericEmail({ to, subject, html, text, cc, bcc, replyTo }) {
  const safeHtml = html || null;
  const safeText = text || null;

  if (!safeHtml && !safeText) {
    throw new Error("Either html or text content is required");
  }

  return sendEmail({
    to,
    subject,
    html: safeHtml,
    text: safeText,
    cc,
    bcc,
    replyTo,
  });
}