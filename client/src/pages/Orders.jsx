import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import en from '../content/en';
import { dOnly } from '../lib/format';
import { Badge, Drawer, Empty, Field, PageHeader, Skeleton, inputCls } from '../components/ui';

const TONE = { Created: 'grey', Picking: 'amber', Picked: 'violet', Dispatched: 'blue', Delivered: 'green', Cancelled: 'red' };
const FLOW = ['Created', 'Picking', 'Picked', 'Dispatched', 'Delivered'];

function OrderForm({ products, customers: initialCustomers = [], onDone }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [selectedCustId, setSelectedCustId] = useState('');
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({ defaultValues: { customerId: '', customerName: '', customerPhone: '', deliveryAddress: '', instructions: '', items: [] } });
  const [lines, setLines] = useState([]);
  const [line, setLine] = useState({ productId: '', qty: 1 });
  const [avail, setAvail] = useState({});

  useEffect(() => {
    if (!initialCustomers || !initialCustomers.length) {
      api.get('/customers?limit=100').then((r) => setCustomers(r.data.items || [])).catch(() => {});
    } else {
      setCustomers(initialCustomers);
    }
  }, [initialCustomers]);

  function handleSelectCustomer(custId) {
    setSelectedCustId(custId);
    if (!custId) {
      setValue('customerId', '');
      return;
    }
    if (custId === '__manual__') {
      setValue('customerId', '');
      setValue('customerName', '');
      setValue('customerPhone', '');
      setValue('deliveryAddress', '');
      return;
    }
    const cust = customers.find((c) => (c._id || c.id) === custId);
    if (cust) {
      setValue('customerId', cust._id || cust.id);
      setValue('customerName', cust.name || '', { shouldValidate: true });
      setValue('customerPhone', cust.phone || '', { shouldValidate: true });
      setValue('deliveryAddress', cust.address || '', { shouldValidate: true });
      toast.success(en.orders.customerAutoFilled ? en.orders.customerAutoFilled(cust.name) : `Customer details auto-filled for ${cust.name}`);
    }
  }

  async function addLine() {
    if (!line.productId) return;
    const { data } = await api.get(`/products/${line.productId}`);
    const p = data.product;
    if (p.availableQuantity < Number(line.qty)) {
      toast.error(en.orders.short(p.availableQuantity));
      return;
    }
    setAvail({ ...avail, [line.productId]: p.availableQuantity });
    setLines([...lines, { productId: line.productId, qty: Number(line.qty), sku: p.sku, name: p.name, unit: p.unit }]);
    setLine({ productId: '', qty: 1 });
  }

  async function submit(v) {
    if (!lines.length) return toast.error(en.valid.required);
    try {
      const { data } = await api.post('/orders', {
        customerId: v.customerId || undefined,
        customerName: v.customerName,
        customerPhone: v.customerPhone,
        deliveryAddress: v.deliveryAddress,
        instructions: v.instructions,
        items: lines.map((l) => ({ productId: l.productId, qty: l.qty }))
      });
      toast.success(en.toasts.orderCreated(data.orderNo));
      onDone(data);
    } catch (e) {
      toast.error(e.response?.data?.error || en.toasts.err);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {en.orders.fCustomerSelect || 'Select Customer'}
          </label>
          <Link to="/customers" target="_blank" className="text-xs text-blue-600 hover:underline">
            + New Customer ↗
          </Link>
        </div>
        <select
          value={selectedCustId}
          onChange={(e) => handleSelectCustomer(e.target.value)}
          className={inputCls}
          data-testid="order-customer-select"
        >
          <option value="">{en.orders.fCustomerSelectPh || '— Select Customer to Auto-fill Details —'}</option>
          {customers.map((c) => (
            <option key={c._id || c.id} value={c._id || c.id}>
              {c.name} {c.phone ? `(${c.phone})` : ''} {c.address ? `· ${c.address.slice(0, 30)}...` : ''}
            </option>
          ))}
          <option value="__manual__">{en.orders.fCustomerManual || '+ Enter New / Walk-in Customer'}</option>
        </select>
        {customers.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {en.orders.noCustomersHint || 'No saved customers yet. Type details below or add them in Customers.'}
          </p>
        )}
        {selectedCustId && selectedCustId !== '__manual__' && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ Details automatically fetched from customer profile
          </p>
        )}
      </div>

      <Field label={en.orders.fCustomer} error={errors.customerName?.message}>
        <input
          {...register('customerName', { required: en.valid.required })}
          className={inputCls}
          placeholder="Customer name"
          data-testid="order-customer"
        />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label={en.orders.fPhone}>
          <input
            {...register('customerPhone')}
            className={inputCls}
            placeholder="Phone number"
            data-testid="order-phone"
          />
        </Field>
        <Field label={en.orders.fAddress}>
          <textarea
            {...register('deliveryAddress')}
            className={inputCls}
            rows={1}
            placeholder="Delivery address"
            data-testid="order-address"
          />
        </Field>
      </div>
      <div>
        <label className="text-xs font-semibold">{en.orders.fItems}</label>
        <div className="flex gap-2 mt-1">
          <select value={line.productId} onChange={(e) => setLine({ ...line, productId: e.target.value })} className={inputCls} data-testid="order-product">
            <option value="">— Select Product to Add —</option>
            {products.map((p) => (
              <option key={p._id || p.id} value={p._id || p.id}>
                {p.name} · {p.sku} ({p.availableQuantity ?? 0} {p.unit || ''} avail)
              </option>
            ))}
          </select>
          <input type="number" min={1} value={line.qty} onChange={(e) => setLine({ ...line, qty: e.target.value })} className={`${inputCls} w-20`} data-testid="order-qty" />
          <button type="button" onClick={addLine} className="px-3 rounded-xl bg-slate-200 dark:bg-white/15 font-bold hover:bg-slate-300 transition">+</button>
        </div>
        <ul className="mt-2 space-y-1.5 text-sm">
          {lines.map((l, i) => (
            <li key={i} data-testid="order-line" className="flex justify-between items-center bg-slate-50 dark:bg-white/5 rounded-xl px-3 py-2 border border-slate-200/60 dark:border-white/10">
              <div className="flex flex-col">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{l.name || l.sku}</span>
                <span className="font-mono text-xs text-slate-400">{l.sku}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold font-mono text-blue-600 dark:text-blue-400">× {l.qty} {l.unit || ''}</span>
                <button type="button" onClick={() => setLines(lines.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">✕</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Field label={en.orders.fInstr}><input {...register('instructions')} className={inputCls} /></Field>
      <button data-testid="order-create-submit" disabled={isSubmitting} className="rounded-xl bg-blue-600 text-white text-sm font-bold px-5 py-2.5 hover:bg-blue-500 transition disabled:opacity-60">{en.orders.create}</button>
    </form>
  );
}

export default function Orders({ history = false }) {
  const [params] = useSearchParams();
  const [view, setView] = useState('table');
  const [items, setItems] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [status, setStatus] = useState(history ? 'Dispatched' : '');
  const [q, setQ] = useState('');
  const [drawer, setDrawer] = useState(false);
  const dragRef = useRef(null); // ref (not state): drop must read the id synchronously
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canDispatch = ['admin', 'dispatch_staff'].includes(user.role);

  async function load() {
    const url = history ? `/orders/history?status=${status}` : `/orders?status=${status}&q=${encodeURIComponent(q)}`;
    const [{ data }, { data: p }, { data: c }] = await Promise.all([
      api.get(url),
      api.get('/products?limit=100'),
      api.get('/customers?limit=100').catch(() => ({ data: { items: [] } }))
    ]);
    setItems(data.items);
    setProducts(p.items);
    setCustomers(c.items || []);
  }
  useEffect(() => { load(); }, [status, q]);
  useEffect(() => { if (params.get('action') === 'new') setDrawer(true); }, []);

  async function dropTo(orderId, to) {
    try {
      const map = { Picking: 'to-picking', Picked: 'to-picked', Dispatched: 'dispatch', Delivered: 'to-delivered' };
      if (!map[to]) return;
      await api.post(`/orders/${orderId}/${map[to]}`, {});
      toast.success(en.toasts.saved);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || en.toasts.err);
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title={history ? en.orders.histT : en.orders.title} sub={history ? en.orders.histS : en.orders.sub}
        action={
          <div className="flex gap-2">
            {!history && (
              <div className="flex rounded-xl border border-slate-300 dark:border-white/15 text-sm overflow-hidden">
                {en.orders.views.map((v) => (
                  <button key={v} onClick={() => setView(v === 'Table' ? 'table' : 'board')}
                    className={`px-3 py-2 font-semibold ${(view === 'table') === (v === 'Table') ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : ''}`}>{v}</button>
                ))}
              </div>
            )}
            {canDispatch && !history && <button onClick={() => setDrawer(true)} data-testid="new-order-btn" className="text-sm font-bold bg-blue-600 text-white rounded-xl px-4 py-2 hover:bg-blue-500 transition shadow-sm">{en.orders.add}</button>}
          </div>
        }
      />
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order no. / customer" className="text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-transparent px-3 py-2 w-64" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="text-sm rounded-xl border bg-transparent px-3 py-2">
          <option value="">All statuses</option>
          {(history ? ['Dispatched', 'Delivered', 'Cancelled'] : en.orders.statuses).map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {!items ? <Skeleton rows={6} /> : items.length === 0 ? (
        <Empty title={en.orders.emptyT} text={en.orders.emptyD} action={canDispatch && !history && <button onClick={() => setDrawer(true)} className="text-sm font-bold bg-blue-600 text-white rounded-xl px-4 py-2">{en.orders.emptyB}</button>} />
      ) : view === 'table' || history ? (
        <div className="bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <caption className="sr-only">Orders</caption>
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase text-slate-500">
              <tr>{en.orders.cols.map((c) => <th key={c} className="p-3">{c}</th>)}</tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o._id} data-testid="order-row" className="border-t hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="p-3"><Link to={`/orders/${o._id}`} className="font-mono font-bold text-blue-600">{o.orderNo}</Link></td>
                  <td className="p-3">{o.customerName}</td>
                  <td className="p-3 tnum">{o.items.length}</td>
                  <td className="p-3 tnum">{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td className="p-3"><Badge tone={TONE[o.status]}>{o.status}</Badge></td>
                  <td className="p-3">{dOnly(o.createdAt)}</td>
                  <td className="p-3">{o.dispatchedAt ? dOnly(o.dispatchedAt) : '—'}</td>
                  <td className="p-3"><Link to={`/orders/${o._id}`} className="text-blue-600 text-xs font-semibold">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid md:grid-cols-5 gap-3">
          {FLOW.map((st) => (
            <div key={st} onDragOver={(e) => e.preventDefault()} onDrop={() => dragRef.current && dropTo(dragRef.current, st)}
              data-testid={`kanban-${st}`}
              className="bg-slate-200/60 dark:bg-white/5 rounded-2xl p-2 min-h-64">
              <h4 className="text-xs font-bold uppercase text-slate-500 px-2 py-1">{st} ({items.filter((o) => o.status === st).length})</h4>
              <div className="space-y-2">
                {items.filter((o) => o.status === st).map((o) => (
                  <div key={o._id} draggable={canDispatch} onDragStart={() => { dragRef.current = o._id; }}
                    data-testid={`kanban-card-${o.orderNo}`}
                    className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm cursor-grab active:cursor-grabbing active:shadow-xl transition">
                    <Link to={`/orders/${o._id}`} className="font-mono text-sm font-bold text-blue-600">{o.orderNo}</Link>
                    <div className="text-xs text-slate-500 truncate">{o.customerName}</div>
                    <div className="text-xs tnum">{o.items.reduce((s, i) => s + i.qty, 0)} units</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer open={drawer} onClose={() => setDrawer(false)} title={en.orders.add} wide>
        <OrderForm products={products} customers={customers} onDone={() => { setDrawer(false); load(); }} />
      </Drawer>
    </div>
  );
}
