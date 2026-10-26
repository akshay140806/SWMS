import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Shield, Warehouse, Truck } from 'lucide-react';
import api from '../lib/api';
import en from '../content/en';
import { Field } from '../components/ui';
import AuthShowcase, { BrandLogo } from '../components/AuthShowcase';
import GoogleAuthModal from '../components/GoogleAuthModal';

const schema = z
  .object({
    name: z.string().min(2, en.valid?.required || 'Name is required (at least 2 characters)'),
    email: z.string().email(en.valid?.email || 'Enter a valid corporate email address'),
    password: z.string().min(8, en.valid?.pw || 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    role: z.enum(['admin', 'warehouse_staff', 'dispatch_staff'])
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: en.valid?.pwMatch || 'Passwords do not match',
    path: ['confirmPassword']
  });

export default function Register() {
  const nav = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [googleModal, setGoogleModal] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'admin'
    }
  });

  const selectedRole = watch('role');

  async function onSubmit(values) {
    try {
      const { data } = await api.post('/auth/register', values);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success(`Operator clearance provisioned for ${data.user.name} (${data.user.role})`);
      nav('/');
    } catch (e) {
      toast.error(e.response?.data?.error || en.toasts?.err || 'Registration failed');
    }
  }

  const roleCard = (val, title, desc, Icon) => {
    const isSelected = selectedRole === val;
    return (
      <button
        type="button"
        key={val}
        onClick={() => setValue('role', val, { shouldValidate: true })}
        className={`flex-1 p-3 rounded-xl border text-left transition flex flex-col justify-between ${
          isSelected
            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 ring-1 ring-blue-500'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800'
        }`}
      >
        <div className="flex items-center justify-between w-full mb-1">
          <div className="flex items-center gap-1.5">
            <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
            <span className={`text-xs font-bold ${isSelected ? 'text-blue-900 dark:text-blue-200' : 'text-slate-800 dark:text-slate-200'}`}>
              {title}
            </span>
          </div>
          <span
            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
              isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{desc}</p>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
      {/* Left Corporate Operational Showcase Panel */}
      <AuthShowcase isRegister={true} />

      {/* Right Enterprise Registration Portal Container */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 relative overflow-y-auto">
        {/* Mobile Corporate Brand Header */}
        <div className="lg:hidden mb-6 self-start sm:self-center">
          <BrandLogo size="md" light={false} />
        </div>

        <div className="w-full max-w-lg">
          {/* Main Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-9 relative">
            {/* Top Corporate Border Accent */}
            <div className="absolute top-0 inset-x-0 h-1 bg-blue-600 rounded-t-2xl" />

            <div className="mb-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Enterprise Identity Provisioning</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Operator Registration
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Provision operational clearance for warehouse inventory, dispatch, or administrative staff.
              </p>
            </div>

            {/* Google Workspace SSO Register Button */}
            <button
              type="button"
              onClick={() => setGoogleModal(true)}
              data-testid="reg-google-btn"
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 text-sm font-semibold transition hover:border-slate-400 shadow-xs"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign up with Google Workspace SSO</span>
            </button>

            {/* Corporate Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold">
                  Or register operator profile
                </span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
              <Field label="Full Name" error={errors.name?.message}>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    data-testid="reg-name"
                    {...register('name')}
                    placeholder="e.g. Michael Vance"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition"
                  />
                </div>
              </Field>

              <Field label="Corporate Email Address" error={errors.email?.message}>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    data-testid="reg-email"
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    placeholder="operator@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition"
                  />
                </div>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Password" error={errors.password?.message}>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      data-testid="reg-password"
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 characters"
                      className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </Field>

                <Field label="Confirm Password" error={errors.confirmPassword?.message}>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      {...register('confirmPassword')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition"
                    />
                  </div>
                </Field>
              </div>

              {/* CLEARANCE ROLE SELECTION */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Assigned Operational Clearance Role
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {roleCard('admin', 'Admin Staff', 'Full control, users & facility settings', Shield)}
                  {roleCard('warehouse_staff', 'Warehouse Staff', 'Inventory catalog, stock & bin storage', Warehouse)}
                  {roleCard('dispatch_staff', 'Dispatch Staff', 'Sales orders, picking, packing & shipping', Truck)}
                </div>
                <input type="hidden" {...register('role')} />
              </div>

              <button
                type="submit"
                data-testid="reg-submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-sm shadow-sm hover:shadow transition disabled:opacity-60 mt-3"
              >
                <span>{isSubmitting ? 'Provisioning clearance...' : 'Submit Registration & Provision Clearance'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Corporate Disclaimer */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 leading-normal">
              <span className="font-semibold text-slate-500 dark:text-slate-300">Compliance Assurance: </span>
              All registered operator actions are cryptographically logged with user identity and timestamp audits.
            </div>

            {/* Switch to Login */}
            <div className="text-center text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              Already have authorized system credentials?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-bold">
                Sign in to portal
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Google Authentication Dialog */}
      <GoogleAuthModal
        isOpen={googleModal}
        onClose={() => setGoogleModal(false)}
        onSuccess={() => nav('/')}
        initialRole={selectedRole || 'admin'}
      />
    </div>
  );
}
