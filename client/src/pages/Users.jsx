import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Users as UsersIcon,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Check
} from 'lucide-react';
import api from '../lib/api';
import en from '../content/en';
import { Badge, Drawer, Field, PageHeader, Skeleton, Empty, inputCls, FadeIn } from '../components/ui';

export default function Users() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: 'User@1234',
    role: 'warehouse_staff'
  });
  const [submitting, setSubmitting] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  async function load(manual = false) {
    if (manual) setRefreshing(true);
    try {
      const { data } = await api.get('/users');
      setItems(data.items || []);
      if (manual) toast.success('Operator directory refreshed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load operators');
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users', form);
      toast.success(en.toasts.saved || 'Operator created successfully');
      setDrawer(false);
      setForm({ name: '', email: '', password: 'User@1234', role: 'warehouse_staff' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || en.toasts.err || 'Failed to create operator');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggle(u) {
    try {
      await api.patch(`/users/${u.id}/active`, { active: !u.active });
      toast.success(u.active ? 'Operator deactivated' : 'Operator activated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update operator status');
    }
  }

  async function resetPw(u) {
    const pw = prompt(`Reset password for ${u.name}\nEnter new password (min 8 chars):`, 'User@1234');
    if (!pw) return;
    try {
      await api.post(`/users/${u.id}/reset-password`, { password: pw });
      toast.success(`Password updated for ${u.name}`);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Password reset failed');
    }
  }

  function copyId(id) {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
    toast.success('User ID copied to clipboard');
  }

  const roleInfo = (r) => {
    switch (r) {
      case 'admin':
        return { label: 'Admin', tone: 'violet', desc: 'Full System Clearance' };
      case 'warehouse_staff':
        return { label: 'Warehouse Staff', tone: 'blue', desc: 'Stock & Inventory Operations' };
      case 'dispatch_staff':
        return { label: 'Dispatch Staff', tone: 'amber', desc: 'Orders, Picking & Fulfilment' };
      default:
        return { label: r, tone: 'grey', desc: 'Standard Clearance' };
    }
  };

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((u) => {
      const matchQ =
        !q ||
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase()) ||
        String(u.id).toLowerCase().includes(q.toLowerCase());
      const matchRole = !roleFilter || u.role === roleFilter;
      const matchStatus =
        !statusFilter ||
        (statusFilter === 'active' && u.active) ||
        (statusFilter === 'inactive' && !u.active);
      return matchQ && matchRole && matchStatus;
    });
  }, [items, q, roleFilter, statusFilter]);

  const activeCount = items ? items.filter((u) => u.active).length : 0;
  const adminCount = items ? items.filter((u) => u.role === 'admin').length : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title={en.users?.title || 'User Management'}
        sub={en.users?.sub || 'Administration of system operators, clearance roles, and credentials.'}
        crumb="Administration / Operators"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              title="Refresh operator list"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              data-testid="add-user-btn"
              onClick={() => setDrawer(true)}
              className="flex items-center gap-1.5 text-sm font-bold bg-blue-600 text-white rounded-xl px-4 py-2 hover:bg-blue-500 transition shadow-sm"
            >
              <UserPlus size={16} />
              <span>{en.users?.add || 'Add User'}</span>
            </button>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Session Operator */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <UserCheck size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Session
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {currentUser.name || 'Admin'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {currentUser.email || 'Current Operator'}
            </div>
          </div>
          <Badge tone="blue">Self</Badge>
        </div>

        {/* Total Registered Operators */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <UsersIcon size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Operators
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {items?.length ?? '—'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Database accounts
            </div>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Status
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {activeCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enabled logins
            </div>
          </div>
        </div>

        {/* Admins */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Admin Clearance
            </div>
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-0.5">
              {adminCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Full system control
            </div>
          </div>
        </div>
      </div>

      {/* Main Directory Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, or user ID..."
              className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="warehouse_staff">Warehouse Staff</option>
              <option value="dispatch_staff">Dispatch Staff</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {(q || roleFilter || statusFilter) && (
              <button
                onClick={() => {
                  setQ('');
                  setRoleFilter('');
                  setStatusFilter('');
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-500 px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Directory Table */}
        {loading ? (
          <div className="p-4">
            <Skeleton rows={6} />
          </div>
        ) : filtered.length === 0 ? (
          <Empty
            title="No operators match your criteria"
            text={q || roleFilter || statusFilter ? 'Try clearing or adjusting your search filters.' : 'Add your first operator account to get started.'}
            action={
              <button
                onClick={() => setDrawer(true)}
                className="mt-3 text-sm font-bold bg-blue-600 text-white rounded-xl px-4 py-2 hover:bg-blue-500 transition"
              >
                + Add Operator
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <caption className="sr-only">Operator directory table</caption>
              <thead className="bg-slate-50 dark:bg-white/5 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th scope="col" className="py-3 px-4">Operator ID</th>
                  <th scope="col" className="py-3 px-4">Name</th>
                  <th scope="col" className="py-3 px-4">Email</th>
                  <th scope="col" className="py-3 px-4 text-center">Clearance Role</th>
                  <th scope="col" className="py-3 px-4 text-center">Status</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filtered.map((u) => {
                  const r = roleInfo(u.role);
                  const isSelf = String(u.id) === String(currentUser.id);
                  const isCopied = copiedId === u.id;
                  const initials = (u.name || 'U')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <motion.tr
                      key={u.id}
                      data-testid="user-row"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition"
                    >
                      {/* MongoDB ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => copyId(u.id)}
                          title="Click to copy ID"
                          className="group inline-flex items-center gap-1.5 font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-white/10 hover:border-blue-400 transition"
                        >
                          <span>#{u.id}</span>
                          {isCopied ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} className="opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                          )}
                        </button>
                      </td>

                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {u.name}
                              {isSelf && (
                                <span className="text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 px-1.5 py-0.2 rounded font-semibold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 hidden sm:block">
                              {r.desc}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {u.email}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge tone={r.tone}>{r.label}</Badge>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {u.active ? (
                          <Badge tone="green">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </Badge>
                        ) : (
                          <Badge tone="grey">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Inactive
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => resetPw(u)}
                            title="Reset Password"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-300 transition"
                          >
                            <KeyRound size={14} />
                          </button>

                          {u.active ? (
                            <button
                              type="button"
                              onClick={() => toggle(u)}
                              disabled={isSelf}
                              title={isSelf ? 'Cannot deactivate your own active session' : 'Deactivate operator'}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggle(u)}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div>
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{filtered.length}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{items?.length || 0}</span> operators
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Live MongoDB Cluster Synchronized</span>
          </div>
        </div>
      </div>

      {/* Drawer for Adding Operator */}
      <Drawer open={drawer} onClose={() => setDrawer(false)} title={en.users?.add || 'Add New Operator'}>
        <form onSubmit={create} className="space-y-4">
          <Field label={en.profile?.fName || 'Operator Name'}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              required
              data-testid="user-name"
              placeholder="e.g. Michael Kaiser"
            />
          </Field>

          <Field label={en.auth?.email || 'Email Address'}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputCls}
              required
              data-testid="user-email"
              placeholder="e.g. michael@example.com"
            />
          </Field>

          <Field label={en.auth?.password || 'Temporary Password'}>
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputCls}
              required
              minLength={8}
              placeholder="Min 8 characters"
            />
          </Field>

          <Field label={en.auth?.role || 'Clearance Role'}>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className={inputCls}
            >
              <option value="warehouse_staff">Warehouse Staff (Products, Stock & Adjustments)</option>
              <option value="dispatch_staff">Dispatch Staff (Orders, Invoices & Fulfilment)</option>
              <option value="admin">Admin (Full System Access & Configuration)</option>
            </select>
          </Field>

          <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300">Role Permissions:</div>
            <div>• <strong className="text-slate-700 dark:text-slate-300">Admin:</strong> Complete system control, users, organization settings.</div>
            <div>• <strong className="text-slate-700 dark:text-slate-300">Warehouse Staff:</strong> Products, storage bins, adjustments, PO receipts.</div>
            <div>• <strong className="text-slate-700 dark:text-slate-300">Dispatch Staff:</strong> Sales orders, invoices, picking slips, shipments.</div>
          </div>

          <div className="flex gap-2 justify-end pt-3">
            <button
              type="button"
              onClick={() => setDrawer(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 transition shadow-sm disabled:opacity-60"
            >
              {submitting ? 'Creating...' : en.common?.create || 'Create Operator'}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
