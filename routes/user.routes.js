import { Router } from 'express';
import {
  createOrUpdateUser,
  getUserByEmail,
  getUsers,
  updateUserRole
} from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import { verifyAdmin } from '../middleware/verifyAdmin.js';
import { verifyJWT } from '../middleware/verifyJWT.js';
import { emailParamSchema, idParamSchema, userCreateSchema, userRoleSchema } from '../utils/validators.js';

const router = Router();

router.post('/users', verifyJWT, validate(userCreateSchema), createOrUpdateUser);
router.get('/users', verifyJWT, verifyAdmin, getUsers);
router.get('/users/:email', verifyJWT, validate(emailParamSchema, 'params'), getUserByEmail);
router.patch('/users/:id/role', verifyJWT, verifyAdmin, validate(idParamSchema, 'params'), validate(userRoleSchema), updateUserRole);

export default router;
