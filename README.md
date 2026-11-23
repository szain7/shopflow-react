# Shopflow

Shopflow is a developer gear storefront built for The Bug Bazaar assignment. Browse the catalog, build a cart, and place a training order with the local mocks. The npm package and project folder are named `shopflow-react`.

## Run locally

1. Clone the repository and open the `shopflow-react` folder.
2. Use Node **26.13.0** from `.nvmrc`. The setup was verified with npm **11.20.0**.
3. Run `npm ci`.
4. Copy `.env.example` to `.env.local` and set `VITE_ENABLE_MOCKS=true`.
5. Run `npm run dev`. Open the local URL Vite prints, usually `http://localhost:5173/`.

### Public environment variables

For the local catalog without a backend, copy `.env.example` to `.env.local`, set `VITE_ENABLE_MOCKS=true`, and restart Vite. Mocks are off by default and only work with the development server. The test runner starts its own mocks automatically. Keep secrets out of all `VITE_` variables because Vite exposes them to the browser.

`VITE_DISPLAY_CURRENCY` controls the price display currency code and defaults to USD. The API still sends integer cents. For a deployed build, serve the shared `/api` endpoints on the same origin and configure the host to send client routes such as `/products/product-0002` to `index.html`.

See the [API contract](docs/api-contract.md#reproduce-scenarios) for links that reproduce catalog and detail states.

To try checkout, add a product, open the cart, and select **Checkout**. Use the mock email `learner@example.test` and password `shopflow-demo`. The sign-in route is `/login`.

## Features and demo limits

- Browse 5,000 mock products with shareable filters, sorting, pagination, and detail pages.
- Update the persisted cart, sign in, check out, and view confirmation. The cart survives reload. The memory-only session requires another sign-in.
- Live mock stock uses a WebSocket. Stock conflicts keep the requested quantity visible and show what to change.
- Checkout retry protection applies to the same account and mock tab session while the pending intent and ledger survive. The demo simulates order status and stock reservations. Live payments and fulfillment workers are outside its scope. See [authentication](docs/auth.md) and [orders](docs/orders.md).

## Scripts

| Command                 | Purpose                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`           | Start the Vite development server                                             |
| `npm run build`         | Build the production shell into `dist`                                        |
| `npm run preview`       | Serve the production build locally after building                             |
| `npm run lint`          | Lint the repository, excluding generated files and `src/practice/practice.js` |
| `npm run lint:app`      | Lint the app, tests, and tooling                                              |
| `npm run typecheck`     | Strictly check application, test, and TypeScript tooling files                |
| `npm run format`        | Apply Prettier to project files in scope                                      |
| `npm run format:check`  | Check formatting without writing files                                        |
| `npm test`              | Run Vitest in watch mode during local development                             |
| `npm run test:run`      | Run the test suite once                                                       |
| `npm run practice`      | Run the original Week 1 practice script                                       |
| `npm run practice:test` | Run the original practice script previously mapped to `npm test`              |

PowerShell users can use `npm.cmd` if their execution policy blocks `npm.ps1`. See [progress](docs/progress.md) for validation and [decisions](docs/decisions.md) for trade-offs.

## Documentation

- [Architecture](docs/ARCHITECTURE.md), [API and mock scenarios](docs/api-contract.md), and [glossary](docs/glossary.md)
- [Accessibility](docs/accessibility.md), [performance](docs/performance.md), [monitoring](docs/monitoring.md), and [CI setup](docs/ci.md)
- [Acceptance checklist](docs/acceptance-checklist.md), [PR draft](docs/pr-description.md), and [walkthrough](docs/walkthrough.md)
