import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";

import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

// ✅ Middleware

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// JSON parser
app.use(express.json());

// ✅ Rate Limiter
const aiLimiter = rateLimit({
  windowMs: 30 * 1000, // 1 minute
  max: 10,
  message: {
    reply: "Too many AI requests. Please wait a minute.",
  },
});

app.use("/api/ai", aiLimiter);

// ✅ Gemini AI Setup

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ MongoDB Connection

mongoose
  .connect(process.env.MONGO_URI, {
    family: 4,
  })
  .then(() => {
    console.log("MongoDB Connected ✅");
  })
  .catch((err) => {
    console.error("MongoDB Error ❌");
    console.error(err.message);
  });

// ✅ Routes

// Health Route
app.get("/", (req, res) => {
  res.send("RentIt API is running 🚀");
});

// Auth Routes
app.use("/api/auth", authRoutes);

// ✅ AI Chat Route

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, context } = req.body;

    // Validation
    if (!message || message.trim() === "") {
      return res.status(400).json({
        reply: "Message is required.",
      });
    }

    console.log(`AI Request: ${message}`);

    // Gemini Model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",

    });

    // System Prompt
    const systemInstruction = `
You are RentBot, the official AI assistant for the RentIt platform.

Platform Features: 
1. Users can rent items.
2. Users can post items for rent.
3. Secure escrow payments are used.
4. Govt ID verification is required.

Behavior Rules:
- Be helpful and concise.
- Keep answers beginner-friendly.
- Answer only platform-related questions.

User Context:
${context || "User is browsing dashboard"}
`;

    // Final Prompt
    const prompt = `
${systemInstruction}

User Question:
${message}
`;

    // Gemini Request


    try {
      const result = await model.generateContent(prompt);

      const response = await result.response;

      const text = response.text();

      if (!text) {
        throw new Error("Empty AI response");
      }

      return res.status(200).json({
        reply: text,
      });

    } catch (aiError) {
      console.error("Gemini API Error ❌");
      console.error(aiError.message);

      // Graceful fallback
      return res.status(200).json({
        reply:
          "RentBot is temporarily unavailable due to API limits. Please try again later.",
      });
    }

  } catch (error) {
    console.error("Backend Server Error ❌");
    console.error(error.stack);

    return res.status(500).json({
      reply: "Internal server error.",
    });
  }
});



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} 🚀`);
});