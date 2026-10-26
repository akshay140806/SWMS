import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import en from '../content/en';
import { Field, PageHeader, inputCls } from '../components/ui';

function OpForm({ kind, products, locations, onDone }) {
  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm({ defaultValues: { reason: en.stock.dmgReasons[0] } });
  const pid = watch('productId');
  const [avail, setAvail] = useState(null);
  const [scan, setScan] = useState('');

  useEffect(() => {
    if (!pid) { setAvail(null); return; }
    api.get(`/products/${pid}`).then((r) => setAvail(r.data.product));
  }, [pid]);

  function doScan() {
    const code = scan.trim().toUpperCase();
    if (!code) return;
    const hit = products.find((p) => p.sku === code || (p.barcode || '').toUpperCase() === code);
    if (hit) { setValue('productId', hit._id || hit.id); toast.success(`${hit.sku} selected.`); }
    else toast.error(en.toasts.err);
  }

  async function submit(v) {
    const qty = Number(v.qty);
    if (kind === 'adjust') {
      if (!v.productId) return toast.error(en.valid.required);
      if (!Number.isInteger(qty) || qty < 0) return toast.error(en.valid.qtyPos);
      try {
        await api.post(`/products/${v.productId}/adjust`, { qty, reason: v.reason || 'Stock-taking correction', note: v.note || '' });
        toast.success(en.toasts.saved);
        onDone();
      } catch (e) {
        toast.error(e.response?.data?.error || en.toasts.err);
      }
      return;
    }
    if (!qty || qty <= 0) return toast.error(en.valid.qtyPos);
    try {
      const map = { inward: 'inward', outward: 'outward', transfer: 'transfer', damaged: 'damage' };
      const url = v.productId ? `/products/${v.productId}/${map[kind]}` : `/products/${map[kind]}`;
      const body = { qty, productId: v.productId || undefined, locationId: v.locationId || undefined, fromLocationId: v.fromLocationId || undefined, toLocationId: v.toLocationId || undefined, reference: v.reference || '', reason: v.reason || '', note: v.note || '' };
      const { data } = await api.post(url, body);
      if (kind === 'inward') toast.success(en.toasts.inward(qty, data.unit, data.defaultLocationId?.code || ''));
      else if (kind === 'outward') toast.success(en.toasts.outward);
      else if (kind === 'transfer') toast.success(en.toasts.transfer(v.fromLocationId, v.toLocationId));
      else toast.success('Damage flagged.');
      onDone();
    } catch (e) {
      toast.error(e.response?.data?.error || en.toasts.err);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4 bg-white dark:bg-slate-900 border rounded-2xl p-5">
      <input value={scan} onChange={(e) => setScan(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), doScan())}
        placeholder={en.stock.scanPh} data-testid="barcode-input" className={inputCls} />
      <Field label={en.stock.fProduct}>
        <select {...register('productId', { required: true })} className={inputCls} data-testid="stock-product">
          <option value="">—</option>
          {products.map((p) => <option key={p._id || p.id} value={p._id || p.id}>{p.sku} — {p.name}</option>)}
        </select>
      </Field>
      {avail && <p className="text-xs text-slate-500">{en.stock.availAt(avail.availableQuantity, avail.unit, avail.defaultLocationId?.code || '—')}</p>}
      <div className="grid md:grid-cols-2 gap-4">
        <Field label={kind === 'adjust' ? 'New stock count' : kind === 'damaged' ? en.stock.fQtyDmg : kind === 'inward' ? en.stock.fQtyIn : en.stock.fQty}>
          <input type="number" {...register('qty', { required: true, min: kind === 'adjust' ? 0 : 1 })} className={inputCls} data-testid="stock-qty" />
        </Field>
        {(kind === 'inward') && (
          <Field label={en.stock.fLoc}>
            <select {...register('locationId')} className={inputCls} data-testid="stock-location">
              <option value="">—</option>
              {locations.map((l) => <option key={l._id} value={l._id}>{l.code} ({l.occupied}/{l.capacity})</option>)}
            </select>
          </Field>
        )}
        {(kind === 'outward') && (
          <Field label={en.stock.fFrom}>
            <select {...register('locationId')} className={inputCls}>
              <option value="">—</option>
              {locations.map((l) => <option key={l._id} value={l._id}>{l.code}</option>)}
            </select>
          </Field>
        )}
        {(kind === 'transfer') && (
          <>
            <Field label={en.stock.fFrom}>
              <select {...register('fromLocationId')} className={inputCls}>
                <option value="">—</option>
                {locations.map((l) => <option key={l._id} value={l._id}>{l.code}</option>)}
              </select>
            </Field>
            <Field label={en.stock.fTo}>
              <select {...register('toLocationId', { required: true })} className={inputCls}>
                <option value="">—</option>
                {locations.map((l) => <option key={l._id} value={l._id}>{l.code} ({l.occupied}/{l.capacity})</option>)}
              </select>
            </Field>
          </>
        )}
        {(kind === 'damaged') && (
          <>
            <Field label={en.stock.fDamageReason}>
              <select {...register('reason')} className={inputCls}>
                {en.stock.dmgReasons.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label={en.stock.fLoc}>
              <select {...register('locationId')} className={inputCls}>
                <option value="">—</option>
                {locations.map((l) => <option key={l._id} value={l._id}>{l.code}</option>)}
              </select>
            </Field>
          </>
        )}
      </div>
      {(kind === 'inward' || kind === 'outward') && (
        <Field label={kind === 'inward' ? en.stock.fSupplier : en.stock.fOrder}>
          <input {...register('reference')} className={inputCls} />
        </Field>
      )}
      <Field label={kind === 'outward' ? en.stock.fReason : en.stock.fNotes}>
        <input {...register(kind === 'outward' ? 'reason' : 'note')} className={inputCls} />
      </Field>
      <p className="text-xs text-slate-400">{en.stock.ledgerNote}</p>
      <button data-testid="stock-in-submit" disabled={isSubmitting} className="rounded-xl bg-blue-600 text-white text-sm font-bold px-5 py-2.5 hover:bg-blue-500 transition disabled:opacity-60 shadow-sm">
        {kind === 'adjust' ? 'Save Adjustment' : [en.stock.inwardB, en.stock.outwardB, en.stock.transferB, en.stock.dmgB][['inward', 'outward', 'transfer', 'damaged'].indexOf(kind)]}
      </button>
    </form>
  );
}

export default function StockOps() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'inward');
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    Promise.all([api.get('/products?limit=100'), api.get('/locations')]).then(([p, l]) => {
      setProducts(p.data.items); setLocations(l.data.items);
    });
  }, [tick]);

  const titles = [[en.stock.inwardT, en.stock.inwardS], [en.stock.outwardT, ''], [en.stock.transferT, ''], [en.stock.dmgT, ''], ['Stock Adjustment', 'Correct the counted quantity. The difference is written to the ledger.']];
  const keys = ['inward', 'outward', 'transfer', 'damaged', 'adjust'];
  const tabLabels = [...en.stock.tabs, 'Adjustment'];

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title={en.stock.title} />
      <div className="flex gap-1 border-b border-slate-200 dark:border-white/10 mb-4">
        {tabLabels.map((t, i) => (
          <button key={t} onClick={() => setTab(keys[i])} data-testid={`stock-tab-${keys[i]}`}
            className={`text-sm font-semibold px-4 py-2 border-b-2 -mb-px transition ${tab === keys[i] ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
            {t}
          </button>
        ))}
      </div>
      <h2 className="font-bold text-lg mb-1">{titles[keys.indexOf(tab)][0]}</h2>
      {titles[keys.indexOf(tab)][1] && <p className="text-sm text-slate-500 mb-3">{titles[keys.indexOf(tab)][1]}</p>}
      <OpForm key={tab + tick} kind={tab} products={products} locations={locations} onDone={() => setTick((t) => t + 1)} />
    </div>
  );
}
