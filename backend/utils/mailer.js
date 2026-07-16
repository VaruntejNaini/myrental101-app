import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: false,
  family:4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/*transporter
  .verify()
  .then(() => {
    console.log("✅ Nodemailer transporter verified");
  })
  .catch((err) => {
    console.error("❌ Nodemailer verify failed");
    console.error(err);
  });
*/

const sendMail = async (mailOptions) => {
  console.log("======================================");
  console.log("📨 sendMail() called");
  console.log("To:", mailOptions.to);
  console.log("Subject:", mailOptions.subject);
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
  console.log("======================================");

  try {
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully");
    console.log("Message ID:", info.messageId);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);

    return info;
  } catch (err) {
    console.error("❌ transporter.sendMail() failed");
    console.error(err);
    throw err;
  }
};

export { transporter, sendMail };