import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[config] Missing ${key}. Add it to .env before running production workloads.`);
  }
}

export const env = {
  port: process.env.PORT || 5001,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || 'development-only-secret',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development'
};
