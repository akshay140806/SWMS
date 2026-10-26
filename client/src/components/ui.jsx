import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import en from '../content/en';

export const EASE = [0.22, 1, 0.36, 1];
export function FadeIn({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}
export function StaggerList({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}
export function StaggerItem({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}
export function AnimatedNumber({ value, format = (v) => Math.round(v).toLocaleString('en-IN') }) {
  return <>{format(value)}</>;
}

const badgeStyles = {
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30 font-semibold',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 dark:border dark:border-amber-500/30 font-semibold',
  red: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 dark:border dark:border-red-500/30 font-semibold',
  grey: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:border dark:border-slate-700 font-semibold',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 dark:border dark:border-blue-500/30 font-semibold',
  violet: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300 dark:border dark:border-violet-500/30 font-semibold'
};
export function Badge({ tone = 'grey', children, ...rest }) {
  return (
    <span {...rest} className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5 ${badgeStyles[tone]}`}>
      {children}
    </span>
  );
}

export function Field({ label, tip, error, children }) {
  const [shake, setShake] = useState(0);
  useEffect(() => { if (error) setShake((s) => s + 1); }, [error]);
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
        {label} {tip && <span title={tip} className="cursor-help text-slate-400">ⓘ</span>}
      </label>
      <motion.div key={shake} animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.3 }} className="mt-1">
        {children}
      </motion.div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
export const inputCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition';

export function PageHeader({ title, sub, crumb, action }) {
  return (
    <div className="sticky top-14 z-[5] -mx-4 px-4 py-3 bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-200 dark:border-white/10 mb-5">
      <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
        <div>
          {crumb && <div className="text-[11px] text-slate-400">{crumb}</div>}
          <h1 className="text-xl font-bold">{title}</h1>
          {sub && <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
        </div>
        <div className="ml-auto flex gap-2">{action}</div>
      </div>
    </div>
  );
}

export function Empty({ title, text, action }) {
  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-10 text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-2xl mb-3">📦</div>
      <h3 className="font-bold">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 mb-4">{text}</p>
      {action}
    </div>
  );
}

export function Skeleton({ rows = 5 }) {
  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-9 rounded-lg bg-slate-200/70 dark:bg-white/10 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
      <span className="sr-only">{en.common.loading}</span>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, wide = false }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className={`fixed right-0 top-0 h-full bg-white dark:bg-slate-900 shadow-2xl z-50 p-6 overflow-y-auto ${wide ? 'w-full max-w-2xl' : 'w-full max-w-md'}`}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.25, ease: EASE }}
            role="dialog" aria-label={title}
          >
            <div className="flex items-center mb-5">
              <h2 className="font-bold text-lg">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="ml-auto w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">✕</button>
            </div>
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function Confirm({ open, title, text, confirmLabel, onConfirm, onCancel, danger = false }) {
  const [busy, setBusy] = useState(false);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} />
          <motion.div
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }} role="alertdialog" aria-label={title}
          >
            <h3 className="font-bold">{title}</h3>
            <p className="text-sm text-slate-500 mt-1 mb-5">{text}</p>
            <div className="flex justify-end gap-2">
              <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-white/10 hover:bg-slate-200">{en.common.close}</button>
              <button
                onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}
              >
                {busy ? '…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function useShakeOnError(error) {
  const ref = useRef(null);
  useEffect(() => {
    if (error && ref.current) {
      ref.current.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }],
        { duration: 300 }
      );
    }
  }, [error]);
  return ref;
}
