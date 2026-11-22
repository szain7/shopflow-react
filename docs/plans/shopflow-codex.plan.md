# Shopflow — Codex implementation plan

Status: Phase 0 complete. Day 1 is the next implementation phase.
Prepared: 22 November 2026.

## Purpose and authority

Build Shopflow in VS Code using Codex, React, TypeScript and Tailwind CSS. This replaces the Claude/Cursor and Ant Design setup in `shared_ai_guidelines_6b42b86a.plan.md`. It preserves The Bug Bazaar assignment's API, task IDs, acceptance criteria and 100-point rubric. Shopflow is the user-requested branding override; the README must say that Shopflow implements The Bug Bazaar assignment. If the evaluator enforces the original display name, disclose this branding change.

This document is ordinary Markdown, not a Cursor executable plan. Codex reads it when explicitly instructed. Create `AGENTS.md` during Phase 0 to carry persistent project instructions; this plan alone is not automatically loaded. No Claude/Cursor integration, symlinks or custom agent skill is required.

Sources reviewed: the complete original plan and all nine pages of `The Bug Bazaar.pdf`. See [the Phase 0 progress record](../progress.md) for the inspected repository baseline. The source PDF and original plan were not present in the checkout during Phase 0.

## How to use in VS Code

1. Open the existing Week 1 Git repository in VS Code. Preserve its history; do not initialize a replacement repository.
2. Put this document at `docs/plans/shopflow-codex.plan.md`. Keep the assignment PDF accessible and tell Codex its path; do not assume attachments in this chat are accessible in VS Code.
3. Paste the startup prompt at the end into Codex. The startup prompt covers Phase 0 only. Start Day 1 in a separate authorized task. Build later days in order using the continuation prompt.
4. Start each fresh Codex task from the repository root and mention this plan and the relevant task IDs. Ask Codex to report the applicable instruction files before changes.

## Phase 0 — inspect and establish instructions

- Inspect Git root/status, tracked paths, existing `AGENTS.md` / `AGENTS.override.md`, package manifests, lockfiles, scripts, Vite config, TypeScript, lint and any existing working features. Respect existing instructions and preserve uncommitted changes.
- The app is at the repository root. Keep the folder and npm package name as `shopflow-react`. Keep the existing Git history and npm lockfile.
- Use **Shopflow** as the visible application name, page title and README heading during D1-1. Keep package and lockfile identity as `shopflow-react`. Use relative paths in application code.
- Leave `bug-bounty-starter`, `bug-bounty-starter.zip`, `JSPractice` and unrelated projects untouched. Phase 0 changes documentation only. Application and tooling changes begin in the applicable Day 1 tasks.
- Reuse the existing package manager and one lockfile. In D1-1, record a verified Node version compatible with the locked toolchain in a version file and README; do not blindly use `latest` or upgrade React/Vite as part of this task.
- Root `AGENTS.md` owns concise repository-wide scope and safety rules. `UI.md` at the repository root owns UI rules once, explicitly scoped to Shopflow. `docs/ai/*.md` owns feature guidance. Use explicit instructions to read relevant documents; do not assume `@path` text expands as an import.
- Root `AGENTS.md` must route API/types work to `docs/ai/foundation.md`, browsing to `browse.md`, cart/auth/orders to `buy.md`, tests/CI/live updates to `harden.md`, and submission docs to `explain.md`. Before every UI change, read `UI.md`. Keep these routing instructions short.
- Put a review checklist at `docs/ai/react-review.md`, referenced by `AGENTS.md`: architecture, hooks/dependencies/cleanup, state ownership, renders, TypeScript, readability, accessibility, errors, responsive Tailwind usage and security. Findings must identify location, problem, impact and concrete fix; recheck fixes. This is a document, not an auto-discovered skill.
- Maintain `docs/progress.md` with each task ID, status, evidence, remaining work and relevant commits. Do not mark scaffolded or unverified work complete.

Required persistent rules in `AGENTS.md`:

