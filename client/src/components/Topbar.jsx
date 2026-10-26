import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Moon, Sun, Menu, User as UserIcon, LogOut } from 'lucide-react';
import api from '../lib/api';
import en from '../content/en';
import { getSocket } from '../lib/socket';

const ROLE_STYLE = {
  admin: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  warehouse_staff: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
  dispatch_staff: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30'
};

export default function Topbar({ onMenu, dark, setDark }) {
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [unread, setUnread] = useState(0);
  const [palette, setPalette] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [profOpen, setProfOpen] = useState(false);
  const boxRef = useRef(null);

  async function loadUnread() {
    try {
      const { data } = await api.get('/notifications?tab=unread&limit=1');
      setUnread(data.unread || 0);
    } catch { /* offline */ }
  }
  useEffect(() => {
    loadUnread();
    const s = getSocket();
    s.on('notification', () => loadUnread());
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(true); }
      if (e.key === 'Escape') { setPalette(false); setProfOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => { s.off('notification'); window.removeEventListener('keydown', onKey); };
  }, []);

  useEffect(() => {
    if (!palette || q.trim().length < 2) { setResults(null); return; }
    const t = setTimeout(async () => {
      try {
        const [p, o] = await Promise.all([api.get(`/products?q=${encodeURIComponent(q)}&limit=5`), api.get(`/orders?q=${encodeURIComponent(q)}&limit=5`)]);
        setResults({ products: p.data.items, orders: o.data.items });
      } catch { setResults({ products: [], orders: [] }); }
    }, 250);
    return () => clearTimeout(t);
  }, [q, palette]);

  return (
    <header className="sticky top-0 z-40 h-14 bg-slate-900 text-white flex items-center gap-2 px-3 shadow-lg">
      <button className="lg:hidden p-2 -ml-1" aria-label="Open menu" onClick={onMenu}><Menu size={20} /></button>
      <div onClick={() => nav('/')} className="flex items-center gap-2.5 cursor-pointer select-none mr-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center shrink-0">
          <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
            <svg className="w-4 h-4" viewBox="0 0 32 32" fill="none">
              <path d="M6 9L16 3L26 9V23L16 29L6 23V9Z" stroke="#38BDF8" strokeWidth="2" strokeLinejoin="round" />
              <path d="M10 13L13 21L16 15L19 21L22 13" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="16" cy="15" r="1.5" fill="#34D399" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-1.5 hidden sm:flex">
          <span className="font-black text-base tracking-tight text-white">
            Ware<span className="text-blue-400">X</span>
          </span>
          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Enterprise
          </span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button onClick={() => nav('/notifications')} aria-label="Open notifications" data-testid="notification-bell"
          className="relative p-2 rounded-xl hover:bg-white/10 transition">
          <Bell size={18} />
          {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">{unread > 99 ? '99+' : unread}</span>}
        </button>
        <button onClick={() => setDark(!dark)} aria-label="Toggle dark mode" className="p-2 rounded-xl hover:bg-white/10 transition">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="relative" ref={boxRef}>
          <button onClick={() => setProfOpen(!profOpen)} aria-label="Profile menu" className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10">
            <span className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center"><UserIcon size={15} /></span>
          </button>
          <AnimatePresence>
            {profOpen && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.12 }}
                className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 p-2">
                <div className="px-3 py-2">
                  <div className="text-sm font-bold truncate">{user?.name}</div>
                  <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                  <span className={`inline-block mt-1 text-[11px] font-semibold border rounded-full px-2 py-0.5 ${ROLE_STYLE[user?.role] || ''}`}>
                    {user?.role === 'admin' ? 'Admin Staff' : user?.role === 'warehouse_staff' ? 'Warehouse Staff' : user?.role === 'dispatch_staff' ? 'Dispatch Staff' : user?.role}
                  </span>
                </div>
                {[[en.nav.profile, '/profile'], [en.nav.settings, '/settings']].map(([label, to]) => (
                  <button key={label} onClick={() => { setProfOpen(false); nav(to); }} className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">{label}</button>
                ))}
                <button onClick={() => { setProfOpen(false); setDark(!dark); }} className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">{en.nav.theme}</button>
                <button onClick={() => { localStorage.clear(); nav('/login'); }} className="w-full text-left text-sm px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2">
                  <LogOut size={14} />{en.nav.signOut}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Command palette */}
      <AnimatePresence>
        {palette && (
          <div className="fixed inset-0 z-50 flex justify-center pt-24 px-4">
            <motion.div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPalette(false)} />
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={en.nav.searchPh} data-testid="cmdk-input"
                className="w-full px-5 py-4 text-sm outline-none bg-transparent border-b border-slate-200 dark:border-white/10" />
              <div className="max-h-80 overflow-y-auto p-2">
                {!results && <p className="text-xs text-slate-400 px-3 py-4">Type at least 2 characters to search products and orders.</p>}
                {results && [...results.products.map((p) => ({ label: `${p.sku} — ${p.name}`, to: `/products/${p._id || p.id}` })), ...results.orders.map((o) => ({ label: `${o.orderNo} — ${o.customerName}`, to: `/orders/${o._id}` }))].map((r) => (
                  <button key={r.to} onClick={() => { setPalette(false); nav(r.to); }} className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">{r.label}</button>
                ))}
                {results && results.products.length === 0 && results.orders.length === 0 && <p className="text-xs text-slate-400 px-3 py-4">No matches.</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
