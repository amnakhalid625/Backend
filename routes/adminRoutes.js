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
router.get("/session-test", (req, res) => {
    res.json({
        sessionId: req.sessionID,
        hasSession: !!req.session,
        hasUser: !!req.session?.user,
        userEmail: req.session?.user?.email || null
    });
});

export default router;
