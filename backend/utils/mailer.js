/**
 * backend/utils/mailer.js
 *
 * Temporary debugging version using the Resend HTTP API directly via fetch().
 * This bypasses the Resend SDK completely.
 *
 * IMPORTANT:
 * After debugging, revoke the exposed API key and remove any logs that print it.
 */

const sendMail = async (mailOptions) => {
  console.log("======================================");
  console.log("📨 sendMail() called [via Resend HTTP API - fetch]");
  console.log("To:", mailOptions.to);
  console.log("Subject:", mailOptions.subject);
  console.log("RESEND_API_KEY set:", !!process.env.RESEND_API_KEY);
  console.log("RESEND_API_KEY:", JSON.stringify(process.env.RESEND_API_KEY));
  console.log(
    "RESEND_API_KEY length:",
    process.env.RESEND_API_KEY?.length
  );
  console.log("RESEND_FROM_EMAIL:", process.env.RESEND_FROM_EMAIL);
  console.log("======================================");

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not set.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:
        mailOptions.from ||
        process.env.RESEND_FROM_EMAIL ||
        "onboarding@resend.dev",

      to: [mailOptions.to],

      subject: mailOptions.subject || "Notification",

      html:
        mailOptions.html ||
        `<p>Your OTP is <b>${mailOptions.otp}</b>. It is valid for 10 minutes.</p>`,
    }),
  });

  const responseBody = await response.text();

  console.log("======================================");
  console.log("HTTP Status:", response.status);
  console.log("HTTP Response:", responseBody);
  console.log("======================================");

  if (!response.ok) {
    throw new Error(`Resend HTTP Error: ${responseBody}`);
  }

  try {
    const data = JSON.parse(responseBody);

    console.log("✅ Email sent successfully!");
    console.log("Email ID:", data.id);

    return data;
  } catch (err) {
    console.error("Failed to parse Resend response:", err);
    throw err;
  }
};

export { sendMail };