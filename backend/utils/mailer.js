import dns from "node:dns";
import nodemailer from "nodemailer";

// Prefer IPv4 to avoid IPv6 connectivity issues on some cloud platforms
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter
  .verify()
  .then(() => {
    console.log("Nodemailer transporter verified ✅");
  })
  .catch((err) => {
    console.error("========== NODEMAILER ERROR ==========");
    console.error(err);
    console.error("EMAIL_USER:", process.env.EMAIL_USER);
    console.error("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
    console.error("======================================");
  });

const sendMail = (mailOptions) => transporter.sendMail(mailOptions);

export { transporter, sendMail };