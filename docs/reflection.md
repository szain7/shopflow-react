# Shopflow reflection draft

The original assignment tracker and PDF are absent from this checkout. The table covers all 31 entries in the available [implementation plan](plans/shopflow-codex.plan.md) as a provisional evidence index. Supply the official tracker to confirm coverage and add or rename its topics. Evidence shows where to review the work. Add your own rating out of 10 for each official topic.

| Task | Topic to reflect on                                              | Evidence to review                                            | My rating /10 |
| ---- | ---------------------------------------------------------------- | ------------------------------------------------------------- | ------------- |
| D1-1 | Project setup and UI conventions                                 | [Project reference](../UI.md)                                 | —             |
| D1-2 | API contracts and mocks                                          | [Project reference](api-contract.md)                          | —             |
| D1-3 | Strict TypeScript                                                | [Project reference](../tsconfig.json)                         | —             |
| D1-4 | Typed client and runtime validation                              | [Project reference](../src/api/client.ts)                     | —             |
| D2-1 | Catalog routing and product UI                                   | [Project reference](../src/App.tsx)                           | —             |
| D2-2 | URL state and pagination                                         | [Project reference](../src/features/browse/catalog-url.ts)    | —             |
| D2-3 | Loading, empty, error and success states                         | [Project reference](../src/features/browse/BrowseMessage.tsx) | —             |
| D2-4 | Effect cleanup, request cancellation and StrictMode              | [Project reference](../src/test/App.test.tsx)                 | —             |
| D2-5 | Reusable typed hooks                                             | [Project reference](../src/hooks/)                            | —             |
| D2-6 | Debounce and search races                                        | [Project reference](../src/test/App.test.tsx)                 | —             |
| D3-1 | Redux and selectors                                              | [Project reference](../src/app/store.ts)                      | —             |
| D3-2 | Cart persistence, stock and order idempotency                    | [Project reference](../src/test/buy.test.tsx)                 | —             |
| D3-3 | Authentication and session storage                               | [Project reference](auth.md)                                  | —             |
| D3-4 | Safe API errors                                                  | [Project reference](../src/api/client.ts)                     | —             |
| D3-5 | Server cache and invalidation                                    | [Project reference](../src/features/browse/browse-queries.ts) | —             |
| D4-1 | Keyboard and assistive technology                                | [Project reference](accessibility.md)                         | —             |
| D4-2 | Latency measurement and profiling                                | [Project reference](performance.md)                           | —             |
| D4-3 | Bounded rendering and virtualization                             | [Project reference](performance.md)                           | —             |
| D4-4 | WebSockets and reconnect                                         | [Project reference](../src/test/stock-feed.test.tsx)          | —             |
| D4-5 | Behavior testing                                                 | [Project reference](../src/test/)                             | —             |
| D4-6 | CI and branch protection                                         | [Project reference](ci.md)                                    | —             |
| D4-7 | Error boundaries and monitoring                                  | [Project reference](monitoring.md)                            | —             |
| D5-1 | Architecture and state ownership                                 | [Project reference](ARCHITECTURE.md)                          | —             |
| D5-2 | Design patterns and trade-offs                                   | [Project reference](ARCHITECTURE.md)                          | —             |
| D5-3 | Queues, workers and eventual consistency                         | [Project reference](orders.md)                                | —             |
| D5-4 | Latency, idempotency, scaling, CDN, invalidation and consistency | [Project reference](glossary.md)                              | —             |
| D5-5 | Architecture peer review                                         | [Project reference](peer-review.md)                           | —             |
| D5-6 | PR feedback and code review                                      | [Project reference](peer-review.md)                           | —             |
| D5-7 | Responsible AI use                                               | [Project reference](ai-notes.md)                              | —             |
| D5-8 | Self-assessment and learning plan                                | [Project reference](reflection.md)                            | —             |
| D5-9 | PR and technical walkthrough                                     | [Project reference](walkthrough.md)                           | —             |

## Two learning gaps

| My learning gap | One next step I will take |
| --------------- | ------------------------- |
| —               | —                         |
| —               | —                         |
