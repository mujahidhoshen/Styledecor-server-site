import { Booking } from '../models/Booking.js';
import { Decorator } from '../models/Decorator.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex, getPagination, normalizeSearch } from '../utils/query.js';
import { calculateDecoratorEarning, isNextDecoratorStatus } from '../services/status.service.js';

export const getDecorators = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status = '' } = req.query;
  const search = normalizeSearch(req.query.search);
  const filter = {};

  if (search) {
    const pattern = escapeRegex(search);
    filter.$or = [
      { name: { $regex: pattern, $options: 'i' } },
      { email: { $regex: pattern, $options: 'i' } },
      { specialties: { $regex: pattern, $options: 'i' } }
    ];
  }

  if (status) filter.status = status;

  const [data, total] = await Promise.all([
    Decorator.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Decorator.countDocuments(filter)
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

export const getTopDecorators = asyncHandler(async (_req, res) => {
  const decorators = await Decorator.find({ status: 'approved' })
    .sort({ rating: -1, createdAt: -1 })
    .limit(4)
    .lean();

  res.json({
    success: true,
    data: decorators
  });
});

export const updateDecoratorStatus = asyncHandler(async (req, res) => {
  const decorator = await Decorator.findById(req.params.id);

  if (!decorator) {
    throw new AppError('Decorator not found.', 404);
  }

  decorator.status = req.body.status;
  await decorator.save();

  const userStatus = req.body.status === 'disabled' ? 'disabled' : 'active';
  await User.findOneAndUpdate({ email: decorator.email }, { status: userStatus, role: 'decorator' });

  res.json({
    success: true,
    message: 'Decorator status updated.',
    data: decorator
  });
});

export const updateDecorator = asyncHandler(async (req, res) => {
  const decorator = await Decorator.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!decorator) {
    throw new AppError('Decorator not found.', 404);
  }

  res.json({
    success: true,
    message: 'Decorator updated.',
    data: decorator
  });
});

export const deleteDecorator = asyncHandler(async (req, res) => {
  const decorator = await Decorator.findByIdAndDelete(req.params.id);

  if (!decorator) {
    throw new AppError('Decorator not found.', 404);
  }

  await User.findOneAndUpdate({ email: decorator.email }, { role: 'user' });

  res.json({
    success: true,
    message: 'Decorator deleted.',
    data: decorator
  });
});

export const getAssignedProjects = asyncHandler(async (req, res) => {
  const projects = await Booking.find({ assignedDecoratorEmail: req.decorator.email })
    .sort({ bookingDate: 1 })
    .lean();

  res.json({
    success: true,
    data: projects
  });
});

export const getTodaySchedule = asyncHandler(async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const schedule = await Booking.find({
    assignedDecoratorEmail: req.decorator.email,
    bookingDate: { $gte: start, $lt: end },
    status: { $ne: 'cancelled' }
  })
    .sort({ bookingDate: 1 })
    .lean();

  res.json({
    success: true,
    data: schedule
  });
});

export const updateProjectStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError('Project not found.', 404);
  }

  if (booking.assignedDecoratorEmail !== req.decorator.email) {
    throw new AppError('You can only update projects assigned to you.', 403);
  }

  if (!isNextDecoratorStatus(booking.status, req.body.status)) {
    throw new AppError('Project status must follow the required workflow sequence.', 400);
  }

  booking.status = req.body.status;
  await booking.save();

  if (req.body.status === 'Completed') {
    const earning = calculateDecoratorEarning(booking.cost);
    await Decorator.findByIdAndUpdate(req.decorator._id, { $inc: { earnings: earning } });
  }

  res.json({
    success: true,
    message: 'Project status updated.',
    data: booking
  });
});

export const getDecoratorEarnings = asyncHandler(async (req, res) => {
  const completed = await Booking.find({
    assignedDecoratorEmail: req.decorator.email,
    status: 'Completed',
    paymentStatus: 'paid'
  }).lean();

  const totalRevenue = completed.reduce((sum, booking) => sum + booking.cost, 0);
  const estimatedEarnings = completed.reduce((sum, booking) => sum + calculateDecoratorEarning(booking.cost), 0);

  res.json({
    success: true,
    data: {
      completedProjects: completed.length,
      totalRevenue,
      estimatedEarnings,
      storedEarnings: req.decorator.earnings || 0,
      recentProjects: completed.slice(0, 5)
    }
  });
});

export const getDecoratorPayments = asyncHandler(async (req, res) => {
  const completedBookings = await Booking.find({
    assignedDecoratorEmail: req.decorator.email,
    status: 'Completed',
    paymentStatus: 'paid'
  })
    .select('_id serviceName cost bookingDate')
    .lean();

  const bookingIds = completedBookings.map((booking) => booking._id);
  const payments = await Payment.find({ bookingId: { $in: bookingIds }, paymentStatus: 'succeeded' })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: payments.map((payment) => {
      const booking = completedBookings.find((item) => item._id.toString() === payment.bookingId.toString());
      return {
        ...payment,
        serviceName: booking?.serviceName,
        decoratorEarning: calculateDecoratorEarning(booking?.cost || 0)
      };
    })
  });
});
