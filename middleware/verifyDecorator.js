import { Decorator } from '../models/Decorator.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export const verifyDecorator = async (req, _res, next) => {
  const email = req.user?.email?.toLowerCase();
  const dbUser = await User.findOne({ email }).lean();

  if (!dbUser || dbUser.status === 'disabled' || dbUser.role !== 'decorator') {
    return next(new AppError('Decorator access is required.', 403));
  }

  const decorator = await Decorator.findOne({ email, status: 'approved' }).lean();

  if (!decorator) {
    return next(new AppError('Approved decorator profile was not found.', 403));
  }

  req.dbUser = dbUser;
  req.decorator = decorator;
  next();
};
