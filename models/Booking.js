import mongoose from 'mongoose';
import { PAYMENT_STATUSES, PROJECT_STATUSES, SERVICE_MODES } from '../utils/constants.js';

const bookingSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true
    },
    serviceName: {
      type: String,
      required: true,
      trim: true
    },
    serviceImage: {
      type: String,
      trim: true
    },
    userName: {
      type: String,
      required: true,
      trim: true
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    bookingDate: {
      type: Date,
      required: true,
      index: true
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240
    },
    serviceMode: {
      type: String,
      enum: SERVICE_MODES,
      default: 'on-site'
    },
    cost: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: 'pending',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'unpaid',
      index: true
    },
    assignedDecoratorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Decorator'
    },
    assignedDecoratorEmail: {
      type: String,
      lowercase: true,
      trim: true,
      index: true
    }
  },
  { timestamps: true }
);

bookingSchema.index({ userEmail: 1, createdAt: -1 });
bookingSchema.index({ assignedDecoratorEmail: 1, bookingDate: 1 });
bookingSchema.index({ status: 1, paymentStatus: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
