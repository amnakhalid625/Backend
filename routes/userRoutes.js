import { Router } from "express";
import {
    addToCart,
    addToWishlist,
    getAllUsers,
} from "../controller/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/cart", protect, addToCart);
router.post("/wishlist", protect, addToWishlist);

router.get("/", protect, getAllUsers);

export default router;
