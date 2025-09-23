import { Router } from "express";

// controllers
import {
    signUp,
    signIn,
    logout,
    adminLogin,
    adminSignUp,
} from "../controller/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// test route
router.get("/test", (req, res) => {
    res.json({ message: "Auth route is working!" });
});

router.post("/sign-up", signUp);
router.post("/sign-in", signIn);
router.post("/admin-login", adminLogin);
router.post("/admin-sign-up", adminSignUp);
router.post("/log-out", protect, logout);

export default router;
