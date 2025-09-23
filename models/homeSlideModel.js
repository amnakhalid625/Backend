import mongoose from "mongoose";

const homeSlideSchema = new mongoose.Schema({
    image: { type: String, required: true },
    title: { type: String },
    status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] }
}, { timestamps: true });

const HomeSlide = mongoose.model("HomeSlide", homeSlideSchema);

export default HomeSlide;