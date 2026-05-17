import { Router } from 'express';
import { createPayment, createPaymentIntent, getMyPayments } from '../controllers/payment.controller.js';
import { validate } from '../middleware/validate.js';
import { verifyJWT } from '../middleware/verifyJWT.js';
import { verifyUser } from '../middleware/verifyUser.js';
import { paymentCreateSchema, paymentIntentSchema } from '../utils/validators.js';

const router = Router();

router.post('/create-payment-intent', verifyJWT, verifyUser, validate(paymentIntentSchema), createPaymentIntent);
router.post('/payments', verifyJWT, verifyUser, validate(paymentCreateSchema), createPayment);
router.get('/payments/my-payments', verifyJWT, verifyUser, getMyPayments);

export default router;
