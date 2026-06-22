import rateLimit from "express-rate-limit";

export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: "Too many admin requests. Please try again later." },
});
