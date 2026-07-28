import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "node:url";
import path from "path";
import { validateEmailConfig } from "./config/email.js";
// ✅ Rent & Wish Routes
import rentRoutes from "./routes/rent.js";
import wishesRoutes from "./routes/wishes.js";
import Product from "./models/Product.js";
import Notification from "./models/Notification.js";
import Transaction from "./models/Transaction.js";

import authRoutes from "./routes/auth.js";
import addressRoutes from "./routes/addresses.js";
import adminRoutes from "./routes/admin.js";
import auctionRoutes from "./controllers/auctionController.js";
import { initAuctionSockets } from "./sockets/auctionSockets.js";
import { registerChatSocketHandlers } from "./sockets/chatSockets.js";
import { initAuctionScheduler } from "./services/auctionSchedulerService.js";
//import { initNotificationQueue } from "./services/notificationQueueService.js";
import http from "http";

import { GoogleGenerativeAI } from "@google/generative-ai";

// ──────────────────────────────────────────────────────────────────────────────
// Startup Orchestrator — guarantees NO requests are served until MongoDB is up
// ──────────────────────────────────────────────────────────────────────────────
async function start() {
  // Fail fast if AWS SES / email config is missing
  validateEmailConfig();

  // ── MongoDB Connection ────────────────────────────────────────────────────
  console.log("[startup] before mongoose.connect");
  await mongoose.connect(process.env.MONGO_URI, {
    family: 4,
  });

  // Confirm connection is truly ready for I/O
  if (mongoose.connection.readyState !== 1) {
    throw new Error(`MongoDB not connected. readyState=${mongoose.connection.readyState}`);
  }

  console.log("[startup] after mongoose.connect");
  console.log("MongoDB Connected ✅");
  console.log("Ready State:", mongoose.connection.readyState);

  // ── One-time startup migrations / cleanup ──────────────────────────────────
  const migrateOldNotifications = async () => {
    try {
      const notifications = await Notification.find({ transactionId: null });
      let count = 0;
      for (const notif of notifications) {
        const txMatch = notif.link ? notif.link.match(/tx=([^&#=]*)/) : null;
        let txId = txMatch ? txMatch[1] : null;

        if (!txId) {
          const tx = await Transaction.findOne({
            $or: [
              { borrower: notif.recipient, owner: notif.sender },
              { borrower: notif.sender, owner: notif.recipient }
            ]
          }).sort({ createdAt: -1 });
          if (tx) txId = tx._id;
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
      throw err;
    }
  };

  await migrateOldNotifications();
  await initAuctionScheduler();

  // ── Express App Setup ──────────────────────────────────────────────────────
  const app = express();
  app.set("trust proxy", 1);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const CLIENT_DIST = path.resolve(__dirname, "public");

  // CORS
  const allowedOrigins = [
    "http://localhost:5173",
    "https://rentit101.vercel.app",
    "https://rentit-frontend.vercel.app",
    "https://rentit-frontend-5vs4okgo3-varuncode7-5379s-projects.vercel.app",
    "https://rentit-frontend-5dm5kv86e-varuncode7-5379s-projects.vercel.app"
  ];

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Rate limiter for AI endpoints
  const aiLimiter = rateLimit({
    windowMs: 30 * 1000,
    max: 10,
    message: {
      reply: "Too many AI requests. Please wait a minute.",
    },
  });

  app.use("/api/ai", aiLimiter);

  // Gemini AI client (safe to init anytime after dotenv loaded)
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  app.set('genAI', genAI);

  // ── Routes ─────────────────────────────────────────────────────────────────
  app.get("/api/health", (req, res) => {
    res.send("RentIt API is running 🚀");
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/addresses", addressRoutes);
  app.use("/api/rent", rentRoutes);
  app.use("/api/wishes", wishesRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/auctions", auctionRoutes);

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(CLIENT_DIST));
  }

  // Production SPA fallback
  if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
      if (!req.path.startsWith("/api") && !req.path.startsWith("/socket.io")) {
        res.sendFile(path.join(CLIENT_DIST, "index.html"));
      } else {
        res.status(404).send("Not Found");
      }
    });
  }

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR:', err && (err.stack || err.message));
    if (!res.headersSent) {
      if (err && (err.name === 'MulterError' || err.message === 'Only image files are allowed!')) {
        return res.status(400).json({ msg: err.message });
      }
      return res.status(500).json({ msg: err && err.message ? err.message : 'Internal server error' });
    }
    next(err);
  });

  // ── HTTP + Socket.IO (only after DB is ready) ──────────────────────────────
  const PORT = process.env.PORT || 5000;
  const server = http.createServer(app);

  const io = initAuctionSockets(server);
  registerChatSocketHandlers(io);
  app.set('io', io);

  server.listen(PORT, () => {
    console.log("[startup] after server.listen");
    console.log(`Server running on port ${PORT} 🚀`);
  });
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
start().catch((error) => {
  console.error("FATAL: Startup failed — server will not listen.", error);
  process.exitCode = 1;
});