import express from "express";
import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} from "../controller/categoryController.js";
import { protect, adminProtected } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Admin-only routes
router.post(
    "/",
    protect,
    adminProtected,
    upload.single("image"),
    createCategory
);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.put(
    "/:id",
    protect,
    adminProtected,
    upload.single("image"),
    updateCategory
);
router.delete("/:id", protect, adminProtected, deleteCategory);

export default router;