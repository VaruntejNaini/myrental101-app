import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { logFailure } from "../services/auditService.js";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  //console.log('>>> AUTH: verifyToken invoked. Authorization header present:', !!authHeader);

  if (!token) {
    console.log('>>> AUTH: No token present - blocking request.');
    return res.status(403).json({ msg: "umm! we can't identify you please register / login into our page first for using our platform" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    //console.log('>>> AUTH: Token verified. userId=', req.userId);
    next();
  } catch (err) {
    console.log('>>> AUTH: Token verification failed:', err.message);
    return res.status(401).json({ msg: "Token is invalid or expired" });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("role");
    if (!user || user.role !== "ADMIN") {
      await logFailure({
        actor: req.userId,
        actionType: "UNAUTHORIZED_ADMIN_ACCESS",
        summary: "Non-admin user attempted to access an admin-only endpoint.",
        metadata: { path: req.originalUrl, method: req.method },
      });
      return res.status(403).json({ msg: "Admin access required" });
    }
    req.adminUser = user;
    next();
  } catch (err) {
    return res.status(500).json({ msg: "Unable to verify admin access" });
  }
};
