import nodemailer from "nodemailer";

let transporter = null;

export function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return transporter;
}

export async function verifyTransporter() {
  try {
    const tx = getTransporter();
    await tx.verify();
    return true;
  } catch (error) {
    console.error("[Mailer] SMTP verification failed:", error.message);
    return false;
  }
}

export async function sendMail(mailOptions) {
  const tx = getTransporter();

  try {
    const message = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: mailOptions.to,
      subject: mailOptions.subject,
      ...(mailOptions.html ? { html: mailOptions.html } : {}),
      ...(mailOptions.text ? { text: mailOptions.text } : {}),
      ...(mailOptions.cc ? { cc: mailOptions.cc } : {}),
      ...(mailOptions.bcc ? { bcc: mailOptions.bcc } : {}),
      ...(mailOptions.replyTo ? { replyTo: mailOptions.replyTo } : {}),
    };

    const result = await tx.sendMail(message);
    return result;
  } catch (error) {
    console.error("[Mailer] SMTP send failed:", error.message);
    throw new Error("Email delivery failed. Please try again later.");
  }
}