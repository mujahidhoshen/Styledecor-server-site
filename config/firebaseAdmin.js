import admin from 'firebase-admin';
import { env } from './env.js';
import { AppError } from '../utils/AppError.js';

const parseServiceAccount = () => {
  if (env.firebase.serviceAccountBase64) {
    const decoded = Buffer.from(env.firebase.serviceAccountBase64, 'base64').toString('utf8');
    return JSON.parse(decoded);
  }

  if (env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey) {
    return {
      projectId: env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      privateKey: env.firebase.privateKey
    };
  }

  return null;
};

const initializeFirebaseAdmin = () => {
  if (admin.apps.length) return admin.app();

  const serviceAccount = parseServiceAccount();

  if (serviceAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  }

  return null;
};

const firebaseApp = initializeFirebaseAdmin();

export const verifyFirebaseIdToken = async (idToken) => {
  if (!firebaseApp) {
    throw new AppError('Firebase Admin authentication is not configured on the server.', 503);
  }

  try {
    const decoded = await admin.auth(firebaseApp).verifyIdToken(idToken);

    if (!decoded.email) {
      throw new AppError('Firebase token does not include an email address.', 401);
    }

    return {
      uid: decoded.uid,
      email: decoded.email.toLowerCase(),
      emailVerified: Boolean(decoded.email_verified),
      name: decoded.name || '',
      picture: decoded.picture || ''
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid or expired Firebase authentication token.', 401);
  }
};
