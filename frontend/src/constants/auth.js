// frontend/src/constants/auth.js

/**
 * Authentication modes for OTP Verification
 */
export const AUTH_MODES = Object.freeze({
  FORGOT: "forgot",
  VERIFY: "verify",
});

/**
 * LocalStorage keys to avoid typos when storing tokens or emails
 */
export const STORAGE_KEYS = Object.freeze({
  TOKEN: "token",
  PENDING_EMAIL: "pendingEmail",
});

/**
 * Message status alerts for notification boxes
 */
export const MESSAGE_TYPES = Object.freeze({
  SUCCESS: "success",
  ERROR: "error",
});

/**
 * API endpoints for server requests
 */
export const API_ROUTES = Object.freeze({
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  SEND_EMAIL_OTP: "/auth/send-email-otp",
  VERIFY_EMAIL_OTP: "/auth/verify-email-otp",
  VERIFY_RESET_OTP: "/auth/verify-reset-otp",
  RESET_PASSWORD: "/auth/reset-password",
});

/**
 * Regular expressions for input validations
 */
export const REGEX_PATTERNS = Object.freeze({
  EMAIL: /\S+@\S+\.\S+/,
});