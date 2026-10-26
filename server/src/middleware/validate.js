export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!result.success) {
      const details = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return res.status(400).json({ error: details[0] || 'Validation failed.', details });
    }
    if (result.data.body) req.body = result.data.body;
    next();
  };
}
