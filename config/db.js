import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI is required to connect to MongoDB.');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongodbUri, {
    autoIndex: env.nodeEnv !== 'production'
  });

  console.log('[db] MongoDB connected');
};
