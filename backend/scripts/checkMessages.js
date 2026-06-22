import "dotenv/config";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";

const checkMessages = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing.");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfully. 🚀");

    const count = await Message.countDocuments({});
    console.log(`Total messages in database: ${count}`);

    if (count > 0) {
      const sample = await Message.find({}).limit(5).populate("sender", "name").populate("receiver", "name");
      console.log("Sample messages:", JSON.stringify(sample, null, 2));
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkMessages();