- This is a learning project: explain meaningful changes in plain language, with the relevant principle and trade-off. The engineer must understand all submitted code. Do not invent personal reflections, partner feedback, measurements or AI-use history.
- When authorized, make at least one commit per assignment task, prefixed with its ID; keep task changes separate. Do not commit unrelated user changes. Daily pushes and the final PR are required submission steps; report when authorization, credentials, remote access or user participation prevents them.
- Record library choices and alternatives in `docs/decisions.md`; record actual notable AI uses in `docs/ai-notes.md` as work proceeds.
- React + strict TypeScript; no explicit `any`, `@ts-ignore`, suppressed checks or disabled tests to pass validation. Validate unknown external values before use.
- Follow the shared API. Keep prices in integer cents until formatting. HTTP transport belongs only in `src/api/client.ts`; components use feature hooks or typed client operations.
- No secrets in source or `VITE_` configuration. Tokens in memory only, including Redux; exclude session from persistence and redact auth from logs/devtools. Cart persistence is allowed and must be validated. Render untrusted text as text; no `dangerouslySetInnerHTML` for product/API content. Validate payloads, sanitize user-facing errors and never log credentials or raw sensitive bodies.
- Checkout requires server/mock-enforced idempotency. Never automatically retry a non-idempotent mutation. Treat this frontend/mock implementation as a training demo, not production authentication or payment processing.

## UI standards

Follow [UI.md](../../UI.md) for the seven Tailwind rules and Vite integration. Apply the integration during D1-1.

## Architecture and dependencies

Keep the existing Vite and React setup. Migrate the JavaScript/JSX app to strict TypeScript in Day 1. React StrictMode is already enabled and is separate from TypeScript strict checking. Add dependencies only in the phase that needs them:

| Concern | Choice | Ownership |
| --- | --- | --- |
| UI | Tailwind v4 + Vite plugin | Native HTML and shared React UI |
| HTTP | Native fetch | Typed operations in `src/api/client.ts` |
| Validation | Zod | Request, response, persisted data and feed boundaries |
| Mock backend | MSW | Development and test handlers; deterministic data |
| Routing / URL state | React Router | Routes, search/filter/sort/page and return path |
| Server state | TanStack Query | Product/order/user requests, cache and invalidation |
| Client state | Redux Toolkit + React Redux | Cart and in-memory session; selectors derive totals |
| Local state | React state | Input drafts, toggles and transient interactions |
| Tests | Vitest + Testing Library + user-event + jsdom | Behavior, client and integration coverage |
| Formatting / lint | Prettier + type-aware ESLint + hooks rules | Compatible with installed major versions |
| Large list | Measure first; virtualizer if warranted | Do not render all 5,000 cards by default |

Suggested app-relative folders: `src/api`, `src/types`, `src/mocks`, `src/app`, `src/components/ui`, `src/features/browse`, `src/features/cart`, `src/features/auth`, `src/features/orders`, `src/hooks`, `src/styles`, `src/test`. Create only what a task needs. Shared documentation lives in repository-root `docs/`.

The client accepts `AbortSignal`, token input through a safe provider, and typed request options; distinguishes abort/network/HTTP/validation errors; checks HTTP status before consuming a success schema; validates error envelopes; handles invalid JSON safely; and exposes typed operations for all six endpoints. Infer types from schemas or keep one source to avoid schema/type drift. Never cast an unvalidated payload into a trusted type.

Query keys include every effective filter, page and product/order ID. Pass TanStack Query's signal to fetch. Set and explain stale times, avoid retrying 400/401/404/409, and keep stock fresh after orders and live updates. Debounced search must not display old-query results under a new query. Session changes clear user-scoped caches; logout must not expose another user's order data.

## API contract — preserve these endpoints

```ts
type Product = {
  id: string;
  name: string;
  price: number; // integer cents
  category: "keyboards" | "ducks" | "coffee" | "stickers";
  stock: number;
  rating: number;
  imageUrl: string;
};
type ApiError = {
  error: { code: string; message: string; details?: Record<string, string> };
};
```

| Method | Endpoint | Success | Required errors |
| --- | --- | --- | --- |
| GET | `/api/products?search=&category=&sort=&page=` | 200 `{ items: Product[], total: number }` | 500 |
| GET | `/api/products/:id` | 200 `Product` | 404 |
| POST | `/api/login` | 200 `{ token, user }` | 400, 401 |
| GET | `/api/me` | 200 `user` | 401 |
| POST | `/api/orders` | 201 `{ id, status: "queued" }` | 400, 401, 409 |
| GET | `/api/orders/:id` | 200 `{ id, status }` | 401, 404 |

### Contract gaps and explicit mock assumptions

The PDF does not define the following details. Record the choices below in `docs/api-contract.md` and `docs/decisions.md` as local mock assumptions, not requirements quoted from the brief. If an existing shared backend/contract supplies a different definition, use that definition and update tests before building dependent features. Do not invent extra REST endpoints.

