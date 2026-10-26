import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';
import { locationSchema } from '../validators/schemas.js';
import * as c from '../controllers/locationController.js';

const router = Router();
const WH = requireRole('admin', 'warehouse_staff');

router.get('/', auth, c.list);
router.get('/:id/contents', auth, c.contents);
router.get('/:id/qr', auth, c.qr);
router.post('/', auth, WH, validate(locationSchema), c.create);
router.post('/assign', auth, WH, c.assign);

export default router;
