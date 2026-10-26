# AUDIT.md — Smart Warehouse Management System (pre-upgrade, 13 Oct 2026)

## What exists (working, kept)
- `server/` (CommonJS): Express + Mongoose + JWT/bcrypt + Socket.IO + zod validation.
  Models: User, Product, Location, StockMovement, Order. Routes: auth/products/locations/movements/orders/dashboard.
  Atomic `$inc` via transactions, RBAC (`admin|warehouse|dispatch`), capacity checks, picking sort by code, idempotent seed, auto-seed in-memory fallback (`mongodb-memory-server`, `USE_MEMORY_DB=true`).
- `client/` (Vite + React Router + Tailwind v4 + axios + socket.io-client): Login (new split-screen), Navbar, Dashboard, Inventory, Locations, Movements, Orders, Analytics — all wired to real APIs, no dummy data.
- Verified running: `:5000/api/health` 200, login 200, `:5173` 200, `npm run build` passes.

## What is broken / missing (vs the upgrade spec)
1. **Backend is CommonJS** — spec requires ES modules. Needs conversion.
2. **Missing hardening**: no `helmet`, no rate limiting, no centralized error handler, no request logging of auth failures.
3. **Role names differ**: `warehouse|dispatch` vs spec `warehouse_staff|dispatch_staff`. No `active` flag, no register-with-role control, no logout/blacklist, no user-management endpoints.
4. **Models underspecified**: Product lacks barcode/unit/prices/image/reorderLevel naming (`threshold`), no `reservedQuantity`; Location lacks `shelf/blocked`; Movements use lowercase types, no `reference`, editable in theory (no lock); Orders lack sequential `ORD-00001`, customer phone/address, reserve-on-create, Picked/Delivered states, pickingList persistence.
5. **No Notifications / ActivityLogs collections**; dashboard analytics thin (no valuation, aging, dispatch-by-day).
6. **Frontend gaps**: no sidebar layout (top nav only), no dark mode, no Ctrl+K palette, no notification bell, no Users/Settings/Profile pages, no product detail, no kanban, no printable picking list, no CSV import/export, no charts (recharts), no animations (framer-motion), no toasts (react-hot-toast), no RHF+zod forms, no centralized copy file, few `data-testid`s.
7. **Tests**: no `/tests`, no Playwright config, no specs at all.
8. **Root**: no root `package.json` (dev/seed/test scripts), `.env.example` exists only in `server/`, `MONGO_URI` name not used (uses `MONGODB_URI`).
9. **Seed**: 6 products / 8 locations / 3 old-format users — spec wants 40+ products, 30 locations, 20 orders, 100+ movements, new credentials.
10. **Disconnected UI**: none — every button/form calls a real API. (Old `App.jsx` nested-Routes pattern works but will be replaced by layout routes.)

## Reuse plan
Keep: all business rules (atomic ledger writes, capacity, RBAC matrix semantics, picking sort, idempotent seeding), route shapes (renamed where spec demands), seed product/location data as base for the bigger seed.
Rewrite: module system (CJS→ESM), models (spec fields), frontend shell (sidebar/topbar), all copy (central `content/en.js`).

## AFTER upgrade (13 Oct 2026)
- Backend converted CJS -> ESM; added helmet, rate limits (test bypass), central error handler.
- Roles renamed to admin|warehouse_staff|dispatch_staff; added active flag, Users API, logout, register guard.
- Models match spec (barcode/unit/prices/reorderLevel/reservedQuantity, shelf/blocked, INWARD..ADJUSTMENT ledger, ORD-00001, reserve-on-create).
- Added Notifications, ActivityLogs, Counter, Settings; analytics endpoints (valuation, aging, dispatch trend).
- Seed: 3 new users, 43 products, 30 locations/3 zones, 20 orders, 110+ movements.
- Frontend rebuilt: sidebar/topbar/Ctrl+K/bell/dark mode, 17 pages, content/en.js copy, framer-motion, recharts, RHF+zod, toasts, testids.
- Playwright: 11 specs, chromium + Pixel 5. Fixed real bugs found: replset transactions, kanban drop ref, motion draggable, AnimatedNumber determinism.

