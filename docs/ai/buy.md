# Day 3 — Buy

Use the [plan](../plans/shopflow-codex.plan.md), [repository security rules](../../AGENTS.md) and [UI standards](../../UI.md).

- **D3-1** — Redux owns cart and in-memory session. Selectors derive counts and totals. Query owns catalog, account and order responses.
- **D3-2** — Validate saved carts, quantities and stock. Protect checkout and confirm success before clearing the cart. Verify that the mock enforces one order per logical submission across duplicate clicks and reload retries. Test the named-item stock conflict and changed-payload rejection.
- **D3-3** — Use safe internal return paths, disable pending login submits and clear session plus user-scoped cache on sign-out or a 401. Verify reload behavior and describe the storage trade-off in `docs/auth.md`.
- **D3-4** — Exercise safe messages for field errors, session expiry, missing items, stock conflicts and retryable server failures.
- **D3-5** — Verify cache reuse and stock reconciliation after orders. Explain stale times and check cart consistency when stock changes.
