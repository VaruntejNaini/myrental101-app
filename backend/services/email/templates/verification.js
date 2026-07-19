import { wrapInBrandLayout } from "./sharedLayout.js";

export function getVerificationTemplate(otp) {
  const content = `
    <h2>Email Verification</h2>
    <p>Your OTP is:</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
    </div>
    <p>Please enter this OTP to verify your account.</p>
    <div class="warning">
      <strong>Important:</strong> This OTP will expire in 10 minutes.
    </div>
  `;

  return wrapInBrandLayout(content);
}