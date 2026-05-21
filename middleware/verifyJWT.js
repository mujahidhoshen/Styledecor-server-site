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
    if (!env.jwtSecret) {
      return next(new AppError('JWT verification secret is not configured.', 503));
    }

    const decoded = jwt.verify(token, env.jwtSecret);

    if (!decoded?.email) {
      return next(new AppError('Invalid authentication token payload.', 401));
    }

    req.user = {
      ...decoded,
      email: decoded.email.toLowerCase()
    };
    next();
  } catch (_error) {
    next(new AppError('Invalid or expired authentication token.', 401));
  }
};
