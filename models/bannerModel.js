import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        subtitle: { type: String },
        description: { type: String },
        image: { type: String, required: true },
        backgroundColor: { type: String, default: "#000000" },
        status: { type: String, default: "Active", enum: ["Active", "Inactive"] },
    },
    { timestamps: true }
);

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;