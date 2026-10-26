import { useEffect, useState } from 'react';
import api from '../lib/api';
import en from '../content/en';
import { dt } from '../lib/format';
import { Badge, PageHeader, Skeleton } from '../components/ui';

const TONE = { INWARD: 'green', OUTWARD: 'blue', TRANSFER: 'violet', DAMAGED: 'red', ADJUSTMENT: 'grey' };

export default function Movements() {
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [f, setF] = useState({ type: '', page: 1 });

  useEffect(() => {
    api.get(`/movements?type=${f.type}&page=${f.page}&limit=30`).then((r) => {
      setItems(r.data.items); setTotal(r.data.total); setPages(r.data.pages);
    });
  }, [f]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title={en.movements.title} sub={en.movements.sub} />
      <p className="text-xs text-slate-400 mb-3" title={en.tips.ledger}>{en.movements.locked}</p>
      <div className="bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden">
        <div className="flex flex-wrap gap-2 p-3 border-b">
          <select value={f.type} onChange={(e) => setF({ type: e.target.value, page: 1 })} data-testid="movement-type-filter"
            className="text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-transparent px-3 py-2">
            <option value="">{en.movements.filters[0]}: All</option>
            {['INWARD', 'OUTWARD', 'TRANSFER', 'DAMAGED', 'ADJUSTMENT'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {(f.type) && <button onClick={() => setF({ type: '', page: 1 })} className="text-sm text-slate-500">{en.common.resetFilters}</button>}
          <span className="ml-auto text-xs text-slate-400 self-center">{total} entries</span>
        </div>
        {!items ? <Skeleton rows={8} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Stock movements ledger</caption>
              <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase text-slate-500">
                <tr>{en.movements.cols.map((c) => <th key={c} className="p-3">{c}</th>)}</tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m._id} data-testid="movement-row" className="border-t hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="p-3 whitespace-nowrap">{dt(m.createdAt)}</td>
                    <td className="p-3 font-mono">{m.product?.sku}</td>
                    <td className="p-3"><Badge tone={TONE[m.type]}>{m.type}</Badge></td>
                    <td className="p-3 font-bold tnum">{m.quantity}</td>
                    <td className="p-3 font-mono">{m.fromLocation?.code || '—'}</td>
                    <td className="p-3 font-mono">{m.toLocation?.code || '—'}</td>
                    <td className="p-3 font-mono">{m.reference || '—'}</td>
                    <td className="p-3">{m.performedBy?.name || '—'}</td>
                    <td className="p-3 text-slate-500 max-w-48 truncate">{m.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center p-3 text-sm border-t">
          <span className="text-slate-500">{total} entries</span>
          <div className="ml-auto flex gap-1">
            <button disabled={f.page <= 1} onClick={() => setF({ ...f, page: f.page - 1 })} className="px-3 py-1.5 rounded-lg border disabled:opacity-40">‹</button>
            <span className="px-2 py-1.5">{f.page} / {pages}</span>
            <button disabled={f.page >= pages} onClick={() => setF({ ...f, page: f.page + 1 })} className="px-3 py-1.5 rounded-lg border disabled:opacity-40">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
