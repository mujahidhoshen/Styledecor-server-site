import { Router } from 'express';
import {
  assignDecorator,
  cancelBooking,
  createBooking,
  getAllBookings,
  getBookingById,
  getMyBookings,
  updateBooking,
  updateBookingStatus
} from '../controllers/booking.controller.js';
import { validate } from '../middleware/validate.js';
import { verifyAdmin } from '../middleware/verifyAdmin.js';
import { verifyJWT } from '../middleware/verifyJWT.js';
import { verifyUser } from '../middleware/verifyUser.js';
import {
  assignDecoratorSchema,
  bookingCreateSchema,
  bookingStatusSchema,
  bookingUpdateSchema,
  idParamSchema
} from '../utils/validators.js';

const router = Router();

router.post('/bookings', verifyJWT, verifyUser, validate(bookingCreateSchema), createBooking);
router.get('/bookings/my-bookings', verifyJWT, verifyUser, getMyBookings);
router.get('/bookings', verifyJWT, verifyAdmin, getAllBookings);
router.get('/bookings/:id', verifyJWT, verifyUser, validate(idParamSchema, 'params'), getBookingById);
router.patch('/bookings/:id', verifyJWT, verifyUser, validate(idParamSchema, 'params'), validate(bookingUpdateSchema), updateBooking);
router.delete('/bookings/:id', verifyJWT, verifyUser, validate(idParamSchema, 'params'), cancelBooking);
router.patch('/bookings/:id/status', verifyJWT, verifyAdmin, validate(idParamSchema, 'params'), validate(bookingStatusSchema), updateBookingStatus);
router.patch('/bookings/:id/assign-decorator', verifyJWT, verifyAdmin, validate(idParamSchema, 'params'), validate(assignDecoratorSchema), assignDecorator);

export default router;
