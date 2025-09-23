import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
}, { timestamps: true });


const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
        },
        brand: {
            type: String,
            required: [true, "Brand is required"],
            trim: true,
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true,
        },
        subCategory: {
            type: String,
            trim: true,
        },
        thirdLevelCategory: {
            type: String,
            trim: true,
        },
        originalPrice: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        price: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        stockQuantity: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        sku: {
            type: String,
            trim: true,
            unique: true,
            sparse: true,
        },
        weight: {
            type: Number,
            default: 0,
        },
        dimensions: {
            type: String,
            trim: true,
        },
        tags: {
            type: [String],
            default: [],
        },
        images: [
            {
                type: String,
                required: true,
            },
        ],
        reviews: [reviewSchema],
        averageRating: { type: Number, default: 0 },
        inStock: {
            type: Boolean,
            required: true,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// This pre-save hook is fine for handling stock status.
productSchema.pre('save', function (next) {
    if (this.isModified('stockQuantity')) {
        this.inStock = this.stockQuantity > 0;
    }
    next();
});

// REMOVED faulty updateAverageRating method.

const Product = mongoose.model("Product", productSchema);
export default Product;