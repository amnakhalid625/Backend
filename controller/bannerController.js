import Banner from "../models/bannerModel.js";
import AsyncHandler from "express-async-handler";
import ErrorResponse from "../utils/ErrorResponse.js";
import { deleteFile } from "../utils/fileHelper.js";

// Create a new banner
const createBanner = AsyncHandler(async (req, res, next) => {
    try {
        const { subtitle, description, backgroundColor, status } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : undefined;
        // Use filename as title if a title is not provided in the request body
        const title = req.body.title || (req.file ? req.file.originalname.split('.').slice(0, -1).join('.') : "Untitled");


        if (!image) {
            return next(new ErrorResponse("Image is required", 400));
        }

        const banner = await Banner.create({
            title,
            subtitle,
            description,
            backgroundColor,
            status,
            image,
        });

        res.status(201).json({
            success: true,
            message: "Banner created successfully",
            banner,
        });
    } catch (error) {
        console.error("Error creating banner:", error.message);
        if (req.file) deleteFile(`/uploads/${req.file.filename}`);
        return next(new ErrorResponse("Internal Server Error", 500));
    }
});

// Get all banners
const getBanners = AsyncHandler(async (req, res, next) => {
    try {
        const banners = await Banner.find().sort({ createdAt: 1 });
        res.status(200).json({
            success: true,
            count: banners.length,
            banners,
        });
    } catch (error) {
        console.error("Error fetching banners:", error.message);
        return next(new ErrorResponse("Internal Server Error", 500));
    }
});

// Get single banner by ID
const getBannerById = AsyncHandler(async (req, res, next) => {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
        return next(new ErrorResponse("Banner not found", 404));
    }

    res.status(200).json({ success: true, banner });
});

// Update banner
const updateBanner = AsyncHandler(async (req, res, next) => {
    const { title, subtitle, description, backgroundColor, status } = req.body;

    const banner = await Banner.findById(req.params.id);

    if (!banner) {
        if (req.file) deleteFile(`/uploads/${req.file.filename}`);
        return next(new ErrorResponse("Banner not found", 404));
    }

    if (req.file) {
        if (banner.image) {
            deleteFile(banner.image);
        }
        banner.image = `/uploads/${req.file.filename}`;
    }

    // Only update title if a new one is provided.
    if (title) banner.title = title;

    banner.subtitle = subtitle || banner.subtitle;
    banner.description = description || banner.description;
    banner.backgroundColor = backgroundColor || banner.backgroundColor;
    banner.status = status || banner.status;

    await banner.save();

    res.status(200).json({ success: true, message: "Banner updated", banner });
});

// Delete banner
const deleteBanner = AsyncHandler(async (req, res, next) => {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
        return next(new ErrorResponse("Banner not found", 404));
    }

    if (banner.image) {
        deleteFile(banner.image);
    }

    await banner.deleteOne();

    res.status(200).json({ success: true, message: "Banner deleted" });
});

export { createBanner, getBanners, getBannerById, updateBanner, deleteBanner };