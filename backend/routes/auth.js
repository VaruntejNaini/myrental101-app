import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";
import { OAuth2Client } from "google-auth-library";

import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Define rate limiter to enforce a 60-second cooldown per IP for OTP requests
const otpRequestLimiter = rateLimit({
  windowMs: 60 * 1000, // 60 seconds
  max: 1, // Only 1 request allowed per window
  message: {
    msg: "Too many OTP requests. Please wait 60 seconds before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});



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

router.post("/send-email-otp", otpRequestLimiter, async (req, res) => {
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
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("EMAIL OTP (Sent to user):", otp);

    // HASH AND SAVE OTP
    const hashedOtp = await bcrypt.hash(otp, 10);
    user.emailOtp = hashedOtp;
    await user.save();
    console.log("SUCCESSFULLY SAVED HASHED EMAIL OTP TO MONGODB:", user.emailOtp);

    // SEND EMAIL with raw plain-text OTP
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
    console.log("MOBILE OTP (Sent to user):", otp);

    const hashedOtp = await bcrypt.hash(otp, 10);
    user.phone = phone;
    user.mobileOtp = hashedOtp;
    await user.save();
    console.log("SUCCESSFULLY SAVED HASHED MOBILE OTP TO MONGODB:", user.mobileOtp);

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

    const isMatch = user.mobileOtp ? await bcrypt.compare(otp, user.mobileOtp) : false;
    if (!isMatch) {
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

    // INVALID OTP using cryptographic comparison
    const isMatch = user.emailOtp ? await bcrypt.compare(otp, user.emailOtp) : false;
    if (!isMatch) {
      return res.status(400).json({
        msg: "Invalid OTP",
      });
    }

    // SUCCESS
    user.isEmailVerified = true;
    user.emailOtp = "";
    await user.save();

    // RESPONSE
    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      msg: "Email verified successfully",
      token,
      user
    });

  } catch (err) {
    console.log("VERIFY OTP ERROR:", err);
    res.status(500).json({
      msg: "Verification failed",
    });
  }
});


// =========================
// VERIFY RESET OTP (FORGOT PASSWORD)
// =========================
router.post("/verify-reset-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ msg: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isMatch = user.emailOtp ? await bcrypt.compare(otp, user.emailOtp) : false;
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    res.json({ msg: "OTP verified successfully" });
  } catch (err) {
    console.error("VERIFY RESET OTP ERROR:", err);
    res.status(500).json({ msg: "Verification failed" });
  }
});

// =========================
// RESET PASSWORD
// =========================
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Verify OTP again for security before applying password change
    const isMatch = user.emailOtp ? await bcrypt.compare(otp, user.emailOtp) : false;
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    // Hash and store the new password securely
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.emailOtp = ""; // Clear OTP
    user.isEmailVerified = true; // Auto-verify email upon password recovery
    await user.save();

    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// =========================
// GOOGLE AUTHENTICATION
// =========================
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ msg: "Credential token is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Auto-register new Google user with secure random password
      const randomPassword = Math.random().toString(36).substring(2, 10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        name: name || email.split("@")[0],
        email,
        password: hashedPassword,
        isEmailVerified: true, // Pre-verified by Google
      });
      console.log("GOOGLE SIGNUP SUCCESS:", user.email);
    } else {
      console.log("GOOGLE LOGIN SUCCESS:", user.email);
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user,
    });
  } catch (err) {
    console.error("GOOGLE LOGIN ERROR:", err);
    res.status(500).json({ msg: "Google authentication failed" });
  }
});

// GET CURRENT USER PROFILE
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// =========================
// EXPORT
// =========================

export default router;