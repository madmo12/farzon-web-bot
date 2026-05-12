const mongoose = require('mongoose');

// Cache the connection promise for serverless reuse.
// Without this, every invocation opens a new connection and
// quickly exhausts MongoDB's connection pool.
let cached = null;

const connectDB = async () => {
  // If already connected or connecting, reuse
  if (cached) {
    return cached;
  }

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not defined in environment variables');
    throw new Error('MONGO_URI is not defined');
  }

  try {
    cached = mongoose.connect(process.env.MONGO_URI);
    const conn = await cached;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    cached = null; // Reset so next invocation retries
    console.error(`Error connecting to MongoDB: ${error.message}`);
    throw error; // Let the request fail gracefully, don't kill the process
  }
};

module.exports = connectDB;
