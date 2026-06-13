import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import rateLimit from "express-rate-limit";
// ✅ Rent & Wish Routes
import rentRoutes from "./routes/rent.js";
import wishesRoutes from "./routes/wishes.js";
import Product from "./models/Product.js";
import Wish from "./models/Wish.js";
import Notification from "./models/Notification.js";
import Transaction from "./models/Transaction.js";

import authRoutes from "./routes/auth.js";
import addressRoutes from "./routes/addresses.js";

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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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

// Address Routes
app.use("/api/addresses", addressRoutes);



app.use("/api/rent", rentRoutes);
app.use("/api/wishes", wishesRoutes);

// Clean up Mock Database listings on startup (deletes mock IDs and preserves user listings)
const cleanMockDatabase = async () => {
  try {
    await Product.deleteMany({
      _id: {
        $in: [
          new mongoose.Types.ObjectId("60d5ecb8b5c9c93d98e8a8a1"),
          new mongoose.Types.ObjectId("60d5ecb8b5c9c93d98e8a8a2"),
          new mongoose.Types.ObjectId("60d5ecb8b5c9c93d98e8a8a3"),
          new mongoose.Types.ObjectId("60d5ecb8b5c9c93d98e8a8a4")
        ]
      }
    });
    await Wish.deleteMany({
      creator: new mongoose.Types.ObjectId("60d5ecb8b5c9c93d98e8a8b1")
    });
    console.log("Mock data cleaned and database is ready! ✅");
  } catch (err) {
    console.error("Error cleaning database:", err);
  }
};

// One-time startup migration to link old/legacy notifications to their active transactions
const migrateOldNotifications = async () => {
  try {
    const notifications = await Notification.find({ transactionId: null });
    let count = 0;
    for (const notif of notifications) {
      const txMatch = notif.link ? notif.link.match(/tx=([^&#=]*)/) : null;
      let txId = txMatch ? txMatch[1] : null;

      if (!txId) {
        // Find any active transaction involving borrower & owner
        const tx = await Transaction.findOne({
          $or: [
            { borrower: notif.recipient, owner: notif.sender },
            { borrower: notif.sender, owner: notif.recipient }
          ]
        }).sort({ createdAt: -1 });
        if (tx) {
          txId = tx._id;
        }
      }

      if (txId) {
        notif.transactionId = txId;
        await notif.save();
        count++;
      }
    }
    console.log(`Migrated ${count} legacy notifications to active transactions! 🚀`);
  } catch (err) {
    console.error("Error migrating notifications:", err);
  }
};

mongoose.connection.once("open", async () => {
  await cleanMockDatabase();
  await migrateOldNotifications();
});


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