import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const REQUIRED_DATABASE_NAME = 'styleDB';
const REQUIRED_ADMIN_EMAIL = 'mh5787975@gmail.com';
const DEPRECATED_ADMIN_EMAILS = new Set(['dbadmin6432@gmail.com']);

const normalizePrivateKey = (value = '') => value.replace(/\\n/g, '\n');
const normalizeEmail = (value = '') => value.toLowerCase().trim();

const resolveDatabaseName = (value = '') => {
  const requested = value.trim();

  if (requested && requested !== REQUIRED_DATABASE_NAME) {
    console.warn(`[config] MONGODB_DB_NAME=${requested} ignored; using ${REQUIRED_DATABASE_NAME}.`);
  }

  return REQUIRED_DATABASE_NAME;
};

const resolveAdminEmail = (value = '') => {
  const requested = normalizeEmail(value);

  if (requested && requested !== REQUIRED_ADMIN_EMAIL) {
    const reason = DEPRECATED_ADMIN_EMAILS.has(requested) ? 'deprecated admin email' : 'unsupported admin email';
    console.warn(`[config] ADMIN_EMAIL=${requested} ignored (${reason}); using ${REQUIRED_ADMIN_EMAIL}.`);
  }

  return REQUIRED_ADMIN_EMAIL;
};

const required = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];

if (isProduction) {
  required.push('STRIPE_SECRET_KEY');
}

for (const key of required) {
  if (!process.env[key]) {
    const message = `[config] Missing ${key}. Add it to .env before running production workloads.`;
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
  console.warn(
    '[config] Firebase Admin credentials are required in production. Use FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.'
  );
}

export const env = {
  port: process.env.PORT || 5001,
  mongodbUri: process.env.MONGODB_URI,
  databaseName: resolveDatabaseName(process.env.MONGODB_DB_NAME),
  jwtSecret: process.env.JWT_SECRET,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  clientUrl: process.env.CLIENT_URL || 'https://styledecor-client-site.vercel.app',
  clientUrls: process.env.CLIENT_URLS || '',
  adminEmail: resolveAdminEmail(process.env.ADMIN_EMAIL),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  firebase: {
    serviceAccountBase64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY || '')
  }
};
