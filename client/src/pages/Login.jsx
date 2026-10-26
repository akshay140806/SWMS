import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, CheckSquare, Square } from 'lucide-react';
import api from '../lib/api';
import en from '../content/en';
import { Field } from '../components/ui';
import AuthShowcase, { BrandLogo } from '../components/AuthShowcase';
import GoogleAuthModal from '../components/GoogleAuthModal';

const schema = z.object({
  email: z.string().email(en.valid?.email || 'Enter a valid corporate email address.'),
  password: z.string().min(1, en.valid?.required || 'Password is required.')
});

export default function Login() {
  const nav = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [googleModal, setGoogleModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' }
  });

  async function onSubmit(values) {
    try {
      const { data } = await api.post('/auth/login', values);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success(`Authenticated as ${data.user.name} (${data.user.role})`);
      nav('/');
    } catch (e) {
      toast.error(e.response?.data?.error || en.toasts?.err || 'Authentication failed. Please verify credentials.');
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
      {/* Left Corporate Operational Showcase Panel */}
      <AuthShowcase isRegister={false} />

      {/* Right Enterprise Sign-In Portal Container */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 relative overflow-y-auto">
        {/* Mobile Corporate Brand Header */}
        <div className="lg:hidden mb-8 self-start sm:self-center">
          <BrandLogo size="md" light={false} />
        </div>

        <div className="w-full max-w-md">
          {/* Main Business Sign-In Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-9 relative">
            {/* Top Corporate Border Accent */}
            <div className="absolute top-0 inset-x-0 h-1 bg-blue-600 rounded-t-2xl" />

            <div className="mb-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Enterprise Access Portal</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Operator Sign-In
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Authenticate with your corporate credentials to access the central warehouse command system.
              </p>
            </div>

            {/* Google Workspace SSO Button */}
            <button
              type="button"
              onClick={() => setGoogleModal(true)}
              data-testid="login-google-btn"
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-sm font-semibold transition hover:border-slate-400 shadow-xs"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in with Google Workspace SSO</span>
            </button>

            {/* Corporate Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold">
                  Or authenticate with operator credentials
                </span>
              </div>
            </div>

            {/* Corporate Credentials Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Field label="Operator Email / ID" error={errors.email?.message}>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    data-testid="login-email"
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    placeholder="operator@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition"
                  />
                </div>
              </Field>

              <Field label="Security Password" error={errors.password?.message}>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    data-testid="login-password"
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 select-none hover:text-slate-900"
                >
                  {rememberMe ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Remember workstation (30 days)</span>
                </button>

                <button
                  type="button"
                  onClick={() => toast('Please contact your IT System Administrator to reset your clearance credentials.')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                data-testid="login-submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-sm shadow-sm hover:shadow transition disabled:opacity-60 mt-2"
              >
                <span>{isSubmitting ? 'Verifying clearance...' : 'Authenticate & Access Portal'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Corporate Compliance Notice */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 leading-normal">
              <span className="font-semibold text-slate-500 dark:text-slate-300">Restricted Corporate System: </span>
              Authorized personnel only. All warehouse transactions and inventory movements are cryptographically logged under ISO 27001 audit standards.
            </div>

            {/* Switch to Register */}
            <div className="text-center text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              Need system access or new operator clearance?{' '}
              <Link to="/register" className="text-blue-600 hover:underline font-bold">
                Create an account
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
        initialRole="admin"
      />
    </div>
  );
}
