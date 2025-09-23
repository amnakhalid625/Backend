import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      bufferCommands: false,
      bufferMaxEntries: 0,
    });

    isConnected = true;
    console.log("MongoDB Connected:", conn.connection.host);
    return conn.connection;
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    isConnected = false;
    throw error;
  }
};

export default connectDB;