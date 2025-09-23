import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,  // ✅ Keep this - 5 seconds
      socketTimeoutMS: 10000,          // ✅ CHANGED: 45000 → 10000 (10 seconds)
      connectTimeoutMS: 10000,         // ✅ ADDED: Connection timeout
      maxPoolSize: 5,                  // ✅ CHANGED: 10 → 5 (reduced pool size)
      minPoolSize: 1,                  // ✅ Keep this
      maxIdleTimeMS: 30000,            // ✅ Keep this
      bufferCommands: false,           // ✅ Keep this
      bufferMaxEntries: 0,             // ✅ Keep this
    });

    isConnected = true;
    console.log("MongoDB Connected:", conn.connection.host);
    return conn.connection;
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    isConnected = false;
    
    // ✅ CRITICAL CHANGE: Don't throw error - return null instead
    // This prevents infinite hanging in serverless
    console.warn("Continuing without database connection...");
    return null;
  }
};

// ✅ ADDED: Handle connection events
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
  isConnected = false;
});

// ✅ ADDED: Graceful shutdown handling
mongoose.connection.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

export default connectDB;