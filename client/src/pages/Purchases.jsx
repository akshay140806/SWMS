import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import retail from '../content/retail';
import { Badge, Drawer, Empty, Field, PageHeader, Skeleton, inputCls } from '../components/ui';

const TONE = { Draft: 'grey', Ordered: 'amber', 'Partially Received': 'violet', Received: 'green', Cancelled: 'red' };

function POForm({ vendors, products, onDone }) {
  const [vendorId, setVendorId] = useState(vendors[0]?._id || '');
  const [lines, setLines] = useState([]);
  const [line, setLine] = useState({ product: '', qty: 1, rate: 0, location: '' });
  const [locations, setLocations] = useState([]);
  useEffect(() => { api.get('/locations').then((r) => setLocations(r.data.items)); }, []);

  async function submit(e) {
    e.preventDefault();
    if (!vendorId || !lines.length) return toast.error('This field is required.');
    try {
      const { data } = await api.post('/purchases', { vendorId, items: lines, status: 'Ordered' });
      toast.success(`Purchase order ${data.poNo} created.`);
      onDone();
    } catch (err) { toast.error(err.response?.data?.error || 'Something went wrong. Please try again.'); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={retail.po.fVendor}>
        <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className={inputCls} data-testid="po-vendor">
          {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
        </select>
      </Field>
      <div>
        <label className="text-xs font-semibold">{retail.po.fItems}</label>
        <div className="grid grid-cols-12 gap-2 mt-1">
          <select value={line.product} onChange={(e) => setLine({ ...line, product: e.target.value })} className={`${inputCls} col-span-6`} data-testid="po-product">
            <option value="">— Select Product —</option>
            {products.map((p) => <option key={p._id || p.id} value={p._id || p.id}>{p.name} · {p.sku}</option>)}
          </select>
          <input type="number" min={1} value={line.qty} onChange={(e) => setLine({ ...line, qty: e.target.value })} className={`${inputCls} col-span-2`} data-testid="po-qty" />
          <input type="number" min={0} value={line.rate} onChange={(e) => setLine({ ...line, rate: e.target.value })} placeholder="Rate" className={`${inputCls} col-span-2`} />
          <button
            type="button"
            onClick={() => {
              if (line.product) {
                const p = products.find((x) => (x._id || x.id) === line.product);
                setLines([...lines, { ...line, name: p?.name, sku: p?.sku, qty: Number(line.qty), rate: Number(line.rate) }]);
                setLine({ product: '', qty: 1, rate: 0, location: '' });
              }
            }}
            className="col-span-2 rounded-xl bg-slate-200 dark:bg-white/15 font-bold hover:bg-slate-300 transition"
          >
            +
          </button>
        </div>
        <select value={line.location} onChange={(e) => setLine({ ...line, location: e.target.value })} className={`${inputCls} mt-2`}>
          <option value="">{retail.po.fLoc}</option>
          {locations.map((l) => <option key={l._id} value={l._id}>{l.code} ({l.occupied}/{l.capacity})</option>)}
        </select>
        <ul className="mt-2 space-y-1.5 text-sm">
          {lines.map((l, i) => (
            <li key={i} data-testid="po-line" className="flex justify-between items-center bg-slate-50 dark:bg-white/5 rounded-xl px-3 py-2 border border-slate-200/60 dark:border-white/10">
              <div className="flex flex-col">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{l.name || l.sku || 'Product'}</span>
                <span className="font-mono text-xs text-slate-400">{l.sku}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold font-mono text-blue-600 dark:text-blue-400">× {l.qty} @ ₹{l.rate}</span>
                <button type="button" onClick={() => setLines(lines.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1">✕</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <button data-testid="po-create" className="rounded-xl bg-blue-600 text-white text-sm font-bold px-5 py-2.5">{retail.po.create}</button>
    </form>
  );
}

export default function Purchases() {
  const [items, setItems] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [drawer, setDrawer] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canWrite = ['admin', 'warehouse_staff'].includes(user.role);

  async function load() {
    const [{ data }, { data: v }, { data: p }] = await Promise.all([
      api.get('/purchases'), api.get('/vendors?limit=100'), api.get('/products?limit=100')
    ]);
    setItems(data.items); setVendors(v.items); setProducts(p.items);
  }
  useEffect(() => { load(); }, []);

  async function receiveAll(po) {
    try {
      await api.post(`/purchases/${po._id}/receive`, {});
      toast.success(retail.po.receivedMsg);
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Something went wrong. Please try again.'); }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title={retail.po.title} sub={retail.po.sub}
        action={canWrite && vendors.length > 0 && <button onClick={() => setDrawer(true)} data-testid="po-add" className="text-sm font-bold bg-blue-600 text-white rounded-xl px-4 py-2">{retail.po.add}</button>} />
      {canWrite && vendors.length === 0 && items && (
        <div className="mb-3 text-sm bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Add a <Link to="/vendors" className="font-bold text-blue-600">vendor</Link> first, then raise purchase orders.
        </div>
      )}
      {!items ? <Skeleton rows={5} /> : items.length === 0 ? (
        <Empty title={retail.po.emptyT} text={retail.po.emptyD} />
      ) : (
        <div className="bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <caption className="sr-only">Purchase orders</caption>
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase text-slate-500">
              <tr>{retail.po.cols.map((c) => <th key={c} className="p-3">{c}</th>)}</tr>
            </thead>
            <tbody>
              {items.map((po) => (
                <tr key={po._id} data-testid="po-row" className="border-t hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="p-3 font-mono font-bold">{po.poNo}</td>
                  <td className="p-3">{po.vendor?.name}</td>
                  <td className="p-3 tnum">{po.items.reduce((s, i) => s + i.qty, 0)} ({po.items.filter((i) => i.receivedQty >= i.qty).length}/{po.items.length} received)</td>
                  <td className="p-3"><Badge tone={TONE[po.status]}>{po.status}</Badge></td>
                  <td className="p-3">{new Date(po.createdAt).toLocaleDateString('en-GB')}</td>
                  <td className="p-3">{po.receivedAt ? new Date(po.receivedAt).toLocaleDateString('en-GB') : '—'}</td>
                  <td className="p-3">
                    {canWrite && !['Received', 'Cancelled'].includes(po.status) && (
                      <button onClick={() => receiveAll(po)} data-testid={`po-receive-${po.poNo}`} className="text-xs font-bold text-blue-600">{retail.po.receiveAll}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Drawer open={drawer} onClose={() => setDrawer(false)} title={retail.po.add} wide>
        <POForm vendors={vendors} products={products} onDone={() => { setDrawer(false); load(); }} />
      </Drawer>
    </div>
  );
}
