# Shopflow progress

Baseline recorded 22 November 2026. See the [implementation plan](plans/shopflow-codex.plan.md) for full acceptance criteria. Mark a task complete only after its criteria are verified. Record actual checks, remaining work and any authorized task commit.

## Phase 0 — Complete

| Work                                    | Status   | Evidence                                                         |
| --------------------------------------- | -------- | ---------------------------------------------------------------- |
| Inspect repository and verify baseline  | Complete | Findings and validation below                                    |
| Reconcile plan with checkout            | Complete | [Updated plan](plans/shopflow-codex.plan.md)                     |
| Establish repository and UI guidance    | Complete | [AGENTS.md](../AGENTS.md) and [UI.md](../UI.md)                  |
| Add feature guides and review checklist | Complete | Day links below and [React review checklist](ai/react-review.md) |
| Track every assignment task             | Complete | Day 1–5 tables below                                             |

Phase 0 has no remaining work and no new commit.

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

| ID   | Status   | Evidence                                                                                            | Remaining work                                                     | Commit                                              |
| ---- | -------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| D1-1 | Complete | Shopflow shell, Tailwind, README, environment example, and Chrome smoke check                       | Whole-repository lint still reports four preserved practice errors | D1-1 Build the Shopflow Tailwind shell              |
| D1-2 | Complete | Six MSW handlers, 5,000 products, all required statuses tested, and [API contract](api-contract.md) | —                                                                  | D1-2 Implement the documented mock API              |
| D1-3 | Complete | Strict typecheck, type-aware app lint, and formatting check pass                                    | —                                                                  | D1-3 Enable strict TypeScript and typed linting     |
| D1-4 | Complete | Zod client tests cover auth, HTTP failures, invalid responses, network errors, and cancellation     | —                                                                  | D1-4 Validate requests through the typed API client |

### Day 1 review

- The API client now rejects invalid mutation bodies and unsafe detail IDs before fetch. This prevents invalid submissions and stops dot segments from resolving to another route. It also classifies a failed successful-response body stream as a network error while malformed JSON remains a validation failure.
- Reviewed shell landmarks, keyboard focus, responsive styles, strict types, mock storage, and sanitized API failures. Feature hooks, lists, and screen-level data states begin in later tasks.

### Day 1 validation

- `npm run lint:app`, `npm run typecheck`, `npm run format:check`, and `npm run build` passed. `npm run test:run` passed 19 tests across four files.
- `npm run lint` reports four pre-existing errors in `src/practice/practice.js`: unused variables at lines 54 and 161, a constant condition at 64, and a redeclaration at 102. The old app unused-variable error was removed with the starter screen. Exercise files are unchanged.
- Headless Chrome verified the skip link receives keyboard focus and the shell fits at 360, 768 and 1280 px. With the mock flag enabled, development returned 5,000 products and a forced 500. The production preview rendered Shopflow without registering a service worker.
- `npm ci` passed in a clean temporary directory with the repository manifests. Windows blocked replacing loaded native dependencies in the working checkout. `npm install` restored the checkout's dependency tree. The original direct package versions are unchanged.
- `npm audit` reports three moderate findings tied to the existing ESLint development-tool dependency chain. `npm audit --omit=dev` reports zero vulnerabilities.
- Day 1 is recorded in the four task-prefixed commits above. No pushes were made. Day 2 is tracked below.

## Day 2 — Browse

[Browse guide](ai/browse.md)

| ID   | Status   | Evidence                                                                                                            | Remaining work | Commit                                             |
| ---- | -------- | ------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------- |
| D2-1 | Complete | Responsive catalog and detail routes, formatted cents, keyboard access, image fallback, and distinct missing states | —              | D2-1 Add catalog and product detail routes         |
| D2-2 | Complete | Shareable URL filters and pagination, canonical defaults, and tested reload and history                             | —              | D2-2 Restore filters through URL history           |
| D2-3 | Complete | Live status and safe retry for both routes with documented mock scenario links                                      | —              | D2-3 Verify reproducible browse states and retry   |
| D2-4 | Complete | StrictMode tests verify detail cancellation, route focus, and scroll listener cleanup                               | —              | D2-4 Manage browse cancellation and scroll cleanup |
| D2-5 | Complete | Title hook shared by routes, scroll hook shared through Back to Top, and tested debounce cleanup                    | —              | D2-5 Verify reusable typed browse hooks            |
| D2-6 | Complete | Controlled late response test verifies obsolete search cancellation and current results                             | —              | D2-6 Verify out-of-order search isolation          |

### Day 2 review

