import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { getSESClient } from "./sesClient.js";
import { getVerificationTemplate } from "./templates/verification.js";
import { getPasswordResetTemplate } from "./templates/passwordReset.js";
import { getTransactionOtpTemplate } from "./templates/transactionOtp.js";
import { getEmailConfig } from "../../config/email.js";

const EMAIL_TIMEOUT_MS = 15000;

const RETRYABLE_ERRORS = new Set([
  "TimeoutError",
  "NetworkingError",
  "ThrottlingException",
  "ServiceUnavailable",
]);

const NON_RETRYABLE_ERRORS = new Set([
  "ValidationException",
  "MessageRejected",
  "BadRequest",
]);

const MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 500;

function getDelayMs(attempt) {
  return BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
}

function isRetryable(error) {
  if (RETRYABLE_ERRORS.has(error.name)) return true;
  if (error.$retryable !== undefined) return error.$retryable;
  if (error.retryable !== undefined) return error.retryable;
  return false;
}

function shouldNotRetry(error) {
  return NON_RETRYABLE_ERRORS.has(error.name);
}

function sanitizeLogContext(context) {
  return {
    recipient: context.recipient,
    subject: context.subject,
    awsRequestId: context.awsRequestId,
    awsErrorCode: context.awsErrorCode,
    awsErrorName: context.awsErrorName,
    httpStatus: context.httpStatus,
    deliverySuccess: context.deliverySuccess,
  };
}

function mapToAppError(error) {
  if (shouldNotRetry(error)) {
    return new Error("Email delivery failed. Please try again later.");
  }

  if (error.name === "TimeoutError") {
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

async function sendWithRetry(command, context) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await getSESClient().send(command);
      return response;
    } catch (error) {
      lastError = error;

      console.error(`[EmailService] Attempt ${attempt} failed:`, {
        ...sanitizeLogContext(context),
        awsErrorName: error.name,
        awsErrorCode: error.name,
        httpStatus: error.$metadata?.httpStatusCode,
        message: error.message,
      });

      if (attempt < MAX_RETRIES && isRetryable(error)) {
        const delayMs = getDelayMs(attempt);
        console.log(`[EmailService] Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      break;
    }
  }

  throw lastError;
}

async function sendEmailInternal({ to, cc, bcc, replyTo, subject, text, html, tags, configurationSetName }) {
  const config = getEmailConfig();
  const fromEmail = config.fromEmail;

  const commandInput = {
    FromEmailAddress: fromEmail,
    ReplyToAddresses: replyTo ? [replyTo] : [],
    Destination: {
      ToAddresses: [to],
      ...(cc ? { CcAddresses: [cc] } : {}),
      ...(bcc ? { BccAddresses: [bcc] } : {}),
    },
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          ...(html ? { Html: { Data: html, Charset: "UTF-8" } } : {}),
          ...(text ? { Text: { Data: text, Charset: "UTF-8" } } : {}),
        },
      },
    },
    ...(tags ? { Tags: tags } : {}),
    ...(configurationSetName ? { ConfigurationSetName: configurationSetName } : {}),
  };

  const context = {
    recipient: to,
    subject,
    awsRequestId: null,
    awsErrorCode: null,
    awsErrorName: null,
    httpStatus: null,
    deliverySuccess: false,
  };

  let response;
  try {
    const command = new SendEmailCommand(commandInput);
    response = await withTimeout(sendWithRetry(command, context));
    context.deliverySuccess = true;
    context.awsRequestId = response.MessageId || null;

    console.log("[EmailService] Email sent successfully:", sanitizeLogContext(context));

    return {
      success: true,
      messageId: response.MessageId,
      requestId: response.MessageId,
    };
  } catch (error) {
    context.awsErrorName = error.name;
    context.awsErrorCode = error.name;
    context.httpStatus = error.$metadata?.httpStatusCode || null;

    console.error("[EmailService] Email delivery failed:", sanitizeLogContext(context));

    const appError = mapToAppError(error);
    throw appError;
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