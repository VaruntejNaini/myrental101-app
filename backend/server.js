import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/auth.js";

const requiredEnv = [
  "MONGO_URI",
  "JWT_SECRET",
  "EMAIL_USER",
  "EMAIL_PASS",
];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error("Missing required environment variables:", missingEnv.join(", "));
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

/// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  family: 4,
  
})

.then(() => {
  console.log("MongoDB Connected ✅");
})
.catch((err) => {
  console.error("FULL ERROR:", err.message);
});
console.log("Mongo URI:", process.env.MONGO_URI);

/// ✅ Mount auth routes
app.use("/api/auth", authRoutes);

/// Test route
app.get("/", (req, res) => {
  res.send("API running...");
});

app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});

