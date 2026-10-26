import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import * as c from '../controllers/fulfilController.js';

const router = Router();
const DSP = requireRole('admin', 'dispatch_staff');

router.get('/packages', auth, c.listPackages);
router.post('/orders/:id/pack', auth, DSP, c.packOrder);
router.get('/shipments', auth, c.listShipments);
router.get('/shipments/:id/challan', auth, c.challan);
router.get('/returns', auth, c.listReturns);
router.post('/returns', auth, DSP, c.createReturn);

export default router;
