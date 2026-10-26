---
description: Run the project's builds and test suites, then report real results
---

Run the relevant checks for what changed and report actual output:

1. Backend: `cd server && npm run dev` smoke (or `node --check` for syntax) — DB-backed tests only if `MONGODB_URI` is set.
2. Frontend: `cd client && npm run build` must pass.
3. If tests exist (`*.test.*`, `__tests__`), run them with the project's runner.
4. Report pass/fail with the failing output quoted. Never fabricate results.
