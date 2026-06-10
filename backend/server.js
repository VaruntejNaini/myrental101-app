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

// Seed Mock Database listings on start if empty
const seedDatabase = async () => {
  try {
    const pCount = await Product.countDocuments();
    if (pCount === 0) {
      console.log("Seeding initial mock listings...");
      const dummyUserId = new mongoose.Types.ObjectId("60d5ecb8b5c9c93d98e8a8b1"); // stable fake ID
      
      const seedProducts = [
        {
          _id: new mongoose.Types.ObjectId("60d5ecb8b5c9c93d98e8a8a1"),
          title: "Canon EOS R50 Camera",
          description: "Vibrant and compact mirrorless camera designed for content creators. Capture stunning 24.2 MP photos.",
          category: "Electronics",
          rentalPrice: 450,
          securityDeposit: 1125,
          city: "Hyderabad",
          area: "Madhapur",
          productType: "RENT",
          status: "ACTIVE",
          owner: dummyUserId,
          location: {
            type: "Point",
            coordinates: [78.3885, 17.4483]
          }
        },
        {
          _id: new mongoose.Types.ObjectId("60d5ecb8b5c9c93d98e8a8a2"),
          title: "Honda Activa Scooter",
          description: "Regularly serviced and clean Activa 6G. Ideal for navigating daily commutes and dense city traffic.",
          category: "Vehicles",
          rentalPrice: 250,
          securityDeposit: 625,
          city: "Hyderabad",
          area: "Gachibowli",
          productType: "RENT",
          status: "ACTIVE",
          owner: dummyUserId,
          location: {
            type: "Point",
            coordinates: [78.3489, 17.4401]
          }
        },
        {
          _id: new mongoose.Types.ObjectId("60d5ecb8b5c9c93d98e8a8a3"),
          title: "PlayStation 5 Console",
          description: "Unleash new gaming possibilities with lightning-fast loading, deeper immersion, and ultra-high-speed SSD.",
          category: "Electronics",
          rentalPrice: 350,
          securityDeposit: 875,
          city: "Hyderabad",
          area: "Jubilee Hills",
          productType: "RENT",
          status: "ACTIVE",
          owner: dummyUserId,
          location: {
            type: "Point",
            coordinates: [78.4074, 17.4311]
          }
        },
        {
          _id: new mongoose.Types.ObjectId("60d5ecb8b5c9c93d98e8a8a4"),
          title: "DeWalt Power Drill Set",
          description: "Cordless drill set featuring a high-torque motor and variable speed controls. Includes 20V battery.",
          category: "Tools",
          rentalPrice: 120,
          securityDeposit: 300,
          city: "Hyderabad",
          area: "Madhapur",
          productType: "RENT",
          status: "ACTIVE",
          owner: dummyUserId,
          location: {
            type: "Point",
            coordinates: [78.3914, 17.4429]
          }
        }
      ];

      await Product.insertMany(seedProducts);
      console.log("Mock products seeded successfully! ✅");
    }

    const wCount = await Wish.countDocuments();
    if (wCount === 0) {
      const dummyUserId = new mongoose.Types.ObjectId("60d5ecb8b5c9c93d98e8a8b1");
      const seedWishes = [
        {
          title: "2-Person Camping Tent",
          description: "Durable dome camping tent featuring quick installation mechanism and water-proof fabric overlays.",
          category: "Tools",
          budget: 150,
          durationDays: 5,
          creator: dummyUserId,
          status: "ACTIVE"
        },
        {
          title: "Fender Stratocaster Guitar",
          description: "Iconic electric guitar delivering classic Fender chime and versatility. Needed for a weekend gig.",
          category: "Music",
          budget: 200,
          durationDays: 3,
          creator: dummyUserId,
          status: "ACTIVE"
        }
      ];
      await Wish.insertMany(seedWishes);
      console.log("Mock wishes seeded successfully! ✅");
    }
  } catch (err) {
    console.error("Error seeding listings database:", err);
  }
};
mongoose.connection.once("open", seedDatabase);


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