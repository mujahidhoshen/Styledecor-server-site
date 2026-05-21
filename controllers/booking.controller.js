import { Booking } from '../models/Booking.js';
import { Decorator } from '../models/Decorator.js';
import { Service } from '../models/Service.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex, getPagination, getSort, normalizeSearch } from '../utils/query.js';
import {
  canCancelBooking,
  assertAdminBookingStatusTransition
} from '../services/status.service.js';

const buildBookingFilter = (query) => {
  const { status, paymentStatus, decoratorEmail } = query;
  const search = normalizeSearch(query.search);
  const filter = {};

  if (search) {
    const pattern = escapeRegex(search);
    filter.$or = [
      { serviceName: { $regex: pattern, $options: 'i' } },
      { userEmail: { $regex: pattern, $options: 'i' } },
      { location: { $regex: pattern, $options: 'i' } }
    ];
  }

  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (decoratorEmail) filter.assignedDecoratorEmail = decoratorEmail.toLowerCase();

  return filter;
};

const dayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

export const createBooking = asyncHandler(async (req, res) => {
  if (req.body.userEmail !== req.user.email) {
    throw new AppError('You can only create bookings for your own account.', 403);
  }

  const service = await Service.findById(req.body.serviceId).lean();

  if (!service) {
    throw new AppError('Selected service was not found.', 404);
  }

  const booking = await Booking.create({
    serviceId: service._id,
    serviceName: service.service_name,
    serviceImage: service.image,
    userName: req.body.userName,
    userEmail: req.body.userEmail,
    bookingDate: req.body.bookingDate,
    location: req.body.location,
    serviceMode: req.body.serviceMode || service.service_type,
    cost: service.cost,
    status: 'pending',
    paymentStatus: 'unpaid'
  });

  res.status(201).json({
    success: true,
    message: 'Booking request created.',
    data: booking
  });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {
    ...buildBookingFilter(req.query),
    userEmail: req.user.email
  };

  const [data, total] = await Promise.all([
    Booking.find(filter).sort(getSort(req.query.sort || 'date_desc')).skip(skip).limit(limit).lean(),
    Booking.countDocuments(filter)
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

export const getAllBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = buildBookingFilter(req.query);

  const [data, total] = await Promise.all([
    Booking.find(filter).sort(getSort(req.query.sort || 'date_desc')).skip(skip).limit(limit).lean(),
    Booking.countDocuments(filter)
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

export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).lean();

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  if (booking.userEmail !== req.user.email && req.dbUser?.role !== 'admin') {
    throw new AppError('You are not allowed to view this booking.', 403);
  }

  res.json({
    success: true,
    data: booking
  });
});

export const updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  const isOwner = booking.userEmail === req.user.email;
  const isAdmin = req.dbUser?.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new AppError('You are not allowed to update this booking.', 403);
  }

  if (isOwner && !canCancelBooking(booking.status)) {
    throw new AppError('This booking can no longer be updated.', 400);
  }

  if (isOwner && (req.body.status || req.body.paymentStatus)) {
    throw new AppError('Users cannot directly update booking or payment status.', 403);
  }

  const allowedUserFields = ['bookingDate', 'location', 'serviceMode'];
  const allowedAdminFields = ['bookingDate', 'location', 'serviceMode', 'status'];
  const allowed = isAdmin ? allowedAdminFields : allowedUserFields;

  if (isAdmin && req.body.status) {
    assertAdminBookingStatusTransition(booking, req.body.status);
  }

  for (const field of allowed) {
    if (req.body[field] !== undefined) booking[field] = req.body[field];
  }

  await booking.save();

  res.json({
    success: true,
    message: 'Booking updated.',
    data: booking
  });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  if (booking.userEmail !== req.user.email) {
    throw new AppError('You can only cancel your own bookings.', 403);
  }

  if (!canCancelBooking(booking.status)) {
    throw new AppError('This booking is already in progress or completed.', 400);
  }

  booking.status = 'cancelled';
  await booking.save();

  res.json({
    success: true,
    message: 'Booking cancelled.',
    data: booking
  });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  assertAdminBookingStatusTransition(booking, req.body.status);

  booking.status = req.body.status;
  await booking.save();

  res.json({
    success: true,
    message: 'Booking status updated.',
    data: booking
  });
});

export const assignDecorator = asyncHandler(async (req, res) => {
  const [booking, decorator] = await Promise.all([
    Booking.findById(req.params.id),
    Decorator.findById(req.body.decoratorId)
  ]);

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  if (!decorator || decorator.status !== 'approved') {
    throw new AppError('Approved decorator not found.', 404);
  }

  if (booking.paymentStatus !== 'paid') {
    throw new AppError('Decorator can only be assigned after payment is completed.', 400);
  }

  if (booking.serviceMode !== 'on-site') {
    throw new AppError('Decorators can only be assigned to on-site services.', 400);
  }

  if (booking.status === 'cancelled' || booking.status === 'Completed') {
    throw new AppError('This booking cannot be assigned.', 400);
  }

  const service = await Service.findById(booking.serviceId).lean();

  if (!service) {
    throw new AppError('Booked service was not found.', 404);
  }

  const specialties = (decorator.specialties || []).map((specialty) => specialty.toLowerCase());
  const requiredSpecialty = service.service_category.toLowerCase();

  if (specialties.length && !specialties.includes(requiredSpecialty)) {
    throw new AppError(`Decorator specialty does not match ${requiredSpecialty} services.`, 400);
  }

  const { start, end } = dayRange(booking.bookingDate);
  const conflict = await Booking.findOne({
    _id: { $ne: booking._id },
    assignedDecoratorEmail: decorator.email,
    bookingDate: { $gte: start, $lt: end },
    status: { $nin: ['cancelled', 'Completed'] }
  }).lean();

  if (conflict) {
    throw new AppError('Decorator already has an assigned project on this date.', 409);
  }

  booking.assignedDecoratorId = decorator._id;
  booking.assignedDecoratorEmail = decorator.email;
  booking.status = 'Assigned';
  await booking.save();

  res.json({
    success: true,
    message: 'Decorator assigned.',
    data: booking
  });
});
