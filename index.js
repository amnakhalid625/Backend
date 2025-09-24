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

// Enhanced CORS configuration
app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            
            const allowedOrigins = [
                FRONT_END_URL, 
                ADMIN_DASHBOARD_URL,
                'https://admin-gray-mu.vercel.app', // Hardcode your admin URL as backup
                'http://localhost:5173', // For local development
                'http://localhost:3000'  // For local development
            ];
            
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log('CORS blocked origin:', origin);
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
            'Origin',
            'X-Requested-With', 
            'Content-Type', 
            'Accept',
            'Authorization',
            'Cache-Control',
            'Pragma'
        ],
        credentials: true,
        optionsSuccessStatus: 200
    })
);

// Handle preflight requests explicitly
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});

// Session configuration
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'your-fallback-secret',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            collectionName: "sessions",
            ttl: 14 * 24 * 60 * 60, // 14 days
        }),
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
        },
        rolling: true,
    })
);

// Debug middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} from origin: ${req.headers.origin}`);
    console.log('Session ID:', req.sessionID);
    next();
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        cors_origins: [FRONT_END_URL, ADMIN_DASHBOARD_URL]
    });
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
        hasUser: !!req.session?.user,
        headers: req.headers
    });
});

// Catch-all route for debugging
app.use('*', (req, res) => {
    console.log('Unmatched route:', req.method, req.originalUrl);
    res.status(404).json({ 
        error: 'Route not found', 
        method: req.method, 
        path: req.originalUrl 
    });
});

// error handling middleware
app.use(ErrorHandler);

app.listen(PORT, async () => {
    console.log(`app is running on PORT: ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Admin Dashboard URL:', ADMIN_DASHBOARD_URL);
    console.log('Frontend URL:', FRONT_END_URL);
    await DBConnect();
});