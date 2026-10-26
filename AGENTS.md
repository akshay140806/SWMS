# AGENTS.md — Smart Warehouse Management System

## Stack
MERN: MongoDB (Atlas `MONGODB_URI` or local), Express, React (Vite), Node. `server/` on :5000, `client/` on :5173 (proxies `/api`).

## Rules for OpenCode agents
1. Prefer current official docs — use **Context7** for React/Next/Node/Supabase/FastAPI/TS/Postgres.
2. Use native `websearch`/`webfetch`, or **Firecrawl**, for web research. Cite fetched URLs.
3. Use **Playwright** for browser/UI testing, **Chrome DevTools** for console/network debugging.
4. Use **GitHub** MCP for repo/issue/PR context.
5. Use **Supabase/PostgreSQL/SQLite** MCPs for DB work — inspection is read-only by default.
6. Never expose secrets (keys, tokens, passwords). Use env-var names only.
7. Never run destructive DB ops (`DROP/DELETE/ALTER`, `--reset` seeds, prod writes) without explicit user confirmation. Show the statement first.
8. Inspect existing architecture (`server/src/*`, `client/src/*`, `.opencode/skills/smart-warehouse-domain/SKILL.md`) before modifying.
9. Reuse existing code and follow repo conventions (RBAC matrix, zod validation, atomic `$inc` updates, capacity checks).
10. Run checks after meaningful changes: `cd client && npm run build`; `node --check` for server files; project tests if present.
11. Prefer simple, maintainable solutions; avoid new dependencies unless justified.
12. Explain failures with evidence (logs, status codes, file:line).
13. Load specialized skills on demand (`git-workflow-manager`, `docker-expert`, `node-specialist`, `supabase-expert`, `penetration-tester`, …) — see `~/.config/opencode/skills`.
14. Delegate to specialized agents in `.opencode/agents/` when a task fits (debugger, test-engineer, security-reviewer, database-engineer, …).
15. Use MCP tools only when they materially help; prefer native tools otherwise.

## Domain quick-ref
- RBAC: products/locations/stock/purchases write = admin+warehouse_staff; orders/picking/dispatch/invoices/fulfil = admin+dispatch_staff; directory (customers/vendors) write = admin+warehouse_staff; users/settings = admin.
- Stock changes must be transactional (`$inc` in replica-set transactions) + capacity-checked + movement-logged. Available = total − damaged − reserved (derived).
- Picking lists sort by location code (nearest-first). Dispatch auto-creates shipments. Optional seed is idempotent (upsert by sku/code) — server never auto-seeds.
- First run: `/api/setup` (org + admin) → onboarding wizard. Test logins come from `tests/global-setup.mjs`.
- UI copy lives in `client/src/content/{en,retail}.js` — never hard-code strings. All async handlers are crash-safe via `wrapRouter`. Test with `npx playwright test` (stop dev servers first or set NODE_ENV=test).
