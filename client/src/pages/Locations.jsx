import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import en from '../content/en';
import { Drawer, Empty, Field, PageHeader, Skeleton, inputCls } from '../components/ui';

function heat(loc) {
  if (loc.status === 'blocked') return 'bg-slate-400 dark:bg-slate-600';
  const pct = loc.capacity ? loc.occupied / loc.capacity : 0;
  if (pct >= 1) return 'bg-red-500';
  if (pct >= 0.85) return 'bg-amber-400';
  if (pct > 0) return 'bg-emerald-400';
  return 'bg-slate-200 dark:bg-white/10';
}

export default function Locations() {
  const [items, setItems] = useState(null);
  const [view, setView] = useState('map');
  const [sel, setSel] = useState(null);
  const [contents, setContents] = useState(null);
  const [qr, setQr] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ code: '', zone: 'A', rack: '01', shelf: 'B1', capacity: 100 });
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canWrite = ['admin', 'warehouse_staff'].includes(user.role);

  async function load() {
    const { data } = await api.get('/locations');
    setItems(data.items);
  }
  useEffect(() => { load(); }, []);

  async function open(loc) {
    setSel(loc); setContents(null); setQr(null);
    const [{ data: c }, { data: q }] = await Promise.all([
      api.get(`/locations/${loc._id}/contents`),
      api.get(`/locations/${loc._id}/qr`)
    ]);
    setContents(c.products); setQr(q);
  }

  async function create(e) {
    e.preventDefault();
    try {
      await api.post('/locations', { ...form, capacity: Number(form.capacity) });
      toast.success(en.toasts.saved);
      setShowNew(false); setForm({ code: '', zone: 'A', rack: '01', shelf: 'B1', capacity: 100 }); load();
    } catch (err) { toast.error(err.response?.data?.error || en.toasts.err); }
  }

  const zones = items ? [...new Set(items.map((l) => l.zone))].sort() : [];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title={en.locations.title} sub={en.locations.sub}
        action={
          <div className="flex gap-2">
            <div className="flex rounded-xl border border-slate-300 dark:border-white/15 text-sm overflow-hidden">
              {en.locations.views.map((v, i) => (
                <button key={v} onClick={() => setView(i === 0 ? 'map' : 'list')}
                  className={`px-3 py-2 font-semibold ${((view === 'map') === (i === 0)) ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : ''}`}>
                  {v}
                </button>
              ))}
            </div>
            {canWrite && <button onClick={() => setShowNew(true)} data-testid="add-location-btn" className="text-sm font-bold bg-blue-600 text-white rounded-xl px-4 py-2 hover:bg-blue-500 transition shadow-sm">{en.locations.add}</button>}
          </div>
        }
      />
      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-4">
        {en.locations.legend.map((l, i) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${['bg-slate-200 dark:bg-white/10', 'bg-emerald-400', 'bg-amber-400', 'bg-red-500', 'bg-slate-400'][i]}`} />{l}
          </span>
        ))}
      </div>

      {!items ? <Skeleton rows={6} /> : view === 'map' ? (
        <div className="space-y-5">
          {zones.map((z) => (
            <div key={z} className="bg-white dark:bg-slate-900 border rounded-2xl p-4">
              <h3 className="font-bold mb-3">Zone {z}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2">
                {items.filter((l) => l.zone === z).map((l) => (
                  <button key={l._id} onClick={() => open(l)} title={`${l.code}: ${l.occupied}/${l.capacity}`}
                    data-testid={`bin-${l.code}`}
                    className={`aspect-square rounded-xl ${heat(l)} hover:ring-2 hover:ring-blue-400 text-white text-[11px] font-mono font-bold flex flex-col items-center justify-center shadow-sm transition`}>
                    <span>{l.code}</span>
                    <span className="opacity-80">{l.occupied}/{l.capacity}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <caption className="sr-only">Storage locations</caption>
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Location</th><th className="p-3">Capacity</th><th className="p-3">Status</th></tr></thead>
            <tbody>
              {items.map((l) => (
                <tr key={l._id} className="border-t hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer" onClick={() => open(l)}>
                  <td className="p-3 font-mono font-bold">{en.locations.cardT(l.code)}</td>
                  <td className="p-3 tnum">{en.locations.cardCap(l.occupied, l.capacity)}</td>
                  <td className="p-3">{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel ? en.locations.cardT(sel.code) : ''}>
        {sel && (
          <div className="space-y-4 text-sm">
            <p>{en.locations.cardCap(sel.occupied, sel.capacity)} · {sel.status}</p>
            {!contents ? <Skeleton rows={3} /> : contents.length === 0 ? (
              <p className="text-slate-500">{en.locations.emptyBin}</p>
            ) : (
              <ul className="space-y-2">
                {contents.map((p) => <li key={p.id} className="flex justify-between border-b pb-1"><span className="font-mono font-semibold">{p.sku}</span><span className="tnum">{p.totalQuantity} {p.unit}</span></li>)}
              </ul>
            )}
            {qr && (
              <div>
                <img src={qr.dataUrl} alt={`QR for ${qr.code}`} className="w-40 h-40 border rounded-xl" />
                <div className="flex gap-2 mt-2 no-print">
                  <button onClick={() => window.print()} className="text-xs font-bold border rounded-xl px-3 py-2">{en.locations.printQr}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Drawer open={showNew} onClose={() => setShowNew(false)} title={en.locations.add}>
        <form onSubmit={create} className="space-y-4">
          <Field label={en.locations.fCode} tip={en.tips.locCode}><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputCls} data-testid="location-code" required /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label={en.locations.fZone}><input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} className={inputCls} /></Field>
            <Field label={en.locations.fRack}><input value={form.rack} onChange={(e) => setForm({ ...form, rack: e.target.value })} className={inputCls} /></Field>
            <Field label={en.locations.fShelf}><input value={form.shelf} onChange={(e) => setForm({ ...form, shelf: e.target.value })} className={inputCls} /></Field>
          </div>
          <Field label={en.locations.fCap}><input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className={inputCls} /></Field>
          <button className="rounded-xl bg-blue-600 text-white text-sm font-bold px-5 py-2.5 hover:bg-blue-500 transition">{en.common.create}</button>
        </form>
      </Drawer>
    </div>
  );
}
