# Shopflow repository guidance

Shopflow implements The Bug Bazaar assignment in the root Vite + React app. Keep the directory and npm package named `shopflow-react`. Use **Shopflow** for visible branding. Use React, strict TypeScript and Tailwind for assignment code. Keep Week 1 exercises and history intact. This training demo covers developer gear browsing, cart, mock authentication, checkout and order status. Real payments, production authentication and backend infrastructure are outside scope.

## Read before working

- Check the [plan](docs/plans/shopflow-codex.plan.md) and [progress tracker](docs/progress.md) for the authorized phase, task IDs and acceptance criteria. Apply any more specific instructions for the files you touch.
- Read [UI.md](UI.md) before every UI change and use the [React review checklist](docs/ai/react-review.md) before marking implementation complete.
- Route API, types and setup to [Foundation](docs/ai/foundation.md), product browsing to [Browse](docs/ai/browse.md), cart, auth and orders to [Buy](docs/ai/buy.md), tests, CI and live stock to [Harden](docs/ai/harden.md), and submission docs to [Explain](docs/ai/explain.md).

## Learning and workflow

- Explain meaningful changes in plain language, including the principle and a trade-off. The engineer should be able to explain the submitted code. Record actual library choices and alternatives in `docs/decisions.md` and notable AI use in `docs/ai-notes.md` as work proceeds. Use genuine peer feedback, measurements and personal reflections.
- Preserve unrelated work. Review the diff and run relevant checks after each task. Record status, evidence, remaining work and any commit in the tracker. Report failures and checks still pending. Before completing a day, run npm lint, typecheck, noninteractive tests and build, and smoke-check the production build. Use the npm lockfile for clean installs.
- When authorized, make at least one separate commit per assignment task prefixed with its ID. Stage only task files. Daily pushes and the final PR are submission requirements that require authorization. Report any access or participation still needed.
- Keep strict checks and tests enabled. Avoid explicit `any` and `@ts-ignore`. Validate unknown external values before use.

## API and security

- Follow the shared API in the plan. Keep money in integer cents until formatting. HTTP transport belongs in `src/api/client.ts`. Components use feature hooks or typed client operations.
- Keep secrets out of source and public `VITE_` settings. Keep session tokens in memory only, including in Redux. Exclude session data from persistence and redact auth from logs and devtools. Validate persisted cart data.
- Render untrusted content as text. Avoid `dangerouslySetInnerHTML` for product and API data. Validate payloads, map errors to safe user messages and keep credentials and raw sensitive bodies out of logs.
- Require server/mock-enforced checkout idempotency. Automatic retries require idempotent operations. Keep mock persistence scoped to the demo and use fake credentials only.
