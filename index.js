// index.js - Clean & Updated
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "path";

dotenv.config();

// ✅ Available routes (as per your folder screenshot)
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
const FRONT_END_URL =
  process.env.FRONT_END_URL ||
  "https://frontend-seven-alpha-49.vercel.app";
const ADMIN_DASHBOARD_URL =
  process.env.ADMIN_DASHBOARD_URL ||
  "https://adminnew-omega.vercel.app";

// ✅ Must add this for path.resolve():
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);

// ✅ Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ CORS - FIXED: Added port 5173 for admin panel
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Handle preflight - FIXED: Updated to handle multiple origins
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.origin;
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];
    
    if (allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Cookie"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    return res.sendStatus(200);
  }
  next();
});

// ✅ Sessions - FIXED: Added MongoStore for session persistence
// ✅ Sessions - FIXED: Use MONGO_URI instead of MONGODB_URI
app.use(session({
    name: 'admin.session',
    secret: process.env.SESSION_SECRET || 'your-session-secret-here',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI  // Changed from MONGODB_URI to MONGO_URI
    }),
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));

// ✅ Enhanced Debug Middleware - Added after session configuration
app.use((req, res, next) => {
    console.log(`\n=== ${req.method} ${req.path} ===`);
    console.log('Origin:', req.headers.origin);
    console.log('Session ID:', req.sessionID);
    console.log('Session User:', req.session?.user ? 'Found' : 'Not found');
    console.log('Cookies:', req.headers.cookie ? 'Present' : 'Missing');

    if (req.originalUrl.startsWith("//uploads/")) {
        console.log("🚨 DOUBLE SLASH DETECTED in URL:", req.originalUrl);
    }
    
    // Skip logging for static file requests to reduce noise
    if (!req.path.startsWith('/uploads/')) {
        console.log('Full session data:', JSON.stringify(req.session, null, 2));
    }
    
    next();
});

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
  console.log("Unmatched route:", req.method, req.originalUrl);

  if (
    req.originalUrl.startsWith("/uploads/") ||
    req.originalUrl.startsWith("//uploads/")
  ) {
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
  });
});

// ✅ Error handler
app.use(ErrorHandler);

// ✅ Start server
app.listen(PORT, async () => {
  console.log(`Server running on PORT: ${PORT}`);
  console.log("Environment:", process.env.NODE_ENV);
  console.log("Uploads directory:", path.join(__dirname, "uploads"));
  await DBConnect();
});