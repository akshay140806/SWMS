import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import retail from '../content/retail';
import { inr, dt } from '../lib/format';
import { Badge, Empty, PageHeader, Skeleton } from '../components/ui';

const TONE = { Unpaid: 'amber', Paid: 'green', Cancelled: 'red' };

export default function Invoices() {
  const [items, setItems] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canWrite = ['admin', 'dispatch_staff'].includes(user.role);

  async function load() {
    const [{ data }, { data: o }] = await Promise.all([
      api.get('/invoices'),
      api.get('/orders?status=Dispatched')
    ]);
    setItems(data.items);
    const o2 = await api.get('/orders?status=Delivered').then((r) => r.data.items);
    setOrders([...o.items, ...o2]);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!orderId) return toast.error('This field is required.');
    try {
      const { data } = await api.post('/invoices/from-order', { orderId, taxRate: 18 });
      toast.success(`Invoice ${data.invoiceNo} created.`);
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Something went wrong. Please try again.'); }
  }

  async function pay(id) {
    await api.post(`/invoices/${id}/pay`, {});
    toast.success('Changes saved.');
    load();
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title={retail.inv.title} sub={retail.inv.sub} />
      {canWrite && (
        <div className="flex gap-2 mb-4 no-print">
          <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className="text-sm rounded-xl border bg-transparent px-3 py-2" data-testid="invoice-order">
            <option value="">{retail.inv.fromOrder}…</option>
            {orders.map((o) => <option key={o._id} value={o._id}>{o.orderNo} — {o.customerName}</option>)}
          </select>
          <button onClick={create} data-testid="invoice-create" className="text-sm font-bold bg-blue-600 text-white rounded-xl px-4 py-2">{retail.inv.create}</button>
        </div>
      )}
      {!items ? <Skeleton rows={5} /> : items.length === 0 ? (
        <Empty title={retail.inv.emptyT} text={retail.inv.emptyD} />
      ) : (
        <div className="bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <caption className="sr-only">Invoices</caption>
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase text-slate-500">
              <tr>{retail.inv.cols.map((c) => <th key={c} className="p-3">{c}</th>)}</tr>
            </thead>
            <tbody>
              {items.map((inv) => (
                <tr key={inv._id} data-testid="invoice-row" className="border-t hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="p-3"><Link to={`/invoices/${inv._id}`} className="font-mono font-bold text-blue-600">{inv.invoiceNo}</Link></td>
                  <td className="p-3 font-mono">{inv.order?.orderNo || '—'}</td>
                  <td className="p-3">{inv.customerName}</td>
                  <td className="p-3 font-bold tnum">{inr(inv.grandTotal)}</td>
                  <td className="p-3"><Badge tone={TONE[inv.status]}>{inv.status}</Badge></td>
                  <td className="p-3">{dt(inv.createdAt)}</td>
                  <td className="p-3">{inv.status === 'Unpaid' && canWrite && <button onClick={() => pay(inv._id)} className="text-xs font-bold text-emerald-600">{retail.inv.pay}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
