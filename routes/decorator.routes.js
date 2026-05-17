import { Router } from 'express';
import {
  deleteDecorator,
  getAssignedProjects,
  getDecoratorEarnings,
  getDecoratorPayments,
  getDecorators,
  getTodaySchedule,
  getTopDecorators,
  updateDecorator,
  updateDecoratorStatus,
  updateProjectStatus
} from '../controllers/decorator.controller.js';
import { validate } from '../middleware/validate.js';
import { verifyAdmin } from '../middleware/verifyAdmin.js';
import { verifyDecorator } from '../middleware/verifyDecorator.js';
import { verifyJWT } from '../middleware/verifyJWT.js';
import {
  decoratorProjectStatusSchema,
  decoratorStatusSchema,
  decoratorUpdateSchema,
  idParamSchema
} from '../utils/validators.js';

const router = Router();

router.get('/decorators/top', getTopDecorators);
router.get('/decorators', verifyJWT, verifyAdmin, getDecorators);
router.patch('/decorators/:id/status', verifyJWT, verifyAdmin, validate(idParamSchema, 'params'), validate(decoratorStatusSchema), updateDecoratorStatus);
router.patch('/decorators/:id', verifyJWT, verifyAdmin, validate(idParamSchema, 'params'), validate(decoratorUpdateSchema), updateDecorator);
router.delete('/decorators/:id', verifyJWT, verifyAdmin, validate(idParamSchema, 'params'), deleteDecorator);

router.get('/decorator/assigned-projects', verifyJWT, verifyDecorator, getAssignedProjects);
router.get('/decorator/today-schedule', verifyJWT, verifyDecorator, getTodaySchedule);
router.patch('/decorator/projects/:id/status', verifyJWT, verifyDecorator, validate(idParamSchema, 'params'), validate(decoratorProjectStatusSchema), updateProjectStatus);
router.get('/decorator/earnings', verifyJWT, verifyDecorator, getDecoratorEarnings);
router.get('/decorator/payments', verifyJWT, verifyDecorator, getDecoratorPayments);

export default router;
