import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "path";
import serverless from "serverless-http";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import DBConnect from "./config/db.js";
import { ErrorHandler } from "./middleware/ErrorHandler.js";

dotenv.config();

const FRONT_END_URL = process.env.FRONT_END_URL || "http://localhost:3000";
const ADMIN_DASHBOARD_URL = process.env.ADMIN_DASHBOARD_URL || "http://localhost:5173";

const app = express();

// ✅ ONLY CHANGE: Add timeout middleware (15 seconds)
app.use((req, res, next) => {
  const timeout = setTimeout(() => {
    console.log('Request timeout for:', req.url);
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' });
    }
  }, 15000); // 15 seconds

  res.on('finish', () => clearTimeout(timeout));
  res.on('close', () => clearTimeout(timeout));
  
  next();
});

// middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS
app.use(
  cors({
    origin: [FRONT_END_URL, ADMIN_DASHBOARD_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Database connection per request
app.use(async (req, res, next) => {
  try {
    await DBConnect();
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Database connection failed" });
    }
  }
});

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60,
      autoRemove: 'native',
      touchAfter: 24 * 3600,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
    rolling: true,
  })
);

// Debug
app.use((req, res, next) => {
  console.log("Session ID:", req.sessionID);
  next();
});

// Static files
const dirname = path.resolve();
app.use("/uploads", express.static(path.join(dirname, "/uploads")));

// ✅ Health check route (ADD THIS)
app.get("/", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/admin", adminRoutes);

// Test route
app.get("/api/test-session", (req, res) => {
  res.json({
    sessionID: req.sessionID,
    hasUser: !!req.session?.user,
  });
});

// ✅ ADD: Favicon handler
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Error middleware
app.use(ErrorHandler);

// Export serverless handler for Vercel
export default serverless(app);