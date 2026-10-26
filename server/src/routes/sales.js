import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import * as c from '../controllers/salesController.js';

const router = Router();
router.use(auth);

router.get('/customers', c.customers.list);
router.post('/customers', requireRole('admin', 'dispatch_staff'), c.customers.create);
router.put('/customers/:id', requireRole('admin', 'dispatch_staff'), c.customers.update);

router.get('/invoices', c.listInvoices);
router.post('/invoices/from-order/:orderId', requireRole('admin', 'dispatch_staff'), c.createSalesInvoice);
router.post('/payments', requireRole('admin', 'dispatch_staff'), c.addPayment);
router.get('/payments', c.listPayments);
router.post('/returns', requireRole('admin', 'dispatch_staff'), c.salesReturn);
router.post('/credits', requireRole('admin', 'dispatch_staff'), c.createCredit);
router.get('/credits', c.listCredits);

export default router;
