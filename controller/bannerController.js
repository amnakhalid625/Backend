import Banner from "../models/bannerModel.js";
import AsyncHandler from "express-async-handler";
import ErrorResponse from "../utils/ErrorResponse.js";
// import { deleteFile } from "../utils/fileHelper.js"; // REMOVE THIS

// Create a new banner
const createBanner = AsyncHandler(async (req, res, next) => {
    try {
        const { subtitle, description, backgroundColor, status } = req.body;
        
        // ✅ CLOUDINARY CHANGE: Use Cloudinary URL instead of local path
        const image = req.file ? req.file.path : undefined;
        
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
            image, // ✅ Cloudinary URL save hogi
        });

        res.status(201).json({
            success: true,
            message: "Banner created successfully",
            banner,
        });
    } catch (error) {
        console.error("Error creating banner:", error.message);
        // ✅ Local file delete ki zaroorat nahi
        return next(new ErrorResponse("Internal Server Error", 500));
    }
});

// Update banner
const updateBanner = AsyncHandler(async (req, res, next) => {
    const { title, subtitle, description, backgroundColor, status } = req.body;

    const banner = await Banner.findById(req.params.id);

    if (!banner) {
        // ✅ Local file delete ki zaroorat nahi
        return next(new ErrorResponse("Banner not found", 404));
    }

    if (req.file) {
        // ✅ Old image Cloudinary se delete karne ki zaroorat nahi (optional)
        banner.image = req.file.path; // ✅ Cloudinary URL
    }

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

    // ✅ Local file delete ki zaroorat nahi
    // Cloudinary pe image reh sakti hai (free tier mein sufficient space)

    await banner.deleteOne();

    res.status(200).json({ success: true, message: "Banner deleted" });
});

// getBanners aur getBannerById mein koi change nahi
export { createBanner, getBanners, getBannerById, updateBanner, deleteBanner };