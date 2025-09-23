import { Router } from "express";
import { adminProtected, protect } from "../middleware/authMiddleware.js";
import {
    createOrder,
    deleteOrder,
    getOrder,
    getOrders,
    updateOrderStatus,
} from "../controller/orderController.js";

const router = Router();

router.get("/", adminProtected, getOrders);
router.get("/:id", protect, getOrder);
router.post("/create-order", protect, createOrder);
router.put("/:id/status", protect, adminProtected, updateOrderStatus);
router.delete("/:id", protect, adminProtected, deleteOrder);

export default router;
