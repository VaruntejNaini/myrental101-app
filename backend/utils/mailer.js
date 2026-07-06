import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify()
  .then(() => {
    console.log("Nodemailer transporter verified ✅");
  })
  .catch((err) => {
    console.error("Nodemailer verify failed:", err.message);
  });

const sendMail = (mailOptions) => transporter.sendMail(mailOptions);

export { transporter, sendMail };
