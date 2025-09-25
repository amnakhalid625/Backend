import Banner from "../models/bannerModel.js";
import AsyncHandler from "express-async-handler";
import ErrorResponse from "../utils/ErrorResponse.js";

// Create a new banner
const createBanner = AsyncHandler(async (req, res, next) => {
  try {
    const { subtitle, description, backgroundColor, status } = req.body;
    const image = req.file ? req.file.path : undefined;

    const title =
      req.body.title ||
      (req.file
        ? req.file.originalname.split(".").slice(0, -1).join(".")
        : "Untitled");

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
    return next(new ErrorResponse("Internal Server Error", 500));
  }
});

// Get all banners
const getBanners = AsyncHandler(async (req, res, next) => {
  try {
    const banners = await Banner.find();
    res.status(200).json({ success: true, banners });
  } catch (error) {
    return next(new ErrorResponse("Failed to fetch banners", 500));
  }
});

// Get single banner
const getBannerById = AsyncHandler(async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return next(new ErrorResponse("Banner not found", 404));
    }
    res.status(200).json({ success: true, banner });
  } catch (error) {
    return next(new ErrorResponse("Internal Server Error!", 500));
  }
});

// Update banner
const updateBanner = AsyncHandler(async (req, res, next) => {
  const { title, subtitle, description, backgroundColor, status } = req.body;

  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    return next(new ErrorResponse("Banner not found", 404));
  }

  if (req.file) {
    banner.image = req.file.path;
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

  await banner.deleteOne();
  res.status(200).json({ success: true, message: "Banner deleted" });
});

// ✅ Named Exports
export {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
};
