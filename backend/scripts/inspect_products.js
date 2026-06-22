import mongoose from "mongoose";
import "dotenv/config";
import Product from "../models/Product.js";

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    const products = await Product.find().lean();
    console.log("All Products in Database:");
    console.dir(products.map(p => ({
      _id: p._id,
      title: p.title,
      rentalPrice: p.rentalPrice,
      productType: p.productType,
      category: p.category,
      status: p.status,
      location: p.location
    })), { depth: null });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
