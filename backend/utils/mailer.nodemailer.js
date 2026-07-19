// ARCHIVED: Nodemailer-based mailer
// Kept for rollback purposes only.
// Do NOT use in production. AWS SES is the active provider.
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendMail = async (mailOptions) => {
  const message = {
    from: mailOptions.from || process.env.EMAIL_USER,
    to: mailOptions.to,
    subject: mailOptions.subject || "Notification",
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

  return transporter.sendMail(message);
};

export { sendMail };