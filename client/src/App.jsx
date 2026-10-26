import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import OnboardingWizard from './components/OnboardingWizard';
import VoiceAssistant from './components/VoiceAssistant';
import en from './content/en';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import StockOps from './pages/StockOps';
import Locations from './pages/Locations';
import Movements from './pages/Movements';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Picking from './pages/Picking';
import DispatchHistory from './pages/DispatchHistory';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Directory from './pages/Directory';
import Catalog from './pages/Catalog';
import Purchases from './pages/Purchases';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import { Packages, Shipments, Challan, Returns } from './pages/Fulfil';
import api from './lib/api';
import './styles.css';

function useAuth() {
  return { token: localStorage.getItem('token'), user: JSON.parse(localStorage.getItem('user') || 'null') };
}

function Protected({ roles, children }) {
  const { token, user } = useAuth();
  const loc = useLocation();
  const [setup, setSetup] = useState(null);
  useEffect(() => {
    if (token) api.get('/setup/status').then((r) => setSetup(r.data)).catch(() => setSetup({ needsSetup: false }));
  }, [token]);
  if (!token) return <Navigate to="/login" replace />;
  // Fresh business with no users yet → onboarding (public route below).
  if (setup?.needsSetup && loc.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />;
  if (roles && !roles.includes(user?.role)) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center bg-white dark:bg-white/5 border rounded-2xl p-10">
        <h1 className="font-bold text-lg">{en.common.denied}</h1>
        <p className="text-sm text-slate-500 mt-1">{en.common.deniedD}</p>
        <a href="/" className="inline-block mt-4 text-sm font-semibold text-blue-600">{en.common.backDash}</a>
        <span className="hidden">{loc.pathname}</span>
      </div>
    );
  }
  return children;
}

function Shell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [showWizard, setShowWizard] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);
  useEffect(() => {
    if (user.role === 'admin') {
      api.get('/settings').then((r) => {
        if (!r.data.onboarded) setShowWizard(true);
      }).catch(() => {});
    }
  }, []);
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:px-4 focus:py-2">Skip to main content</a>
      {showWizard && <OnboardingWizard onDone={() => setShowWizard(false)} />}
      <Topbar onMenu={() => setMobileOpen(true)} dark={dark} setDark={setDark} />
      <div className="flex">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <main id="main" className="flex-1 min-w-0 px-4 pb-10">
          <Outlet />
          <footer className="max-w-7xl mx-auto mt-8 text-center text-[11px] text-slate-400">{en.brand.footer}</footer>
        </main>
      </div>
      <VoiceAssistant />
    </div>
  );
}

function NotFound() {
  return (
    <div className="max-w-xl mx-auto mt-20 text-center bg-white dark:bg-white/5 border rounded-2xl p-10">
      <h1 className="font-bold text-lg">{en.common.notFound}</h1>
      <p className="text-sm text-slate-500 mt-1">{en.common.notFoundD}</p>
      <a href="/" className="inline-block mt-4 text-sm font-semibold text-blue-600">{en.common.backDash}</a>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/*" element={<Protected><Shell /></Protected>}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="groups" element={<Catalog key="groups" initialTab="groups" />} />
          <Route path="pricelists" element={<Catalog key="prices" initialTab="prices" />} />
          <Route path="stock" element={<Protected roles={['admin', 'warehouse_staff']}><StockOps /></Protected>} />
          <Route path="packages" element={<Packages />} />
          <Route path="shipments" element={<Shipments />} />
          <Route path="shipments/:id" element={<Challan />} />
          <Route path="customers" element={<Directory kind="customer" />} />
          <Route path="returns" element={<Returns />} />
          <Route path="vendors" element={<Directory kind="vendor" />} />
          <Route path="purchases" element={<Protected roles={['admin', 'warehouse_staff']}><Purchases /></Protected>} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          <Route path="locations" element={<Locations />} />
          <Route path="movements" element={<Movements />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="picking" element={<Protected roles={['admin', 'dispatch_staff']}><Picking /></Protected>} />
          <Route path="dispatch-history" element={<Orders history />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="users" element={<Protected roles={['admin']}><Users /></Protected>} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
