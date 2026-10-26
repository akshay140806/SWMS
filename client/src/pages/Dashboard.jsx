import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../lib/api';
import en from '../content/en';
import { inr, num, dt } from '../lib/format';
import { AnimatedNumber, Badge, PageHeader, Skeleton } from '../components/ui';
import { getSocket } from '../lib/socket';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function Card({ children, className = '' }) {
  return (
    <section className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 ${className}`}>
      {children}
    </section>
  );
}

const RANGES = { Today: 1, 'This Week': 7, 'This Month': 30, 'This Quarter': 90 };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [range, setRange] = useState('This Month');
  const [live, setLive] = useState(true);

  async function load(days) {
    const to = new Date().toISOString();
    const from = new Date(Date.now() - (days - 1) * 864e5).toISOString();
    const { data } = await api.get(`/dashboard/stats?from=${from}&to=${to}`);
    setStats(data);
  }
  useEffect(() => {
    load(RANGES[range]);
    const s = getSocket();
    const refresh = () => load(RANGES[range]);
    s.on('inventory_updated', refresh);
    s.on('order_updated', refresh);
    s.on('order_dispatched', refresh);
    s.on('order_created', refresh);
    s.on('connect', () => setLive(true));
    s.on('disconnect', () => setLive(false));
    return () => { s.off('inventory_updated', refresh); s.off('order_updated', refresh); s.off('order_dispatched', refresh); s.off('order_created', refresh); };
  }, [range]);

  const trendData = useMemo(() => {
    if (!stats) return [];
    const map = {};
    for (const t of stats.trend) {
      const d = t._id.day;
      map[d] = map[d] || { day: d.slice(5), INWARD: 0, OUTWARD: 0 };
      if (t._id.type === 'INWARD' || t._id.type === 'OUTWARD') map[d][t._id.type] += t.qty;
    }
    return Object.values(map);
  }, [stats]);

  if (!stats) return <div className="max-w-7xl mx-auto"><PageHeader title={en.dashboard.title} sub={en.dashboard.sub} /><Skeleton rows={6} /></div>;

  const kpis = [
    ['Total Products', <AnimatedNumber key="a" value={stats.totalProducts} />, 'vs. last period', 'slate'],
    ['Total Stock Value', inr(stats.stockValue), 'vs. last period', 'slate'],
    ['Low Stock Items', <AnimatedNumber key="b" value={stats.lowStockCount} />, 'Needs reorder', stats.lowStockCount ? 'amber' : 'green'],
    ['Damaged Items', <AnimatedNumber key="c" value={stats.damaged} />, 'Excluded from sellable stock', 'red'],
    ['Pending Orders', <AnimatedNumber key="d" value={stats.orders.pending} />, 'Awaiting picking', 'amber'],
    ['Dispatched Today', <AnimatedNumber key="e" value={stats.orders.dispatchedToday} />, 'vs. last period', 'green'],
    ['Location Utilization', `${stats.occupancy.pct}%`, 'Space in use', 'violet']
  ];
  const zoneData = Object.entries(stats.byZone).map(([name, value]) => ({ name, value }));
  const statusData = stats.statusBreakdown.map((s) => ({ name: s._id, value: s.count }));

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={en.dashboard.title} sub={en.dashboard.sub}
        action={
          <>
            <span data-testid="live-badge" className={`text-xs font-semibold inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 border ${live ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              <span className={`w-2 h-2 rounded-full ${live ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />{live ? en.common.live : en.common.reconnecting}
            </span>
            <select data-testid="date-filter" value={range} onChange={(e) => setRange(e.target.value)} className="text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-1.5">
              {en.dashboard.ranges.slice(0, 4).map((r) => <option key={r}>{r}</option>)}
            </select>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {kpis.map(([label, value, help, tone]) => (
          <div key={label} data-testid={`kpi-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`}
            className="bg-white dark:bg-slate-900 border-t-4 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-4 transition-shadow hover:shadow-md"
            style={{ borderTopColor: tone === 'amber' ? '#f59e0b' : tone === 'red' ? '#ef4444' : tone === 'green' ? '#10b981' : tone === 'violet' ? '#8b5cf6' : '#2563eb' }}>
            <div className="text-2xl font-extrabold tnum text-slate-900 dark:text-white">{value}</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">{label}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5">{help}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
        <Card className="xl:col-span-2">
          <h3 className="font-bold mb-3">{en.dashboard.charts[0]}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} /><Tooltip />
              <Area type="monotone" dataKey="INWARD" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
              <Area type="monotone" dataKey="OUTWARD" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="font-bold mb-3">{en.dashboard.charts[2]}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={zoneData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {zoneData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="font-bold mb-3">{en.dashboard.charts[1]}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.fastMoving.slice(0, 6)} layout="vertical">
              <XAxis type="number" hide /><YAxis type="category" dataKey="sku" fontSize={11} width={80} /><Tooltip />
              <Bar dataKey="total" fill="#2563eb" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="font-bold mb-3">{en.dashboard.charts[3]}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.dispatchTrend.map((d) => ({ day: d._id.slice(5), count: d.count }))}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} allowDecimals={false} /><Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="font-bold mb-3">{en.dashboard.charts[4]}</h3>
          <div className="flex flex-wrap gap-2">
            {statusData.map((s, i) => <Badge key={s.name} tone={['blue', 'amber', 'violet', 'green', 'grey', 'red'][i % 6]}>{s.name}: {s.value}</Badge>)}
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <Card>
          <div className="flex items-center mb-3">
            <h3 className="font-bold">{en.dashboard.lowStock}</h3>
            <Link to="/products?low=true" className="ml-auto text-xs font-semibold text-blue-600">{en.dashboard.viewAll}</Link>
          </div>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-slate-500">{en.dashboard.healthy}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {stats.lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <span className="truncate font-mono">{p.sku}</span>
                  <Badge tone="amber" pulse>{p.qty}/{p.reorderLevel}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h3 className="font-bold mb-3">{en.dashboard.recent}</h3>
          <ul className="space-y-2 text-sm">
            {stats.orders.recent.map((o) => (
              <li key={o._id} className="flex justify-between gap-2">
                <Link to={`/orders/${o._id}`} className="font-mono text-blue-600 truncate">{o.orderNo}</Link>
                <span className="text-slate-500 truncate">{o.customerName} · {dt(o.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="font-bold mb-3">{en.dashboard.quick}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[[en.nav.newProduct, '/products?action=new'], [en.nav.inward, '/stock?tab=inward'], [en.nav.newOrder, '/orders?action=new'], [en.nav.transfer, '/stock?tab=transfer']].map(([l, to]) => (
              <Link key={l} to={to} className="rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2.5 font-semibold text-center hover:border-blue-500 hover:text-blue-600 transition">{l}</Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
