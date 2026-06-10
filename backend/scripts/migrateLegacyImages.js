import "dotenv/config";
import mongoose from "mongoose";
import Product from "../models/Product.js";

const migrateLegacyImages = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is missing in process.env.");
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfully for migration. 🚀");
    
    const products = await Product.find({});
    let count = 0;
    
    for (const product of products) {
      let modified = false;
      const newImages = product.images.map(img => {
        // Handle case where image is stored as raw string (Base64/URL)
        if (typeof img === "string") {
          modified = true;
          return {
            url: img,
            publicId: null
          };
        }
        
        // Handle case where image is an object but lacks publicId structure
        if (img && typeof img === "object" && !("publicId" in img)) {
          modified = true;
          return {
            url: img.url || "",
            publicId: null
          };
        }
        
        return img;
      });
      
      if (modified) {
        product.images = newImages;
        product.markModified("images");
        await product.save();
        count++;
        console.log(`[MIGRATED] Product "${product.title}" images normalized.`);
      }
    }
    
    console.log(`Migration execution completed. Total documents updated: ${count} ✅`);
    await mongoose.disconnect();
  } catch (err) {
    console.error("Migration failed ❌");
    console.error(err);
    process.exit(1);
  }
};

migrateLegacyImages();
