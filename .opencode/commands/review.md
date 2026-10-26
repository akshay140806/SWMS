---
description: Review the working-tree diff for bugs, security, and convention violations
---

Review `git status` + `git diff` (and recent commits if helpful):

1. Load the `code-reviewer` skill lens: correctness, security (OWASP), N+1/perf, naming, and this repo's domain conventions (`.opencode/skills/smart-warehouse-domain/SKILL.md`).
2. Output prioritized findings (blocker/major/minor) with `file:line` references.
3. Verify each claim against the code before reporting.
