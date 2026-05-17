import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || statusCode < 500;

  if (!isOperational) {
    console.error('[server-error]', error);
  }

  const payload = {
    success: false,
    message: isOperational ? error.message : 'Something went wrong.',
    details: error.details || null
  };

  if (env.nodeEnv !== 'production' && !isOperational) {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
};
