// Centralized async + error handling. All controllers use asyncHandler;
// unknown errors become consistent JSON via errorHandler.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid id.' });
  if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Something went wrong. Please try again.' });
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Page not found' });
}
