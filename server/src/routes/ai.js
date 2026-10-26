import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { voiceAssist, setGeminiKey } from '../controllers/aiController.js';

const router = Router();

// Endpoints for Hey WareX Gemini 3.8 Live Voice Assistant
router.post('/voice-assist', auth, voiceAssist);
router.post('/set-key', auth, setGeminiKey);

export default router;
