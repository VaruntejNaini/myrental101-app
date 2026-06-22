import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Wish from "../models/Wish.js";
import Transaction from "../models/Transaction.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import Review from "../models/Review.js";
import Auction from "../models/Auction.js";
import Address from "../models/Address.js";

const checkCounts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database. 🚀");

    const collections = [
      { name: "User", model: User },
      { name: "Product", model: Product },
      { name: "Wish (Requests)", model: Wish },
      { name: "Transaction (Chat Threads)", model: Transaction },
      { name: "Message", model: Message },
      { name: "Notification (Requests Log)", model: Notification },
      { name: "Review", model: Review },
      { name: "Auction", model: Auction },
      { name: "Address", model: Address }
    ];

    for (const col of collections) {
      const count = await col.model.countDocuments({});
      console.log(`${col.name}: ${count}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkCounts();
