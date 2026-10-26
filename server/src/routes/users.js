import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';
import { userCreateSchema } from '../validators/schemas.js';
import * as c from '../controllers/userController.js';

const router = Router();
router.use(auth, requireRole('admin'));
router.get('/', c.list);
router.post('/', validate(userCreateSchema), c.create);
router.put('/:id', c.update);
router.patch('/:id/active', c.setActive);
router.post('/:id/reset-password', c.resetPassword);

export default router;
