import mongoose from 'mongoose';
import { TRANSACTION_STATUSES } from '../utils/constants.js';

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      lowercase: true,
      default: 'bdt'
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    paymentStatus: {
      type: String,
      enum: TRANSACTION_STATUSES,
      default: 'succeeded'
    }
  },
  { timestamps: true }
);

paymentSchema.index({ userEmail: 1, createdAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
