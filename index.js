// packages
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "path";
import serverless from "serverless-http";

// configs
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import connectDB from "./config/db.js";
import { ErrorHandler } from "./middleware/ErrorHandler.js";

// Load env
dotenv.config();

const FRONT_END_URL = process.env.FRONT_END_URL || "http://localhost:3000";
const ADMIN_DASHBOARD_URL =
  process.env.ADMIN_DASHBOARD_URL || "http://localhost:5173";

const app = express();

// middlewares
app.use(express.json());
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

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultsecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60, // 14 days
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // in prod cookies only over HTTPS
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
    rolling: true,
  })
);

// Debug session
app.use((req, res, next) => {
  console.log("Session ID:", req.sessionID);
  console.log("Session data:", req.session);
  next();
});

// Static uploads
const dirname = path.resolve();
app.use("/uploads", express.static(path.join(dirname, "/uploads")));

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
    session: req.session,
    hasUser: !!req.session?.user,
  });
});

// Error handler
app.use(ErrorHandler);

// ✅ Connect DB only once (no repeated connections)
await connectDB();

// ✅ Export for Vercel (serverless)
export const handler = serverless(app);
