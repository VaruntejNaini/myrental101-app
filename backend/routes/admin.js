import express from "express";
import { verifyToken, requireAdmin } from "../middleware/auth.js";
import { adminLimiter } from "../middleware/adminLimiter.js";
import {
  listDisputes,
  resolveDispute,
  getAuditLogs,
  getMetrics,
  listUsers,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(adminLimiter);
router.use(verifyToken);
router.use(requireAdmin);

router.get("/disputes", listDisputes);
router.post("/disputes/:id/resolve", resolveDispute);
router.get("/audit-logs", getAuditLogs);
router.get("/metrics", getMetrics);
router.get("/users", listUsers);

export default router;
