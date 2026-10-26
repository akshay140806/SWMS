import { useState } from 'react';
import toast from 'react-hot-toast';
import { Shield, CheckCircle2, X, ArrowRight, User } from 'lucide-react';
import api from '../lib/api';

export default function GoogleAuthModal({ isOpen, onClose, onSuccess, initialRole = 'admin' }) {
  const [email, setEmail] = useState('akshayjanu1408@gmail.com');
  const [name, setName] = useState('AKSHAY');
  const [role, setRole] = useState(initialRole);
  const [isCustom, setIsCustom] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleGoogleAuth(chosenEmail, chosenName, chosenRole) {
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/google', {
        email: chosenEmail || email,
        name: chosenName || name,
        role: chosenRole || role
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success(`Signed in as ${data.user.name} (${data.user.email})`);
      onSuccess?.(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Google authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Sign in with Google</h3>
              <p className="text-xs text-slate-500">Choose an account to continue to WareX</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Account Selector Body */}
        <div className="p-6 space-y-4">
          {!isCustom ? (
            <div className="space-y-3">
              {/* Primary Detected Google Account */}
              <button
                type="button"
                onClick={() => handleGoogleAuth('akshayjanu1408@gmail.com', 'AKSHAY', role)}
                disabled={submitting}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-blue-500/30 hover:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50 transition group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    A
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      AKSHAY
                      <span className="text-[10px] bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full">
                        Admin Account
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">akshayjanu1408@gmail.com</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
              </button>

              {/* Use Another Account */}
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition text-left text-sm"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Use another Google account</div>
                  <div className="text-xs text-slate-400">Sign in with work or personal Gmail</div>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Google Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-transparent focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-transparent focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Assigned Clearance Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="admin">Admin Staff (Full System Clearance)</option>
                  <option value="warehouse_staff">Warehouse Staff (Inventory & Stock)</option>
                  <option value="dispatch_staff">Dispatch Staff (Orders & Fulfilment)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustom(false)}
                  className="flex-1 py-2.5 text-sm rounded-xl border font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleGoogleAuth(email, name, role)}
                  disabled={submitting || !email}
                  className="flex-1 py-2.5 text-sm rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Connecting...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Security Assurance */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center gap-2 text-[11px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>To continue, Google will share your name and email with WareX.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
