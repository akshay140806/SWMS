import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';
import { orderCreateSchema, dispatchSchema } from '../validators/schemas.js';
import * as c from '../controllers/orderController.js';

const router = Router();
const DSP = requireRole('admin', 'dispatch_staff');

router.get('/', auth, c.list);
router.get('/history', auth, c.history);
router.get('/:id', auth, c.getOne);
router.get('/:id/picking-list', auth, c.pickingList);
router.post('/', auth, DSP, validate(orderCreateSchema), c.create);
router.post('/:id/to-picking', auth, DSP, c.toPicking);
router.post('/:id/to-picked', auth, DSP, c.toPicked);
router.post('/:id/dispatch', auth, DSP, validate(dispatchSchema), c.dispatch);
router.post('/:id/to-delivered', auth, DSP, c.toDelivered);
router.post('/:id/cancel', auth, DSP, c.cancel);
router.put('/:id', auth, DSP, c.update);
router.patch('/:id', auth, DSP, c.update);

export default router;