- Login body `{ email, password }`; mock user `{ id, name, email }`; Bearer token header; documented fake credentials, expiry/invalid-token scenario and in-memory session lost on reload. No refresh/logout endpoint; logout clears local session. Safe internal-only login return paths prevent open redirects.
- Order body `{ items: Array<{ productId, quantity }> }`; positive integer quantities; the mock validates stock and computes prices independently from product data. Order status union initially `queued | processing | completed | failed`; document deterministic progression and ownership checks for order reads.
- Idempotency uses `Idempotency-Key`: reuse one key for the same logical submission across a network retry, store the key/payload/result in the mock, return the original order for repeats, and reject a changed payload under the same key with a documented 400. Persist or otherwise retain the mock ledger and pending intent across a reload within the demo session; document reset/expiry limits. Disable duplicate submits, but do not mistake this for server-side idempotency.
- Pagination: one-based page, fixed documented page size (default 24), total is the count after filtering and before paging. Search is case-insensitive; sort values `name-asc`, `price-asc`, `price-desc`, `rating-desc`, with deterministic ID tie-breaks. Parse/canonicalize invalid URL values and reset page on filter changes.
- The brief requires an in-stock filter but omits its API parameter. Use a documented optional mock query parameter `inStock=true`, on the existing products endpoint, applied before total/pagination. Label this as a contract clarification; confirm it with the evaluator if strict query compatibility is enforced. Do not filter just the current page and claim the full result count.
- Currency is unspecified; use a configurable documented display currency (default USD) with `Intl.NumberFormat`, preserving cents internally. Validate stock/prices as nonnegative integers; avoid inventing a rating range the shared contract has not established.
- Deterministic 409 error `details` identifies an affected product ID and actionable field data, without showing raw server messages. Centralize safe mappings for 400, 401, 404, 409, 500 and network failures.
- Seed exactly 5,000 stable products. Provide development/test-only controls for each listed HTTP error, loading, empty, malformed response, slow/out-of-order requests and stock changes. They must be reproducible and documented, not random failures in normal use.
- Live transport is not specified. Default to a documented MSW-compatible simulated WebSocket feed using its supported WebSocket API; verify installed support before implementation. Use a fixed documented feed URL, typed stock messages, reconnect/backoff and cancellation. Keep a shared mock inventory source for REST and feed; the simulator changes inventory, not just displayed labels. Reconcile stock after reconnect and clean up timers/listeners/sockets on unmount. This adds a mock transport, not a REST endpoint. An alternative such as polling is allowed by the PDF only with a documented rationale and an explanation of WebSockets.
- Development mocks may use local persistence to support repeatable demo reloads; isolate schema-versioned mock data, never persist credentials, and provide a deliberate reset procedure. Test environments reset state between tests. Production builds must not accidentally enable mocks; if a deployed demo requires them, use a clearly named public demo flag and document that mode explicitly.

## Build and acceptance checklist

Phase 0 is setup work, not an additional scored day. Build Days 1–3 before Day 4 polish. The task scores below total 100.

### Day 1 — Foundation (15 points)

| ID | Pts | Deliverable and acceptance |
| --- | --- | --- |
| D1-1 | 3 | Use the completed Phase 0 inspection and guidance; apply Shopflow display branding and the Tailwind baseline; clear structure, formatting/lint, `.env.example` with public values and `.env` ignored. README enables clone/install/start in under five minutes and explains scripts and environment variables. |
| D1-2 | 3 | Complete `docs/api-contract.md`; mock all six endpoints with exact statuses/shapes, deterministic 5,000-product seed and deliberate error triggers. Add contract tests for success and every listed error. |
| D1-3 | 5 | Strict TypeScript in app and relevant test/tooling configs; typed props/contracts, no explicit `any` or `@ts-ignore`. Use a discriminated union where custom async request state is modeled; use library-provided discriminated results rather than competing booleans for Query state. Type checking passes. |
| D1-4 | 4 | One validated typed HTTP client; components never issue direct network calls. Verify auth header, status mapping, malformed JSON/schema failures and abort behavior. |

Deliver a minimal accessible Tailwind Shopflow shell in Day 1. Do not implement grid/cart/login screens yet. Install test/mock foundations and make Day 1 independently runnable.

### Day 2 — Browse (21 points)

