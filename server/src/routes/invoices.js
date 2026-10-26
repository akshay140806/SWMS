import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import * as c from '../controllers/invoiceController.js';

const router = Router();
const DSP = requireRole('admin', 'dispatch_staff');
router.get('/', auth, c.list);
router.get('/:id', auth, c.getOne);
router.post('/from-order', auth, DSP, c.createFromOrder);
router.post('/:id/pay', auth, DSP, c.markPaid);

export default router;
