import Category from "../models/categoryModel.js";
import AsyncHandler from "express-async-handler";
import ErrorResponse from "../utils/ErrorResponse.js";

// Create a new category
const createCategory = AsyncHandler(async (req, res, next) => {
  try {
    const { name } = req.body;

    const image = req.file ? req.file.path : undefined; // ✅ Cloudinary URL

    if (!name) {
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
    return next(new ErrorResponse("Internal Server Error", 500));
  }
});

// Get all categories
const getCategories = AsyncHandler(async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ success: true, categories });
  } catch (error) {
    return next(new ErrorResponse("Failed to fetch categories", 500));
  }
});

// Get single category by ID
const getCategoryById = AsyncHandler(async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return next(new ErrorResponse("Category not found", 404));
    }
    res.status(200).json({ success: true, category });
  } catch (error) {
    return next(new ErrorResponse("Internal Server Error", 500));
  }
});

// Update category
const updateCategory = AsyncHandler(async (req, res, next) => {
  const { name } = req.body;
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse("Category not found", 404));
  }

  if (req.file) {
    category.image = req.file.path; // ✅ Cloudinary URL
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

  await category.deleteOne();

  res.status(200).json({ success: true, message: "Category deleted" });
});

// ✅ EXPORT ALL
export default {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
