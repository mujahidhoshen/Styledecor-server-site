import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createJwt = asyncHandler(async (req, res) => {
  const token = jwt.sign({ email: req.body.email }, env.jwtSecret, { expiresIn: '7d' });

  res.json({
    success: true,
    token
  });
});
