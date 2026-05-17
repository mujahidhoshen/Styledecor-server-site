import { AppError } from '../utils/AppError.js';

export const validate = (schema, property = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[property]);

  if (!result.success) {
    const details = result.error.errors.map((error) => ({
      field: error.path.join('.'),
      message: error.message
    }));

    return next(new AppError('Validation failed.', 400, details));
  }

  req[property] = result.data;
  next();
};
