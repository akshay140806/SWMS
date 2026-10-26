import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import en from '../content/en';
import { dt } from '../lib/format';
import { Badge, Confirm, PageHeader, Skeleton, Field, inputCls } from '../components/ui';

const TONE = { Created: 'grey', Picking: 'amber', Picked: 'violet', Dispatched: 'blue', Delivered: 'green', Cancelled: 'red' };

export default function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [order, setOrder] = useState(null);
  const [picking, setPicking] = useState(null);
  const [confirm, setConfirm] = useState(null); // 'dispatch' | 'cancel' | null
  const [disp, setDisp] = useState({ carrier: '', trackingNo: '', dispatchNotes: '' });
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canDispatch = ['admin', 'dispatch_staff'].includes(user.role);

  async function load() {
    const { data } = await api.get(`/orders/${id}`);
    setOrder(data);
  }
  useEffect(() => { load(); }, [id]);

  async function act(path, okMsg) {
    try {
      const { data } = await api.post(`/orders/${id}/${path}`, path === 'dispatch' ? disp : {});
      toast.success(okMsg || en.toasts.saved);
      setConfirm(null);
      if (data.orderNo) setOrder(await api.get(`/orders/${id}`).then((r) => r.data));
      else load();
    } catch (e) {
      toast.error(e.response?.data?.error || en.toasts.err);
    }
  }

  async function genPick() {
    try {
      const { data } = await api.post(`/orders/${id}/to-picking`, {});
      setPicking(data.pickingList);
      toast.success(en.toasts.saved);
      load();
    } catch (e) { toast.error(e.response?.data?.error || en.toasts.err); }
  }

  async function pack() {
    try {
      const { data } = await api.post(`/orders/${id}/pack`, {});
      toast.success(`Packed as ${data.packageNo}.`);
    } catch (e) { toast.error(e.response?.data?.error || 'Something went wrong. Please try again.'); }
  }

  if (!order) return <div className="max-w-5xl mx-auto"><PageHeader title="…" /><Skeleton rows={6} /></div>;
  const stepIdx = en.orders.stepper.findIndex((s) => s.toLowerCase().replace('order created', 'created') === order.status.toLowerCase());

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title={order.orderNo} sub={`${order.customerName} · ${order.customerPhone}`} crumb={`Orders / ${order.orderNo}`}
        action={<Link to="/orders" className="text-sm font-semibold rounded-xl border px-4 py-2">{en.common.back}</Link>} />
      <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Badge tone={TONE[order.status]} data-testid="order-status">{order.status}</Badge>
          <span className="text-xs text-slate-400 ml-auto">{dt(order.createdAt)}</span>
        </div>
        {order.status !== 'Cancelled' && (
          <ol className="flex items-center gap-0 mb-5" data-testid="order-stepper">
            {en.orders.stepper.map((s, i) => (
              <li key={s} className="flex-1 flex items-center last:flex-none">
                <div className="flex flex-col items-center gap-1 w-full">
                  <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${i <= stepIdx ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500'}`}>{i + 1}</span>
                  <span className={`text-[11px] text-center ${i <= stepIdx ? 'font-bold' : 'text-slate-400'}`}>{s}</span>
                </div>
                {i < en.orders.stepper.length - 1 && <div className={`h-0.5 flex-1 -mt-6 mx-1 ${i < stepIdx ? 'bg-blue-600' : 'bg-slate-200 dark:bg-white/10'}`} />}
              </li>
            ))}
          </ol>
        )}
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-2">Product</th><th className="py-2">Qty</th><th className="py-2">Location</th></tr></thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={i} className="border-t">
                <td className="py-2 font-mono">{it.product?.sku || it.product} — {it.product?.name || ''}</td>
                <td className="py-2 tnum font-bold">{it.qty}</td>
                <td className="py-2 font-mono">{it.location || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {order.deliveryAddress && <p className="text-sm text-slate-500 mt-3">📍 {order.deliveryAddress}</p>}
        {order.instructions && <p className="text-sm text-slate-500">📝 {order.instructions}</p>}
        {order.carrier && <p className="text-sm text-slate-500">🚚 {order.carrier} · {order.trackingNo}</p>}
      </div>

      {canDispatch && (
        <div className="flex flex-wrap gap-2 no-print">
          {(order.status === 'Created') && <button onClick={genPick} data-testid="gen-pick" className="text-sm font-bold bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl px-4 py-2">{en.orders.genPick}</button>}
          {['Picking'].includes(order.status) && <button onClick={() => act('to-picked')} data-testid="mark-picked" className="text-sm font-bold bg-violet-600 text-white rounded-xl px-4 py-2">{en.orders.markPicked}</button>}
          {order.status === 'Picked' && <button onClick={pack} data-testid="pack-order" className="text-sm font-bold bg-amber-500 text-white rounded-xl px-4 py-2">Pack Items</button>}
          {['Created', 'Picking', 'Picked'].includes(order.status) && <button onClick={() => setConfirm('dispatch')} data-testid="mark-dispatched" className="text-sm font-bold bg-blue-600 text-white rounded-xl px-4 py-2">{en.orders.markDispatched}</button>}
          {order.status === 'Dispatched' && <button onClick={() => act('to-delivered')} className="text-sm font-bold bg-emerald-600 text-white rounded-xl px-4 py-2">{en.orders.markDelivered}</button>}
          {['Created', 'Picking', 'Picked'].includes(order.status) && <button onClick={() => setConfirm('cancel')} className="text-sm font-bold border border-red-300 text-red-600 rounded-xl px-4 py-2">{en.orders.cancelOrder}</button>}
          <button onClick={() => window.print()} className="text-sm font-semibold border rounded-xl px-4 py-2">{en.orders.print}</button>
          <Link to={`/picking?order=${order._id}`} className="text-sm font-semibold border rounded-xl px-4 py-2">{en.orders.pickTitle('')}</Link>
        </div>
      )}

      {picking && (
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 mt-4">
          <h3 className="font-bold mb-1">{en.orders.pickTitle(order.orderNo)}</h3>
          <p className="text-xs text-slate-500 mb-3">{en.orders.pickSub}</p>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500"><tr>{en.orders.pickCols.map((c) => <th key={c} className="py-2">{c}</th>)}</tr></thead>
            <tbody>
              {picking.map((r, i) => (
                <tr key={i} className="border-t"><td className="py-2 font-bold">{i + 1}</td><td className="py-2 font-mono">{r.location}</td><td className="py-2">{r.name}</td><td className="py-2 font-mono">{r.sku}</td><td className="py-2 tnum">{r.qty}</td><td className="py-2">☐</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Confirm open={confirm === 'dispatch'} title={en.orders.dispTitle} text={en.orders.dispText(order.orderNo)} confirmLabel={en.orders.dispConfirm}
        onConfirm={() => act('dispatch', en.toasts.orderDisp(order.orderNo))} onCancel={() => setConfirm(null)} />
      <Confirm open={confirm === 'cancel'} title={`Cancel order ${order.orderNo}?`} text={en.orders.cancelD} confirmLabel={en.orders.cancelOrder} danger
        onConfirm={async () => { await act('cancel', en.toasts.orderCancel); nav('/orders'); }} onCancel={() => setConfirm(null)} />
      {confirm === 'dispatch' && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-end justify-center pb-24">
          <div className="pointer-events-auto bg-white dark:bg-slate-800 border rounded-2xl shadow-2xl p-4 grid grid-cols-3 gap-2 w-full max-w-lg mx-4">
            <Field label={en.orders.fCarrier}><input value={disp.carrier} onChange={(e) => setDisp({ ...disp, carrier: e.target.value })} className={inputCls} /></Field>
            <Field label={en.orders.fTracking}><input value={disp.trackingNo} onChange={(e) => setDisp({ ...disp, trackingNo: e.target.value })} className={inputCls} /></Field>
            <Field label={en.orders.fDispNotes}><input value={disp.dispatchNotes} onChange={(e) => setDisp({ ...disp, dispatchNotes: e.target.value })} className={inputCls} /></Field>
          </div>
        </div>
      )}
    </div>
  );
}
