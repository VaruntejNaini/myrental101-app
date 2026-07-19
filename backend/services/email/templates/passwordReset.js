import { wrapInBrandLayout } from "./sharedLayout.js";

export function getPasswordResetTemplate(otp) {
  const content = `
    <h2>Password Reset Request</h2>
    <p>You requested to reset your password. Your OTP is:</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
    </div>
    <p>Enter this OTP to reset your password. This OTP will expire in 10 minutes.</p>
    <div class="warning">
      <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email.
    </div>
  `;

  return wrapInBrandLayout(content);
}