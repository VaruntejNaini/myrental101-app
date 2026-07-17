import { Resend } from "resend";

/**
 * sendMail — Sends a transactional email via Resend's HTTP API.
 *
 * WHY NOT NODEMAILER + GMAIL SMTP?
 * Render's free tier blocks all outbound SMTP connections on ports 25, 465
 * and 587 at the network level (enforced since Sep 26 2025). No nodemailer
 * config can work around this — the TCP socket never leaves the container.
 * Resend uses HTTPS (port 443) which is never blocked.
 *
 * REQUIRED ENV VARS (set in Render dashboard):
 *   RESEND_API_KEY    — your Resend API key (re_xxxxxx...)
 *   RESEND_FROM_EMAIL — verified sender address, e.g. onboarding@resend.dev
 *                       or noreply@yourdomain.com once domain is verified
 *
 * Callers (auth.js, rent.js) pass a mailOptions object:
 *   { from?, to, subject, html?, text?, otp? }
 */
const sendMail = async (mailOptions) => {
  console.log("======================================");
  console.log("📨 sendMail() called [via Resend HTTP API]");
  console.log("To:", mailOptions.to);
  console.log("Subject:", mailOptions.subject);
  console.log("RESEND_API_KEY set:", !!process.env.RESEND_API_KEY);
 console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY);
console.log(
  "RESEND_API_KEY length:",
  process.env.RESEND_API_KEY?.length
);
  console.log("RESEND_FROM_EMAIL:", process.env.RESEND_FROM_EMAIL);
  console.log("======================================");

  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY environment variable is not set. " +
      "Please add it in your Render dashboard under Environment Variables."
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Build the email body — prefer html, fall back to text / otp template
  const emailBody = mailOptions.html
    ? { html: mailOptions.html }
    : {
        text:
          mailOptions.text ||
          (mailOptions.otp
            ? `Your OTP is ${mailOptions.otp}. It is valid for 10 minutes.`
            : ""),
      };

  try {
    const { data, error } = await resend.emails.send({
      from:
        mailOptions.from ||
        process.env.RESEND_FROM_EMAIL ||
        "onboarding@resend.dev",
      to: [mailOptions.to],
      subject: mailOptions.subject || "Notification",
      ...emailBody,
    });

    if (error) {
      // Resend returns errors in the response body rather than throwing
      console.error("❌ Resend API returned an error:", error);
      throw new Error(error.message || "Email send failed via Resend");
    }

    console.log("✅ Email sent successfully via Resend");
    console.log("Email ID:", data?.id);
    return data;
  } catch (err) {
    console.error("❌ sendMail() failed");
    console.error(err);
    throw err;
  } finally {
    console.log("=================inside finally=====================");
  }
};

export { sendMail };