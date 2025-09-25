import AsyncHandler from "express-async-handler";
import Product from "../models/productModel.js";
import ErrorResponse from "../utils/ErrorResponse.js";
// import { deleteFile } from "../utils/fileHelper.js"; // REMOVE THIS

// Get all products
export const getProducts = AsyncHandler(async (req, res, next) => {
    try {
        const {
            keyword,
            category,
            brand,
            minPrice,
            maxPrice,
            sort,
        } = req.query;

        let query = {};

        if (keyword) {
            query.$or = [
                { name: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } },
            ];
        }
        if (category) query.category = category;
        if (brand) query.brand = brand;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        let sortOption = { createdAt: -1 };
        if (sort) {
            if (sort === "priceAsc") sortOption = { price: 1 };
            else if (sort === "priceDesc") sortOption = { price: -1 };
            else if (sort === "rating") sortOption = { averageRating: -1 };
        }

        const products = await Product.find(query).sort(sortOption);
        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            products,
            totalProducts: total,
        });
    } catch (error) {
        console.log("Error in Get Products:", error.message);
        return next(new ErrorResponse("Internal Server Error!", 500));
    }
});

// Get single product by ID
export const getProductById = AsyncHandler(async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return next(new ErrorResponse("Product not found", 404));
        }
        res.status(200).json({ success: true, product });
    } catch (error) {
        return next(new ErrorResponse("Internal Server Error!", 500));
    }
});

// Create product review
export const createProductReview = AsyncHandler(async (req, res, next) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) {
            return next(new ErrorResponse("Product not found", 404));
        }
        const review = {
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user._id,
        };
        product.reviews.push(review);
        const totalRating = product.reviews.reduce((acc, item) => item.rating + acc, 0);
        product.averageRating = totalRating / product.reviews.length;
        await product.save();
        res.status(201).json({ message: "Review added successfully" });
    } catch (error) {
        console.error("Error creating product review:", error);
        return next(new ErrorResponse("Could not add review", 500));
    }    
});

// Create a new product
export const createProduct = AsyncHandler(async (req, res, next) => {
    try {
        const { name, brand, category, subCategory, thirdLevelCategory, description, price, originalPrice, stockQuantity, sku, weight, dimensions, tags, inStock } = req.body;
        
        // ✅ CLOUDINARY CHANGE: Use Cloudinary URLs
        const images = req.files ? req.files.map((file) => file.path) : [];
        
        if (!name || !brand || !category || !description || images.length === 0) {
            return next(new ErrorResponse("Please provide all required fields", 400));
        }

        const product = await Product.create({ 
            name, brand, category, subCategory, thirdLevelCategory, description, 
            price, originalPrice, stockQuantity, sku, weight, dimensions, 
            tags: tags ? tags.split(",").map((tag) => tag.trim()) : [], 
            images, // ✅ Cloudinary URLs
            inStock: stockQuantity > 0 
        });

        res.status(201).json({ 
            success: true, 
            message: "Product created successfully", 
            product 
        });
    } catch (error) {
        return next(new ErrorResponse("Internal Server Error!", 500));
    }
});

// Update product
export const updateProduct = AsyncHandler(async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return next(new ErrorResponse("Product not found", 404));
        }

        const { name, brand, category, subCategory, thirdLevelCategory, description, price, originalPrice, stockQuantity, sku, weight, dimensions, tags, inStock } = req.body;
        
        if (req.files && req.files.length > 0) {
            product.images = req.files.map((file) => file.path); // ✅ Cloudinary URLs
        }

        product.name = name || product.name;
        product.brand = brand || product.brand;
        product.category = category || product.category;
        product.subCategory = subCategory || product.subCategory;
        product.thirdLevelCategory = thirdLevelCategory || product.thirdLevelCategory;
        product.description = description || product.description;
        product.price = price ?? product.price;
        product.originalPrice = originalPrice ?? product.originalPrice;
        product.stockQuantity = stockQuantity ?? product.stockQuantity;
        product.sku = sku || product.sku;
        product.weight = weight ?? product.weight;
        product.dimensions = dimensions || product.dimensions;
        product.tags = tags ? tags.split(",").map((tag) => tag.trim()) : product.tags;
        product.inStock = inStock ?? (product.stockQuantity > 0);
        
        const updatedProduct = await product.save();
        res.status(200).json({ 
            success: true, 
            message: "Product updated successfully!", 
            product: updatedProduct 
        });
    } catch (error) {
        return next(new ErrorResponse("Internal Server Error!", 500));
    }
});

// Delete product
export const deleteProduct = AsyncHandler(async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return next(new ErrorResponse("Product not found", 404));
        }

        // ✅ Local file delete ki zaroorat nahi
        await product.deleteOne();
        
        res.json({ 
            success: true, 
            message: "Product removed successfully" 
        });
    } catch (error) {
        return next(new ErrorResponse("Internal Server Error!", 500));
    }
});

// ✅ CORRECTED EXPORT - all functions included
export { 
    getProducts, 
    getProductById, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    createProductReview
};