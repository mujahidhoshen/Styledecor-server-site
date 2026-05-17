import { Router } from 'express';
import { createJwt } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { jwtSchema } from '../utils/validators.js';

const router = Router();

router.post('/jwt', validate(jwtSchema), createJwt);

export default router;
