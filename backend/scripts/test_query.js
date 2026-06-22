import mongoose from "mongoose";
import "dotenv/config";
import Product from "../models/Product.js";

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const lat = 17.385;
    const lng = 78.4867;
    const dist = 100;

    const radiusInRadians = dist / 6378.1;
    const query = {
      status: { $ne: "INACTIVE" },
      productType: "SECOND_HAND",
      location: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians]
        }
      }
    };

    console.log("Running query:", JSON.stringify(query, null, 2));
    const results = await Product.find(query);
    console.log("Results count:", results.length);
    console.log("Titles:", results.map(r => r.title));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
