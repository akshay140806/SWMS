import Product, { availOf } from '../models/Product.js';
import Location from '../models/Location.js';
import Order from '../models/Order.js';
import StockMovement from '../models/StockMovement.js';
import Invoice from '../models/Invoice.js';
import PurchaseOrder from '../models/PurchaseOrder.js';

export async function stats(req, res) {
  const { from, to } = req.query;
  const range = {};
  if (from) range.$gte = new Date(from);
  if (to) range.$lte = new Date(to);
  const dateFilter = Object.keys(range).length ? { createdAt: range } : {};

  const [products, locations, invoices, purchaseOrders] = await Promise.all([
    Product.find({}).populate('defaultLocationId', 'code zone'),
    Location.find({}),
    Invoice.find({ status: { $ne: 'Cancelled' }, ...dateFilter }).sort({ createdAt: -1 }),
    PurchaseOrder.find({ status: { $ne: 'Cancelled' }, ...dateFilter }).populate('vendor', 'name')
  ]);

  const totalProducts = products.length;
  const totalQty = products.reduce((s, p) => s + (p.totalQuantity || 0), 0);
  const stockValue = products.reduce((s, p) => s + (p.totalQuantity || 0) * (p.costPrice || 0), 0);
  const stockValueRetail = products.reduce((s, p) => s + (p.totalQuantity || 0) * (p.sellingPrice || 0), 0);
  const unrealizedProfit = Math.max(0, stockValueRetail - stockValue);
  const potentialMarginPct = stockValueRetail > 0 ? Math.round(((stockValueRetail - stockValue) / stockValueRetail) * 100) : 0;
  const damaged = products.reduce((s, p) => s + (p.damagedQuantity || 0), 0);
  const damagedLoss = products.reduce((s, p) => s + (p.damagedQuantity || 0) * (p.costPrice || 0), 0);
  const lowStock = products.filter((p) => availOf(p) <= (p.reorderLevel ?? 10));

  const totalCapacity = locations.reduce((s, l) => s + l.capacity, 0);
  const totalOccupied = locations.reduce((s, l) => s + l.occupied, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [pending, dispatchedToday, dispatchedTotal] = await Promise.all([
    Order.countDocuments({ status: { $in: ['Created', 'Picking', 'Picked'] } }),
    Order.countDocuments({ status: { $in: ['Dispatched', 'Delivered'] }, dispatchedAt: { $gte: today } }),
    Order.countDocuments({ status: { $in: ['Dispatched', 'Delivered'] } })
  ]);

  // Cost and SKU maps for financial computations
  const costMap = new Map(products.map((p) => [String(p._id), p.costPrice || 0]));
  const skuCostMap = new Map(products.map((p) => [p.sku, p.costPrice || 0]));

  // Financial tracking
  let totalRevenue = 0;
  let subTotalInvoiced = 0;
  let taxCollected = 0;
  let paidRevenue = 0;
  let unpaidRevenue = 0;
  let totalCOGS = 0;

  const invoiceList = invoices.map((inv) => {
    const grand = Number(inv.grandTotal || 0);
    const sub = Number(inv.subTotal || 0);
    const tax = Number(inv.taxAmount || 0);
    totalRevenue += grand;
    subTotalInvoiced += sub;
    taxCollected += tax;
    if (inv.status === 'Paid') paidRevenue += grand;
    else if (inv.status === 'Unpaid') unpaidRevenue += grand;

    let invCost = 0;
    for (const it of inv.items || []) {
      const uCost = (it.product && costMap.get(String(it.product))) || (it.sku && skuCostMap.get(it.sku)) || 0;
      invCost += uCost * (it.qty || 1);
    }
    totalCOGS += invCost;
    const invGross = (sub || grand) - invCost;
    const invMargin = sub > 0 ? Math.round((invGross / sub) * 100) : 0;
    return {
      id: inv._id,
      invoiceNo: inv.invoiceNo,
      orderNo: inv.order?.orderNo || '—',
      customerName: inv.customerName,
      customerPhone: inv.customerPhone,
      deliveryAddress: inv.deliveryAddress,
      grandTotal: grand,
      subTotal: sub,
      taxAmount: tax,
      taxRate: inv.taxRate || 0,
      cogs: invCost,
      grossProfit: invGross,
      marginPct: invMargin,
      status: inv.status,
      createdAt: inv.createdAt
    };
  });

  const grossProfit = Math.max(0, subTotalInvoiced - totalCOGS);
  const grossMarginPct = subTotalInvoiced > 0 ? Math.round((grossProfit / subTotalInvoiced) * 100) : 0;

  // Total procurement purchase spend
  const totalPOSpend = purchaseOrders.reduce((s, po) => {
    return s + (po.items || []).reduce((sum, it) => sum + (it.qty || 0) * (it.rate || 0), 0);
  }, 0);

  // Category-wise financial breakdown
  const categoryMap = {};
  for (const p of products) {
    const cat = (p.category || 'General').trim();
    if (!categoryMap[cat]) {
      categoryMap[cat] = {
        name: cat,
        skus: 0,
        totalQty: 0,
        costValue: 0,
        retailValue: 0,
        damagedQty: 0,
        damagedLoss: 0
      };
    }
    categoryMap[cat].skus += 1;
    categoryMap[cat].totalQty += (p.totalQuantity || 0);
    categoryMap[cat].costValue += (p.totalQuantity || 0) * (p.costPrice || 0);
    categoryMap[cat].retailValue += (p.totalQuantity || 0) * (p.sellingPrice || 0);
    categoryMap[cat].damagedQty += (p.damagedQuantity || 0);
    categoryMap[cat].damagedLoss += (p.damagedQuantity || 0) * (p.costPrice || 0);
  }

  const categoryList = Object.values(categoryMap).map((c) => ({
    ...c,
    profitPotential: Math.max(0, c.retailValue - c.costValue),
    marginPct: c.retailValue > 0 ? Math.round(((c.retailValue - c.costValue) / c.retailValue) * 100) : 0,
    costSharePct: stockValue > 0 ? Math.round((c.costValue / stockValue) * 100) : 0
  })).sort((a, b) => b.costValue - a.costValue);

  // Product valuation list
  const productValuations = products.map((p) => {
    const costVal = (p.totalQuantity || 0) * (p.costPrice || 0);
    const retailVal = (p.totalQuantity || 0) * (p.sellingPrice || 0);
    const unitMargin = (p.sellingPrice || 0) - (p.costPrice || 0);
    const marginPct = (p.sellingPrice || 0) > 0 ? Math.round((unitMargin / p.sellingPrice) * 100) : 0;
    return {
      id: p._id,
      sku: p.sku,
      name: p.name,
      category: p.category || 'General',
      locationCode: p.defaultLocationId?.code || '—',
      totalQuantity: p.totalQuantity || 0,
      availableQuantity: availOf(p),
      damagedQuantity: p.damagedQuantity || 0,
      unit: p.unit,
      costPrice: p.costPrice || 0,
      sellingPrice: p.sellingPrice || 0,
      costValuation: costVal,
      retailValuation: retailVal,
      profitPotential: Math.max(0, retailVal - costVal),
      unitMargin,
      marginPct,
      lowStock: availOf(p) <= (p.reorderLevel ?? 10)
    };
  }).sort((a, b) => b.costValuation - a.costValuation);

  // Financial trend (grouped by date)
  const dateTrendMap = {};
  for (const item of invoiceList) {
    const dStr = new Date(item.createdAt).toISOString().slice(0, 10);
    if (!dateTrendMap[dStr]) dateTrendMap[dStr] = { date: dStr, revenue: 0, cost: 0, profit: 0, count: 0 };
    dateTrendMap[dStr].revenue += item.grandTotal;
    dateTrendMap[dStr].cost += item.cogs;
    dateTrendMap[dStr].profit += item.grossProfit;
    dateTrendMap[dStr].count += 1;
  }
  const financialTrend = Object.values(dateTrendMap).sort((a, b) => a.date.localeCompare(b.date));

  // Customer performance
  const custStats = {};
  for (const inv of invoiceList) {
    const name = inv.customerName || 'Walk-in Customer';
    if (!custStats[name]) custStats[name] = { name, orders: 0, totalBilled: 0, paid: 0, unpaid: 0, grossProfit: 0 };
    custStats[name].orders += 1;
    custStats[name].totalBilled += inv.grandTotal;
    if (inv.status === 'Paid') custStats[name].paid += inv.grandTotal;
    else if (inv.status === 'Unpaid') custStats[name].unpaid += inv.grandTotal;
    custStats[name].grossProfit += inv.grossProfit;
  }
  const customerFinancials = Object.values(custStats).sort((a, b) => b.totalBilled - a.totalBilled);

  // Movements trend (last 14 days, INWARD vs OUTWARD)
  const since = new Date(Date.now() - 13 * 24 * 3600 * 1000);
  since.setHours(0, 0, 0, 0);
  const trend = await StockMovement.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, type: '$type' }, qty: { $sum: '$quantity' } } },
    { $sort: { '_id.day': 1 } }
  ]);

  // Fast-moving (OUTWARD 30d) + slow/aging (no outward 60d)
  const m30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const fastMoving = await StockMovement.aggregate([
    { $match: { type: 'OUTWARD', createdAt: { $gte: m30 } } },
    { $group: { _id: '$product', total: { $sum: '$quantity' } } },
    { $sort: { total: -1 } },
    { $limit: 8 },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'p' } },
    { $unwind: '$p' },
    { $project: { sku: '$p.sku', name: '$p.name', unit: '$p.unit', total: 1, sellingPrice: '$p.sellingPrice', revenue: { $multiply: ['$total', { $ifNull: ['$p.sellingPrice', 0] }] } } }
  ]);
  const m60 = new Date(Date.now() - 60 * 24 * 3600 * 1000);
  const movedIds = await StockMovement.distinct('product', { createdAt: { $gte: m60 } });
  const slowMoving = products
    .filter((p) => !movedIds.some((id) => String(id) === String(p._id)) && (p.totalQuantity || 0) > 0)
    .slice(0, 10)
    .map((p) => ({
      sku: p.sku,
      name: p.name,
      totalQuantity: p.totalQuantity,
      unit: p.unit,
      costPrice: p.costPrice || 0,
      tiedCapital: (p.totalQuantity || 0) * (p.costPrice || 0),
      updatedAt: p.updatedAt
    }));

  // Stock by zone
  const byZone = {};
  for (const p of products) {
    const z = p.defaultLocationId?.zone || 'Unassigned';
    byZone[z] = (byZone[z] || 0) + (p.totalQuantity || 0);
  }

  // Dispatch trend (per day, 14d) + order status breakdown + movements by type
  const dispatchTrend = await Order.aggregate([
    { $match: { dispatchedAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$dispatchedAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  const statusBreakdown = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const byType = await StockMovement.aggregate([
    { $match: { ...(Object.keys(range).length ? { createdAt: range } : { createdAt: { $gte: m30 } }) } },
    { $group: { _id: '$type', count: { $sum: 1 }, qty: { $sum: '$quantity' } } }
  ]);

  const damagedReport = products
    .filter((p) => (p.damagedQuantity || 0) > 0)
    .map((p) => ({
      sku: p.sku,
      name: p.name,
      damagedQuantity: p.damagedQuantity,
      unit: p.unit,
      costPrice: p.costPrice || 0,
      totalLoss: (p.damagedQuantity || 0) * (p.costPrice || 0)
    }))
    .slice(0, 15);

  const recentOrders = await Order.find({}).sort({ createdAt: -1 }).limit(8).select('orderNo customerName status createdAt');

  res.json({
    totalProducts,
    totalQty,
    stockValue,
    stockValueRetail,
    unrealizedProfit,
    potentialMarginPct,
    damaged,
    damagedLoss,
    lowStockCount: lowStock.length,
    lowStock: lowStock.slice(0, 10).map((p) => ({ id: p._id, sku: p.sku, name: p.name, qty: availOf(p), reorderLevel: p.reorderLevel, unit: p.unit })),
    occupancy: { totalCapacity, totalOccupied, pct: totalCapacity ? Math.round((totalOccupied / totalCapacity) * 100) : 0 },
    orders: { pending, dispatchedToday, dispatchedTotal, recent: recentOrders },
    financials: {
      totalRevenue,
      subTotalInvoiced,
      taxCollected,
      paidRevenue,
      unpaidRevenue,
      totalCOGS,
      grossProfit,
      grossMarginPct,
      totalPOSpend,
      invoiceCount: invoices.length,
      invoices: invoiceList,
      trend: financialTrend,
      customers: customerFinancials
    },
    categories: categoryList,
    productValuations,
    trend,
    fastMoving,
    slowMoving,
    byZone,
    dispatchTrend,
    statusBreakdown,
    byType,
    damagedReport,
    range: dateFilter
  });
}
