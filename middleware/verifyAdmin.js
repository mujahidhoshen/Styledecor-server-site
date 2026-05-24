import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { isConfiguredAdminEmail, isDeprecatedAdminEmail } from '../utils/authIdentity.js';

export const verifyAdmin = async (req, _res, next) => {
  const email = req.user?.email?.toLowerCase();
  const dbUser = await User.findOne({ email }).lean();

  if (!dbUser || dbUser.status === 'disabled') {
    return next(new AppError('Admin account was not found or is disabled.', 403));
  }

  if (isDeprecatedAdminEmail(email)) {
    return next(new AppError('This email is not configured for admin access.', 403));
  }

  if (dbUser.role !== 'admin' && !isConfiguredAdminEmail(email)) {
    return next(new AppError('Admin access is required.', 403));
  }

  req.dbUser = dbUser;
  next();
};
