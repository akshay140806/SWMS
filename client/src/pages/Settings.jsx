import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Send, CheckCircle2, ShieldCheck, Server, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import en from '../content/en';
import { Field, PageHeader, inputCls, Badge } from '../components/ui';

export default function Settings() {
  const [s, setS] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const ro = user.role !== 'admin';

  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => { api.get('/settings').then((r) => setS(r.data)); }, []);

  async function save() {
    setSaving(true);
    try {
      const { data } = await api.put('/settings', s);
      setS(data);
      toast.success(en.profile.saved);
    } catch (e) {
      toast.error(e.response?.data?.error || en.toasts.noPerm);
    } finally {
      setSaving(false);
    }
  }

  async function testEmail() {
    setTestingEmail(true);
    setTestResult(null);
    try {
      const { data } = await api.post('/settings/notify-test', {
        to: s.notificationEmail,
        smtpConfig: {
          smtpHost: s.smtpHost,
          smtpPort: s.smtpPort,
          smtpUser: s.smtpUser,
          smtpPass: s.smtpPass,
          smtpFrom: s.smtpFrom,
          smtpSecure: s.smtpSecure
        }
      });
      setTestResult(data);
      if (data.isConfigured) {
        toast.success(`Live SMTP test email sent to ${data.recipient || s.notificationEmail || 'admin'}!`);
      } else {
        toast.success(`Test email verified (Simulated mode). Delivered to ${data.recipient || 'admin'}.`);
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to send test email. Check SMTP settings.');
    } finally {
      setTestingEmail(false);
    }
  }

  if (!s) return <div className="max-w-3xl mx-auto"><PageHeader title={en.profile.settings} /><p className="text-sm text-slate-500">{en.common.loading}</p></div>;
  const num = (k) => ({ type: 'number', value: s[k] ?? '', onChange: (e) => setS({ ...s, [k]: Number(e.target.value) }), className: inputCls, disabled: ro });
  const txt = (k) => ({ value: s[k] ?? '', onChange: (e) => setS({ ...s, [k]: e.target.value }), className: inputCls, disabled: ro });
  const chk = (k) => ({ type: 'checkbox', checked: !!s[k], onChange: (e) => setS({ ...s, [k]: e.target.checked }), className: 'w-4 h-4', disabled: ro });

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title={en.profile.settings} action={!ro && <button type="button" onClick={save} disabled={saving} data-testid="settings-save" className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 transition disabled:opacity-50">{saving ? 'Saving...' : en.profile.save}</button>} />
      {ro && <p className="text-xs text-amber-600 mb-3">{en.common.deniedD}</p>}
      <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
        <section className="bg-white dark:bg-slate-900 border rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-sm">{en.profile.general}</h3>
          <Field label={en.profile.fWh}><input {...txt('warehouseName')} placeholder="e.g. ANS Vasi Provisions" /></Field>
          <Field label={en.profile.fAddr}><input {...txt('address')} placeholder="Store address" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={en.profile.fTz}><input {...txt('timeZone')} /></Field>
            <Field label={en.profile.fCur}><input {...txt('currency')} /></Field>
          </div>
        </section>
        <section className="bg-white dark:bg-slate-900 border rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-sm">{en.profile.rules}</h3>
          <Field label={en.profile.fDefReorder}><input {...num('defaultReorderLevel')} /></Field>
          <Field label={en.profile.fLowTh}><input {...num('lowStockThreshold')} /></Field>
          <label className="flex items-center gap-2 text-sm"><input {...chk('allowNegativeStock')} />{en.profile.fAllowNeg} (Off)</label>
        </section>

        {/* Operational Email & Alert Center */}
        <section className="bg-white dark:bg-slate-900 border rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm">Email & Operational Lifecycle Notifications</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                Dispatches automated HTML email alerts for each stage from adding stock to final customer dispatch.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer shrink-0">
              <input {...chk('emailAlerts')} className="w-4 h-4 accent-blue-600" />
              <span>Enable Email Alerts</span>
            </label>
          </div>

          {/* Active Process Badges */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
              Active Lifecycle Email Triggers:
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-500/30">1. Adding Stock / Inward</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-500/30">2. PO Goods Receipt (GRN)</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold border border-amber-500/30">3. Low Stock Safety Warning</span>
              <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 font-semibold border border-red-500/30">4. Stock Damage Hold</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 font-semibold border border-blue-500/30">5. New Sales Order Created</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold border border-amber-500/30">6. Picking Route Slip</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 font-semibold border border-blue-500/30">7. Order Package Prepared</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 font-semibold border border-indigo-500/30">8. Shipment & Delivery Challan</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-500/30">9. Final Carrier Dispatch</span>
            </div>
          </div>

          <Field label="Notification Recipient Email Address" tip="Operational emails will be dispatched to this email. Leave blank to notify registered admin accounts automatically.">
            <input {...txt('notificationEmail')} placeholder="e.g. warehouse-operations@company.com" />
          </Field>

          {/* Optional Custom SMTP Configuration */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Server size={14} className="text-slate-400" /> Custom SMTP Mail Server Configuration (Optional)
              </span>
              <span className="text-[11px] text-slate-400">Defaults to internal simulator or env credentials</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="SMTP Host">
                <input {...txt('smtpHost')} placeholder="e.g. smtp.gmail.com" />
              </Field>
              <Field label="SMTP Port">
                <input {...num('smtpPort')} placeholder="587" />
              </Field>
              <Field label="Sender Address (From)">
                <input {...txt('smtpFrom')} placeholder='"WareX WMS" <alerts@co.com>' />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="SMTP Username">
                <input {...txt('smtpUser')} placeholder="user@company.com" />
              </Field>
              <Field label="SMTP Password / App Key">
                <input type="password" value={s.smtpPass || ''} onChange={(e) => setS({ ...s, smtpPass: e.target.value })} className={inputCls} placeholder="••••••••••••" disabled={ro} />
              </Field>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <input {...chk('smtpSecure')} className="w-3.5 h-3.5 accent-blue-600" />
                <span>Use SSL/TLS (Port 465)</span>
              </label>

              {!ro && (
                <button
                  type="button"
                  onClick={testEmail}
                  disabled={testingEmail}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition shadow-xs disabled:opacity-50"
                >
                  <Send size={13} className={testingEmail ? 'animate-pulse' : ''} />
                  <span>{testingEmail ? 'Sending Test...' : 'Send Test Alert Email'}</span>
                </button>
              )}
            </div>

            {testResult && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>
                    Test email successfully dispatched to <strong>{testResult.recipient}</strong> ({testResult.isConfigured ? 'Live SMTP Transport' : 'Stream Simulation Mode'}).
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
        <section className="bg-white dark:bg-slate-900 border rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-sm">{en.profile.appear}</h3>
          <Field label={en.profile.fTheme}>
            <select value={s.theme} onChange={(e) => setS({ ...s, theme: e.target.value })} className={inputCls} disabled={ro}>
              <option value="light">Light mode</option>
              <option value="dark">Dark mode</option>
              <option value="system">System</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm"><input {...chk('compactTables')} />{en.profile.fCompact}</label>
        </section>
        {!ro && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : en.profile.save}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
