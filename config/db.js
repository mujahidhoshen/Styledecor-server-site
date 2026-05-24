import mongoose from 'mongoose';
import { env } from './env.js';
import { AppError } from '../utils/AppError.js';

let connectionPromise = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI is required to connect to MongoDB.');
  }

  console.info(`[db] Using MongoDB database: ${env.databaseName}`);

  mongoose.set('strictQuery', true);
  connectionPromise =
    connectionPromise ||
    mongoose.connect(env.mongodbUri, {
      dbName: env.databaseName,
      autoIndex: env.nodeEnv !== 'production',
      serverSelectionTimeoutMS: 10000
    });

  try {
    await connectionPromise;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }

  console.log(`[db] MongoDB connected: ${env.databaseName}`);
  return mongoose.connection;
};

export const ensureDB = async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('[db] Database unavailable:', error.message);
    next(new AppError('Database is temporarily unavailable. Please try again later.', 503));
  }
};