- `CatalogPage.tsx` discarded dormant search drafts on history entry changes. A regression test verifies that Back and Forward restore the applied search and page without reviving a pending edit.
- `BrowseMessage.tsx` moves focus to the main landmark when a focused retry control is activated. Keyboard retry tests cover both list and detail recovery.
- StrictMode tests covered an obsolete detail request aborting, the old product staying hidden while the next product loads, debounce timer cleanup, title restoration, scroll listener removal, and a deliberately late search response.
- `useDocumentTitle` is used on catalog, detail, and unknown routes. `useScrollThreshold` is shared by the Back to Top control on catalog and detail, and the typed debounce hook applies only the settled search.
- Both routes expose reproducible loading, empty or missing, error with retry, and success states. Chrome also verified that Back to Top moved the page to scroll position zero.

### Day 2 validation

- App lint, strict type checking, formatting, production build, and all 37 tests passed.
- Headless Chrome verified one, two, and four catalog columns at 360, 768, and 1280 px without horizontal overflow. Tab reached the skip link and Enter opened a product, moving focus to the main landmark. Reload restored the detail link. Back and Forward restored the filtered catalog page and product route. The production preview handled a deep link and registered no mock worker.
- Repository-wide lint still reports the four existing exercise errors documented above. The practice files were unchanged.
- Day 2 is recorded in the six commits above. No pushes were made.

## Day 3 — Buy

[Buy guide](ai/buy.md)

| ID   | Status   | Evidence                                                                                                                    | Remaining work | Commit                                            |
| ---- | -------- | --------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------- |
| D3-1 | Complete | Redux cart and memory-only session, derived count and total, and Query-owned server data                                    | —              | D3-1 Add shared Redux cart and session state      |
| D3-2 | Complete | Validated cart persistence, protected checkout, mock-backed confirmation, and replay tests after a lost response and reload | —              | D3-2 Add persistent cart and idempotent checkout  |
| D3-3 | Complete | Login, logout, protected return routes, 401 handling, cache removal, and [authentication guide](auth.md)                    | —              | D3-3 Isolate authentication and private queries   |
| D3-4 | Complete | Tests for safe 400 field errors, 401 redirects, 404, named 409 conflicts, and 500 retry                                     | —              | D3-4 Verify safe API error handling               |
| D3-5 | Complete | Verified detail cache reuse, product invalidation after orders, and cart stock warnings after refresh                       | —              | D3-5 Verify product cache reuse and stock updates |

### Day 3 review

- Invalid numbers and malformed persisted carts are rejected. Verified quantity updates, derived totals, and reload behavior.
- Private query keys include a fresh, non-secret session scope. Logout and session replacement remove private entries. A delayed previous-account response was aborted and could not repopulate the cache after a new login.
- Verified duplicate login blocking, safe return paths after successful login, 401 handling, and that the login flow writes neither the token nor password to storage or app logs.
- Verified that duplicate submissions are blocked and lost-response retries reuse the exact body and key, including after reload and sign-in. A definitive 409 keeps the cart editable. Correcting the quantity produces a new body and key. Cart items remain until a validated order response.
- Checkout recovery applies within the documented mock tab session and account. Keep the pending intent and ledger until the order resolves.

### Day 3 validation

- App lint, strict type checking, formatting, production build, and all 57 tests passed.
- Chrome with development mocks verified catalog → add to cart → update quantity → reload the cart → sign in → checkout → confirmation. It also verified logout, a competing order that produced a named 409 while keeping the cart, and no horizontal overflow at 360, 768, and 1280 px on cart, login, checkout, and confirmation. Production preview registered no mock worker.
- Tests forced duplicate submit events and an accepted order with a lost reply. Manual retry returned the original order in the same page and after rehydrating both the app and mock ledger and signing in again.
- Repository-wide lint still reports the four existing exercise errors documented above. Practice files were unchanged.
- Day 3 is recorded in the five commits above. Day 4 has not started.

## Day 4 — Harden

[Harden guide](ai/harden.md)

| ID   | Status   | Evidence                                                                                                         | Remaining work                                                   | Commit                                         |
| ---- | -------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| D4-1 | Partial  | Lighthouse 100 on catalog, populated cart, and login, plus keyboard and accessibility-tree verification          | Standalone screen-reader speech check pending                    | D4-1 Record local accessibility audits         |
| D4-2 | Complete | Compared the two slowest mock stages before and after with the same workload. See [performance](performance.md). | —                                                                | D4-2 Reduce measured catalog handler work      |
| D4-3 | Complete | Browser verified bounded rendering on early and late pages of the 5,000-product catalog.                         | —                                                                | D4-3 Verify bounded paging after stock changes |
| D4-4 | Complete | Browser live update reached the cart. Tests cover validation, backoff, reconciliation, and StrictMode cleanup.   | —                                                                | D4-4 Add reconnecting mock stock feed          |
| D4-5 | Complete | 64 passing tests retain prior coverage and verify stock WebSocket handling across REST overrides and resets.     | —                                                                | D4-5 Cover live updates and cleanup            |
| D4-6 | Partial  | PR workflow added. Clean local install and all workflow commands passed. See [CI setup](ci.md).                  | Hosted PR run and required status check setup remain unverified. | D4-6 Add pull request application checks       |
| D4-7 | Complete | Render failure test verified focus, sanitized logging, and recovery. See [monitoring](monitoring.md).            | —                                                                | D4-7 Add sanitized render recovery             |

