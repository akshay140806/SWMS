import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import * as c from '../controllers/movementController.js';

const router = Router();
router.get('/', auth, c.list);

export default router;
