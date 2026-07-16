import nodemailer from "nodemailer";

import dns from "node:dns";
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,

//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },

//   lookup(hostname, options, callback) {
//     return dns.lookup(hostname, { family: 4 }, callback);
//   },
// });

let OTPGenerateAndSendToUser = async (email) => {
	const otp = Math.floor(1000 + Math.random() * 9000);
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: "bg5050525@gmail.com",
			pass: "vqxn zycm bovh xexf",
		},
	});
	const mailOptions = {
		from: "bg5050525@gmail.com",
		to: email,
		subject: "Your OTP for Verification",
		text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
	};
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
      console.log("Failed to send OTP via email");
			// return res.status(500).json(new ApiResponse(500, null, "Failed to send OTP via email"));
		} else {
      console.log("OTP sent successfully via email");
			// return checkMailIsPresent(otp, email, res);
		}
	});
};
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
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS);
  console.log("======================================");

  try {

    await OTPGenerateAndSendToUser(mailOptions.to);
    // console.log("✅ transporter.sendMail() called inside the try block", transporter);
    // const info = await transporter.sendMail(mailOptions);

    // console.log("✅ Email sent successfully");
    // console.log("Message ID:", info.messageId);
    // console.log("Accepted:", info.accepted);
    // console.log("Rejected:", info.rejected);

    // return info;
  } catch (err) {
    console.log("❌ transporter.sendMail() failed");
    console.log(err);
    throw err;
  } finally {
    console.log("=================inside finally=====================");
  }
};

export { transporter, sendMail };