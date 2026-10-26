import rateLimit from 'express-rate-limit';

// Relaxed under NODE_ENV=test so the Playwright suite (100+ logins) isn't throttled.
const skip = () => process.env.NODE_ENV === 'test';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-7',
  skip,
  message: { error: 'Too many attempts. Please try again in a moment.' }
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: 'draft-7',
  skip,
  message: { error: 'Too many requests. Please try again in a moment.' }
});
