import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import en from '../content/en';
import { dt, inr, num } from '../lib/format';
import { Badge, PageHeader, Skeleton } from '../components/ui';

export default function ProductDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    api.get(`/products/${id}`).then((r) => setData(r.data));
  }, [id]);

  if (!data) return <div className="max-w-7xl mx-auto"><PageHeader title="…" /><Skeleton rows={6} /></div>;
  const { product: p, movements } = data;
  const badge = p.status === 'inactive' ? ['grey', en.products.badges.inactive] : p.availableQuantity <= 0 ? ['red', en.products.badges.out] : p.lowStock ? ['amber', en.products.badges.low] : ['green', en.products.badges.in];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title={p.name} sub={`${p.sku} · ${p.category}`} crumb={`Products / ${p.sku}`}
        action={<Link to="/products" className="text-sm font-semibold rounded-xl border px-4 py-2">{en.common.back}</Link>} />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {[['Available', `${num(p.availableQuantity)} ${p.unit}`, 'green'], ['On hand', `${num(p.totalQuantity)}`, 'slate'], ['Damaged', `${num(p.damagedQuantity)}`, 'red'], ['Reserved', `${num(p.reservedQuantity)}`, 'amber'], ['Stock value', inr(p.totalQuantity * p.costPrice), 'violet']].map(([l, v, t]) => (
          <div key={l} className="bg-white dark:bg-slate-900 border rounded-2xl p-4">
            <div className="text-xl font-extrabold tnum">{v}</div>
            <div className="text-xs text-slate-500">{l}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-1 border-b border-slate-200 dark:border-white/10 mb-4">
        {en.products.tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={`text-sm font-semibold px-4 py-2 border-b-2 -mb-px transition ${tab === i ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>{t}</button>
        ))}
      </div>
      {tab === 0 && (
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 text-sm grid md:grid-cols-2 gap-x-8 gap-y-3">
          {[['SKU', p.sku], ['Barcode', p.barcode || '—'], ['Category', p.category], ['Unit', p.unit], ['Cost price', inr(p.costPrice)], ['Selling price', inr(p.sellingPrice)], ['Reorder level', p.reorderLevel], ['Default location', p.defaultLocationId?.code || '—'], ['Status', ''], ['Description', p.description || '—']].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-2">
              <span className="text-slate-500">{k}</span>
              {k === 'Status' ? <Badge tone={badge[0]}>{badge[1]}</Badge> : <span className="font-semibold text-right">{v}</span>}
            </div>
          ))}
        </div>
      )}
      {tab === 1 && (
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 text-sm">
          <p>Default storage: <span className="font-mono font-bold">{p.defaultLocationId?.code || '—'}</span></p>
          <p className="text-slate-500 mt-1" title={en.tips.avail}>{en.tips.avail}</p>
        </div>
      )}
      {tab === 2 && (
        <div className="bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <caption className="sr-only">Stock movements</caption>
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Date & Time</th><th className="p-3">Type</th><th className="p-3">Quantity</th><th className="p-3">Reference</th><th className="p-3">By</th></tr></thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m._id} className="border-t border-slate-100 dark:border-white/5">
                  <td className="p-3">{dt(m.createdAt)}</td><td className="p-3">{m.type}</td>
                  <td className="p-3 tnum font-bold">{m.quantity}</td><td className="p-3 font-mono">{m.reference || '—'}</td>
                  <td className="p-3">{m.performedBy?.name || '—'}</td>
                </tr>
              ))}
              {movements.length === 0 && <tr><td className="p-3 text-slate-400" colSpan={5}>No movements yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {tab === 3 && (
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 text-sm text-slate-500">
          Full per-product activity stream lives in Stock Movements (filtered by this product) — ledger entries above are the source of truth. {en.movements.locked}
        </div>
      )}
    </div>
  );
}
