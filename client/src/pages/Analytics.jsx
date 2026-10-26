import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Wallet,
  ArrowUpRight,
  Package,
  AlertTriangle,
  Layers,
  PieChart as PieIcon,
  BarChart3,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  Search,
  Percent,
  Receipt
} from 'lucide-react';
import api from '../lib/api';
import en from '../content/en';
import { inr, num, dOnly } from '../lib/format';
import { PageHeader, Skeleton, Badge, inputCls } from '../components/ui';

const PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316'];

export default function Analytics() {
  const [s, setS] = useState(null);
  const [report, setReport] = useState('Financial & P&L');
  const [timeframe, setTimeframe] = useState('all'); // 'all' | '30' | '90'
  const [catFilter, setCatFilter] = useState('');
  const [valSearch, setValSearch] = useState('');
  const [invSearch, setInvSearch] = useState('');

  async function loadData() {
    try {
      let url = '/dashboard/stats';
      if (timeframe === '30') {
        const d = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
        url += `?from=${d}`;
      } else if (timeframe === '90') {
        const d = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
        url += `?from=${d}`;
      }
      const { data } = await api.get(url);
      setS(data);
    } catch (e) {
      console.error('Failed to load analytics', e);
    }
  }

  useEffect(() => {
    loadData();
  }, [timeframe]);

  const filteredValuations = useMemo(() => {
    if (!s?.productValuations) return [];
    return s.productValuations.filter((p) => {
      const matchCat = !catFilter || p.category === catFilter;
      const matchQuery =
        !valSearch ||
        p.name.toLowerCase().includes(valSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(valSearch.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [s?.productValuations, catFilter, valSearch]);

  const filteredInvoices = useMemo(() => {
    if (!s?.financials?.invoices) return [];
    return s.financials.invoices.filter((inv) => {
      if (!invSearch) return true;
      const q = invSearch.toLowerCase();
      return (
        inv.invoiceNo?.toLowerCase().includes(q) ||
        inv.customerName?.toLowerCase().includes(q) ||
        inv.status?.toLowerCase().includes(q)
      );
    });
  }, [s?.financials?.invoices, invSearch]);

  function exportValuationCsv() {
    if (!filteredValuations.length) return;
    const headers = ['SKU', 'Name', 'Category', 'Location', 'Quantity', 'Unit Cost', 'Unit Price', 'Cost Valuation', 'Retail Valuation', 'Margin %'];
    const rows = filteredValuations.map((p) => [
      `"${p.sku}"`,
      `"${p.name}"`,
      `"${p.category}"`,
      `"${p.locationCode}"`,
      p.totalQuantity,
      p.costPrice,
      p.sellingPrice,
      p.costValuation,
      p.retailValuation,
      p.marginPct
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_valuation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportFinancialsCsv() {
    if (!s?.financials?.invoices?.length) return;
    const headers = ['Invoice No', 'Date', 'Customer', 'Subtotal', 'Tax', 'Grand Total', 'COGS Cost', 'Gross Profit', 'Margin %', 'Status'];
    const rows = s.financials.invoices.map((inv) => [
      `"${inv.invoiceNo}"`,
      `"${dOnly(inv.createdAt)}"`,
      `"${inv.customerName}"`,
      inv.subTotal,
      inv.taxAmount,
      inv.grandTotal,
      inv.cogs,
      inv.grossProfit,
      inv.marginPct,
      `"${inv.status}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_invoices_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (!s) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <PageHeader title={en.analytics.title} sub={en.analytics.sub} />
        <Skeleton rows={8} />
      </div>
    );
  }

  const fin = s.financials || {};
  const categories = s.categories || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title={en.analytics.title}
        sub={en.analytics.sub}
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-900 text-xs p-1">
              {[
                { id: 'all', label: 'All Time' },
                { id: '30', label: 'Last 30 Days' },
                { id: '90', label: 'Last 90 Days' }
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id)}
                  className={`px-3 py-1.5 font-semibold rounded-lg transition ${
                    timeframe === tf.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs font-semibold border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-white/5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              {en.analytics.print}
            </button>
          </div>
        }
      />

      {/* Report Selection Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-slate-200 dark:border-white/10 pb-3">
        {en.analytics.reports.map((r) => (
          <button
            key={r}
            onClick={() => setReport(r)}
            data-testid={`report-${r}`}
            className={`text-xs font-bold rounded-xl px-4 py-2.5 transition flex items-center gap-2 ${
              report === r
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm ring-1 ring-slate-900/10'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-400'
            }`}
          >
            {r === 'Financial & P&L' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
            {r === 'Stock Valuation & Margins' && <DollarSign className="w-3.5 h-3.5 text-blue-500" />}
            {r === 'Stock Summary' && <Package className="w-3.5 h-3.5 text-indigo-500" />}
            {r === 'Fast-Moving & Revenue Drivers' && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />}
            {r === 'Damaged & Shrinkage Report' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
            {r}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* 1. FINANCIAL & P&L OVERVIEW                             */}
      {/* ======================================================== */}
      {report === 'Financial & P&L' && (
        <div className="space-y-6">
          {/* Executive Financial KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-500/20 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                <span>Total Invoiced Revenue</span>
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-extrabold tnum text-slate-900 dark:text-white mt-2">
                {inr(fin.totalRevenue || 0)}
              </div>
              <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                <span>{fin.invoiceCount || 0} Invoices</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">Tax: {inr(fin.taxCollected || 0)}</span>
              </div>
            </div>

            {/* Cost of Goods Sold */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span>Cost of Goods (COGS)</span>
                <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-extrabold tnum text-slate-900 dark:text-white mt-2">
                {inr(fin.totalCOGS || 0)}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Actual cost of sold stock
              </div>
            </div>

            {/* Gross Profit */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-500/20 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                <span>Gross Profit</span>
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-extrabold tnum text-emerald-600 dark:text-emerald-400 mt-2">
                {inr(fin.grossProfit || 0)}
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-2 font-semibold flex items-center justify-between">
                <span>Profit Margin</span>
                <span className="bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  {fin.grossMarginPct || 0}%
                </span>
              </div>
            </div>

            {/* Cash Collected vs Receivables */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span>Cash Flow Status</span>
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <Wallet className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-extrabold tnum text-slate-900 dark:text-white mt-2">
                {inr(fin.paidRevenue || 0)}
              </div>
              <div className="text-xs mt-2 flex items-center justify-between">
                <span className="text-emerald-600 font-semibold">✓ Paid: {inr(fin.paidRevenue || 0)}</span>
                {fin.unpaidRevenue > 0 ? (
                  <span className="text-amber-600 font-bold">Unpaid: {inr(fin.unpaidRevenue)}</span>
                ) : (
                  <span className="text-slate-400">0 Outstanding</span>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Financial Indicators Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
            <div>
              <div className="text-xs text-slate-500">Warehouse Asset Value (Cost)</div>
              <div className="text-lg font-bold tnum mt-0.5">{inr(s.stockValue)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Capital invested in physical stock</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Potential Retail Value</div>
              <div className="text-lg font-bold tnum mt-0.5 text-blue-600 dark:text-blue-400">
                {inr(s.stockValueRetail || s.stockValue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">If current inventory is 100% sold</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Unrealized Stock Profit</div>
              <div className="text-lg font-bold tnum mt-0.5 text-emerald-600 dark:text-emerald-400">
                +{inr(s.unrealizedProfit || 0)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Estimated margin: {s.potentialMarginPct || 0}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Shrinkage & Damage Loss</div>
              <div className="text-lg font-bold tnum mt-0.5 text-red-600 dark:text-red-400">
                {inr(s.damagedLoss || 0)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{s.damaged || 0} damaged units</div>
            </div>
          </div>

          {/* Financial Charts: Revenue Trend & Category Share */}
          <div className="grid md:grid-cols-12 gap-5">
            {/* Revenue & Profit Growth Chart */}
            <div className="md:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm">Revenue & Gross Profit Trend</h3>
                  <p className="text-xs text-slate-500">Billed revenue vs actual COGS and realized profit</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg">
                  Daily Overview
                </span>
              </div>
              {fin.trend && fin.trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={fin.trend}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(value) => [inr(value), '']} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="profit" name="Gross Profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
                  <Receipt className="w-8 h-8 mb-2 opacity-50" />
                  No invoice transactions recorded in this period.
                </div>
              )}
            </div>

            {/* Department / Category Revenue Breakdown */}
            <div className="md:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col">
              <h3 className="font-bold text-sm">Inventory Capital Distribution</h3>
              <p className="text-xs text-slate-500 mb-3">Where warehouse capital is invested</p>

              {categories.length > 0 ? (
                <>
                  <div className="h-44 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categories}
                          dataKey="costValue"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {categories.map((_, i) => (
                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [inr(v), 'Capital Value']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 space-y-2 overflow-y-auto max-h-40 pr-1 text-xs">
                    {categories.map((c, i) => (
                      <div key={c.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                          <span className="truncate">{c.name}</span>
                        </div>
                        <span className="font-semibold tnum shrink-0">{c.costSharePct}% ({inr(c.costValue)})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                  No categories found.
                </div>
              )}
            </div>
          </div>

          {/* Invoices Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-white/10">
              <div>
                <h3 className="font-bold text-sm">Sales Invoices & Margin Breakdown</h3>
                <p className="text-xs text-slate-500">Every billed transaction with item cost, tax, and gross profit</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    value={invSearch}
                    onChange={(e) => setInvSearch(e.target.value)}
                    placeholder="Search invoice or customer..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-white/15 bg-transparent outline-none w-56"
                  />
                </div>
                <button
                  onClick={exportFinancialsCsv}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="p-3">Invoice No.</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3 text-right">GST / Tax</th>
                    <th className="p-3 text-right">Grand Total</th>
                    <th className="p-3 text-right">COGS Cost</th>
                    <th className="p-3 text-right">Gross Profit</th>
                    <th className="p-3 text-right">Margin %</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition">
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{inv.invoiceNo}</td>
                      <td className="p-3 text-slate-500">{dOnly(inv.createdAt)}</td>
                      <td className="p-3 font-medium">{inv.customerName}</td>
                      <td className="p-3 text-right tnum">{inr(inv.subTotal)}</td>
                      <td className="p-3 text-right tnum text-slate-500">{inr(inv.taxAmount)}</td>
                      <td className="p-3 text-right font-bold tnum">{inr(inv.grandTotal)}</td>
                      <td className="p-3 text-right tnum text-slate-500">{inr(inv.cogs)}</td>
                      <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 tnum">
                        +{inr(inv.grossProfit)}
                      </td>
                      <td className="p-3 text-right font-bold tnum">
                        <span className={`px-2 py-0.5 rounded-full ${inv.marginPct >= 10 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-700'}`}>
                          {inv.marginPct}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Badge tone={inv.status === 'Paid' ? 'green' : 'amber'}>
                          {inv.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        No invoices match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. STOCK SUMMARY (Enriched Executive Hub)               */}
      {/* ======================================================== */}
      {report === 'Stock Summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="text-2xl font-extrabold tnum text-slate-900 dark:text-white">{num(s.totalProducts)}</div>
              <div className="text-xs text-slate-500 mt-1">Active Grocery & Item SKUs</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="text-2xl font-extrabold tnum text-slate-900 dark:text-white">{num(s.totalQty)}</div>
              <div className="text-xs text-slate-500 mt-1">Total Physical Units on Shelves</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="text-2xl font-extrabold tnum text-emerald-600 dark:text-emerald-400">{inr(s.stockValue)}</div>
              <div className="text-xs text-slate-500 mt-1">Current Inventory Valuation (Cost)</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="text-2xl font-extrabold tnum text-red-600 dark:text-red-400">{num(s.damaged)}</div>
              <div className="text-xs text-slate-500 mt-1">Damaged / Shrinkage Units ({inr(s.damagedLoss || 0)})</div>
            </div>
          </div>

          {/* Department / Category Summary Cards */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-sm mb-1">Department / Category Overview</h3>
            <p className="text-xs text-slate-500 mb-4">Stock quantities and financial value by item group</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((c, i) => (
                <div key={c.name} className="border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm truncate">{c.name}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                      {c.skus} SKUs
                    </span>
                  </div>
                  <div className="text-lg font-extrabold tnum">{inr(c.costValue)}</div>
                  <div className="text-xs text-slate-500 flex justify-between mt-1">
                    <span>{num(c.totalQty)} Units</span>
                    <span className="text-emerald-600 font-semibold">{c.marginPct}% Margin</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(100, c.costSharePct)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. STOCK VALUATION & MARGIN AUDIT                      */}
      {/* ======================================================== */}
      {(report === 'Stock Valuation' || report === 'Stock Valuation & Margins') && (
        <div className="space-y-6">
          {/* Valuation Overview Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Total Asset Cost</div>
              <div className="text-2xl lg:text-3xl font-extrabold tnum text-slate-900 dark:text-white mt-1">
                {inr(s.stockValue)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Warehouse purchase basis</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Potential Retail Value</div>
              <div className="text-2xl lg:text-3xl font-extrabold tnum text-blue-600 dark:text-blue-400 mt-1">
                {inr(s.stockValueRetail || s.stockValue)}
              </div>
              <div className="text-xs text-slate-400 mt-1">At current selling prices</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Projected Profit</div>
              <div className="text-2xl lg:text-3xl font-extrabold tnum text-emerald-600 dark:text-emerald-400 mt-1">
                +{inr(s.unrealizedProfit || 0)}
              </div>
              <div className="text-xs text-emerald-600 mt-1 font-semibold">
                Expected Margin: {s.potentialMarginPct || 0}%
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Shrinkage Loss</div>
              <div className="text-2xl lg:text-3xl font-extrabold tnum text-red-600 dark:text-red-400 mt-1">
                {inr(s.damagedLoss || 0)}
              </div>
              <div className="text-xs text-red-500 mt-1 font-medium">{num(s.damaged)} damaged units</div>
            </div>
          </div>

          {/* Department Breakdown Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            {categories.map((c) => (
              <div key={c.name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm space-y-2">
                <div className="font-bold text-sm truncate">{c.name}</div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Inventory Cost</span>
                  <span className="font-bold tnum">{inr(c.costValue)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Retail Potential</span>
                  <span className="font-bold tnum text-blue-600">{inr(c.retailValue)}</span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-slate-100 dark:border-white/5">
                  <span className="text-emerald-600 font-semibold">Unrealized Gain</span>
                  <span className="font-bold tnum text-emerald-600">+{inr(c.profitPotential)} ({c.marginPct}%)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Product Valuation Audit Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-white/10">
              <div>
                <h3 className="font-bold text-sm">Product-by-Product Valuation & Profit Margin</h3>
                <p className="text-xs text-slate-500">Unit costs, retail prices, and profit projections</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                  className="text-xs rounded-xl border border-slate-300 dark:border-white/15 bg-transparent px-3 py-1.5"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    value={valSearch}
                    onChange={(e) => setValSearch(e.target.value)}
                    placeholder="Search SKU or name..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-white/15 bg-transparent outline-none w-52"
                  />
                </div>
                <button
                  onClick={exportValuationCsv}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Location</th>
                    <th className="p-3 text-right">Stock</th>
                    <th className="p-3 text-right">Cost Price</th>
                    <th className="p-3 text-right">Selling Price</th>
                    <th className="p-3 text-right">Total Cost Value</th>
                    <th className="p-3 text-right">Potential Retail</th>
                    <th className="p-3 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredValuations.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition">
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{p.sku}</td>
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-slate-500">{p.category}</td>
                      <td className="p-3 font-mono text-slate-500">{p.locationCode}</td>
                      <td className="p-3 text-right tnum font-semibold">
                        {p.totalQuantity} <span className="font-normal text-slate-400">{p.unit}</span>
                      </td>
                      <td className="p-3 text-right tnum">{inr(p.costPrice)}</td>
                      <td className="p-3 text-right tnum">{inr(p.sellingPrice)}</td>
                      <td className="p-3 text-right tnum font-semibold">{inr(p.costValuation)}</td>
                      <td className="p-3 text-right tnum font-bold text-blue-600 dark:text-blue-400">{inr(p.retailValuation)}</td>
                      <td className="p-3 text-right tnum font-bold">
                        <span className={`px-2 py-0.5 rounded-full ${p.marginPct >= 15 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20' : 'bg-slate-100 text-slate-600'}`}>
                          {p.marginPct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredValuations.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        No products match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. FAST-MOVING & REVENUE DRIVERS                        */}
      {/* ======================================================== */}
      {(report === 'Fast-Moving Items' || report === 'Fast-Moving & Revenue Drivers') && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-sm">Top Velocity & Dispatched Items (Last 30 Days)</h3>
                <p className="text-xs text-slate-500">
                  {s.fastMoving[0]
                    ? `${s.fastMoving[0].name} leads with ${s.fastMoving[0].total} units dispatched.`
                    : 'Dispatched sales order volume over the last 30 days.'}
                </p>
              </div>
            </div>

            {s.fastMoving.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={s.fastMoving}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="sku" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip
                    formatter={(val, name, props) => [
                      `${val} units (${inr(props.payload.revenue || 0)} revenue)`,
                      'Dispatched'
                    ]}
                  />
                  <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
                <Package className="w-8 h-8 mb-2 opacity-50" />
                No dispatch movements recorded in the last 30 days.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. SLOW-MOVING & AGING STOCK                            */}
      {/* ======================================================== */}
      {report === 'Slow-Moving & Aging Stock' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm">Stagnant Inventory & Capital Risk</h3>
                <p className="text-xs text-slate-500">
                  {s.slowMoving.length} items have had zero outward sales movements in over 60 days.
                </p>
              </div>
              {s.slowMoving.length > 0 && (
                <div className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-xl text-xs font-semibold">
                  Tied Capital: {inr(s.slowMoving.reduce((sum, p) => sum + (p.tiedCapital || 0), 0))}
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 uppercase font-semibold border-b">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-right">On Hand</th>
                    <th className="p-3 text-right">Unit Cost</th>
                    <th className="p-3 text-right">Tied Capital</th>
                    <th className="p-3">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {s.slowMoving.map((p) => (
                    <tr key={p.sku} className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition">
                      <td className="p-3 font-mono font-bold text-blue-600">{p.sku}</td>
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-right tnum font-semibold">
                        {p.totalQuantity} {p.unit}
                      </td>
                      <td className="p-3 text-right tnum">{inr(p.costPrice || 0)}</td>
                      <td className="p-3 text-right tnum font-bold text-amber-600">
                        {inr(p.tiedCapital || 0)}
                      </td>
                      <td className="p-3">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                          Consider bundling / promo discount
                        </span>
                      </td>
                    </tr>
                  ))}
                  {s.slowMoving.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        All items are actively moving! No aging stock identified.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. DISPATCH PERFORMANCE                                 */}
      {/* ======================================================== */}
      {report === 'Dispatch Performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="text-2xl font-extrabold tnum">{s.orders?.dispatchedTotal || 0}</div>
              <div className="text-xs text-slate-500 mt-1">Total Dispatched Shipments</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="text-2xl font-extrabold tnum text-emerald-600">{s.orders?.dispatchedToday || 0}</div>
              <div className="text-xs text-slate-500 mt-1">Dispatched Today</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="text-2xl font-extrabold tnum text-amber-600">{s.orders?.pending || 0}</div>
              <div className="text-xs text-slate-500 mt-1">Pending Orders in Queue</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-sm mb-1">Dispatch Trend (Last 14 Days)</h3>
            <p className="text-xs text-slate-500 mb-4">Completed shipments cleared and delivered</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={s.dispatchTrend.map((d) => ({ day: d._id.slice(5), count: d.count }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. LOCATION UTILIZATION                                 */}
      {/* ======================================================== */}
      {report === 'Location Utilization' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-12 gap-5">
            <div className="md:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Warehouse Capacity</span>
                <div className="text-4xl font-extrabold mt-2 text-blue-600 dark:text-blue-400">
                  {s.occupancy.pct}%
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {s.occupancy.totalOccupied} / {s.occupancy.totalCapacity} capacity bins occupied
                </p>
              </div>

              <div className="w-full bg-slate-200 dark:bg-white/10 h-3 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, s.occupancy.pct)}%` }}
                />
              </div>
            </div>

            <div className="md:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-sm mb-1">Zone Distribution</h3>
              <p className="text-xs text-slate-500 mb-3">Unit allocation by storage zone</p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={Object.entries(s.byZone).map(([name, value]) => ({ name, value }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {Object.keys(s.byZone).map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. DAMAGED & SHRINKAGE REPORT                           */}
      {/* ======================================================== */}
      {(report === 'Damaged Stock Report' || report === 'Damaged & Shrinkage Report') && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Damaged Units</div>
              <div className="text-3xl font-extrabold tnum text-red-600 dark:text-red-400 mt-1">
                {num(s.damaged)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Flagged for leakage / spoilage</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Total Financial Loss</div>
              <div className="text-3xl font-extrabold tnum text-red-600 dark:text-red-400 mt-1">
                {inr(s.damagedLoss || 0)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Direct shrinkage cost loss</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Shrinkage Rate</div>
              <div className="text-3xl font-extrabold tnum text-slate-900 dark:text-white mt-1">
                {s.stockValue > 0 ? ((s.damagedLoss / s.stockValue) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Loss vs total stock capital</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-bold text-sm">Detailed Shrinkage & Damaged Stock Audit</h3>
              <p className="text-xs text-slate-500">Items flagged as broken, leaked, or expired</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 uppercase font-semibold border-b">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-right">Damaged Quantity</th>
                    <th className="p-3 text-right">Cost Price</th>
                    <th className="p-3 text-right">Total Financial Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {s.damagedReport.map((p) => (
                    <tr key={p.sku} className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition">
                      <td className="p-3 font-mono font-bold text-blue-600">{p.sku}</td>
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-right tnum font-bold text-red-600">
                        {p.damagedQuantity} {p.unit}
                      </td>
                      <td className="p-3 text-right tnum">{inr(p.costPrice || 0)}</td>
                      <td className="p-3 text-right tnum font-extrabold text-red-600">
                        {inr(p.totalLoss || (p.damagedQuantity || 0) * (p.costPrice || 0))}
                      </td>
                    </tr>
                  ))}
                  {s.damagedReport.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No damaged or spoiled stock recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
