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

// Target backup folder in the scratch workspace
const BACKUP_DIR = "C:/Users/Varuntej/.gemini/antigravity/brain/adb6ce95-77b6-46fd-ae56-7659144633e8/scratch";

const runFreshStart = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing.");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB database successfully. 🚀");

    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    console.log("--- STEP 1: Creating Backups ---");
    const collectionsToBackup = [
      { name: "transactions", model: Transaction },
      { name: "messages", model: Message },
      { name: "notifications", model: Notification },
      { name: "reviews", model: Review },
      { name: "auctions", model: Auction },
      { name: "products", model: Product }
    ];

    for (const col of collectionsToBackup) {
      const docs = await col.model.find({});
      const filePath = path.join(BACKUP_DIR, `backup_${col.name}_${Date.now()}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
      console.log(`Backed up ${docs.length} documents from "${col.name}" to: ${filePath}`);
    }

    console.log("--- STEP 2: Resetting Products to Active status ---");
    // Find products that are reserved or have active auctions
    const productsToReset = await Product.find({
      status: { $in: ["RESERVED", "AUCTION_ACTIVE"] }
    });
    console.log(`Found ${productsToReset.length} products to reset status.`);

    const resetResult = await Product.updateMany(
      { status: { $in: ["RESERVED", "AUCTION_ACTIVE"] } },
      { $set: { status: "ACTIVE", currentBid: 0 }, $unset: { auctionEndTime: "" } }
    );
    console.log(`Reset ${resetResult.modifiedCount} products back to ACTIVE status.`);

    console.log("--- STEP 3: Purging Target Collections ---");
    
    const tRes = await Transaction.deleteMany({});
    console.log(`Purged Transactions: Deleted ${tRes.deletedCount} documents.`);

    const mRes = await Message.deleteMany({});
    console.log(`Purged Messages: Deleted ${mRes.deletedCount} documents.`);

    const nRes = await Notification.deleteMany({});
    console.log(`Purged Notifications: Deleted ${nRes.deletedCount} documents.`);

    const rRes = await Review.deleteMany({});
    console.log(`Purged Reviews: Deleted ${rRes.deletedCount} documents.`);

    const aRes = await Auction.deleteMany({});
    console.log(`Purged Auctions: Deleted ${aRes.deletedCount} documents.`);

    console.log("--- STEP 4: Verification ---");
    console.log("Verifying current document counts:");
    console.log(`Transactions (should be 0): ${await Transaction.countDocuments({})}`);
    console.log(`Messages (should be 0): ${await Message.countDocuments({})}`);
    console.log(`Notifications (should be 0): ${await Notification.countDocuments({})}`);
    console.log(`Reviews (should be 0): ${await Review.countDocuments({})}`);
    console.log(`Auctions (should be 0): ${await Auction.countDocuments({})}`);
    console.log(`Products (remaining): ${await Product.countDocuments({})}`);

    console.log("\nDatabase fresh start purge successfully completed! 🎉");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Purge failed ❌");
    console.error(err);
    process.exit(1);
  }
};

runFreshStart();
