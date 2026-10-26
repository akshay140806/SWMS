---
name: smart-warehouse-domain
description: Use when working in this Smart Warehouse MERN project. Covers the RBAC matrix, atomic stock updates, location capacity rules, zod validation, picking-list ordering, and idempotent seeding conventions. Invoke for any inventory, location, movement, order, or dashboard task in this repo.
---

# Smart Warehouse Domain Conventions

## RBAC matrix (`server/src/middleware/roleCheck.js`)
- Products/Locations writes (create/update/inward/move/damage): `admin`, `warehouse` only. `dispatch` is read-only → expect 403.
- Orders create/pick/dispatch: `admin`, `dispatch` only. `warehouse` cannot dispatch.
- Dashboard/movements/analytics reads: all authenticated roles.

## Atomic stock updates
- Never read-then-save quantities. Use Mongoose transactions (`session.withTransaction`) + `$inc` on `Product.qty/sellableQty` and `Location.occupied`.
- Emit Socket.IO events (`inventory_updated`, `low_stock_alert`, `order_dispatched`) only after commit.
- Viva line: "I use atomic increments to avoid stock count race conditions."

## Location capacity (`server/src/controllers/productController.js`)
- Reject inward/move when `occupied + qty > capacity` with 400 and the `code + occupied/capacity` in the message.
- Status auto: `available` / `near-full (>=85%)` / `full`. UI must disable `full` locations and backend must re-check.

## Validation
- `zod` schemas in `server/src/validators/schemas.js` + `validate()` middleware on every write route. Reject empty/negative-qty payloads with 400 + details.

## Picking lists (`server/src/utils/picking.js`)
- Sort by `Location.code` ascending (Zone > Aisle > Rack > Bin) = nearest-location-first. Keep the one-sentence rationale ready.

## Seeding (`server/src/seed/seed.js`)
- Idempotent: `updateOne({sku} / {code}, {$setOnInsert}, {upsert:true})`, skip existing users by email. `npm run seed` must be safely re-runnable; `--reset` drops the DB only when explicitly passed.

## Demo accounts
- `admin@warehouse.local/admin123`, `warehouse@warehouse.local/warehouse123`, `dispatch@warehouse.local/dispatch123`.
