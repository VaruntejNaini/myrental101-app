import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import Review from "../models/Review.js";
import Auction from "../models/Auction.js";
import Product from "../models/Product.js";

const BACKUP_DIR = "C:/Users/Varuntej/.gemini/antigravity/brain/adb6ce95-77b6-46fd-ae56-7659144633e8/scratch";

// Helper to find the latest backup file for a collection
const getLatestBackupFile = (collectionName) => {
  if (!fs.existsSync(BACKUP_DIR)) return null;
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith(`backup_${collectionName}_`) && f.endsWith(".json"));
  if (files.length === 0) return null;
  // Sort descending to get the latest timestamp
  files.sort((a, b) => b.localeCompare(a));
  return path.join(BACKUP_DIR, files[0]);
};

const restoreCollection = async (name, model) => {
  const filePath = getLatestBackupFile(name);
  if (!filePath) {
    console.log(`⚠️ No backup found for collection: ${name}. Skipping...`);
    return;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);
  
  if (data.length === 0) {
    console.log(`ℹ️ Backup for "${name}" is empty. Skipping insertion.`);
    return;
  }

  // Clear current data first to avoid duplicate key violations
  await model.deleteMany({});
  
  // Re-insert documents
  const res = await model.insertMany(data);
  console.log(`✅ Successfully restored ${res.length} documents into "${name}" from: ${filePath}`);
};

const runRestore = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing.");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB database successfully for restoration. 🚀");

    console.log("--- RESTORING DATABASE STATE ---");
    
    // Deletions first to ensure fresh restore of state
    await restoreCollection("transactions", Transaction);
    await restoreCollection("messages", Message);
    await restoreCollection("notifications", Notification);
    await restoreCollection("reviews", Review);
    await restoreCollection("auctions", Auction);
    await restoreCollection("products", Product);

    console.log("\nDatabase restoration successfully completed! 🎉");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Restoration failed ❌");
    console.error(err);
    process.exit(1);
  }
};

runRestore();
