import StockMovement from '../models/StockMovement.js';

export async function list(req, res) {
  const { productId, type, locationId, by, from, to, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (productId) filter.product = productId;
  if (type) filter.type = type;
  if (by) filter.performedBy = by;
  if (locationId) filter.$or = [{ fromLocation: locationId }, { toLocation: locationId }];
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  const pg = Math.max(1, Number(page));
  const lim = Math.min(200, Math.max(1, Number(limit)));
  const [items, total] = await Promise.all([
    StockMovement.find(filter)
      .populate('product', 'sku name unit')
      .populate('fromLocation', 'code')
      .populate('toLocation', 'code')
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip((pg - 1) * lim)
      .limit(lim),
    StockMovement.countDocuments(filter)
  ]);
  res.json({ items, total, page: pg, pages: Math.ceil(total / lim) });
}