| ID | Pts | Deliverable and acceptance |
| --- | --- | --- |
| D2-1 | 4 | Keyboard-usable product grid and details route; image, name, formatted cents and stock; image fallback, product Not Found and unknown-route fallback. |
| D2-2 | 4 | Search, category, in-stock, sort, count, clear and pagination in URL. Refresh, share links and browser Back/Forward restore the same view. Avoid feedback loops between input drafts and URL state. |
| D2-3 | 4 | Consistent intentionally triggerable loading, empty, error/retry and success on both list/details. Announce meaningful status changes. |
| D2-4 | 3 | Abort in-flight product requests on switches/unmount; no wrong-product flashes; Back to Top uses a cleaned-up scroll listener; all timers/listeners stop on unmount. Verify behavior under React StrictMode. |
| D2-5 | 3 | At least two reusable typed hooks with actual reuse, such as debounce and validated cart storage. Do not create unused hooks merely to satisfy the count. |
| D2-6 | 3 | Simulated slow out-of-order search never shows results for an old query. Include a deterministic behavior test; explain cancellation and query identity. |

### Day 3 — Buy (21 points)

| ID | Pts | Deliverable and acceptance |
| --- | --- | --- |
| D3-1 | 4 | Redux Toolkit cart/session with defined updates and derived count/total selectors. No server catalog duplication in Redux. |
| D3-2 | 7 | Add/remove/update cart; positive integer quantities within current stock; validated cart survives reload; protected checkout and confirmation. Deterministic 409 names the affected item; retries, duplicate clicks and a reload retry do not create a second order within the documented mock session. Clear cart only after confirmed success. |
| D3-3 | 4 | Login/logout, protected account/checkout, safe return path, disabled pending submit. Any 401 clears session; token remains memory-only. `docs/auth.md` explains storage, reload behavior and trade-offs. |
| D3-4 | 3 | Central safe error handling: 400 field errors, 401 sign-out, 404 Not Found, 409 out-of-stock, 500 retry. Never expose raw error messages/bodies. |
| D3-5 | 3 | Revisits reuse cached data; orders invalidate/reconcile stock; explain staleTime and acceptable staleness. Stock and cart remain consistent after updates. |

### Day 4 — Harden (22 points)

| ID | Pts | Deliverable and acceptance |
| --- | --- | --- |
| D4-1 | 3 | Keyboard and screen-reader checks; Lighthouse accessibility >=90 on home/cart/login; form errors announced. Save actual audit evidence and context. |
| D4-2 | 3 | Measure list performance, fix the two slowest observed spots and record comparable before/after measurements for each in `docs/performance.md`. Do not fabricate results. |
| D4-3 | 3 | Smooth access to the 5,000-product catalog; avoid unnecessary renders, bound DOM via paging and add virtualization if measurements warrant it. Justify optimizations and one skipped/removed optimization. Explain the tracker topic even if paging makes virtualization unnecessary. |
| D4-4 | 3 | Live stock without page refresh; feed recovers on disconnect and stops on page close. Validate payloads, update/invalidate cache and reconcile cart quantities visibly rather than silently placing invalid orders. |
| D4-5 | 5 | At least 15 meaningful passing behavior tests covering cart, reusable hooks, login, URL filters, checkout success and 409. Include race/cancellation, 401, idempotency and live cleanup/reconnect where practical; avoid tests that only mirror implementation. |
| D4-6 | 3 | PR CI runs lint, typecheck, tests and build from a clean lockfile install. Configure required status checks/branch protection if authorized and accessible; a green workflow alone does not block merges. If settings are unavailable, document the exact remaining admin action. Automatic main deployment is optional bonus. |
| D4-7 | 2 | Error boundary produces fallback and sanitized log for a deliberate render failure; reset/recovery path. `docs/monitoring.md` lists three signals to track, for example checkout failures, API error rate and client crashes. |

### Day 5 — Explain (21 points)

| ID | Pts | Deliverable and acceptance |
| --- | --- | --- |
| D5-1 | 3 | `docs/ARCHITECTURE.md` matches actual folders, data flow diagram and server/client/URL state ownership; engineer can defend one choice. |
| D5-2 | 2 | In architecture doc, show three patterns actually used, their locations and reasons. |
| D5-3 | 2 | `docs/orders.md` diagrams order service -> queue -> payment/inventory/email workers, why queuing helps, email outage behavior and idempotency preventing double charges. This is architecture documentation; do not build payment workers/microservices for the assignment. |
| D5-4 | 2 | `docs/glossary.md`: latency, idempotency, horizontal scaling, CDN, cache invalidation, eventual consistency, with store examples in the engineer's own words. |
| D5-5 | 2 | Genuine partner architecture review: two strengths, two risks, one recommendation. Codex may assist but must not invent a partner or claim its own review is the peer requirement. |
| D5-6 | 2 | Genuine partner PR review: >=5 useful comments across correctness/readability/accessibility plus one praise; respond to comments on own PR. Requires partner/repository access. |
| D5-7 | 3 | Actual `docs/ai-notes.md` has three uses with prompts/kept/changed/why, one caught AI mistake, and one thing the engineer would not delegate. |
| D5-8 | 2 | `docs/reflection.md` rates every tracker topic /10 and identifies two gaps with one next step each. Engineer supplies personal ratings; Codex can format them. |
| D5-9 | 3 | Final PR with passing CI, complete README and task-prefixed commits. Engineer gives a 10-minute walkthrough showing shopping flow, one hard bug and one trade-off. Codex prepares an outline; it cannot complete the spoken demonstration for the engineer. |

