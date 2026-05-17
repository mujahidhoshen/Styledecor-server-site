import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export const verifyJWT = (req, _res, next) => {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return next(new AppError('Authentication token is required.', 401));
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch (_error) {
    next(new AppError('Invalid or expired authentication token.', 401));
  }
};
