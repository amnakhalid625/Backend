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

// ✅ Global timeout middleware
app.use((req, res, next) => {
  res.setTimeout(25000, () => {
    console.log('Request timeout for:', req.url);
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' });
    }
  });
  next();
});

// Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS
app.use(
  cors({
    origin: [FRONT_END_URL, ADMIN_DASHBOARD_URL],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// ✅ Database connection per request (not at startup)
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

// Sessions - Optimized for serverless
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
      touchAfter: 24 * 3600, // lazy session update
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

// ✅ Health check route
app.get("/", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ✅ MongoDB connection test route
app.get("/api/test-mongo", async (req, res) => {
  try {
    const mongoose = await import('mongoose');
    
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    res.json({
      mongoStatus: states[connectionState],
      host: mongoose.connection.host || 'not connected',
      name: mongoose.connection.name || 'no database',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ Routes with timeout protection
const createRouteWithTimeout = (route) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({ error: "Route timeout" });
      }
    }, 25000);
    
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(...args) {
      clearTimeout(timeout);
      return originalSend.apply(this, args);
    };
    
    res.json = function(...args) {
      clearTimeout(timeout);
      return originalJson.apply(this, args);
    };
    
    route(req, res, next);
  };
};

// Static files
const dirname = path.resolve();
app.use("/uploads", express.static(path.join(dirname, "/uploads")));

// Routes with timeout protection
app.use("/api/auth", createRouteWithTimeout(authRoutes));
app.use("/api/user", createRouteWithTimeout(userRoutes));
app.use("/api/product", createRouteWithTimeout(productRoutes));
app.use("/api/category", createRouteWithTimeout(categoryRoutes));
app.use("/api/banner", createRouteWithTimeout(bannerRoutes));
app.use("/api/order", createRouteWithTimeout(orderRoutes));
app.use("/api/admin", createRouteWithTimeout(adminRoutes));

// Test route
app.get("/api/test-session", (req, res) => {
  res.json({
    sessionID: req.sessionID,
    hasUser: !!req.session?.user,
    timestamp: new Date().toISOString()
  });
});

// ✅ Favicon handler (prevents 404s)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Error middleware
app.use(ErrorHandler);

// ✅ Catch-all handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Export serverless handler for Vercel
export default serverless(app);

// ✅ Remove this line - don't connect at startup
// DBConnect();