## Feature guidance files to create

Create concise `docs/ai/foundation.md`, `browse.md`, `buy.md`, `harden.md`, and `explain.md` with the relevant task IDs, state/contract constraints, verification expectations and links to this plan. Do not duplicate the entire UI or security prose. These are development guidance; `docs/ai-notes.md` is the separate factual AI-use record.

## Validation and progress reporting

Provide equivalent scripts adapted to the existing package manager: `dev`, `build`, `preview`, `lint`, `typecheck`, `format`, `format:check`, `test`, `test:run`. `test:run` is noninteractive for CI. Check app and test/tooling types, not just a single source folder. A clean install uses the retained lockfile (`npm ci` only for npm).

After each task: run relevant checks, review the diff and scope, explain the outcome and key trade-off, record evidence/status, and make the task-prefixed commit if the user has authorized commits. Do not stage unrelated files. Before each day's completion run lint, typecheck, noninteractive tests and build. Report actual commands/results; distinguish checks not run. Add a production-build smoke check and ensure public env/mocks modes are documented.

Maintain reproducible scenarios and test evidence, not just a checklist of claims. Suggested >=15-test core: cart add/merge, removal, quantity validation, derived totals, storage restore/corruption, debounce cleanup, URL refresh/back, out-of-order search, login success, 400 field errors, 401 session clearing, checkout success, 409 named item, repeated idempotency key, and changed-payload rejection. Add tests for other important behaviors as needed.

Scope boundaries: no actual payment gateway, backend deployment, real queue infrastructure, theme editor or additional product features. Keep the assignment's developer gear categories. Preserve Week 1 history and the JavaScript exercises under `src/practice`. The current `test` command runs a practice script. Keep that script accessible when introducing the assignment test runner.

## Review conclusion and remaining dependencies

The technology changes are compatible with the assignment: React, TypeScript and the API contract are fixed; UI libraries are chosen by the engineer. The original plan was not a full build plan. This version explicitly includes the missing scored work, 5,000 data seed, all endpoint errors, live recovery, >=15 tests, measured performance, accessibility audits, CI merge enforcement, documentation and human submission tasks.

Phase 0 found no API implementation or shared backend contract in the checkout. Begin Day 1 when authorized and check any shared contract the user supplies before building dependent features. The only external dependencies are evaluator acceptance of Shopflow branding/in-stock query clarification if enforced, genuine peer review, personal reflection, Git hosting access/settings and the engineer's walkthrough. Do not block independent implementation on those human tasks; keep them visibly pending.

## Startup prompt — paste into Codex in VS Code

```text
Read this plan and all applicable repository instructions. Implement Phase 0 only. Inspect the root Vite app, npm setup, Git state and existing functionality. Keep the folder and package named shopflow-react, and use Shopflow for visible branding when Day 1 begins. Update this plan and create AGENTS.md, UI.md, the docs/ai guides and review checklist, and docs/progress.md. Preserve Git history and uncommitted work. Leave dependencies, application code and tooling configuration untouched. Do not commit or push. Report the baseline, completed documentation and what Day 1 will implement.
```

## Continuation prompt

```text
Read AGENTS.md, docs/plans/shopflow-codex.plan.md, docs/progress.md and the relevant docs/ai guide. Implement the next incomplete task in order, using UI.md for UI work. Preserve existing behavior and the API contract. Run relevant checks, update progress/evidence and actual AI notes, and explain the change and one key principle. Do not invent measurements, peer reviews or personal reflections. Keep changes scoped to this task and prepare its task-prefixed commit; commit/push only when I have authorized it.
```

## Official setup references

- Codex instruction discovery: https://developers.openai.com/codex/guides/agents-md
- Tailwind with Vite: https://tailwindcss.com/docs/installation/using-vite
- CSS-first Tailwind theme variables: https://tailwindcss.com/docs/theme

Check the installed versions and current official documentation during implementation rather than copying unverified dependency version numbers from this plan.
