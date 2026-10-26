import ItemGroup from '../models/ItemGroup.js';
import PriceList from '../models/PriceList.js';
import Product, { availOf } from '../models/Product.js';

export async function listGroups(req, res) {
  const groups = await ItemGroup.find({}).sort({ name: 1 });
  const products = await Product.find({}).populate('defaultLocationId', 'code').sort({ name: 1 });

  const items = await Promise.all(
    groups.map(async (g) => {
      const gNameNorm = g.name.trim().toLowerCase();
      const groupProds = [];

      for (const p of products) {
        const pGroupStr = String(p.group?._id || p.group || '');
        const pCatNorm = (p.category || '').trim().toLowerCase();
        const pNameNorm = (p.name || '').trim().toLowerCase();

        // Check if product belongs to this group:
        // 1. Explicit group ObjectId link
        // 2. Category name matches group name
        // 3. Category / Name keyword matches
        const matches =
          pGroupStr === String(g._id) ||
          pCatNorm === gNameNorm ||
          (gNameNorm.includes('dairy') && (/\b(dairy|milk|curd|paneer|butter)\b/i.test(pCatNorm) || /\b(dairy|milk|curd|paneer|butter)\b/i.test(pNameNorm))) ||
          (gNameNorm.includes('oil') && (/\b(oil|ghee)\b/i.test(pCatNorm) || /\b(oil|ghee)\b/i.test(pNameNorm))) ||
          (gNameNorm.includes('grain') && (/\b(grain|grains|rice|atta|wheat|maida)\b/i.test(pCatNorm) || /\b(grain|grains|rice|atta|wheat|maida)\b/i.test(pNameNorm)));

        if (matches) {
          // Auto-sync product to group in DB if not yet linked
          if (pGroupStr !== String(g._id) || p.category !== g.name) {
            await Product.findByIdAndUpdate(p._id, { $set: { group: g._id, category: g.name } });
            p.group = g._id;
            p.category = g.name;
          }
          groupProds.push({
            id: p._id,
            _id: p._id,
            name: p.name,
            sku: p.sku,
            unit: p.unit,
            category: p.category,
            costPrice: p.costPrice,
            sellingPrice: p.sellingPrice,
            totalQuantity: p.totalQuantity,
            available: availOf(p),
            locationCode: p.defaultLocationId?.code || '—'
          });
        }
      }

      return {
        ...g.toObject(),
        productCount: groupProds.length,
        products: groupProds
      };
    })
  );

  res.json({ items });
}

export async function createGroup(req, res) {
  if (!req.body.name) return res.status(400).json({ error: 'This field is required.' });
  try {
    res.status(201).json(await ItemGroup.create(req.body));
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'Group already exists.' });
    throw e;
  }
}

export async function assignGroupProducts(req, res) {
  const group = await ItemGroup.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Item group not found' });
  const ids = Array.isArray(req.body.productIds) ? req.body.productIds : [req.body.productId];
  if (!ids.length) return res.status(400).json({ error: 'No products provided' });

  await Product.updateMany(
    { _id: { $in: ids } },
    { $set: { group: group._id, category: group.name } }
  );
  res.json({ ok: true });
}

export async function removeGroupProduct(req, res) {
  await Product.findByIdAndUpdate(req.params.productId, { $unset: { group: 1 }, $set: { category: 'General' } });
  res.json({ ok: true });
}

export async function deleteGroup(req, res) {
  const g = await ItemGroup.findByIdAndDelete(req.params.id);
  if (!g) return res.status(404).json({ error: 'Page not found' });
  // Unlink products from deleted group
  await Product.updateMany({ group: req.params.id }, { $unset: { group: 1 } });
  res.json({ ok: true });
}

export async function listPriceLists(req, res) {
  res.json({ items: await PriceList.find({}).populate('items.product', 'sku name sellingPrice').sort({ name: 1 }) });
}

export async function createPriceList(req, res) {
  if (!req.body.name) return res.status(400).json({ error: 'This field is required.' });
  try {
    res.status(201).json(await PriceList.create(req.body));
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'Price list already exists.' });
    throw e;
  }
}

export async function updatePriceList(req, res) {
  const pl = await PriceList.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('items.product', 'sku name sellingPrice');
  if (!pl) return res.status(404).json({ error: 'Page not found' });
  res.json(pl);
}

export async function deletePriceList(req, res) {
  const pl = await PriceList.findByIdAndDelete(req.params.id);
  if (!pl) return res.status(404).json({ error: 'Page not found' });
  res.json({ ok: true });
}
