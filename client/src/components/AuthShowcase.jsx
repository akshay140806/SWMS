import { ShieldCheck, Activity, Database, Server, Lock, Layers } from 'lucide-react';
import en from '../content/en';

export function BrandLogo({ size = 'md', light = true }) {
  const isLarge = size === 'lg';
  return (
    <div className="flex items-center gap-3.5 select-none">
      <div className={`relative ${isLarge ? 'w-11 h-11' : 'w-10 h-10'} rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center shrink-0`}>
        <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
          <svg className={isLarge ? 'w-6 h-6' : 'w-5 h-5'} viewBox="0 0 32 32" fill="none">
            <path d="M6 9L16 3L26 9V23L16 29L6 23V9Z" stroke="#38BDF8" strokeWidth="2" strokeLinejoin="round" />
            <path d="M16 3V16M26 9L16 16M6 9L16 16" stroke="#818CF8" strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />
            <path d="M10 13L13 21L16 15L19 21L22 13" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="16" cy="15" r="1.5" fill="#34D399" />
          </svg>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className={`font-black tracking-tight ${isLarge ? 'text-2xl' : 'text-xl'} ${light ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            Ware<span className="text-blue-500">X</span>
          </span>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 tracking-wider">
            ENTERPRISE
          </span>
        </div>
        <div className={`text-[11px] font-medium leading-none mt-0.5 ${light ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
          Smart Warehouse Management System
        </div>
      </div>
    </div>
  );
}

export default function AuthShowcase({ isRegister = false }) {
  return (
    <div className="hidden lg:flex w-[48%] flex-col justify-between bg-slate-950 text-white p-12 lg:p-14 relative overflow-hidden select-none border-r border-slate-900">
      {/* Background illumination for corporate depth */}
      <div className="absolute top-0 right-0 w-[28rem] h-[28rem] rounded-full bg-blue-600/15 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[28rem] h-[28rem] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

      {/* Top Brand Mark */}
      <div className="relative z-10 flex items-center justify-between">
        <BrandLogo size="lg" light={true} />
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>PROD-CLUSTER-01</span>
        </div>
      </div>

      {/* Center Business Content */}
      <div className="relative z-10 space-y-6 my-auto py-8">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">
            Central Supply Chain & Inventory Execution
          </div>
          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight text-white">
            {isRegister
              ? 'Enterprise Logistics & Inventory Orchestration Platform'
              : 'Real-Time Inventory Precision. Zero Stock Drift. Fast Fulfilment.'}
          </h1>
          <p className="text-sm text-slate-300 mt-3 max-w-lg leading-relaxed">
            Enterprise warehouse command system delivering shelf-to-cloud stock synchronization, automated FIFO picking routes, and immutable audit ledger compliance for multi-facility operations.
          </p>
        </div>

        {/* Enterprise Operational Pillars */}
        <div className="space-y-3 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3.5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Role-Based Access Control (RBAC)</h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">Cryptographically signed clearance enforcing segregated warehouse, inventory, and dispatch permissions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Transactional Stock Ledger</h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">MongoDB Atlas replica set transactions guaranteeing atomic stock increments with zero drift.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Layers className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Multi-Zone Storage & Route Optimization</h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">Capacity-tracked bin locations with shortest-path picking list sorting and delivery challan generation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Corporate Compliance */}
      <div className="relative z-10 pt-5 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500">
        <span>© 2026 WareX Global Systems Inc. · All Rights Reserved</span>
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>256-Bit SSL Encrypted Access</span>
        </div>
      </div>
    </div>
  );
}
