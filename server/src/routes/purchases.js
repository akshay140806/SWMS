import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import * as c from '../controllers/purchaseController.js';

const router = Router();
const WH = requireRole('admin', 'warehouse_staff');
router.get('/', auth, c.list);
router.get('/:id', auth, c.getOne);
router.post('/', auth, WH, c.create);
router.post('/:id/receive', auth, WH, c.receive);
router.post('/:id/status', auth, WH, c.setStatus);

export default router;
