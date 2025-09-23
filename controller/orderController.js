import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import AsyncHandler from "express-async-handler";
import ErrorResponse from "../utils/ErrorResponse.js";
import Stripe from "stripe";

// createOrder is for customers, not directly related to the admin panel bug
export const createOrder = AsyncHandler(async (req, res, next) => {
    // ... existing createOrder code ...
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
        return next(new ErrorResponse("No order items", 400));
    }

    if (paymentMethod === "Stripe") {
        const productIds = orderItems.map((item) => item._id);
        const productsFromDB = await Product.find({ _id: { $in: productIds } });
        const line_items = orderItems.map((item) => {
            const productInfo = productsFromDB.find(
                (p) => p._id.toString() === item._id
            );
            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: productInfo ? productInfo.name : "Product",
                        images:
                            productInfo && productInfo.images.length > 0
                                ? [productInfo.images[0]]
                                : [],
                    },
                    unit_amount: Math.round(
                        (itemsPrice / orderItems.length) * 100
                    ),
                },
                quantity: item.quantity,
            };
        });
        if (shippingPrice > 0) {
            line_items.push({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: "Shipping Fee",
                    },
                    unit_amount: Math.round(shippingPrice * 100),
                },
                quantity: 1,
            });
        }
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items,
            mode: "payment",
            success_url: `${process.env.FRONT_END_URL}/order-success`,
            cancel_url: `${process.env.FRONT_END_URL}/cart`,
            metadata: {
                userId: req.user._id.toString(),
                orderData: JSON.stringify(req.body),
            },
        });
        res.status(200).json({ url: session.url });
    } else {
        const order = new Order({
            user: req.user._id,
            orderItems: orderItems.map((item) => ({
                product: item._id,
                quantity: item.quantity,
            })),
            shippingAddress,
            paymentMethod,
            itemsPrice,
            shippingPrice,
            totalPrice,
        });

        const createdOrder = await order.save();
        const user = await User.findById(req.user._id);
        if (user) {
            user.cart = [];
            user.orders.push(createdOrder._id);
            await user.save();
        }
        res.status(201).json(createdOrder);
    }
});

// Get all orders for the admin panel
export const getOrders = AsyncHandler(async (req, res, next) => {
    try {
        const orders = await Order.find({})
            .populate("user", "name email")
            .populate("orderItems.product")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders,
            message: "Orders fetched successfully",
        });
    } catch (error) {
        console.error("Error in getOrders:", error);
        return next(new ErrorResponse("Failed to fetch orders", 500));
    }
});

// Get a single order's details
export const getOrder = AsyncHandler(async (req, res, next) => {
    try {
        // THIS IS THE FIX: Changed 'items.product' to 'orderItems.product'
        const order = await Order.findById(req.params.id)
            .populate("user", "name email")
            .populate("orderItems.product", "name price images");

        if (!order) {
            return next(
                new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
            );
        }

        res.status(200).json({
            success: true,
            data: order,
            message: "Order fetched successfully",
        });
    } catch (error) {
        console.error("Error in getOrder:", error);
        return next(new ErrorResponse("Failed to fetch order details", 500));
    }
});


// Update an order's status
export const updateOrderStatus = AsyncHandler(async (req, res, next) => {
    const { status } = req.body;

    if (!status) {
        return next(new ErrorResponse("Status is required", 400));
    }

    const validStatuses = [
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
        return next(new ErrorResponse("Invalid status", 400));
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(
            new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
        );
    }

    // The field in the model is 'orderStatus', not 'status'
    order.orderStatus = status;
    await order.save();

    res.status(200).json({
        success: true,
        data: order,
        message: "Order status updated successfully",
    });
});

// Delete an order
export const deleteOrder = AsyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(
            new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
        );
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        data: {},
        message: "Order deleted successfully",
    });
});