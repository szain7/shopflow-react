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

## Checkout retries

The UI saves one UUID and the exact order body to `shopflow.checkout.v1` in tab session storage before sending a new order. The mock keeps the corresponding order and key in its own ledger. With the same tab and mock session, a lost response can be retried after signing in again, even if the original order already reserved the remaining stock. The cart is updated only after a validated 201. A definitive 400 or 409 unlocks the cart for corrections. A network error, 500, malformed success, or 401 preserves the original request for manual retry. Mutations do not retry automatically.

The cart uses `shopflow.cart.v1` in local storage. Clearing the mock ledger or the pending intent during an unresolved order can remove the recovery guarantee. Keep both tab storage records until checkout resolves. This demo's guarantee is scoped to the tab session and the same account.

## Reproduce scenarios

Enable browser mocks in development as described in the [README](../README.md), then try this in the dev page console.

```js
await (await fetch('/api/products?page=1')).json()
await fetch('/api/products', { headers: { 'X-Shopflow-Mock': 'server-error' } })
```

The `X-Shopflow-Mock` header supports `server-error` (500), `empty` (an empty list or product 404), `slow` (600 ms delay), `malformed` (broken JSON), and `invalid-data` (wrong schema). Each applies to list and detail requests.

With development or public demo mocks enabled, the browser routes accept the same scenario names in `mock`. Remove the parameter for normal success. A forced failure remains active on retry until the scenario is removed.

| Scenario         | Catalog URL           | Detail URL                                 |
| ---------------- | --------------------- | ------------------------------------------ |
| Loading          | `/?mock=slow`         | `/products/product-0002?mock=slow`         |
| Empty or missing | `/?mock=empty`        | `/products/product-0002?mock=empty`        |
| Error and retry  | `/?mock=server-error` | `/products/product-0002?mock=server-error` |
| Success          | `/`                   | `/products/product-0002`                   |

For a race, open `/?mock=race`. Type `duck`, let its request start after the 300 ms debounce, then replace it with `coffee` while the duck request is pending. The mock delays the duck request by 600 ms and serves coffee immediately. The app cancels the obsolete request and only displays results for the current search.

Use a missing product ID for product 404. Submit a malformed login body for 400, or a syntactically valid email and wrong password for 401. Use a missing or invalid bearer token on protected endpoints for 401, and a valid token with a missing order ID for order 404. With valid auth and a new idempotency key, use an empty array for order 400 or request two units of `product-0002` for 409. That product starts with one unit. Ordering one unit changes it to zero. Start a fresh tab or reset the ledger for a repeatable stock test.

Development, the test runner, and the Pages demo use the same REST handlers. Ordinary production builds omit the service worker unless the public demo flag is enabled. On Pages, the paths in this contract are relative to the project base, so `/api/products` is requested as `/shopflow-react/api/products`. The Pages router keeps route parameters and filters inside the hash.

## Live mock stock

With mocks enabled, the catalog, product details, cart, and checkout share one WebSocket at the same-origin `/mock/stock` path under the deployment base. MSW 3.0.7 uses `ws.link` from `msw/ws`. The mock cycles the base stock of `product-0002` through 0, 4, and 1 at eight-second intervals. REST and order validation read the same inventory state and subtract existing reservations. Reloading resets the simulated base stock. Tab orders still follow the ledger's lifetime above.

A frame has shape `{ type: "stock", productId: string, stock: nonnegative integer }`. The app validates frames and refetches product queries, including lists whose membership depends on availability. On disconnect it retries after 500 ms with exponential backoff capped at eight seconds. Opening or reopening the connection refetches product data to recover missed changes, including when a shopper returns from a route without a feed. Leaving the shopping routes stops the connection and cancels retries. For a visible demonstration, add Debug Duck 0001 to the cart before its first tick and stay on the cart. The stock warning changes and the requested quantity stays visible.
