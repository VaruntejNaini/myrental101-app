import { sendMail, getTransporter } from "../../utils/mailer.js";
import { getEmailConfig } from "../../config/email.js";
import { getVerificationTemplate } from "./templates/verification.js";
import { getPasswordResetTemplate } from "./templates/passwordReset.js";
import { getTransactionOtpTemplate } from "./templates/transactionOtp.js";

async function sendEmailInternal({ to, cc, bcc, replyTo, subject, text, html, tags, configurationSetName }) {
  const fromEmail = getEmailConfig().from;

  const context = {
    recipient: to,
    subject,
    awsRequestId: null,
    awsErrorCode: null,
    awsErrorName: null,
    httpStatus: null,
    deliverySuccess: false,
  };

  try {
    const result = await sendMail({
      to,
      cc,
      bcc,
      replyTo,
      subject,
      text,
      html,
      from: fromEmail,
    });

    context.deliverySuccess = true;
    context.awsRequestId = result.messageId || null;

    console.log("[EmailService] Email sent successfully:", context);

    return {
      success: true,
      messageId: result.messageId,
      requestId: result.messageId,
    };
  } catch (error) {
    context.awsErrorName = error.name;
    context.awsErrorCode = error.name;
    context.httpStatus = null;

    console.error("[EmailService] Email delivery failed:", context);

    throw error;
  }
}

export async function sendEmail({ to, cc, bcc, replyTo, subject, text, html, tags, configurationSetName }) {
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

export async function sendTransactionOTPEmail({ to, otp, type = "HANDOFF", productTitle }) {
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