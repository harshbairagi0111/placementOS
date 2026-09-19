import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function connectDB(): Promise<typeof mongoose | void> {
  const mongoUri = process.env.MONGODB_URI?.trim();

  if (!mongoUri) {
    console.warn('[MongoDB] MONGODB_URI is not set in environment variables. Database operations will operate in resilient degraded mode.');
    return;
  }

  // Validate that the URI scheme begins with mongodb:// or mongodb+srv://
  if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    console.warn('[MongoDB] Provided MONGODB_URI is invalid (must start with "mongodb://" or "mongodb+srv://"). Running in resilient degraded mode.');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 7500,
      autoIndex: true,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error: any) {
    const sanitizedUri = mongoUri.replace(/:([^:@]+)@/, ':****@');
    console.warn(`[MongoDB Connection Warning] Could not connect to MongoDB (${sanitizedUri}):`, error.message || error);
    return;
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected from database.');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB Error]', err);
});
