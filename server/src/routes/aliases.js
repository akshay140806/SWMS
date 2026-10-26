import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import * as po from '../controllers/purchaseController.js';
import * as catalog from '../controllers/catalogController.js';

const router = Router();
const WH = requireRole('admin', 'warehouse_staff');

// Short aliases used by Zoho-style clients: /pos, /groups, /pricelists.
router.get('/pos', auth, po.list);
router.post('/pos', auth, WH, po.create);
router.post('/pos/:id/receive', auth, WH, po.receiveGRN);

router.get('/groups', auth, catalog.listGroups);
router.post('/groups', auth, WH, catalog.createGroup);
router.get('/pricelists', auth, catalog.listPriceLists);
router.post('/pricelists', auth, WH, catalog.createPriceList);

export default router;
