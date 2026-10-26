import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../lib/api';
import retail from '../content/retail';
import { Field, inputCls } from '../components/ui';

export default function Onboarding() {
  const nav = useNavigate();
  const [checking, setChecking] = useState(true);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { timeZone: 'Asia/Kolkata', currency: 'INR' }
  });

  useEffect(() => {
    api.get('/setup/status').then((r) => {
      if (!r.data.needsSetup) nav('/login', { replace: true });
      else setChecking(false);
    }).catch(() => setChecking(false));
  }, []);

  async function submit(v) {
    try {
      const { data } = await api.post('/setup', v);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success(`Welcome, ${v.warehouseName}!`);
      nav('/');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Something went wrong. Please try again.');
    }
  }

  if (checking) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading…</div>;

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950">
      <div className="hidden lg:flex w-[42%] flex-col justify-center bg-slate-900 text-white p-12 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="relative space-y-6">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xl">W</div>
          <h1 className="text-4xl font-extrabold leading-tight">Know what you have.<br />Know where it is.<br /><span className="text-blue-400">Ship it faster.</span></h1>
          <p className="text-slate-300 text-sm max-w-sm">{retail.setup.side}</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border p-8">
          <h2 className="text-2xl font-bold">{retail.setup.title}</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">{retail.setup.sub}</p>
          <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">{retail.setup.orgSec}</h4>
              <Field label={retail.setup.fStore} error={errors.warehouseName?.message}>
                <input {...register('warehouseName', { required: 'This field is required.' })} className={inputCls} data-testid="setup-store" placeholder="e.g. Kumar General Store" />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2"><Field label={retail.setup.fAddr}><input {...register('address')} className={inputCls} /></Field></div>
                <Field label={retail.setup.fCur}><input {...register('currency')} className={inputCls} /></Field>
              </div>
              <Field label={retail.setup.fTz}>
                <select {...register('timeZone')} className={inputCls}>
                  <option>Asia/Kolkata</option><option>Asia/Dubai</option><option>America/New_York</option><option>Europe/London</option>
                </select>
              </Field>
            </section>
            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">{retail.setup.adminSec}</h4>
              <Field label={retail.setup.fName} error={errors.name?.message}>
                <input {...register('name', { required: true, minLength: 2 })} className={inputCls} data-testid="setup-name" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={retail.setup.fEmail} error={errors.email?.message}>
                  <input {...register('email', { required: true, pattern: /^\S+@\S+\.\S+$/ })} className={inputCls} data-testid="setup-email" />
                </Field>
                <Field label={retail.setup.fPw} error={errors.password?.message}>
                  <input type="password" {...register('password', { required: true, minLength: 8 })} className={inputCls} data-testid="setup-password" />
                </Field>
              </div>
            </section>
            <button data-testid="setup-submit" disabled={isSubmitting} className="w-full rounded-xl bg-blue-600 text-white font-semibold py-2.5 text-sm hover:bg-blue-500 transition disabled:opacity-60 shadow-sm">
              {retail.setup.go}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
