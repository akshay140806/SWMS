import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import en from '../content/en';
import { PageHeader, Skeleton } from '../components/ui';

export default function Picking() {
  const [params] = useSearchParams();
  const [orders, setOrders] = useState(null);
  const [sel, setSel] = useState(params.get('order') || '');
  const [list, setList] = useState(null);

  useEffect(() => {
    api.get('/orders?status=Picking').then((r) => setOrders(r.data.items));
  }, []);
  useEffect(() => {
    if (sel) api.get(`/orders/${sel}/picking-list`).then((r) => setList(r.data));
  }, [sel]);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title={en.nav.pickingLists} />
      <div className="flex gap-2 mb-4 no-print">
        <select value={sel} onChange={(e) => setSel(e.target.value)} className="text-sm rounded-xl border bg-transparent px-3 py-2" data-testid="picking-order-select">
          <option value="">Select order…</option>
          {(orders || []).map((o) => <option key={o._id} value={o._id}>{o.orderNo} — {o.customerName}</option>)}
        </select>
        {list && <button onClick={() => window.print()} className="text-sm font-bold border rounded-xl px-4 py-2">{en.orders.printPick}</button>}
      </div>
      {!sel ? <p className="text-sm text-slate-500">Choose an order in Picking status to see its route-sorted list.</p>
        : !list ? <Skeleton rows={5} /> : (
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6">
            <h2 className="font-bold text-lg">{en.orders.pickTitle(list.orderNo)}</h2>
            <p className="text-xs text-slate-500 mb-4">{en.orders.pickSub}</p>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500"><tr>{en.orders.pickCols.map((c) => <th key={c} className="py-2">{c}</th>)}</tr></thead>
              <tbody>
                {list.pickingList.map((r, i) => (
                  <tr key={i} className="border-t" data-testid="pick-row">
                    <td className="py-2 font-bold">{i + 1}</td>
                    <td className="py-2 font-mono font-bold">{r.location}</td>
                    <td className="py-2">{r.name}</td>
                    <td className="py-2 font-mono">{r.sku}</td>
                    <td className="py-2 tnum">{r.qty}</td>
                    <td className="py-2">☐</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 no-print"><Link to={`/orders/${sel}`} className="text-sm font-bold bg-blue-600 text-white rounded-xl px-4 py-2">{en.orders.markAllPicked}</Link></div>
          </div>
        )}
    </div>
  );
}
