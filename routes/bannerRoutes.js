import express from "express";
import {
    createBanner,
    getBanners,
    getBannerById,
    updateBanner,
    deleteBanner,
} from "../controller/bannerController.js";
import { protect, adminProtected } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Admin-only routes
router.post("/", protect, adminProtected, upload.single("image"), createBanner);
router.get("/", getBanners);
router.get("/:id", getBannerById);
router.put(
    "/:id",
    protect,
    adminProtected,
    upload.single("image"),
    updateBanner
);
router.delete("/:id", protect, adminProtected, deleteBanner);

export default router;