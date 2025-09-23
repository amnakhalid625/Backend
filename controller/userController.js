import User from "../models/userModel.js";
import AsyncHandler from "express-async-handler";
import ErrorResponse from "../utils/ErrorResponse.js";

export const addToCart = AsyncHandler(async (req, res, next) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || !quantity) {
            return next(
                new ErrorResponse("Product ID and quantity are required", 400)
            );
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return next(new ErrorResponse("User not found", 404));
        }

        const itemExists = user.cart.find(
            (item) => item.product.toString() === productId
        );

        if (itemExists) {
            itemExists.quantity += quantity;
        } else {
            user.cart.push({ product: productId, quantity });
        }

        await user.save();
        res.status(201).json({
            success: true,
            message: "Item added to cart",
            cart: user.cart,
        });
    } catch (error) {
        console.error("Error in addToCart:", error.message);
        return next(new ErrorResponse("Internal Server Error", 500));
    }
});

export const addToWishlist = AsyncHandler(async (req, res, next) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return next(new ErrorResponse("Product ID is required", 400));
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return next(new ErrorResponse("User not found", 404));
        }

        const itemIndex = user.whishlist.findIndex(
            (item) => item.toString() === productId
        );

        if (itemIndex > -1) {
            user.whishlist.splice(itemIndex, 1);
            await user.save();
            res.status(200).json({
                message: "Item removed from wishlist",
                whishlist: user.whishlist,
            });
        } else {
            user.whishlist.push(productId);
            await user.save();
            res.status(201).json({
                success: true,
                message: "Item added to wishlist",
                whishlist: user.whishlist,
            });
        }
    } catch (error) {
        console.error("Error in addToWishlist:", error.message);
        return next(new ErrorResponse("Internal Server Error", 500));
    }
});

export const getAllUsers = AsyncHandler(async (req, res, next) => {
    try {
        const users = await User.find().select("-password"); // Exclude passwords

        if (!users || users.length === 0) {
            return next(new ErrorResponse("No users found", 404));
        }

        res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error("Error in getAllUsers:", error.message);
        return next(new ErrorResponse("Internal Server Error", 500));
    }
});

export const updateUser = AsyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (req.user.id !== id || req.user.role !== "admin") {
        return next(new ErrorResponse("You'r not allowed here!", 401));
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorResponse("Invalid user ID format", 400));
    }

    const updateData = { ...req.body };

    // Security: Remove sensitive fields that shouldn't be updated via this endpoint
    const restrictedFields = [
        "password",
        "role",
        "isEmailVerified",
        "refreshToken",
    ];
    restrictedFields.forEach((field) => delete updateData[field]);

    // Check if there's actually data to update
    if (Object.keys(updateData).length === 0) {
        return next(
            new ErrorResponse("No valid fields provided for update", 400)
        );
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
        context: "query", // Ensures validators run with proper context
    }).select("-password -__v");

    if (!user) {
        return next(new ErrorResponse("User not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: {
            user,
        },
    });
});

export const deleteUser = AsyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorResponse("Invalid user ID format", 400));
    }

    if (req.user && req.user.id === id) {
        return next(new ErrorResponse("Cannot delete your own account", 400));
    }

    // Find user first to check if exists and get user data for cleanup
    const user = await User.findById(id);

    if (!user) {
        return next(new ErrorResponse("User not found", 404));
    }

    // Optional: Prevent deletion of admin users (adjust based on your role system)
    if (user.role === "admin") {
        return next(
            new ErrorResponse(
                "Insufficient permissions to delete admin user",
                403
            )
        );
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: "User deleted successfully",
        data: {
            deletedUserId: id,
        },
    });
});
