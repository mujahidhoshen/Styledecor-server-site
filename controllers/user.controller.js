import { Decorator } from '../models/Decorator.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex, getPagination, normalizeSearch } from '../utils/query.js';
import { ROLES } from '../utils/constants.js';
import { isConfiguredAdminEmail, isDeprecatedAdminEmail, normalizeEmail } from '../utils/authIdentity.js';

const resolveRoleForEmail = (email, existingRole) => {
  if (isConfiguredAdminEmail(email)) return 'admin';
  if (isDeprecatedAdminEmail(email) && existingRole === 'admin') return 'user';
  return ROLES.includes(existingRole) ? existingRole : 'user';
};

const buildAvatar = (name, email) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=176b5d&color=ffffff`;

const getDbName = () => User.db?.name || 'unconnected';

const logProfileDebug = (event, details) => {
  console.info(`[auth-profile] ${event}`, {
    dbName: getDbName(),
    ...details
  });
};

export const createOrUpdateUser = asyncHandler(async (req, res) => {
  const authenticatedEmail = normalizeEmail(req.user?.email);

  if (!authenticatedEmail || authenticatedEmail !== req.body.email) {
    throw new AppError('You can only save your own user profile.', 403);
  }

  const payload = {
    name: req.body.name,
    email: authenticatedEmail,
    image: req.body.image
  };

  const isAdminEmail = isConfiguredAdminEmail(payload.email);
  logProfileDebug('sync requested', {
    endpoint: 'POST /users',
    email: payload.email,
    hasJwt: Boolean(req.headers.authorization?.startsWith('Bearer '))
  });

  const update = {
    $set: {
      name: payload.name,
      image: payload.image
    },
    $setOnInsert: {
      role: isAdminEmail ? 'admin' : 'user',
      status: 'active'
    }
  };

  if (isAdminEmail) {
    update.$set.role = 'admin';
    update.$set.status = 'active';
  }

  const result = await User.findOneAndUpdate(
    { email: payload.email },
    update,
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      includeResultMetadata: true
    }
  );

  const user = result.value;
  const created = !result.lastErrorObject?.updatedExisting;

  if (!user) {
    throw new AppError('Unable to save user profile.', 500);
  }

  const resolvedRole = resolveRoleForEmail(payload.email, user.role);

  if (user.role !== resolvedRole) {
    user.role = resolvedRole;
    await user.save();
  }

  if (!isAdminEmail && user.status === 'disabled') {
    logProfileDebug('sync rejected disabled user', {
      endpoint: 'POST /users',
      email: payload.email,
      role: user.role
    });
    throw new AppError('This account has been disabled.', 403);
  }

  logProfileDebug('sync completed', {
    endpoint: 'POST /users',
    email: user.email,
    role: user.role,
    status: user.status,
    created
  });

  res.status(created ? 201 : 200).json({
    success: true,
    message: created ? 'User profile created.' : 'User profile updated.',
    data: user
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { role = '', status = '' } = req.query;
  const search = normalizeSearch(req.query.search);
  const filter = {};

  if (search) {
    const pattern = escapeRegex(search);
    filter.$or = [
      { name: { $regex: pattern, $options: 'i' } },
      { email: { $regex: pattern, $options: 'i' } }
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
  const targetEmail = normalizeEmail(req.params.email);
  const requesterEmail = normalizeEmail(req.user?.email);
  logProfileDebug('fetch requested', {
    endpoint: 'GET /users/:email',
    targetEmail,
    requesterEmail,
    hasJwt: Boolean(req.headers.authorization?.startsWith('Bearer '))
  });

  if (requesterEmail !== targetEmail) {
    const requester = await User.findOne({ email: requesterEmail }).lean();
    const requesterIsAdmin = requester?.role === 'admin' || isConfiguredAdminEmail(requesterEmail);
    if (!requester || requester.status === 'disabled' || !requesterIsAdmin) {
      throw new AppError('You can only view your own profile.', 403);
    }
  }

  let user = await User.findOne({ email: targetEmail });

  if (!user) {
    if (requesterEmail !== targetEmail) {
      throw new AppError('User not found.', 404);
    }

    const name = targetEmail.split('@')[0];
    const image = buildAvatar(name, targetEmail);
    user = await User.create({
      name,
      email: targetEmail,
      image,
      role: resolveRoleForEmail(targetEmail),
      status: 'active'
    });
  } else {
    const resolvedRole = resolveRoleForEmail(targetEmail, user.role);

    if (user.role !== resolvedRole) {
      user.role = resolvedRole;
    }

    if (isConfiguredAdminEmail(targetEmail) && user.status !== 'active') {
      user.status = 'active';
    }

    if (user.isModified()) {
      await user.save();
    }
  }

  res.json({
    success: true,
    data: user.toObject ? user.toObject() : user
  });

  logProfileDebug('fetch completed', {
    endpoint: 'GET /users/:email',
    targetEmail,
    role: user.role,
    status: user.status
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (isConfiguredAdminEmail(user.email) && req.body.role !== 'admin') {
    throw new AppError('The configured admin email must keep the admin role.', 400);
  }

  if (isDeprecatedAdminEmail(user.email) && req.body.role === 'admin') {
    throw new AppError('This email is not configured for admin access.', 400);
  }

  user.role = resolveRoleForEmail(user.email, req.body.role);
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
