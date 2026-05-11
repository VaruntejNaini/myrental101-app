import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/// REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  console.log("Incoming:", req.body); // ✅

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed
    });

    res.json({ msg: "User registered successfully" });

  } catch (err) {  
    console.log("REGISTER ERROR:", err);
  res.status(500).json({ msg: err.message });
  }
});

/// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
   console.log("Login attempt:", req.body);

  try {
    const user = await User.findOne({ email });
     console.log("User found:", user); //
    if (!user) return res.status(400).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user });
    console.log("Saved user:", user); // 

  } catch (err) {
      console.log("Error:", err); // ✅
    res.status(500).json({ error: err.message });
  }
});

export default router;
