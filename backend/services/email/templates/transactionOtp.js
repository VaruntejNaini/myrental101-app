import { wrapInBrandLayout } from "./sharedLayout.js";

export function getTransactionOtpTemplate(otp, type, productTitle) {
  const isHandoff = type === "HANDOFF";
  const title = isHandoff ? "Item Handoff Verification" : "Item Return Verification";
  const description = isHandoff
    ? "Your handoff OTP for the item pickup"
    : "Your return OTP for the item return";
  const instruction = isHandoff
    ? "Please share this code with the owner to confirm pickup."
    : "Please share this code with the owner to confirm the return.";

  const content = `
    <h2>${title}</h2>
    <p>Hello,</p>
    <p>${description} <strong>"${productTitle}"</strong> is:</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
    </div>
    <p>${instruction} It expires in 10 minutes.</p>
    <div class="warning">
      <strong>Security Notice:</strong> Do not share this code with anyone other than the intended party.
    </div>
  `;

  return wrapInBrandLayout(content);
}