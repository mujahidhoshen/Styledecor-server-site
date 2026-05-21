import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { ensureDB } from './config/db.js';
import { env } from './config/env.js';
import analyticsRoutes from './routes/analytics.routes.js';
import authRoutes from './routes/auth.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import decoratorRoutes from './routes/decorator.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import serviceRoutes from './routes/service.routes.js';
import userRoutes from './routes/user.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const allowedOrigins = new Set([
  env.clientUrl,
  ...env.clientUrls.split(','),
  'https://styledecor-client-site.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].map((origin) => origin.trim().replace(/\/+$/, '')).filter(Boolean));

const apiRoutes = [
  authRoutes,
  userRoutes,
  serviceRoutes,
  bookingRoutes,
  decoratorRoutes,
  paymentRoutes,
  analyticsRoutes
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;

  return false;
};

export const app = express();

app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

app.use(express.json({ limit: '1mb', strict: true }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false
});

app.get(['/', '/api'], (_req, res) => {
  res.json({
    success: true,
    message: 'StyleDecor API is running.'
  });
});

app.get(['/health', '/api/health'], (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.use(['/jwt', '/api/jwt'], authLimiter);
app.use(apiLimiter);
app.use(ensureDB);

for (const routes of apiRoutes) {
  app.use(routes);
  app.use('/api', routes);
}

app.use(notFound);
app.use(errorHandler);
