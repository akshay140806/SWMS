import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import * as c from '../controllers/customerController.js';

const router = Router();
// Directory write access: admin + warehouse (dispatch is read-only here).
const WH = requireRole('admin', 'warehouse_staff');
router.get('/', auth, c.list);
router.post('/', auth, WH, c.create);
router.put('/:id', auth, WH, c.update);

export default router;
