import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import * as c from '../controllers/notificationController.js';

const router = Router();
router.use(auth);
router.get('/', c.list);
router.post('/read-all', c.markAllRead);
router.delete('/', c.clearAll);
router.post('/:id/read', c.markRead);

export default router;
