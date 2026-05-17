export const toStripeAmount = (amount) => {
  return Math.round(Number(amount || 0) * 100);
};
