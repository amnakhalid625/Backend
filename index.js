// server.js - Updated session configuration
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
const FRONT_END_URL = process.env.FRONT_END_URL || "https://frontend-seven-alpha-49.vercel.app";
const ADMIN_DASHBOARD_URL = process.env.ADMIN_DASHBOARD_URL || "https://adminnew-omega.vercel.app";

const app = express();

// Trust proxy for production (important for secure cookies)
app.set('trust proxy', 1);

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Enhanced CORS configuration - MUST come before session middleware
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            
            const allowedOrigins = [
                FRONT_END_URL,
                ADMIN_DASHBOARD_URL,
                'https://admin-gray-mu.vercel.app',
                'https://adminnew-omega.vercel.app',
                'https://frontend-seven-alpha-49.vercel.app',
                'http://localhost:5173',
                'http://localhost:3000'
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
            'Pragma',
            'Cookie'
        ],
        credentials: true,
        optionsSuccessStatus: 200
    })
);

// Handle preflight requests
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Cookie');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.sendStatus(200);
    } else {
        next();
    }
});

// FIXED Session configuration - key changes
app.use(
    session({
        name: 'admin.session', // Custom session name
        secret: process.env.SESSION_SECRET || 'your-super-secret-key',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            collectionName: "admin_sessions", // Separate collection for admin sessions
            ttl: 7 * 24 * 60 * 60, // 7 days
            autoRemove: 'native'
        }),
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only secure in production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        },
        rolling: true // Reset expiration on activity
    })
);

// Enhanced debug middleware
app.use((req, res, next) => {
    console.log(`\n=== ${req.method} ${req.path} ===`);
    console.log('Origin:', req.headers.origin);
    console.log('Session ID:', req.sessionID);
    console.log('Session User:', req.session?.user ? 'Present' : 'Not found');
    console.log('Cookies:', req.headers.cookie ? 'Present' : 'None');
    next();
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        session: {
            id: req.sessionID,
            hasUser: !!req.session?.user
        }
    });
});

// Session test route
app.get('/api/test-session', (req, res) => {
    res.json({
        sessionID: req.sessionID,
        hasSession: !!req.session,
        hasUser: !!req.session?.user,
        user: req.session?.user || null,
        cookies: req.headers.cookie
    });
});

// Serve static files
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

// 404 handler
app.use((req, res, next) => {
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
    console.log(`🚀 Server running on PORT: ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Admin Dashboard URL:', ADMIN_DASHBOARD_URL);
    console.log('Frontend URL:', FRONT_END_URL);
    await DBConnect();
});