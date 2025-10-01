import express from "express";
import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} from "../controller/categoryController.js";
import { protect, adminProtected } from "../middleware/authMiddleware.js";
import { uploadSingle } from "../middleware/uploadMiddleware.js"; // Import the fixed version

const router = express.Router();

// Admin-only routes with enhanced upload middleware
router.post(
    "/",
    protect,
    adminProtected,
    uploadSingle('image'), // Use the enhanced version with logging
    createCategory
);

router.get("/", getCategories);

router.get("/:id", getCategoryById);

router.put(
    "/:id",
    protect,
    adminProtected,
    uploadSingle('image'), // Use the enhanced version
    updateCategory
);

router.delete("/:id", protect, adminProtected, deleteCategory);

export default router;