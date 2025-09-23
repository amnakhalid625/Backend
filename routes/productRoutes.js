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
import upload from "../middleware/uploadMiddleware.js";

const router = Router();

// Public routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin-only routes
router.post(
    "/admin/create-product",
    adminProtected,
    upload.array("images", 10), // Allow up to 10 images
    createProduct
);
router.put(
    "/admin/:id",
    adminProtected,
    upload.array("images", 10),
    updateProduct
);
router.delete("/admin/:id", adminProtected, deleteProduct);

router.post("/admin/:id/reviews", adminProtected, createProductReview);



export default router;