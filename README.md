# Shopflow

Shopflow is a developer gear storefront built for The Bug Bazaar assignment. The catalog supports shareable filters, pagination, and product details. The npm package and project folder are named `shopflow-react`.

## Run locally

1. Clone the repository and open the `shopflow-react` folder.
2. Use Node **26.13.0** from `.nvmrc`. The setup was verified with npm **11.20.0**.
3. Run `npm ci`, then `npm run dev`. Open the local URL Vite prints.

### Public environment variables

For the local catalog without a backend, copy `.env.example` to `.env.local`, set `VITE_ENABLE_MOCKS=true`, and restart Vite. Mocks are off by default and only work with the development server. The test runner starts its own mocks automatically. Keep secrets out of all `VITE_` variables because Vite exposes them to the browser.

`VITE_DISPLAY_CURRENCY` controls the price display currency code and defaults to USD. The API still sends integer cents. For a deployed build, serve the shared `/api` endpoints on the same origin and configure the host to send client routes such as `/products/product-0002` to `index.html`.

See the [API contract](docs/api-contract.md#reproduce-scenarios) for links that reproduce catalog and detail states.

## Scripts

| Command                 | Purpose                                                             |
| ----------------------- | ------------------------------------------------------------------- |
| `npm run dev`           | Start the Vite development server                                   |
| `npm run build`         | Build the production shell into `dist`                              |
| `npm run preview`       | Serve the production build locally after building                   |
| `npm run lint`          | Lint the whole repository, including the four known exercise errors |
| `npm run lint:app`      | Lint the app, tests, and tooling                                    |
| `npm run typecheck`     | Strictly check application, test, and TypeScript tooling files      |
| `npm run format`        | Apply Prettier to project files in scope                            |
| `npm run format:check`  | Check formatting without writing files                              |
| `npm test`              | Run Vitest in watch mode during local development                   |
| `npm run test:run`      | Run the test suite once                                             |
| `npm run practice`      | Run the original Week 1 practice script                             |
| `npm run practice:test` | Run the original practice script previously mapped to `npm test`    |

PowerShell users can use `npm.cmd` if their execution policy blocks `npm.ps1`. See [progress](docs/progress.md) for validation and [decisions](docs/decisions.md) for trade-offs.
