import { Router } from "express";
import { adminProtected } from "../middleware/authMiddleware.js";
import {
    getDashboardChartData,
    getDashboardStats,
} from "../controller/adminController.js";

const router = Router();

// Dashboard Stats
router.get("/stats", adminProtected, getDashboardStats);
router.get("/statics", adminProtected, getDashboardChartData);

export default router;
