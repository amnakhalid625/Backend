// index.js - Fixed Version
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "path";

dotenv.config();

// ✅ Available routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import DBConnect from "./config/db.js";
import { ErrorHandler } from "./middleware/ErrorHandler.js";

const PORT = process.env.PORT || 8080;
const FRONT_END_URL = process.env.FRONT_END_URL || "https://frontend-seven-alpha-49.vercel.app";
const ADMIN_DASHBOARD_URL = process.env.ADMIN_DASHBOARD_URL || "https://adminnew-omega.vercel.app";

// ✅ For path.resolve()
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);

// ✅ Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ CORS - Updated with production URLs
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  FRONT_END_URL,
  ADMIN_DASHBOARD_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('Blocked origin:', origin);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Handle preflight
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.origin;
    
    if (!origin || allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin || "*");
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Cookie");
    res.header("Access-Control-Allow-Credentials", "true");
    return res.sendStatus(200);
  }
  next();
});

// ✅ Sessions with proper MongoDB connection
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ ERROR: MongoDB URI not found in environment variables!");
  console.error("Please set MONGO_URI or MONGODB_URI in your .env file");
}

app.use(session({
    name: 'admin.session',
    secret: process.env.SESSION_SECRET || 'your-session-secret-here',
    resave: false,
    saveUninitialized: false,
    store: MONGODB_URI ? MongoStore.create({
        mongoUrl: MONGODB_URI,
        touchAfter: 24 * 3600 // lazy session update
    }) : undefined,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// ✅ Debug Middleware (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
      console.log(`\n=== ${req.method} ${req.path} ===`);
      console.log('Origin:', req.headers.origin);
      console.log('Session ID:', req.sessionID);
      console.log('Session User:', req.session?.user ? 'Found' : 'Not found');
      
      if (req.originalUrl.startsWith("//uploads/")) {
          console.log("🚨 DOUBLE SLASH DETECTED in URL:", req.originalUrl);
      }
      
      next();
  });
}

// ✅ Static uploads
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "1y",
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");

      const ext = path.extname(filePath).toLowerCase();
      switch (ext) {
        case ".jpg":
        case ".jpeg":
          res.set("Content-Type", "image/jpeg");
          break;
        case ".png":
          res.set("Content-Type", "image/png");
          break;
        case ".webp":
          res.set("Content-Type", "image/webp");
          break;
        case ".avif":
          res.set("Content-Type", "image/avif");
          break;
        default:
          res.set("Content-Type", "application/octet-stream");
      }
    },
  })
);

// ✅ ROOT ROUTE - Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Backend API is running successfully!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      product: '/api/product',
      category: '/api/category',
      banner: '/api/banner',
      order: '/api/order',
      admin: '/api/admin'
    }
  });
});

// ✅ Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/admin", adminRoutes);

// ✅ 404 handler
app.use((req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log("Unmatched route:", req.method, req.originalUrl);
  }

  if (req.originalUrl.startsWith("/uploads/") || req.originalUrl.startsWith("//uploads/")) {
    return res.status(404).json({
      error: "Image not found",
      requestedPath: req.originalUrl,
      note: "Check if file exists and URL is correctly formatted",
    });
  }

  res.status(404).json({
    error: "Route not found",
    method: req.method,
    path: req.originalUrl,
    availableRoutes: [
      '/api/auth/*',
      '/api/user/*',
      '/api/product/*',
      '/api/category/*',
      '/api/banner/*',
      '/api/order/*',
      '/api/admin/*'
    ]
  });
});

// ✅ Error handler
app.use(ErrorHandler);

// ✅ Start server
app.listen(PORT, async () => {
  console.log(`✅ Server running on PORT: ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Uploads directory: ${path.join(__dirname, "uploads")}`);
  
  try {
    await DBConnect();
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
  }
});