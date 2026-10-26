import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import en from '../content/en';
import { Field, inputCls } from './ui';

export default function OnboardingWizard({ onDone }) {
  const [step, setStep] = useState(1);
  const [store, setStore] = useState({ warehouseName: '', address: '', currency: 'INR' });
  const [bins, setBins] = useState(true);
  const [product, setProduct] = useState({ name: '', sku: '' });
  const [busy, setBusy] = useState(false);

  // Prefill from the org profile captured during account setup (no re-typing).
  useEffect(() => {
    api.get('/settings').then((r) => {
      setStore((s) => ({ ...s, warehouseName: s.warehouseName || r.data.warehouseName || '', address: s.address || r.data.address || '', currency: r.data.currency || 'INR' }));
    }).catch(() => {});
  }, []);

  async function saveStore(next) {
    setBusy(true);
    try {
      await api.put('/settings', store);
      setStep(next);
    } catch (e) { toast.error(e.response?.data?.error || 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  }

  async function createBins(next) {
    setBusy(true);
    try {
      if (bins) {
        for (const rack of ['01', '02', '03']) {
          for (const bin of ['01', '02']) {
            const code = `A-${rack}-${bin}`;
            await api.post('/locations', { code, zone: 'A', rack, shelf: `B${bin}`, capacity: 200 }).catch(() => {});
          }
        }
      }
      setStep(next);
    } finally { setBusy(false); }
  }

  async function createProduct() {
    setBusy(true);
    try {
      if (product.name && product.sku) {
        await api.post('/products', { name: product.name, sku: product.sku });
      }
      await api.put('/settings', { onboarded: true });
      toast.success(en.onboard.done);
      onDone();
    } catch (e) { toast.error(e.response?.data?.error || 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}
          className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600">{en.onboard.badge} · {step}/3</span>
          {step === 1 && (
            <div className="space-y-4 mt-2">
              <h2 className="text-xl font-extrabold">{en.onboard.s1T}</h2>
              <p className="text-sm text-slate-500">{en.onboard.s1D}</p>
              <Field label={en.onboard.fStore}><input value={store.warehouseName} onChange={(e) => setStore({ ...store, warehouseName: e.target.value })} className={inputCls} data-testid="onboard-store" /></Field>
              <Field label="Address"><input value={store.address} onChange={(e) => setStore({ ...store, address: e.target.value })} className={inputCls} /></Field>
              <button disabled={busy || !store.warehouseName.trim()} onClick={() => saveStore(2)} data-testid="onboard-next-1"
                className="w-full rounded-xl bg-blue-600 text-white font-bold py-2.5 text-sm hover:bg-blue-500 disabled:opacity-50 transition">{en.onboard.next}</button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4 mt-2">
              <h2 className="text-xl font-extrabold">{en.onboard.s2T}</h2>
              <p className="text-sm text-slate-500">{en.onboard.s2D}</p>
              <label className="flex items-start gap-2 text-sm bg-slate-50 dark:bg-white/5 border rounded-xl p-3">
                <input type="checkbox" checked={bins} onChange={(e) => setBins(e.target.checked)} className="mt-1" />
                {en.onboard.quickBins}
              </label>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 rounded-xl border font-bold py-2.5 text-sm">{en.onboard.back}</button>
                <button disabled={busy} onClick={() => createBins(3)} data-testid="onboard-next-2" className="flex-1 rounded-xl bg-blue-600 text-white font-bold py-2.5 text-sm hover:bg-blue-500 disabled:opacity-50">{en.onboard.next}</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4 mt-2">
              <h2 className="text-xl font-extrabold">{en.onboard.s3T}</h2>
              <p className="text-sm text-slate-500">{en.onboard.s3D}</p>
              <Field label="Product name"><input value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} className={inputCls} data-testid="onboard-product" /></Field>
              <Field label="SKU"><input value={product.sku} onChange={(e) => setProduct({ ...product, sku: e.target.value })} className={inputCls} data-testid="onboard-sku" /></Field>
              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="flex-1 rounded-xl border font-bold py-2.5 text-sm">{en.onboard.back}</button>
                <button disabled={busy} onClick={createProduct} data-testid="onboard-finish" className="flex-1 rounded-xl bg-emerald-600 text-white font-bold py-2.5 text-sm hover:bg-emerald-500 disabled:opacity-50">{en.onboard.finish}</button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
