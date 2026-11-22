# Shopflow progress

Baseline recorded 22 November 2026. See the [implementation plan](plans/shopflow-codex.plan.md) for full acceptance criteria. Mark a task complete only after its criteria are verified. Record actual checks, remaining work and any authorized task commit.

## Phase 0 — Complete

| Work | Status | Evidence |
| --- | --- | --- |
| Inspect repository and verify baseline | Complete | Findings and validation below |
| Reconcile plan with checkout | Complete | [Updated plan](plans/shopflow-codex.plan.md) |
| Establish repository and UI guidance | Complete | [AGENTS.md](../AGENTS.md) and [UI.md](../UI.md) |
| Add feature guides and review checklist | Complete | Day links below and [React review checklist](ai/react-review.md) |
| Track every assignment task | Complete | Day 1–5 tables below |

Phase 0 has no remaining work and no new commit. The next task is D1-1.

### Repository baseline

- Git root and app are both `shopflow-react`. Branch `feature/the-bug-bazaar` started at `e91461f` with remote `origin` configured. The plan was already untracked and there were no tracked edits. No applicable existing AGENTS file or override was found. Remote access was not tested.
- npm uses `package-lock.json` (lockfile v3). Local Node is 26.13.0 and npm is 11.20.0. Locked and installed versions include React and React DOM 19.3.1, Vite 8.3.4, the React Vite plugin 6.1.2 and ESLint 10.12.0. The installed tree includes extraneous React Router packages and their dependencies. Routing must be declared and locked when introduced.
- Vite and its React plugin load `src/main.jsx`, which enables React StrictMode. The app is JavaScript/JSX with React type declarations installed. There is no TypeScript compiler or config. ESLint uses flat JS/JSX rules with React Hooks and Refresh.
- Styling uses plain `src/index.css` and `src/App.css` with starter assets from `public` and `src/assets`. Tailwind, Ant Design and Sass are absent. The page title is `shopflow-react`, the on-page heading is `ShopFlow React`, and the README is the Vite template.
- The starter renders an interactive counter and five local products through `ProductCard`. The fixture has numeric IDs and only name and price fields. There is no assignment API, routing, cart, login or order flow. The source assignment PDF and original shared plan were not present in the checkout.
- Scripts are `dev`, `build`, `preview`, `lint`, `practice` and `test`. Both practice commands target JavaScript exercises. The current `test` script only prints exercise output. Typecheck, formatting and noninteractive behavior-test scripts are absent. `.env.local` is ignored through `*.local`, and bare `.env` is not ignored.

### Baseline validation

- `npm.cmd run build` with a temporary output directory passed. No browser smoke check was run.
- `npm.cmd run lint` failed with five existing errors. `src/App.jsx` has an unused variable. `src/practice/practice.js` has two unused variables, a constant condition and a redeclaration.
- `npm.cmd ls --depth=0` confirmed the installed dependencies and flagged extraneous packages. No clean install, assignment tests or typecheck were run.

## Day 1 — Foundation

[Foundation guide](ai/foundation.md)

| ID | Status | Evidence | Remaining work | Commit |
| --- | --- | --- | --- | --- |
| D1-1 | Pending | Phase 0 inspection and guidance complete | Apply Shopflow branding and Tailwind shell. Set up formatting, lint, environment guidance and README | — |
| D1-2 | Pending | — | Document and mock six endpoints with deterministic data and contract tests | — |
| D1-3 | Pending | — | Migrate to strict TypeScript and verify type checks | — |
| D1-4 | Pending | — | Build and test the validated HTTP client | — |

## Day 2 — Browse

[Browse guide](ai/browse.md)

| ID | Status | Evidence | Remaining work | Commit |
| --- | --- | --- | --- | --- |
| D2-1 | Pending | — | Build product grid, details and missing-route states | — |
| D2-2 | Pending | — | Add URL filters, sorting, count and paging | — |
| D2-3 | Pending | — | Cover loading, empty, error and success states | — |
| D2-4 | Pending | — | Verify cancellation and listener cleanup | — |
| D2-5 | Pending | — | Reuse at least two typed hooks | — |
| D2-6 | Pending | — | Test out-of-order search responses | — |

## Day 3 — Buy

[Buy guide](ai/buy.md)

| ID | Status | Evidence | Remaining work | Commit |
| --- | --- | --- | --- | --- |
| D3-1 | Pending | — | Set up Redux cart and session | — |
| D3-2 | Pending | — | Add persistent cart and protected, idempotent checkout | — |
| D3-3 | Pending | — | Add login, logout and protected routes | — |
| D3-4 | Pending | — | Map API errors to safe messages | — |
| D3-5 | Pending | — | Verify cache reuse and stock reconciliation | — |

## Day 4 — Harden

[Harden guide](ai/harden.md)

| ID | Status | Evidence | Remaining work | Commit |
| --- | --- | --- | --- | --- |
| D4-1 | Pending | — | Audit keyboard, screen-reader and Lighthouse accessibility | — |
| D4-2 | Pending | — | Measure and fix two performance bottlenecks | — |
| D4-3 | Pending | — | Verify 5,000-product browsing and document optimization choices | — |
| D4-4 | Pending | — | Implement and test live stock recovery and cleanup | — |
| D4-5 | Pending | — | Run at least 15 meaningful behavior tests | — |
| D4-6 | Pending | — | Configure PR CI and verify required checks | — |
| D4-7 | Pending | — | Add render error recovery and monitoring notes | — |

## Day 5 — Explain

[Explain guide](ai/explain.md)

| ID | Status | Evidence | Remaining work | Commit |
| --- | --- | --- | --- | --- |
| D5-1 | Pending | — | Document actual architecture and state ownership | — |
| D5-2 | Pending | — | Identify three implemented patterns | — |
| D5-3 | Pending | — | Diagram the conceptual order queue and workers | — |
| D5-4 | Pending | — | Write the six-term glossary | — |
| D5-5 | Pending | — | Collect genuine partner architecture feedback | — |
| D5-6 | Pending | — | Complete genuine partner PR reviews and responses | — |
| D5-7 | Pending | — | Record actual AI use and a caught mistake | — |
| D5-8 | Pending | — | Collect personal tracker ratings and next steps | — |
| D5-9 | Pending | — | Finish PR, verify CI and deliver walkthrough | — |
