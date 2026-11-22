# Day 1 — Foundation

Use the [plan](../plans/shopflow-codex.plan.md), [repository guidance](../../AGENTS.md) and [UI standards](../../UI.md).

- **D1-1** — Use the existing npm lockfile and keep `shopflow-react` as the package and directory. Apply Shopflow display branding and build the minimal accessible Tailwind shell. Resolve baseline lint issues, keep the exercises accessible, and document verified Node setup, formatting, scripts and public environment values. Verify that local environment files are ignored.
- **D1-2** — Document the six endpoint contracts and label local assumptions. Use authoritative shared definitions if supplied. Mock exact success and error responses with 5,000 stable products and reproducible scenarios. Test every listed status and envelope.
- **D1-3** — Migrate the app and relevant test/tooling configuration to strict TypeScript. Derive types from runtime schemas where practical. Use discriminated async results and verify typecheck.
- **D1-4** — Centralize fetch, safe token handling and boundary validation. Check status before parsing the success schema. Test auth headers, error mapping, invalid JSON and schemas, and abort propagation.

Run lint, typecheck, noninteractive tests and build. Smoke-check the shell and documented mock setup.
