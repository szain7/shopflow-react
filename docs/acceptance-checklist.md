# Shopflow final acceptance checklist

Use the [assignment plan](plans/shopflow-codex.plan.md) for the full criteria and the [progress tracker](progress.md) for evidence and commits. Local completion reflects repository evidence. External checks and personal work below remain open.

| Task | Acceptance item                                                                      | Status                                                                  |
| ---- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| D1-1 | [Project setup and UI conventions](../UI.md)                                         | Verified locally                                                        |
| D1-2 | [API contracts and mocks](api-contract.md)                                           | Verified locally                                                        |
| D1-3 | [Strict TypeScript](../tsconfig.json)                                                | Verified locally                                                        |
| D1-4 | [Typed client and runtime validation](../src/api/client.ts)                          | Verified locally                                                        |
| D2-1 | [Catalog routing and product UI](../src/App.tsx)                                     | Verified locally                                                        |
| D2-2 | [URL state and pagination](../src/features/browse/catalog-url.ts)                    | Verified locally                                                        |
| D2-3 | [Loading, empty, error and success states](../src/features/browse/BrowseMessage.tsx) | Verified locally                                                        |
| D2-4 | [Effect cleanup, request cancellation and StrictMode](../src/test/App.test.tsx)      | Verified locally                                                        |
| D2-5 | [Reusable typed hooks](../src/hooks/)                                                | Verified locally                                                        |
| D2-6 | [Debounce and search races](../src/test/App.test.tsx)                                | Verified locally                                                        |
| D3-1 | [Redux and selectors](../src/app/store.ts)                                           | Verified locally                                                        |
| D3-2 | [Cart persistence, stock and order idempotency](../src/test/buy.test.tsx)            | Verified locally                                                        |
| D3-3 | [Authentication and session storage](auth.md)                                        | Verified locally                                                        |
| D3-4 | [Safe API errors](../src/api/client.ts)                                              | Verified locally                                                        |
| D3-5 | [Server cache and invalidation](../src/features/browse/browse-queries.ts)            | Verified locally                                                        |
| D4-1 | [Keyboard and assistive technology](accessibility.md)                                | Pending standalone screen-reader verification                           |
| D4-2 | [Latency measurement and profiling](performance.md)                                  | Verified locally                                                        |
| D4-3 | [Bounded rendering and virtualization](performance.md)                               | Verified locally                                                        |
| D4-4 | [WebSockets and reconnect](../src/test/stock-feed.test.tsx)                          | Verified locally                                                        |
| D4-5 | [Behavior testing](../src/test/)                                                     | Verified locally                                                        |
| D4-6 | [CI and branch protection](ci.md)                                                    | Pending hosted PR run and check enforcement                             |
| D4-7 | [Error boundaries and monitoring](monitoring.md)                                     | Verified locally                                                        |
| D5-1 | [Architecture and state ownership](ARCHITECTURE.md)                                  | Documentation ready. Present your design choice during the walkthrough. |
| D5-2 | [Design patterns and trade-offs](ARCHITECTURE.md)                                    | Verified locally                                                        |
| D5-3 | [Queues, workers and eventual consistency](orders.md)                                | Verified locally                                                        |
| D5-4 | [Latency, idempotency, scaling, CDN, invalidation and consistency](glossary.md)      | Draft for personal wording review                                       |
| D5-5 | [Architecture peer review](peer-review.md)                                           | Pending genuine partner architecture review                             |
| D5-6 | [PR feedback and code review](peer-review.md)                                        | Pending genuine PR reviews and responses                                |
| D5-7 | [Responsible AI use](ai-notes.md)                                                    | Draft awaiting what you would not delegate and why                      |
| D5-8 | [Self-assessment and learning plan](reflection.md)                                   | Draft awaiting tracker, self-ratings and learning gaps                  |
| D5-9 | [PR and technical walkthrough](walkthrough.md)                                       | Pending final PR with passing CI and live walkthrough                   |
