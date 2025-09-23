import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "path";
import serverless from "serverless-http";

// routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// DB connect
import DBConnect from "./config/db.js";
import { ErrorHandler } from "./middleware/ErrorHandler.js";

dotenv.config();

const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const FRONT_END_URL = process.env.FRONT_END_URL || "http://localhost:3000";
const ADMIN_DASHBOARD_URL = process.env.ADMIN_DASHBOARD_URL || "http://localhost:5173";

// cors
app.use(
  cors({
    origin: [FRONT_END_URL, ADMIN_DASHBOARD_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    optionsSuccessStatus: 200
  })
);

// session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24
    },
    rolling: true
  })
);

// static files
const dirname = path.resolve();
app.use("/uploads", express.static(path.join(dirname, "/uploads")));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/admin", adminRoutes);

// error handler
app.use(ErrorHandler);

// ✅ instead of app.listen
DBConnect();
export default serverless(app);
