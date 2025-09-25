import Category from "../models/categoryModel.js";
import AsyncHandler from "express-async-handler";
import ErrorResponse from "../utils/ErrorResponse.js";
import { deleteFile } from "../utils/fileHelper.js";

// Create a new category
const createCategory = AsyncHandler(async (req, res, next) => {
    try {
        const { name } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : undefined;

        if (!name) {
            if (image) deleteFile(image); // Clean up uploaded file if name is missing
            return next(new ErrorResponse("Category name is required", 400));
        }

        const category = await Category.create({ name, image });

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            category,
        });
    } catch (error) {
        console.error("Error creating category:", error.message);
        if (req.file) deleteFile(`/uploads/${req.file.filename}`);
        return next(new ErrorResponse("Internal Server Error", 500));
    }
});

// Get all categories
const getCategories = AsyncHandler(async (req, res, next) => {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        count: categories.length,
        categories,
    });
});

// Get single category by ID
const getCategoryById = AsyncHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return next(new ErrorResponse("Category not found", 404));
    }

    res.status(200).json({ success: true, category });
});

// Update category
const updateCategory = AsyncHandler(async (req, res, next) => {
    const { name } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
        if (req.file) deleteFile(`/uploads/${req.file.filename}`);
        return next(new ErrorResponse("Category not found", 404));
    }

    // If a new image is uploaded, delete the old one
    if (req.file) {
        if (category.image) {
            deleteFile(category.image);
        }
        category.image = `/uploads/${req.file.filename}`;
    }

    category.name = name || category.name;

    await category.save();

    res.status(200).json({
        success: true,
        message: "Category updated",
        category,
    });
});

// Delete category
const deleteCategory = AsyncHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        return next(new ErrorResponse("Category not found", 404));
    }

    // Delete associated image
    if (category.image) {
        deleteFile(category.image);
    }

    await category.deleteOne();

    res.status(200).json({ success: true, message: "Category deleted" });
});

export {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};