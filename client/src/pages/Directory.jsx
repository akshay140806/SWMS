import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { Drawer, Empty, Field, PageHeader, Skeleton, inputCls } from '../components/ui';

// Generic people directory (Customers / Vendors).
export default function Directory({ kind }) {
  const isCust = kind === 'customer';
  const T = isCust
    ? { title: 'Customers', sub: 'Everyone you sell to.', add: '+ New Customer', empty: 'No customers yet. Add your first buyer to start taking orders.', base: '/customers' }
    : { title: 'Vendors', sub: 'Everyone you buy stock from.', add: '+ New Vendor', empty: 'No vendors yet. Add a supplier to raise purchase orders.', base: '/vendors' };
  const [items, setItems] = useState(null);
  const [q, setQ] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', gstin: '' });

  async function load() {
    const { data } = await api.get(`${T.base}?q=${encodeURIComponent(q)}`);
    setItems(data.items);
  }
  useEffect(() => { load(); }, [q]);

  async function save(e) {
    e.preventDefault();
    try {
      await api.post(T.base, form);
      toast.success('Changes saved.');
      setDrawer(false); setForm({ name: '', phone: '', email: '', address: '', gstin: '' }); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Something went wrong. Please try again.'); }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title={T.title} sub={T.sub}
        action={<button onClick={() => setDrawer(true)} data-testid={`add-${kind}-btn`} className="text-sm font-bold bg-blue-600 text-white rounded-xl px-4 py-2 hover:bg-blue-500 transition">{T.add}</button>} />
      <div className="bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden">
        <div className="p-3 border-b">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone" className="text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-transparent px-3 py-2 w-64" />
        </div>
        {!items ? <Skeleton rows={5} /> : items.length === 0 ? (
          <Empty title={T.title} text={T.empty} action={<button onClick={() => setDrawer(true)} className="text-sm font-bold bg-blue-600 text-white rounded-xl px-4 py-2">{T.add}</button>} />
        ) : (
          <table className="w-full text-sm">
            <caption className="sr-only">{T.title}</caption>
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase text-slate-500">
              <tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Email</th><th className="p-3">Address</th></tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id} data-testid={`${kind}-row`} className="border-t hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="p-3 font-semibold">{p.name}</td>
                  <td className="p-3">{p.phone || '—'}</td>
                  <td className="p-3">{p.email || '—'}</td>
                  <td className="p-3 text-slate-500 truncate max-w-64">{p.address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title={T.add}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} required data-testid={`${kind}-name`} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone number"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></Field>
            <Field label="Email address"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></Field>
          </div>
          <Field label="Address"><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} rows={2} /></Field>
          <Field label="GSTIN"><input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} className={inputCls} /></Field>
          <button className="rounded-xl bg-blue-600 text-white text-sm font-bold px-5 py-2.5">Save</button>
        </form>
      </Drawer>
    </div>
  );
}
