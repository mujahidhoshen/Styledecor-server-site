import mongoose from 'mongoose';
import { DECORATOR_STATUSES } from '../utils/constants.js';

const decoratorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true
    },
    image: {
      type: String,
      required: true,
      trim: true
    },
    specialties: {
      type: [String],
      required: true,
      default: []
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.8
    },
    status: {
      type: String,
      enum: DECORATOR_STATUSES,
      default: 'pending',
      index: true
    },
    earnings: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

decoratorSchema.index({ rating: -1, status: 1 });

export const Decorator = mongoose.model('Decorator', decoratorSchema);
