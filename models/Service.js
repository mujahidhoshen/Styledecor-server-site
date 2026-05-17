import mongoose from 'mongoose';
import { CATEGORIES, SERVICE_MODES } from '../utils/constants.js';

const serviceSchema = new mongoose.Schema(
  {
    service_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    cost: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40
    },
    service_category: {
      type: String,
      required: true,
      enum: CATEGORIES,
      lowercase: true,
      index: true
    },
    service_type: {
      type: String,
      enum: SERVICE_MODES,
      default: 'on-site'
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    image: {
      type: String,
      required: true,
      trim: true
    },
    createdByEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    }
  },
  { timestamps: true }
);

serviceSchema.index({ service_name: 'text', description: 'text' });
serviceSchema.index({ service_category: 1, cost: 1 });
serviceSchema.index({ createdAt: -1 });

export const Service = mongoose.model('Service', serviceSchema);
