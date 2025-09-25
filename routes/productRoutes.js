import { Router } from "express";
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    createProductReview,
} from "../controller/productController.js";
import { adminProtected } from "../middleware/authMiddleware.js";
// import upload from "../middleware/uploadMiddleware.js"; // REMOVE THIS
import { uploadMultiple } from "../middleware/cloudinaryMiddleware.js"; // ADD THIS

const router = Router();

// Public routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin-only routes - Cloudinary use karein
router.post(
    "/admin/create-product",
    adminProtected,
    uploadMultiple, // Cloudinary multiple upload
    createProduct
);
router.put(
    "/admin/:id",
    adminProtected,
    uploadMultiple, // Cloudinary multiple upload
    updateProduct
);
router.delete("/admin/:id", adminProtected, deleteProduct);

router.post("/admin/:id/reviews", adminProtected, createProductReview);

export default router;