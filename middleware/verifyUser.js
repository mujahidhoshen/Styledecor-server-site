import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export const verifyUser = async (req, _res, next) => {
  const email = req.user?.email?.toLowerCase();
  const dbUser = await User.findOne({ email }).lean();

  if (!dbUser) {
    return next(new AppError('Authenticated user was not found.', 401));
  }

  if (dbUser.status === 'disabled') {
    return next(new AppError('This account has been disabled.', 403));
  }

  req.dbUser = dbUser;
  next();
};
