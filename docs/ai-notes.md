# Shopflow AI-use notes

## Day 1

| Prompt excerpt                                                                                               | Work retained                                                                | What changed and why                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| “Replace the starter screen with a minimal, accessible Shopflow shell.”                                      | Codex created the Tailwind theme, heading, landmarks and keyboard skip link. | The unused starter app files were removed as part of the replacement. The Week 1 practice files were preserved.                                                                                       |
| “Document and mock all six endpoints specified in the plan.”                                                 | Codex wrote MSW handlers, deterministic inventory and contract tests.        | The mock ledger uses tab session storage so repeated submissions can be recognized after reload. The available plan is the source for the endpoints, and local details are documented as assumptions. |
| “Implement the centralized fetch client with Zod validation, cancellation support, and safe error handling.” | Codex wrote and tested the typed HTTP client.                                | Tests exercise HTTP failures, bad payloads, cancellation and token handling through the network boundary.                                                                                             |

**Caught during verification:** Codex initially wrote the MSW startup options using `onUnhandledRequest`. TypeScript flagged it against the installed MSW 3 API. Codex inspected the installed types and switched both startup paths to `onUnhandledFrame`.

The engineer's personal judgment about what they would keep under their control remains for D5-7.
