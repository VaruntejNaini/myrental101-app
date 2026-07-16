import nodemailer from "nodemailer";

/**
 * sendMail — Sends a transactional email via Gmail SMTP.
 *
 * Callers (auth.js, rent.js) pass a mailOptions object containing:
 *   { from, to, subject, html, otp }
 *
 * Credentials are read from environment variables (EMAIL_USER / EMAIL_PASS).
 * A new transporter is created per call so the module stays stateless and
 * works correctly across hot-reloads in development.
 */
const sendMail = async (mailOptions) => {
  console.log("======================================");
  console.log("📨 sendMail() called");
  console.log("To:", mailOptions.to);
  console.log("Subject:", mailOptions.subject);
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS set:", !!process.env.EMAIL_PASS);
  console.log("======================================");

  // Build the transporter using env vars — never hard-code credentials
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Compose the outgoing message, preserving whatever the caller supplied
  const message = {
    from: mailOptions.from || process.env.EMAIL_USER,
    to: mailOptions.to,
    subject: mailOptions.subject || "Notification",
    // Use html if provided, otherwise fall back to plain text
    ...(mailOptions.html
      ? { html: mailOptions.html }
      : {
          text:
            mailOptions.text ||
            (mailOptions.otp
              ? `Your OTP is ${mailOptions.otp}. It is valid for 10 minutes.`
              : ""),
        }),
  };

  try {
    // sendMail returns a Promise when no callback is passed — fully awaitable
    const info = await transporter.sendMail(message);
    console.log("✅ Email sent successfully");
    console.log("Message ID:", info.messageId);
    console.log("Accepted:", info.accepted);
    return info;
  } catch (err) {
    console.error("❌ transporter.sendMail() failed");
    console.error(err);
    throw err;
  } finally {
    console.log("=================inside finally=====================");
  }
};

export { sendMail };