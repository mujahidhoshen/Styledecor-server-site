import mongoose from 'mongoose';
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
      serviceName: booking.serviceName,
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
  if (!stripe) {
    throw new AppError('Stripe is not configured on the server.', 503);
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(req.body.paymentIntentId);

  if (!paymentIntent) {
    throw new AppError('Stripe payment intent was not found.', 404);
  }

  if (paymentIntent.status !== 'succeeded') {
    throw new AppError('Payment has not succeeded yet.', 400);
  }

  if (paymentIntent.metadata?.bookingId !== req.body.bookingId) {
    throw new AppError('Payment intent does not belong to this booking.', 400);
  }

  if (paymentIntent.metadata?.userEmail !== req.user.email) {
    throw new AppError('Payment intent does not belong to your account.', 403);
  }

  const session = await mongoose.startSession();
  let savedPayment = null;
  let wasCreated = false;

  try {
    await session.withTransaction(async () => {
      const booking = await Booking.findById(req.body.bookingId).session(session);

      if (!booking) {
        throw new AppError('Booking not found.', 404);
      }

      if (booking.userEmail !== req.user.email) {
        throw new AppError('You can only store payments for your own bookings.', 403);
      }

      if (booking.status === 'cancelled') {
        throw new AppError('Cancelled bookings cannot be paid.', 400);
      }

      if (paymentIntent.metadata?.serviceId !== booking.serviceId.toString()) {
        throw new AppError('Payment service does not match booking service.', 400);
      }

      if (paymentIntent.amount_received !== toStripeAmount(booking.cost)) {
        throw new AppError('Payment amount does not match booking cost.', 400);
      }

      if (paymentIntent.currency !== 'bdt') {
        throw new AppError('Payment currency does not match booking currency.', 400);
      }

      const existing = await Payment.findOne({
        $or: [
          { transactionId: paymentIntent.id },
          { bookingId: booking._id, paymentStatus: 'succeeded' }
        ]
      })
        .session(session)
        .lean();

      if (existing) {
        booking.paymentStatus = 'paid';
        await booking.save({ session });
        savedPayment = existing;
        return;
      }

      const [payment] = await Payment.create(
        [
          {
            bookingId: booking._id,
            serviceId: booking.serviceId,
            serviceName: booking.serviceName,
            userEmail: req.user.email,
            amount: booking.cost,
            currency: paymentIntent.currency,
            transactionId: paymentIntent.id,
            paymentStatus: 'succeeded'
          }
        ],
        { session }
      );

      booking.paymentStatus = 'paid';
      await booking.save({ session });
      savedPayment = payment;
      wasCreated = true;
    });
  } finally {
    session.endSession();
  }

  res.status(wasCreated ? 201 : 200).json({
    success: true,
    message: 'Payment recorded.',
    data: savedPayment
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
