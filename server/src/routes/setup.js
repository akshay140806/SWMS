import { Router } from 'express';
import * as c from '../controllers/setupController.js';

const router = Router();
router.get('/status', c.status);
router.post('/', c.setup);

export default router;
