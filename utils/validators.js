import mongoose from 'mongoose';
import { z } from 'zod';
import {
  CATEGORIES,
  DECORATOR_STATUSES,
  DECORATOR_STATUS_FLOW,
  PAYMENT_STATUSES,
  PROJECT_STATUSES,
  ROLES,
  SERVICE_MODES,
  TRANSACTION_STATUSES,
  USER_STATUSES
} from './constants.js';

const objectId = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: 'Invalid MongoDB object id.'
});

const email = z.string().email().transform((value) => value.toLowerCase().trim());
const imageUrl = z.string().url();

export const idParamSchema = z.object({ id: objectId });
export const emailParamSchema = z.object({ email });

export const jwtSchema = z.object({
  email
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email,
  image: imageUrl,
  role: z.enum(ROLES).optional()
});

export const userRoleSchema = z.object({
  role: z.enum(ROLES),
  status: z.enum(USER_STATUSES).optional(),
  specialties: z.array(z.string().trim().min(1)).optional()
});

export const serviceCreateSchema = z.object({
  service_name: z.string().trim().min(2).max(120),
  cost: z.coerce.number().min(0),
  unit: z.string().trim().min(1).max(40),
  service_category: z.enum(CATEGORIES),
  service_type: z.enum(SERVICE_MODES).optional(),
  description: z.string().trim().min(20).max(2000),
  image: imageUrl
});

export const serviceUpdateSchema = serviceCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field must be provided.' }
);

export const bookingCreateSchema = z.object({
  serviceId: objectId,
  userName: z.string().trim().min(1).max(80),
  userEmail: email,
  bookingDate: z.coerce.date(),
  location: z.string().trim().min(3).max(240),
  serviceMode: z.enum(SERVICE_MODES).optional()
});

export const bookingUpdateSchema = z
  .object({
    bookingDate: z.coerce.date().optional(),
    location: z.string().trim().min(3).max(240).optional(),
    serviceMode: z.enum(SERVICE_MODES).optional(),
    status: z.enum(PROJECT_STATUSES).optional(),
    paymentStatus: z.enum(PAYMENT_STATUSES).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.'
  });

export const bookingStatusSchema = z.object({
  status: z.enum(PROJECT_STATUSES)
});

export const assignDecoratorSchema = z.object({
  decoratorId: objectId
});

export const decoratorStatusSchema = z.object({
  status: z.enum(DECORATOR_STATUSES)
});

export const decoratorUpdateSchema = z
  .object({
    specialties: z.array(z.string().trim().min(1)).optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
    status: z.enum(DECORATOR_STATUSES).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.'
  });

export const decoratorProjectStatusSchema = z.object({
  status: z.enum(DECORATOR_STATUS_FLOW)
});

export const paymentIntentSchema = z.object({
  bookingId: objectId
});

export const paymentCreateSchema = z.object({
  bookingId: objectId,
  serviceId: objectId,
  amount: z.coerce.number().min(0),
  currency: z.string().trim().min(3).max(3).default('bdt'),
  transactionId: z.string().trim().min(6),
  paymentStatus: z.enum(TRANSACTION_STATUSES).default('succeeded')
});
