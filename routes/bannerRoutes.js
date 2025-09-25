import express from "express";
import {
    createBanner,
    getBanners,
    getBannerById,
    updateBanner,
    deleteBanner,
} from "../controller/bannerController.js";
import { protect, adminProtected } from "../middleware/authMiddleware.js";
// import upload from "../middleware/uploadMiddleware.js"; // REMOVE THIS
import { uploadSingle } from "../middleware/cloudinaryMiddleware.js"; // ADD THIS

const router = express.Router();

// Admin-only routes - Cloudinary use karein
router.post("/", protect, adminProtected, uploadSingle, createBanner);
router.get("/", getBanners);
router.get("/:id", getBannerById);
router.put("/:id", protect, adminProtected, uploadSingle, updateBanner);
router.delete("/:id", protect, adminProtected, deleteBanner);

export default router;