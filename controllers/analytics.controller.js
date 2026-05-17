import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getRevenueSummary = asyncHandler(async (_req, res) => {
  const [revenueAgg, paidBookings, pendingPayments, recentTransactions] = await Promise.all([
    Payment.aggregate([
      { $match: { paymentStatus: 'succeeded' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]),
    Booking.countDocuments({ paymentStatus: 'paid' }),
    Booking.countDocuments({ paymentStatus: 'unpaid', status: { $ne: 'cancelled' } }),
    Payment.find({ paymentStatus: 'succeeded' }).sort({ createdAt: -1 }).limit(8).lean()
  ]);

  res.json({
    success: true,
    data: {
      totalRevenue: revenueAgg[0]?.totalRevenue || 0,
      totalPaidBookings: paidBookings,
      pendingPayments,
      recentTransactions
    }
  });
});

export const getServiceDemand = asyncHandler(async (_req, res) => {
  const demand = await Booking.aggregate([
    {
      $group: {
        _id: '$serviceName',
        bookings: { $sum: 1 },
        paidBookings: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0]
          }
        }
      }
    },
    { $sort: { bookings: -1 } },
    { $limit: 12 }
  ]);

  res.json({
    success: true,
    data: demand.map((item) => ({
      serviceName: item._id,
      bookings: item.bookings,
      paidBookings: item.paidBookings
    }))
  });
});
