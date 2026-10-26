import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import * as c from '../controllers/settingsController.js';

const router = Router();
router.get('/', auth, c.get);
router.get('/activity', auth, requireRole('admin'), c.activity);
router.post('/notify-test', auth, requireRole('admin'), c.notifyStub);
router.put('/', auth, requireRole('admin'), c.update);

export default router;