### Day 4 review

- Confirmed the same warm-up, request sequence, fixture and timed mock-handler stages. Browser card counts are separate from handler timings.
- Stock changes shift the in-stock page boundary without introducing duplicate items or stale totals. A regression test forces a missed change and verifies that reconnect refetches active REST queries.
- Feed opening also refetches stock on view re-entry. Invalid frames cannot trigger refresh, and StrictMode cleanup closes the obsolete socket and cancels retry timers.
- Verified the sanitized recovery test and matched all workflow paths and scripts to the root lockfile and Node 26.13.0.

### Day 4 validation

- App lint, strict type checking, formatting, production build, and 63 tests passed. A clean temporary install also passed every command listed in the PR workflow.
- [Accessibility results](accessibility.md) record Lighthouse snapshot scores and the keyboard and browser accessibility-tree checks. Chrome completed mobile checkout and displayed a live stock warning without altering the requested cart quantity.
- Repository-wide lint still reports unused variables on lines 54 and 161, a constant condition on line 64, and a redeclaration on line 102 in the preserved exercise file. The PR workflow checks app, tests, and tooling.
- Remote CI, branch rules, deployments, and Git history were untouched. Day 4 is recorded in the seven commits above.

- Follow-up: 64 tests passed with console output visible and no unmatched MSW WebSocket errors. The test server now registers the stock socket, unmounts views before resetting handlers, and fails on unexpected socket connections.

## Day 5 — Explain

[Explain guide](ai/explain.md)

| ID   | Status              | Evidence                                                                                                             | Remaining work                                              | Commit                                              |
| ---- | ------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| D5-1 | Documentation ready | [Actual architecture and diagrams](ARCHITECTURE.md)                                                                  | Explain a design choice in the walkthrough                  | D5-1 Document architecture and design patterns      |
| D5-2 | Complete locally    | [Three patterns with code references and trade-offs](ARCHITECTURE.md)                                                | —                                                           | D5-1 Document architecture and design patterns      |
| D5-3 | Complete locally    | [Proposed workers, retry and mock limits](orders.md)                                                                 | —                                                           | D5-3 Describe the proposed order workflow           |
| D5-4 | Draft               | [Six explained glossary terms](glossary.md)                                                                          | Review and put explanations in your own words               | D5-4 Draft Shopflow glossary                        |
| D5-5 | External pending    | [Partner architecture checklist](peer-review.md)                                                                     | Genuine feedback                                            | D5-5 Prepare partner architecture and PR reviews    |
| D5-6 | External pending    | [Partner PR checklist](peer-review.md)                                                                               | Genuine review comments, praise and replies                 | D5-5 Prepare partner architecture and PR reviews    |
| D5-7 | Complete            | [Three AI uses, one caught mistake, and personal reflection](ai-notes.md)                                            | —                                                           | D5-7: finalize AI-use notes and personal reflection |
| D5-8 | Draft               | [Provisional evidence and blank ratings](reflection.md)                                                              | Official tracker, personal ratings, two gaps and next steps | D5-8 Prepare reflection evidence and prompts        |
| D5-9 | External pending    | [PR draft](pr-description.md), [timed walkthrough](walkthrough.md), and [31-task checklist](acceptance-checklist.md) | Final PR, hosted CI, and spoken walkthrough                 | D5-9 Prepare submission and record pending checks   |

#- Follow-up: 64 tests passed with console output visible and no unmatched MSW WebSocket errors. The test server now registers the stock socket, unmounts views before resetting handlers, and fails on unexpected socket connections.

## Day 5 scope

Documentation and submission preparation only. Day 4 standalone screen-reader verification, GitHub-hosted workflow execution, and required-status-check enforcement remain pending. The commits above record local documentation and preparation. The final PR and deployment remain outside this review.

Verified 146 local links, two Mermaid diagrams, npm script names, and all 31 task IDs. App lint, strict type checking, formatting, all 63 tests, and the production build passed. Chrome verified the mocked development catalog and a production cart deep link without a mock worker. Repository-wide lint still reports the four existing exercise errors.
