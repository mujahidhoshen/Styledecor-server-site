import { Router } from 'express';
import {
  createService,
  deleteService,
  getServiceById,
  getServices,
  updateService
} from '../controllers/service.controller.js';
import { validate } from '../middleware/validate.js';
import { verifyAdmin } from '../middleware/verifyAdmin.js';
import { verifyJWT } from '../middleware/verifyJWT.js';
import { idParamSchema, serviceCreateSchema, serviceUpdateSchema } from '../utils/validators.js';

const router = Router();

router.get('/services', getServices);
router.get('/services/:id', validate(idParamSchema, 'params'), getServiceById);
router.post('/services', verifyJWT, verifyAdmin, validate(serviceCreateSchema), createService);
router.patch('/services/:id', verifyJWT, verifyAdmin, validate(idParamSchema, 'params'), validate(serviceUpdateSchema), updateService);
router.delete('/services/:id', verifyJWT, verifyAdmin, validate(idParamSchema, 'params'), deleteService);

export default router;
