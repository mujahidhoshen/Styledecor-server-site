import mongoose from 'mongoose';
import { ROLES, USER_STATUSES } from '../utils/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    image: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'user',
      index: true
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: 'active'
    }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
