// Provider-agnostic mail transport abstraction
// Currently implements Resend HTTP API
// No controller or service should know which provider is being used.

import { Resend } from "resend";
import { getEmailConfig } from "../config/email.js";

let resendClientInstance = null;

function createResendClient() {
  const config = getEmailConfig();
  const client = new Resend(config.resendApiKey);
  console.log("✓ Resend client initialized");
  return client;
}

export function getResendClient() {
  if (!resendClientInstance) {
    resendClientInstance = createResendClient();
  }
  return resendClientInstance;
}

export async function sendResendEmail({
  to,
  cc,
  bcc,
  replyTo,
  subject,
  text,
  html,
}) {
  const config = getEmailConfig();

  const requestPayload = {
    from: config.fromEmail,
    to: [to],
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
    ...(cc ? { cc: [cc] } : {}),
    ...(bcc ? { bcc: [bcc] } : {}),
    ...(replyTo ? { replyTo } : {}),
  };

  const client = getResendClient();

  const response = await client.emails.send(requestPayload);

  return {
    success: true,
    messageId: response.data?.id || null,
    requestId: response.data?.id || null,
  };
}