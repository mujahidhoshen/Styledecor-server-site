import { DECORATOR_STATUS_FLOW } from '../utils/constants.js';

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
