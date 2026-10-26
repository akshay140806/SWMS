import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';
import { authLimiter } from '../middleware/limiter.js';
import * as c from '../controllers/authController.js';

const router = Router();
router.post('/register', authLimiter, validate(registerSchema), c.register);
router.post('/login', authLimiter, validate(loginSchema), c.login);
router.post('/google', authLimiter, c.googleLogin);
router.post('/logout', auth, c.logout);
router.get('/me', auth, c.me);

export default router;
