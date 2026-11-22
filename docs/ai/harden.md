# Day 4 — Harden

Use the [plan](../plans/shopflow-codex.plan.md), [UI standards](../../UI.md) and [review checklist](react-review.md).

- **D4-1** — Verify keyboard and screen-reader flows, announced form errors and Lighthouse accessibility scores of at least 90 on home, cart and login. Record actual audit evidence.
- **D4-2** — Measure the catalog, fix the two slowest observed spots and record comparable before/after results in `docs/performance.md`.
- **D4-3** — Bound rendered rows with paging and add virtualization if measurements justify it. Explain virtualization and one optimization you skipped or removed.
- **D4-4** — Validate feed payloads and reconcile Query cache and cart with shared mock inventory. Test reconnect, stock catch-up and cleanup of sockets, listeners and timers.
- **D4-5** — Run at least 15 meaningful behavior tests. Cover cart, shared hooks, login, URL filters, checkout and 409, and verify races, 401, idempotency and live cleanup where practical.
- **D4-6** — Run lint, typecheck, tests and build in PR CI from a clean npm lockfile install. Verify required checks when authorized and document remaining admin work if needed.
- **D4-7** — Trigger a deliberate render failure and verify fallback, sanitized logging and recovery. Document three monitoring signals.
