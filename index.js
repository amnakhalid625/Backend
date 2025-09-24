// packages
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "path";

dotenv.config();

// routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import DBConnect from "./config/db.js";
import { ErrorHandler } from "./middleware/ErrorHandler.js";

// config
const PORT = process.env.PORT || 8080;
const FRONT_END_URL = process.env.FRONT_END_URL || "http://localhost:3000";
const ADMIN_DASHBOARD_URL = process.env.ADMIN_DASHBOARD_URL || "http://localhost:5173";

const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS configuration - BEFORE session middleware
app.use(
    cors({
        origin: [FRONT_END_URL, ADMIN_DASHBOARD_URL],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true, // This is crucial for session cookies
        optionsSuccessStatus: 200
    })
);

// Session configuration - AFTER CORS
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            collectionName: "sessions",
            ttl: 14 * 24 * 60 * 60, // 14 days
        }),
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // false for development
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
        },
        rolling: true, // Reset expiration on each request
    })
);

// Debug middleware to log session info
app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);
    next();
});

// Serve static files from the 'uploads' directory
const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/admin", adminRoutes);

// Test route to check session
app.get('/api/test-session', (req, res) => {
    res.json({
        sessionID: req.sessionID,
        session: req.session,
        hasUser: !!req.session?.user
    });
});

// error handling middleware
app.use(ErrorHandler);

app.listen(PORT, async () => {
    console.log(`app is running on PORT: ${PORT}`);
    await DBConnect();
});