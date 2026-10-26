import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import * as c from '../controllers/catalogController.js';

const router = Router();
const WH = requireRole('admin', 'warehouse_staff');
router.get('/groups', auth, c.listGroups);
router.post('/groups', auth, WH, c.createGroup);
router.delete('/groups/:id', auth, WH, c.deleteGroup);
router.post('/groups/:id/products', auth, WH, c.assignGroupProducts);
router.delete('/groups/:id/products/:productId', auth, WH, c.removeGroupProduct);
router.get('/price-lists', auth, c.listPriceLists);
router.post('/price-lists', auth, WH, c.createPriceList);
router.put('/price-lists/:id', auth, WH, c.updatePriceList);
router.delete('/price-lists/:id', auth, WH, c.deletePriceList);

export default router;
