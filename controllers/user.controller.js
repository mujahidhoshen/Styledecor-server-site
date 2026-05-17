import { Decorator } from '../models/Decorator.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination } from '../utils/query.js';

export const createOrUpdateUser = asyncHandler(async (req, res) => {
  const payload = {
    name: req.body.name,
    email: req.body.email,
    image: req.body.image
  };

  const existingUser = await User.findOne({ email: payload.email });

  if (existingUser) {
    existingUser.name = payload.name;
    existingUser.image = payload.image;
    await existingUser.save();

    return res.json({
      success: true,
      message: 'User profile updated.',
      data: existingUser
    });
  }

  const user = await User.create({
    ...payload,
    role: req.body.role === 'admin' ? 'user' : req.body.role || 'user'
  });

  res.status(201).json({
    success: true,
    message: 'User profile created.',
    data: user
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search = '', role = '', status = '' } = req.query;
  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (role) filter.role = role;
  if (status) filter.status = status;

  const [data, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  });
});

export const getUserByEmail = asyncHandler(async (req, res) => {
  const targetEmail = req.params.email.toLowerCase();
  const requester = req.dbUser;

  if (requester.email !== targetEmail && requester.role !== 'admin') {
    throw new AppError('You can only view your own profile.', 403);
  }

  const user = await User.findOne({ email: targetEmail }).lean();

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  res.json({
    success: true,
    data: user
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  user.role = req.body.role;
  if (req.body.status) user.status = req.body.status;
  await user.save();

  let decorator = null;

  if (req.body.role === 'decorator') {
    decorator = await Decorator.findOneAndUpdate(
      { email: user.email },
      {
        userId: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        specialties: req.body.specialties?.length ? req.body.specialties : ['home', 'wedding'],
        status: 'pending'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } else {
    await Decorator.findOneAndUpdate({ email: user.email }, { status: 'disabled' });
  }

  res.json({
    success: true,
    message: 'User role updated.',
    data: {
      user,
      decorator
    }
  });
});
