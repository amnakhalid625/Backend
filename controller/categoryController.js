import Category from "../models/categoryModel.js";
import AsyncHandler from "express-async-handler";
import ErrorResponse from "../utils/ErrorResponse.js";
import { deleteFile } from "../utils/fileHelper.js";

// Create a new category
const createCategory = AsyncHandler(async (req, res, next) => {
    try {
        console.log('\n=== CREATE CATEGORY START ===');
        console.log('Request body:', req.body);
        console.log('Uploaded file details:', req.file);
        
        const { name } = req.body;
        
        // CRITICAL FIX: Add leading slash to match frontend expectations
        const image = req.file ? `/uploads/${req.file.filename}` : undefined;
        
        console.log('Saved image path to database:', image);
        
        // Verify file actually exists on disk if uploaded
        if (req.file) {
            const fs = await import('fs');
            console.log('Checking file exists at:', req.file.path);
            
            if (fs.existsSync(req.file.path)) {
                console.log('✅ File verified on disk:', req.file.path);
                console.log('File size:', req.file.size, 'bytes');
            } else {
                console.log('❌ File NOT found on disk:', req.file.path);
                return next(new ErrorResponse("File upload failed - file not saved", 500));
            }
        }

        if (!name) {
            if (image) deleteFile(image.substring(1)); // Remove leading slash for deleteFile
            return next(new ErrorResponse("Category name is required", 400));
        }

        // Check if category with same name exists
        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
        });
        
        if (existingCategory) {
            if (image) deleteFile(image.substring(1)); // Clean up uploaded file
            return next(new ErrorResponse("Category with this name already exists", 400));
        }

        const category = await Category.create({ name: name.trim(), image });
        
        console.log('✅ Category created in database:', {
            id: category._id,
            name: category.name,
            image: category.image
        });
        console.log('=== CREATE CATEGORY END ===\n');

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            category,
        });
    } catch (error) {
        console.error("❌ Error creating category:", error.message);
        if (req.file) {
            deleteFile(`uploads/${req.file.filename}`);
            console.log('🗑️ Cleaned up file after error');
        }
        return next(new ErrorResponse("Internal Server Error", 500));
    }
});

// Get all categories
const getCategories = AsyncHandler(async (req, res, next) => {
    console.log('📋 Fetching all categories...');
    
    const categories = await Category.find().sort({ createdAt: -1 });
    
    console.log(`✅ Found ${categories.length} categories`);
    
    // Debug log categories with images
    categories.forEach(cat => {
        if (cat.image) {
            console.log(`- ${cat.name}: ${cat.image}`);
        }
    });
    
    res.status(200).json({
        success: true,
        count: categories.length,
        categories,
    });
});

// Get single category by ID
const getCategoryById = AsyncHandler(async (req, res, next) => {
    console.log('🔍 Fetching category ID:', req.params.id);
    
    const category = await Category.findById(req.params.id);

    if (!category) {
        console.log('❌ Category not found');
        return next(new ErrorResponse("Category not found", 404));
    }
    
    console.log('✅ Category found:', {
        name: category.name,
        image: category.image
    });

    res.status(200).json({ success: true, category });
});

// Update category
const updateCategory = AsyncHandler(async (req, res, next) => {
    console.log('\n=== UPDATE CATEGORY START ===');
    console.log('Category ID:', req.params.id);
    console.log('Update data:', req.body);
    console.log('New file:', req.file);
    
    const { name } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
        if (req.file) {
            deleteFile(`uploads/${req.file.filename}`);
            console.log('🗑️ Cleaned up file - category not found');
        }
        return next(new ErrorResponse("Category not found", 404));
    }

    // If a new image is uploaded, delete the old one and set new path
    if (req.file) {
        console.log('Processing image update...');
        
        // Verify new file exists
        const fs = await import('fs');
        if (!fs.existsSync(req.file.path)) {
            console.log('❌ New uploaded file missing:', req.file.path);
            return next(new ErrorResponse("File upload failed", 500));
        }
        
        // Delete old image if exists
        if (category.image) {
            const oldImagePath = category.image.startsWith('/') 
                ? category.image.substring(1) 
                : category.image;
            deleteFile(oldImagePath);
            console.log('🗑️ Deleted old image:', category.image);
        }
        
        // Set new image path with leading slash
        category.image = `/uploads/${req.file.filename}`;
        console.log('📷 New image set:', category.image);
    }

    if (name) {
        category.name = name.trim();
    }

    await category.save();
    
    console.log('✅ Category updated:', {
        name: category.name,
        image: category.image
    });
    console.log('=== UPDATE CATEGORY END ===\n');

    res.status(200).json({
        success: true,
        message: "Category updated",
        category,
    });
});

// Delete category
const deleteCategory = AsyncHandler(async (req, res, next) => {
    console.log('🗑️ Deleting category ID:', req.params.id);
    
    const category = await Category.findById(req.params.id);
    if (!category) {
        return next(new ErrorResponse("Category not found", 404));
    }

    // Delete associated image
    if (category.image) {
        const imagePath = category.image.startsWith('/') 
            ? category.image.substring(1) 
            : category.image;
        deleteFile(imagePath);
        console.log('🗑️ Deleted image file:', category.image);
    }

    await category.deleteOne();
    
    console.log('✅ Category deleted successfully:', category.name);

    res.status(200).json({ success: true, message: "Category deleted" });
});

export {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};