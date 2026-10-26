import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import * as c from '../controllers/dashboardController.js';

const router = Router();
router.get('/stats', auth, c.stats);

export default router;
