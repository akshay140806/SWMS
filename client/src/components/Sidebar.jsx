import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ArrowLeftRight, MapPin, ClipboardList, BarChart3,
  Bell, Users, Settings, ChevronLeft, Tag, BadgePercent, ShoppingCart, Truck, FileText, Store
} from 'lucide-react';
import en from '../content/en';
import retail from '../content/retail';

const SECTIONS = [
  { items: [{ to: '/', label: retail.nav.home, icon: LayoutDashboard, end: true, testid: 'nav-dashboard' }] },
  {
    label: en.nav.inventory.replace('Inventory', 'Items'),
    items: [
      { to: '/products', label: en.nav.products, icon: Package, testid: 'nav-products' },
      { to: '/groups', label: retail.nav.itemGroups, icon: Tag, testid: 'nav-groups' },
      { to: '/pricelists', label: retail.nav.priceLists, icon: BadgePercent, testid: 'nav-pricelists' }
    ]
  },
  {
    label: en.nav.inventory,
    items: [
      { to: '/stock', label: en.nav.adjustments, icon: ArrowLeftRight, testid: 'nav-stock' },
      { to: '/locations', label: en.nav.locations, icon: MapPin, testid: 'nav-locations' },
      { to: '/movements', label: en.nav.movements, icon: ClipboardList, testid: 'nav-movements' },
      { to: '/packages', label: 'Packages', icon: Package, testid: 'nav-packages' },
      { to: '/shipments', label: 'Shipments', icon: Truck, testid: 'nav-shipments' }
    ]
  },
  {
    label: retail.nav.sales,
    items: [
      { to: '/customers', label: retail.nav.customers, icon: Store, testid: 'nav-customers' },
      { to: '/orders', label: retail.nav.salesOrders, icon: ShoppingCart, testid: 'nav-orders' },
      { to: '/invoices', label: retail.nav.invoices, icon: FileText, testid: 'nav-invoices' },
      { to: '/picking', label: en.nav.pickingLists, icon: ClipboardList, testid: 'nav-picking' },
      { to: '/dispatch-history', label: en.nav.dispatchHistory, icon: Truck, testid: 'nav-dispatch-history' },
      { to: '/returns', label: 'Sales Returns', icon: ArrowLeftRight, testid: 'nav-returns' }
    ]
  },
  {
    label: retail.nav.purchases,
    items: [
      { to: '/vendors', label: retail.nav.vendors, icon: Store, testid: 'nav-vendors' },
      { to: '/purchases', label: retail.nav.purchaseOrders, icon: Truck, testid: 'nav-purchases' }
    ]
  },
  {
    items: [
      { to: '/analytics', label: en.nav.analytics, icon: BarChart3, testid: 'nav-analytics' },
      { to: '/notifications', label: en.nav.notifications, icon: Bell, testid: 'nav-notifications' }
    ]
  },
  {
    items: [
      { to: '/users', label: en.nav.users, icon: Users, admin: true, testid: 'nav-users' },
      { to: '/settings', label: en.nav.settings, icon: Settings, testid: 'nav-settings' }
    ]
  }
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const loc = useLocation();
  void loc;
  const cls = `fixed lg:static z-30 h-[calc(100vh-3.5rem)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 flex flex-col transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`;
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-slate-900/40 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={cls} aria-label="Primary">
        <nav className="flex-1 overflow-y-auto p-2 space-y-4">
          {SECTIONS.map((g, gi) => {
            const items = g.items.filter((it) => !it.admin || user.role === 'admin');
            if (!items.length) return null;
            return (
              <div key={gi}>
                {g.label && !collapsed && <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{g.label}</div>}
                <ul className="space-y-0.5">
                  {items.map((it) => (
                    <li key={it.to}>
                      <NavLink to={it.to} end={it.end} onClick={() => setMobileOpen(false)} data-testid={it.testid}
                        className={({ isActive }) => `relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                        title={collapsed ? it.label : undefined}
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && <motion.span layoutId="side-pill" className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-blue-600" />}
                            <it.icon size={18} className="shrink-0" />
                            {!collapsed && <span className="truncate">{it.label}</span>}
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
        <button onClick={() => setCollapsed(!collapsed)} aria-label="Collapse sidebar"
          className="hidden lg:flex m-2 items-center justify-center gap-1 py-2 rounded-xl text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">
          <ChevronLeft size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />{!collapsed && 'Collapse'}
        </button>
      </aside>
    </>
  );
}
