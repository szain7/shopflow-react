# Shopflow API contract

The [assignment plan](plans/shopflow-codex.plan.md#api-contract--preserve-these-endpoints) is the available source for these six routes. Day 1 found no separate authoritative backend contract in the repository. The Mock behavior section records local choices for details the plan leaves open.

| Method and route                                  | Request                                                                 | Success                                   | Required errors                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------- |
| GET `/api/products?search=&category=&sort=&page=` | Optional filters                                                        | 200 `{ items: Product[], total: number }` | 500 catalog unavailable                                       |
| GET `/api/products/:id`                           | Product ID                                                              | 200 `Product`                             | 404 product missing                                           |
| POST `/api/login`                                 | `{ email, password }`                                                   | 200 `{ token, user }`                     | 400 invalid fields, 401 wrong credentials                     |
| GET `/api/me`                                     | Bearer token                                                            | 200 `user`                                | 401 invalid or expired token                                  |
| POST `/api/orders`                                | Bearer token, `Idempotency-Key`, `{ items: [{ productId, quantity }] }` | 201 `{ id, status: "queued" }`            | 400 invalid request, 401 unauthorized, 409 insufficient stock |
| GET `/api/orders/:id`                             | Bearer token, order ID                                                  | 200 `{ id, status }`                      | 401 unauthorized, 404 missing or inaccessible                 |

A product has string fields `id`, `name` and `imageUrl`, nonnegative integer cents in `price`, nonnegative integer `stock`, numeric `rating`, and a `category` of `keyboards`, `ducks`, `coffee`, or `stickers`. The error envelope is `{ error: { code, message, details? } }`, with optional string-to-string `details`. The client maps HTTP errors to fixed, safe messages and only returns validated field codes or stock metadata.

## Mock behavior

- The catalog has exactly 5,000 stable products, with 1,250 per category. Search trims whitespace and matches names case-insensitively. Sort accepts `name-asc` (default), `price-asc`, `price-desc`, and `rating-desc`, with ID as a tie-break. Pages start at 1 and have 24 results. Invalid page, category, or sort parameters fall back to defaults. The mock-only `inStock=true` filter applies before totals and pagination. Confirm this extension if the evaluator requires strict query compatibility.
- The mock user is `{ id, name, email }`. Use the fake credentials `learner@example.test` and `shopflow-demo`. Login returns a token valid for 30 minutes in the current page. Reload invalidates it. There is no refresh or logout route. The future UI will clear its own session on logout.
- Order items require unique product IDs and positive integer quantities. The mock looks up stock and prices and computes totals from the catalog. Documented display currency is USD by default. The order request and result carry no formatted price.
- The key is required and may have up to 200 characters. A repeated key and equivalent items return the original ID and 201 response, including after a reload and a fresh login. Changed items under the same key return 400 with `IDEMPOTENCY_MISMATCH`. Item order does not affect equivalence. The browser stores the order ledger in tab session storage under `shopflow.mock-orders.v1`, without tokens or credentials. Clearing that key and reloading resets orders and stock. Closing the tab normally ends the demo session. The future checkout UI owns keeping the same key and pending intent across reloads.
- Each order belongs to the demo user. Its status is `queued` for the first two seconds, `processing` until five seconds have passed, then `completed`. The client accepts `failed` for future failure scenarios. Updating reserved stock and writing the ledger are part of the same mock operation.
- Login 400 field details use `email` and `password` with value `INVALID`. A stock conflict returns code `OUT_OF_STOCK` and details `{ productId, available }`, where `available` is a string containing the available quantity.

## Reproduce scenarios

Enable browser mocks in development as described in the [README](../README.md), then try this in the dev page console.

```js
await (await fetch('/api/products?page=1')).json()
await fetch('/api/products', { headers: { 'X-Shopflow-Mock': 'server-error' } })
```

The `X-Shopflow-Mock` header supports `server-error` (500, list only), `empty` (list only), `slow` (600 ms delay on list or detail), `malformed` (broken JSON on list or detail) and `invalid-data` (wrong schema on list or detail). Start a slow search followed by a normal request to reproduce out-of-order arrivals.

Use a missing product ID for product 404. Submit a malformed login body for 400, or a syntactically valid email and wrong password for 401. Use a missing or invalid bearer token on protected endpoints for 401, and a valid token with a missing order ID for order 404. With valid auth and a new idempotency key, use an empty array for order 400 or request two units of `product-0002` for 409. That product starts with one unit. Ordering one unit changes it to zero. Start a fresh tab or reset the ledger for a repeatable stock test.

The development server and test runner use the same handlers. Production builds do not register the service worker, even when the environment flag is set. Live stock transport belongs to Day 4.
