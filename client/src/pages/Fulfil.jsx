import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import en from '../content/en';
import { dOnly } from '../lib/format';
import { Badge, Drawer, Empty, Field, PageHeader, Skeleton, inputCls } from '../components/ui';

export function Packages() {
  const [items, setItems] = useState(null);
  useEffect(() => { api.get('/packages').then((r) => setItems(r.data.items)); }, []);
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title={en.fulfil.pkgT} sub={en.fulfil.pkgS} />
      {!items ? <Skeleton rows={5} /> : items.length === 0 ? (
        <Empty title={en.fulfil.pkgT} text={en.fulfil.pkgEmpty} />
      ) : (
        <div className="bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <caption className="sr-only">Packages</caption>
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase text-slate-500">
              <tr>{en.fulfil.pkgCols.map((c) => <th key={c} className="p-3">{c}</th>)}</tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id} data-testid="package-row" className="border-t">
                  <td className="p-3 font-mono font-bold">{p.packageNo}</td>
                  <td className="p-3"><Link to={`/orders/${p.order?._id}`} className="font-mono text-blue-600">{p.order?.orderNo}</Link></td>
                  <td className="p-3 tnum">{p.items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td className="p-3 tnum">{p.weight}</td>
                  <td className="p-3">{dOnly(p.createdAt)}</td>
                  <td className="p-3 text-slate-400">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function Shipments() {
  const [items, setItems] = useState(null);
  useEffect(() => { api.get('/shipments').then((r) => setItems(r.data.items)); }, []);
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title={en.fulfil.shpT} sub={en.fulfil.shpS} />
      {!items ? <Skeleton rows={5} /> : items.length === 0 ? (
        <Empty title={en.fulfil.shpT} text="No shipments yet. Dispatch an order to create one." />
      ) : (
        <div className="bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <caption className="sr-only">Shipments</caption>
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase text-slate-500">
              <tr>{en.fulfil.shpCols.map((c) => <th key={c} className="p-3">{c}</th>)}</tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s._id} data-testid="shipment-row" className="border-t hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="p-3 font-mono font-bold">{s.shipmentNo}</td>
                  <td className="p-3"><Link to={`/orders/${s.order?._id}`} className="font-mono text-blue-600">{s.order?.orderNo}</Link></td>
                  <td className="p-3">{s.carrier || '—'}</td>
                  <td className="p-3 font-mono">{s.trackingNo || '—'}</td>
                  <td className="p-3">{s.status}</td>
                  <td className="p-3">{dOnly(s.shippedAt)}</td>
                  <td className="p-3"><Link to={`/shipments/${s._id}`} className="text-xs font-bold text-blue-600">{en.fulfil.printDC}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function Challan() {
  const id = location.pathname.split('/').pop();
  const [data, setData] = useState(null);
  useEffect(() => { api.get(`/shipments/${id}/challan`).then((r) => setData(r.data)); }, [id]);
  if (!data) return <div className="max-w-3xl mx-auto p-6"><p className="text-sm text-slate-500">{en.common.loading}</p></div>;
  const { shipment: s } = data;
  const o = s.order || {};
  return (
    <div className="max-w-3xl mx-auto bg-white text-slate-900 rounded-2xl border p-8 my-6 print:my-0 print:border-0 print:rounded-none">
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
        <div>
          <h1 className="text-2xl font-black">{en.fulfil.dcTitle}</h1>
          <p className="font-mono text-sm">{s.shipmentNo}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-bold">{en.brand.name}</p>
          <p>{dOnly(s.shippedAt)}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 py-4 text-sm border-b">
        <div><p className="text-xs uppercase text-slate-500">{en.fulfil.dcTo}</p><p className="font-bold">{o.customerName}</p><p>{o.deliveryAddress}</p><p>{o.customerPhone}</p></div>
        <div className="text-right"><p className="text-xs uppercase text-slate-500">Order</p><p className="font-mono font-bold">{o.orderNo}</p><p>Carrier: {s.carrier || '—'}</p><p>Tracking: {s.trackingNo || '—'}</p></div>
      </div>
      <table className="w-full text-sm my-4">
        <thead><tr className="text-left border-b">{en.fulfil.dcItems.map((c) => <th key={c} className="py-2">{c}</th>)}</tr></thead>
        <tbody>
          {(o.items || []).map((it, i) => (
            <tr key={i} className="border-b"><td className="py-2">{i + 1}</td><td className="py-2">{it.product?.name}</td><td className="py-2 font-mono">{it.product?.sku}</td><td className="py-2 text-right font-bold">{it.qty}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between items-end mt-10 text-sm">
        <p>{en.fulfil.dcThanks}</p>
        <div className="text-center"><div className="h-12 border-b w-48" /><p className="text-xs mt-1">{en.fulfil.dcSign}</p></div>
      </div>
      <button onClick={() => window.print()} className="no-print mt-6 rounded-xl bg-slate-900 text-white text-sm font-bold px-5 py-2.5">{en.fulfil.printDC}</button>
    </div>
  );
}

export function Returns() {
  const [items, setItems] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [drawer, setDrawer] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);
  const [form, setForm] = useState({ orderId: '', customerName: '', reason: 'Quality defect' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [lines, setLines] = useState([]);
  const [line, setLine] = useState({ product: '', qty: 1 });

  async function load() {
    const [{ data }, { data: p }, { data: ords }, { data: custs }] = await Promise.all([
      api.get('/returns'),
      api.get('/products?limit=100'),
      api.get('/orders?limit=100').catch(() => ({ data: { items: [] } })),
      api.get('/customers?limit=100').catch(() => ({ data: { items: [] } }))
    ]);
    setItems(data.items);
    setProducts(p.items || []);
    setOrders(ords.items || []);
    setCustomers(custs.items || []);
  }
  useEffect(() => { load(); }, []);

  function handleOrderSelect(orderId) {
    if (!orderId || orderId === '__no_order__') {
      setSelectedOrder(null);
      setForm((prev) => ({ ...prev, orderId: '', customerName: '' }));
      return;
    }
    const ord = orders.find((o) => (o._id || o.id) === orderId);
    if (ord) {
      setSelectedOrder(ord);
      setForm((prev) => ({
        ...prev,
        orderId: ord._id || ord.id,
        customerName: ord.customerName || ''
      }));
    }
  }

  function handleCustomerSelect(custId) {
    if (!custId || custId === '__manual__') return;
    const c = customers.find((x) => (x._id || x.id) === custId);
    if (c) {
      setForm((prev) => ({ ...prev, customerName: c.name }));
    }
  }

  function addOrderLine(it) {
    const p = it.product || {};
    const pId = p._id || it.product;
    if (!pId) return;
    const exists = lines.find((l) => l.product === pId);
    if (exists) {
      toast.error('Item already added to return list');
      return;
    }
    const fullP = products.find((x) => (x._id || x.id) === pId) || p;
    setLines([
      ...lines,
      {
        product: pId,
        sku: fullP.sku || p.sku || 'SKU',
        name: fullP.name || p.name || 'Product',
        unit: fullP.unit || p.unit || 'units',
        qty: Math.min(1, it.qty || 1),
        maxQty: it.qty || 1
      }
    ]);
    toast.success(`Added ${fullP.name || fullP.sku} to return list`);
  }

  function addCustomLine() {
    if (!line.product) return;
    const p = products.find((x) => (x._id || x.id) === line.product);
    if (!p) return;
    const exists = lines.find((l) => l.product === line.product);
    if (exists) {
      toast.error('Product already added to return list');
      return;
    }
    setLines([
      ...lines,
      {
        product: p._id || p.id,
        sku: p.sku,
        name: p.name,
        unit: p.unit || 'units',
        qty: Number(line.qty) || 1
      }
    ]);
    setLine({ product: '', qty: 1 });
  }

  async function save(e) {
    e.preventDefault();
    if (!lines.length) return toast.error(en.valid.required);
    if (!form.customerName?.trim()) return toast.error('Customer name is required');
    try {
      await api.post('/returns', {
        orderId: form.orderId || undefined,
        customerName: form.customerName.trim(),
        reason: form.reason,
        items: lines.map((l) => ({ product: l.product, qty: Number(l.qty) }))
      });
      toast.success(en.toasts.saved);
      setDrawer(false);
      setLines([]);
      setSelectedOrder(null);
      setForm({ orderId: '', customerName: '', reason: 'Quality defect' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || en.toasts.err);
    }
  }

  function openNewReturn() {
    setSelectedOrder(null);
    setLines([]);
    setLine({ product: '', qty: 1 });
    setForm({ orderId: '', customerName: '', reason: 'Quality defect' });
    setDrawer(true);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={en.sales.retT}
        sub={en.sales.retS}
        action={
          <button
            onClick={openNewReturn}
            data-testid="add-return-btn"
            className="text-sm font-bold bg-blue-600 text-white rounded-xl px-4 py-2 hover:bg-blue-500 transition shadow-sm"
          >
            {en.sales.addRet}
          </button>
        }
      />

      {!items ? (
        <Skeleton rows={5} />
      ) : items.length === 0 ? (
        <Empty
          title={en.sales.retT}
          text="No sales returns recorded yet. Click '+ New Return' to log returned goods and restock inventory."
          action={
            <button
              onClick={openNewReturn}
              className="text-sm font-bold bg-blue-600 text-white rounded-xl px-4 py-2 hover:bg-blue-500 transition"
            >
              {en.sales.addRet}
            </button>
          }
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <caption className="sr-only">Sales Returns</caption>
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Return No.</th>
                <th className="p-3">Order Ref</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items Returned</th>
                <th className="p-3 text-right">Total Units</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id} data-testid="return-row" className="border-t hover:bg-slate-50 dark:hover:bg-white/5 transition">
                  <td className="p-3 font-mono font-bold text-blue-600">{r.returnNo}</td>
                  <td className="p-3 font-mono text-xs">
                    {r.order ? (
                      <Link to={`/orders/${r.order._id || r.order}`} className="text-blue-600 hover:underline font-bold">
                        {r.order.orderNo || 'Order'}
                      </Link>
                    ) : (
                      <span className="text-slate-400">Direct Return</span>
                    )}
                  </td>
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                    {r.customerName || r.order?.customerName || '—'}
                  </td>
                  <td className="p-3">
                    <div className="space-y-0.5">
                      {r.items?.map((it, idx) => (
                        <div key={idx} className="text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-medium">{it.product?.name || it.product?.sku || 'Item'}</span>
                          <span className="text-slate-400 ml-1">× {it.qty} {it.product?.unit || ''}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 tnum text-right font-bold text-slate-900 dark:text-white">
                    {r.items?.reduce((s, i) => s + (Number(i.qty) || 0), 0)}
                  </td>
                  <td className="p-3 text-xs">
                    <span className="inline-block bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md font-medium text-slate-700 dark:text-slate-300">
                      {r.reason}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-slate-500 whitespace-nowrap">{dOnly(r.createdAt)}</td>
                  <td className="p-3">
                    <Badge tone="green">{r.status || 'Restocked'}</Badge>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setViewDoc(r)}
                      className="text-xs font-bold text-blue-600 hover:underline px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE RETURN DRAWER */}
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="+ New Sales Return" wide>
        <form onSubmit={save} className="space-y-4">
          {/* ORDER SELECTOR */}
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                {en.sales.fOrder || 'Select Sales Order (Recommended)'}
              </label>
              <span className="text-xs text-blue-600 font-medium">Auto-fetches customer & items</span>
            </div>
            <select
              value={form.orderId}
              onChange={(e) => handleOrderSelect(e.target.value)}
              className={inputCls}
              data-testid="return-order-select"
            >
              <option value="">— Select Order to Return Items From —</option>
              {orders.map((o) => (
                <option key={o._id || o.id} value={o._id || o.id}>
                  {o.orderNo} · {o.customerName} ({o.status} · {dOnly(o.createdAt)})
                </option>
              ))}
              <option value="__no_order__">+ Direct Return (Without Order / Walk-in)</option>
            </select>

            {/* ORDER DETAILS CARD */}
            {selectedOrder && (
              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-400">
                      {selectedOrder.orderNo}
                    </span>
                    <Badge tone={selectedOrder.status === 'Delivered' ? 'green' : 'blue'}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500">{dOnly(selectedOrder.createdAt)}</span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p>
                    <span className="font-medium text-slate-500">Customer:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-100">{selectedOrder.customerName}</strong>
                    {selectedOrder.customerPhone ? ` · 📞 ${selectedOrder.customerPhone}` : ''}
                  </p>
                  {selectedOrder.deliveryAddress && (
                    <p className="truncate">
                      <span className="font-medium text-slate-500">📍 Delivery Address:</span>{' '}
                      {selectedOrder.deliveryAddress}
                    </p>
                  )}
                </div>

                {/* Ordered Items List */}
                <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Items Ordered ({selectedOrder.items?.length || 0}):
                    </span>
                    <span className="text-[11px] text-blue-600">Click &quot;+ Return Item&quot; to add</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {selectedOrder.items?.map((it, idx) => {
                      const p = it.product || {};
                      const pId = p._id || it.product;
                      const pName = p.name || 'Product';
                      const pSku = p.sku || 'SKU';
                      const isAdded = lines.some((l) => l.product === pId);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg p-2 border border-slate-200/60 dark:border-white/10 text-xs shadow-xs"
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{pName}</span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {pSku} · Ordered: {it.qty} {p.unit || ''}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => addOrderLine(it)}
                            disabled={isAdded}
                            className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 transition"
                          >
                            {isAdded ? 'Added ✓' : '+ Return Item'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CUSTOMER NAME */}
          <Field label="Customer Name" required>
            <div className="space-y-1">
              <input
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className={inputCls}
                placeholder="Customer name"
                data-testid="return-customer"
                required
              />
              {selectedOrder ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Automatically fetched from Order {selectedOrder.orderNo}
                </p>
              ) : customers.length > 0 ? (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-400">Or pick from directory:</span>
                  <select
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="text-xs border rounded-lg px-2 py-1 bg-transparent"
                  >
                    <option value="">— Select Customer —</option>
                    {customers.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          </Field>

          {/* RETURN REASON */}
          <Field label={en.sales.fReason || 'Return Reason'}>
            <select
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className={inputCls}
              data-testid="return-reason"
            >
              {[
                'Quality defect',
                'Wrong item shipped',
                'Damaged in transit',
                'Expired',
                'Customer rejected',
                'Excess quantity',
                'Other'
              ].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>

          {/* ADD ITEMS SECTION */}
          <div className="pt-2">
            <label className="text-xs font-semibold block mb-1">
              Add Items to Return
            </label>
            <div className="flex gap-2">
              <select
                value={line.product}
                onChange={(e) => setLine({ ...line, product: e.target.value })}
                className={inputCls}
                data-testid="return-product"
              >
                <option value="">— Select Product to Add —</option>
                {products.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>
                    {p.name ? `${p.name} · ${p.sku}` : p.sku} (Current Stock: {p.totalQuantity ?? p.availableQuantity ?? 0} {p.unit || ''})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={line.qty}
                onChange={(e) => setLine({ ...line, qty: e.target.value })}
                className={`${inputCls} w-24`}
                placeholder="Qty"
                data-testid="return-qty"
              />
              <button
                type="button"
                onClick={addCustomLine}
                className="px-4 rounded-xl bg-slate-200 dark:bg-white/15 font-bold hover:bg-slate-300 transition text-sm shrink-0"
              >
                + Add
              </button>
            </div>

            {/* LIST OF RETURN LINES */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Items to Return & Restock ({lines.length})
                </span>
                {lines.length > 0 && (
                  <span className="text-xs text-slate-400">
                    Total: {lines.reduce((s, i) => s + (Number(i.qty) || 0), 0)} units
                  </span>
                )}
              </div>

              {lines.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-white/5 p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-white/15 text-center">
                  No items added to return yet. Click &quot;+ Return Item&quot; on the order above or choose a product to add.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {lines.map((l, i) => (
                    <li
                      key={i}
                      data-testid="return-line"
                      className="flex justify-between items-center bg-slate-50 dark:bg-white/5 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-white/10"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{l.name || l.sku}</span>
                        <span className="font-mono text-xs text-slate-400">
                          {l.sku} {l.maxQty ? `· Max from order: ${l.maxQty}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs text-slate-400">Return Qty:</label>
                          <input
                            type="number"
                            min={1}
                            max={l.maxQty || undefined}
                            value={l.qty}
                            onChange={(e) => {
                              const val = Math.max(1, Number(e.target.value));
                              setLines(lines.map((item, j) => (j === i ? { ...item, qty: val } : item)));
                            }}
                            className="w-16 px-2 py-1 text-center font-bold text-sm rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800"
                          />
                          <span className="text-xs text-slate-500 font-mono">{l.unit || 'units'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLines(lines.filter((_, j) => j !== i))}
                          className="text-red-500 hover:text-red-700 text-xs font-bold p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* RESTOCK AUDIT BANNER */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <span className="text-base">📦</span>
            <div>
              <p className="font-bold">Instant Inventory Restock</p>
              <p className="text-[11px] opacity-90">
                Units will be automatically credited back into warehouse inventory with an INWARD stock movement audit record.
              </p>
            </div>
          </div>

          <button
            type="submit"
            data-testid="return-save-btn"
            disabled={!lines.length}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-3 transition disabled:opacity-50 shadow-sm"
          >
            Process Return & Restock ({lines.reduce((s, i) => s + (Number(i.qty) || 0), 0)} Units)
          </button>
        </form>
      </Drawer>

      {/* VIEW RETURN DETAILS DRAWER */}
      <Drawer open={Boolean(viewDoc)} onClose={() => setViewDoc(null)} title={viewDoc ? `Sales Return ${viewDoc.returnNo}` : ''} wide>
        {viewDoc && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <p className="font-mono text-lg font-bold text-blue-600">{viewDoc.returnNo}</p>
                <p className="text-xs text-slate-400">Processed on {dOnly(viewDoc.createdAt)}</p>
              </div>
              <Badge tone="green">{viewDoc.status || 'Restocked'}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-white/5 p-3.5 rounded-xl border border-slate-200/60 dark:border-white/10 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Customer</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {viewDoc.customerName || viewDoc.order?.customerName || '—'}
                </span>
                {viewDoc.order?.customerPhone && (
                  <p className="text-slate-500 mt-0.5">📞 {viewDoc.order.customerPhone}</p>
                )}
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Linked Order</span>
                {viewDoc.order ? (
                  <Link
                    to={`/orders/${viewDoc.order._id || viewDoc.order}`}
                    className="font-mono font-bold text-blue-600 hover:underline text-sm"
                  >
                    {viewDoc.order.orderNo || 'Order Details'}
                  </Link>
                ) : (
                  <span className="text-slate-500">Direct Return (No order linked)</span>
                )}
                <p className="text-slate-500 mt-0.5">Reason: <strong>{viewDoc.reason}</strong></p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Restocked Items ({viewDoc.items?.length || 0})
              </h4>
              <table className="w-full text-xs border rounded-xl overflow-hidden">
                <thead className="bg-slate-50 dark:bg-white/5 text-left uppercase text-slate-500">
                  <tr>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5">SKU</th>
                    <th className="p-2.5 text-right">Restocked Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {viewDoc.items?.map((it, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2.5 font-medium">{it.product?.name || it.product?.sku || 'Product'}</td>
                      <td className="p-2.5 font-mono text-slate-500">{it.product?.sku || '—'}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-600">
                        +{it.qty} {it.product?.unit || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3 text-xs text-emerald-800 dark:text-emerald-300">
              ✓ <strong>Restock Complete:</strong> Total of{' '}
              <strong>{viewDoc.items?.reduce((s, i) => s + (Number(i.qty) || 0), 0)} units</strong> have been credited back into warehouse inventory.
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
