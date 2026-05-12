import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import User from "../models/User.js";

const router = express.Router();


// =========================
// NODEMAILER SETUP
// =========================

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


// =========================
// REGISTER
// =========================

router.post("/register", async (req, res) => {

  const { name, email, password } = req.body;

  console.log("REGISTER:", req.body);

  try {

    // CHECK USER EXISTS

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({
        msg: "User already exists",
      });
    }

    // HASH PASSWORD

    const hashed = await bcrypt.hash(password, 10);

    // CREATE USER

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    console.log("USER CREATED:", user);

    res.json({
      msg: "User registered successfully",
    });

  } catch (err) {

    console.log("REGISTER ERROR:", err);

    res.status(500).json({
      msg: err.message,
    });
  }
});


// =========================
// LOGIN
// =========================

router.post("/login", async (req, res) => {

  const { email, password } = req.body;

  console.log("LOGIN:", req.body);

  try {

    // FIND USER

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        msg: "User not found",
      });
    }

    // CHECK EMAIL VERIFIED

    if (!user.isEmailVerified) {
      return res.status(401).json({
        msg: "Please verify your email first",
      });
    }

    // CHECK PASSWORD

    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match) {
      return res.status(400).json({
        msg: "Wrong password",
      });
    }

    // CREATE TOKEN

    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // SUCCESS

    res.json({
      token,
      user,
    });

  } catch (err) {

    console.log("LOGIN ERROR:", err);

    res.status(500).json({
      msg: err.message,
    });
  }
});


// =========================
// SEND EMAIL OTP
// =========================

router.post("/send-email-otp", async (req, res) => {

  try {

    const { email } = req.body;

    // FIND USER

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    // GENERATE OTP

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    console.log("EMAIL OTP:", otp);

    // SAVE OTP

    user.emailOtp = otp;

    await user.save();

    // SEND EMAIL

    await transporter.sendMail({

      from: process.env.EMAIL_USER,

      to: email,

      subject: "Your Verification OTP",

      html: `
        <div style="font-family:sans-serif">

          <h2>Email Verification</h2>

          <p>Your OTP is:</p>

          <h1>${otp}</h1>

          <p>Please enter this OTP to verify your account.</p>

        </div>
      `,
    });

    // RESPONSE

    res.json({
      msg: "Email OTP sent successfully",
    });

  } catch (err) {

    console.error("SEND OTP ERROR:", err.message || err);

    res.status(500).json({
      msg: "Failed to send OTP",
      error: err.message || "Unknown error",
    });
  }
});


// =========================
// SEND MOBILE OTP
// =========================

router.post("/send-mobile-otp", async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        msg: "Phone number is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log("MOBILE OTP:", otp);

    user.phone = phone;
    user.mobileOtp = otp;

    await user.save();

    res.json({
      msg: "Mobile OTP sent successfully",
    });
  } catch (err) {
    console.error("SEND MOBILE OTP ERROR:", err.message || err);
    res.status(500).json({
      msg: "Failed to send mobile OTP",
      error: err.message || "Unknown error",
    });
  }
});


// =========================
// VERIFY MOBILE OTP
// =========================

router.post("/verify-mobile-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    if (user.mobileOtp !== otp) {
      return res.status(400).json({
        msg: "Invalid mobile OTP",
      });
    }

    user.isMobileVerified = true;
    user.mobileOtp = "";

    await user.save();

    res.json({
      msg: "Mobile verified successfully",
    });
  } catch (err) {
    console.error("VERIFY MOBILE OTP ERROR:", err.message || err);
    res.status(500).json({
      msg: "Verification failed",
      error: err.message || "Unknown error",
    });
  }
});


// =========================
// VERIFY EMAIL OTP
// =========================

router.post("/verify-email-otp", async (req, res) => {

  try {

    const { email, otp } = req.body;

    // FIND USER

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    // INVALID OTP

    if (user.emailOtp !== otp) {

      return res.status(400).json({
        msg: "Invalid OTP",
      });
    }

    // SUCCESS

    user.isEmailVerified = true;

    // CLEAR OTP

    user.emailOtp = "";

    await user.save();

    // RESPONSE

    res.json({
      msg: "Email verified successfully",
    });

  } catch (err) {

    console.log("VERIFY OTP ERROR:", err);

    res.status(500).json({
      msg: "Verification failed",
    });
  }
});


// =========================
// EXPORT
// =========================

export default router;