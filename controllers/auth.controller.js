import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { verifyFirebaseIdToken } from '../config/firebaseAdmin.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createJwt = asyncHandler(async (req, res) => {
  if (!env.jwtSecret) {
    throw new AppError('JWT signing secret is not configured on the server.', 503);
  }

  const firebaseUser = await verifyFirebaseIdToken(req.body.idToken);
  const email = firebaseUser.email?.toLowerCase().trim();

  if (!email) {
    throw new AppError('Verified Firebase user does not include an email address.', 401);
  }

  const token = jwt.sign(
    {
      email,
      uid: firebaseUser.uid
    },
    env.jwtSecret,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: {
      email,
      uid: firebaseUser.uid,
      emailVerified: firebaseUser.emailVerified
    }
  });
});
