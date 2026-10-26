import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import en from '../content/en';
import retail from '../content/retail';
import { inr, dOnly } from '../lib/format';
import { PageHeader, Skeleton } from '../components/ui';

export default function InvoiceDetail() {
  const { id } = useParams();
  const [inv, setInv] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    Promise.all([api.get(`/invoices/${id}`), api.get('/settings')]).then(([a, b]) => {
      setInv(a.data); setSettings(b.data);
    });
  }, [id]);

  if (!inv) return <div className="max-w-3xl mx-auto"><PageHeader title="…" /><Skeleton rows={6} /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title={inv.invoiceNo} sub={inv.customerName}
        action={<button onClick={() => window.print()} className="text-sm font-semibold border rounded-xl px-4 py-2 no-print">{retail.inv.print}</button>} />
      <div className="bg-white dark:bg-slate-900 border rounded-2xl p-8 text-sm">
        <div className="flex justify-between mb-6">
          <div>
            <div className="font-black text-lg">{settings?.warehouseName || en.brand.name}</div>
            <div className="text-slate-500">{settings?.address}</div>
          </div>
          <div className="text-right">
            <div className="font-bold">{retail.inv.invNo}: {inv.invoiceNo}</div>
            <div className="text-slate-500">{retail.inv.date}: {dOnly(inv.createdAt)}</div>
            <div className="text-slate-500">{retail.inv.order}: {inv.order?.orderNo}</div>
          </div>
        </div>
        <div className="mb-6">
          <div className="text-xs font-bold uppercase text-slate-400">{retail.inv.billTo}</div>
          <div className="font-semibold">{inv.customerName}</div>
          <div className="text-slate-500">{inv.customerPhone} · {inv.deliveryAddress}</div>
        </div>
        <table className="w-full">
          <thead className="text-left text-xs uppercase text-slate-500 border-b">
            <tr><th className="py-2">Item</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Rate</th><th className="py-2 text-right">Amount</th></tr>
          </thead>
          <tbody>
            {inv.items.map((it, i) => (
              <tr key={i} className="border-b">
                <td className="py-2">{it.name} <span className="font-mono text-slate-400">({it.sku})</span></td>
                <td className="py-2 text-right tnum">{it.qty}</td>
                <td className="py-2 text-right tnum">{inr(it.rate)}</td>
                <td className="py-2 text-right tnum font-semibold">{inr(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end mt-4">
          <div className="w-56 space-y-1 tnum">
            <div className="flex justify-between text-slate-500"><span>{retail.inv.sub}</span><span>{inr(inv.subTotal)}</span></div>
            <div className="flex justify-between text-slate-500"><span>{retail.inv.tax} ({inv.taxRate}%)</span><span>{inr(inv.taxAmount)}</span></div>
            <div className="flex justify-between font-extrabold text-base"><span>{retail.inv.grand}</span><span>{inr(inv.grandTotal)}</span></div>
          </div>
        </div>
        <p className="mt-8 text-center text-[11px] text-slate-400">{en.brand.footer}</p>
      </div>
      <Link to="/invoices" className="text-sm text-blue-600 font-semibold no-print">← Back</Link>
    </div>
  );
}
