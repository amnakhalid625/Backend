import express from "express";
import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} from "../controller/categoryController.js";
import { protect, adminProtected } from "../middleware/authMiddleware.js";
// import upload from "../middleware/uploadMiddleware.js"; // REMOVE THIS
import { uploadSingle } from "../middleware/cloudinaryMiddleware.js"; // ADD THIS

const router = express.Router();

// Admin-only routes - Cloudinary use karein
router.post("/", protect, adminProtected, uploadSingle, createCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.put("/:id", protect, adminProtected, uploadSingle, updateCategory);
router.delete("/:id", protect, adminProtected, deleteCategory);

export default router;