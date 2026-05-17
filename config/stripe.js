import Stripe from 'stripe';
import { env } from './env.js';

export const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey, { apiVersion: '2024-12-18.acacia' })
  : null;
