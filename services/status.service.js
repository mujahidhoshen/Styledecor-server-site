import { DECORATOR_STATUS_FLOW } from '../utils/constants.js';
import { AppError } from '../utils/AppError.js';

export const canCancelBooking = (status) => {
  return !['Planning Phase', 'Materials Prepared', 'On the Way to Venue', 'Setup in Progress', 'Completed'].includes(status);
};

export const isNextDecoratorStatus = (currentStatus, nextStatus) => {
  const currentIndex = DECORATOR_STATUS_FLOW.indexOf(currentStatus);
  const nextIndex = DECORATOR_STATUS_FLOW.indexOf(nextStatus);

  return currentIndex >= 0 && nextIndex === currentIndex + 1;
};

export const calculateDecoratorEarning = (bookingCost) => {
  return Math.round(Number(bookingCost || 0) * 0.6);
};

export const assertAdminBookingStatusTransition = (booking, nextStatus) => {
  const currentStatus = booking.status;

  if (currentStatus === nextStatus) return;

  if (currentStatus === 'cancelled') {
    throw new AppError('Cancelled bookings cannot be moved back into workflow.', 400);
  }

  if (currentStatus === 'Completed') {
    throw new AppError('Completed bookings cannot be changed.', 400);
  }

  if (nextStatus === 'cancelled') {
    if (!canCancelBooking(currentStatus)) {
      throw new AppError('This booking is already in progress or completed.', 400);
    }
    return;
  }

  if (nextStatus === 'Assigned') {
    throw new AppError('Use the decorator assignment endpoint to move a booking to Assigned.', 400);
  }

  if (booking.paymentStatus !== 'paid') {
    throw new AppError('Booking workflow cannot progress before payment is completed.', 400);
  }

  if (nextStatus === 'Completed' && currentStatus !== 'Setup in Progress') {
    throw new AppError('Bookings can only be completed after setup is in progress.', 400);
  }

  if (booking.serviceMode === 'on-site') {
    if (!booking.assignedDecoratorEmail) {
      throw new AppError('On-site bookings must have an assigned decorator before workflow progress.', 400);
    }

    if (!isNextDecoratorStatus(currentStatus, nextStatus)) {
      throw new AppError('On-site booking status must follow the required workflow sequence.', 400);
    }

    return;
  }

  if (currentStatus === 'pending' && nextStatus === 'Planning Phase') return;

  if (!isNextDecoratorStatus(currentStatus, nextStatus)) {
    throw new AppError('Booking status must follow the required workflow sequence.', 400);
  }
};
