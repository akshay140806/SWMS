import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';
import { productSchema, stockQtySchema, transferSchema, damageSchema } from '../validators/schemas.js';
import * as c from '../controllers/productController.js';

const router = Router();
const WH = requireRole('admin', 'warehouse_staff');

router.get('/', auth, c.list);
router.get('/export', auth, c.exportCsv);
router.get('/:id', auth, c.getOne);
router.post('/', auth, WH, validate(productSchema), c.create);
router.put('/:id', auth, WH, c.update);
router.delete('/:id', auth, WH, c.remove);
router.post('/import', auth, WH, c.importJson);
// Stock ops accept :id or body.productId
router.post('/:id/inward', auth, WH, validate(stockQtySchema), c.inward);
router.post('/inward', auth, WH, validate(stockQtySchema), c.inward);
router.post('/:id/outward', auth, WH, validate(stockQtySchema), c.outward);
router.post('/outward', auth, WH, validate(stockQtySchema), c.outward);
router.post('/:id/transfer', auth, WH, validate(transferSchema), c.transfer);
router.post('/transfer', auth, WH, validate(transferSchema), c.transfer);
router.post('/:id/damage', auth, WH, validate(damageSchema), c.markDamaged);
router.post('/damage', auth, WH, validate(damageSchema), c.markDamaged);
router.post('/:id/adjust', auth, WH, c.adjust);
router.post('/adjust', auth, WH, c.adjust);
router.post('/:id/adjust', auth, WH, c.adjust);
router.post('/adjust', auth, WH, c.adjust);

export default router;
