import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

const normalizePrivateKey = (value = '') => value.replace(/\\n/g, '\n');

const required = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];

if (isProduction) {
  required.push('STRIPE_SECRET_KEY');
}

for (const key of required) {
  if (!process.env[key]) {
    const message = `[config] Missing ${key}. Add it to .env before running production workloads.`;
    if (isProduction) {
      throw new Error(message);
    }
    console.warn(message);
  }
}

const hasServiceAccountBase64 = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64);
const hasServiceAccountParts = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
);

if (isProduction && !hasServiceAccountBase64 && !hasServiceAccountParts && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error(
    '[config] Firebase Admin credentials are required in production. Use FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.'
  );
}

export const env = {
  port: process.env.PORT || 5001,
  mongodbUri: process.env.MONGODB_URI,
  databaseName: process.env.MONGODB_DB_NAME || 'styleBD',
  jwtSecret: process.env.JWT_SECRET,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  clientUrl: process.env.CLIENT_URL || 'https://styledecor-client-site.vercel.app',
  clientUrls: process.env.CLIENT_URLS || '',
  adminEmail: (process.env.ADMIN_EMAIL || 'dbadmin6432@gmail.com').toLowerCase(),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  firebase: {
    serviceAccountBase64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY || '')
  }
};
