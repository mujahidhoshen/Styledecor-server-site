import { stripe } from '../config/stripe.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toStripeAmount } from '../services/payment.service.js';

export const createPaymentIntent = asyncHandler(async (req, res) => {
  if (!stripe) {
    throw new AppError('Stripe is not configured on the server.', 503);
  }

  const booking = await Booking.findById(req.body.bookingId).lean();

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  if (booking.userEmail !== req.user.email) {
    throw new AppError('You can only pay for your own bookings.', 403);
  }

  if (booking.paymentStatus === 'paid') {
    throw new AppError('This booking has already been paid.', 400);
  }

  if (booking.status === 'cancelled') {
    throw new AppError('Cancelled bookings cannot be paid.', 400);
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: toStripeAmount(booking.cost),
    currency: 'bdt',
    automatic_payment_methods: {
      enabled: true
    },
    metadata: {
      bookingId: booking._id.toString(),
      serviceId: booking.serviceId.toString(),
      userEmail: booking.userEmail
    }
  });

  res.json({
    success: true,
    clientSecret: paymentIntent.client_secret,
    amount: booking.cost,
    currency: 'bdt'
  });
});

export const createPayment = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.body.bookingId);

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  if (booking.userEmail !== req.user.email) {
    throw new AppError('You can only store payments for your own bookings.', 403);
  }

  if (booking.serviceId.toString() !== req.body.serviceId) {
    throw new AppError('Payment service does not match booking service.', 400);
  }

  if (Number(req.body.amount) !== Number(booking.cost)) {
    throw new AppError('Payment amount does not match booking cost.', 400);
  }

  const existing = await Payment.findOne({ transactionId: req.body.transactionId }).lean();

  if (existing) {
    return res.json({
      success: true,
      message: 'Payment already recorded.',
      data: existing
    });
  }

  const payment = await Payment.create({
    ...req.body,
    userEmail: req.user.email,
    currency: req.body.currency.toLowerCase()
  });

  if (payment.paymentStatus === 'succeeded') {
    booking.paymentStatus = 'paid';
    await booking.save();
  }

  res.status(201).json({
    success: true,
    message: 'Payment recorded.',
    data: payment
  });
});

export const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ userEmail: req.user.email })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: payments
  });
});
