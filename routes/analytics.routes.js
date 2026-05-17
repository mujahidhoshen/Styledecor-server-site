import { Router } from 'express';
import { getRevenueSummary, getServiceDemand } from '../controllers/analytics.controller.js';
import { verifyAdmin } from '../middleware/verifyAdmin.js';
import { verifyJWT } from '../middleware/verifyJWT.js';

const router = Router();

router.get('/admin/revenue', verifyJWT, verifyAdmin, getRevenueSummary);
router.get('/admin/analytics/service-demand', verifyJWT, verifyAdmin, getServiceDemand);

export default router;
