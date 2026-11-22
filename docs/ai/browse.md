# Day 2 — Browse

Use the [plan](../plans/shopflow-codex.plan.md) and [UI standards](../../UI.md). The URL owns committed filters and paging, Query owns product responses, and local state can hold input drafts.

- **D2-1** — Deliver accessible grid and detail routes with formatted cents, stock, image fallbacks and missing-product and unknown-route states.
- **D2-2** — Put search, category, in-stock, sort and page in the URL. Canonicalize invalid values, reset paging on filter changes and include all effective inputs in query keys. Verify count and browser refresh, sharing and Back/Forward.
- **D2-3** — Exercise reproducible loading, empty, error/retry and success states on list and detail. Check status announcements and keyboard use.
- **D2-4** — Forward the query signal to the client, clear effects and clean up the Back to Top listener. Check route changes and unmount under StrictMode.
- **D2-5** — Demonstrate real reuse of at least two typed hooks. Test their behavior and cleanup.
- **D2-6** — Use a deterministic out-of-order response test and verify that a stale response never appears under the latest search.
