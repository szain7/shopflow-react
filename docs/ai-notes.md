# Shopflow AI-use notes

## Day 1

| Prompt excerpt                                                                                               | Work retained                                                                | What changed and why                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| “Replace the starter screen with a minimal, accessible Shopflow shell.”                                      | Codex created the Tailwind theme, heading, landmarks and keyboard skip link. | The unused starter app files were removed as part of the replacement. The Week 1 practice files were preserved.                                                                                       |
| “Document and mock all six endpoints specified in the plan.”                                                 | Codex wrote MSW handlers, deterministic inventory and contract tests.        | The mock ledger uses tab session storage so repeated submissions can be recognized after reload. The available plan is the source for the endpoints, and local details are documented as assumptions. |
| “Implement the centralized fetch client with Zod validation, cancellation support, and safe error handling.” | Codex wrote and tested the typed HTTP client.                                | Tests exercise HTTP failures, bad payloads, cancellation and token handling through the network boundary.                                                                                             |

**Caught during verification:** Codex initially wrote the MSW startup options using `onUnhandledRequest`. TypeScript flagged it against the installed MSW 3 API. Codex inspected the installed types and switched both startup paths to `onUnhandledFrame`.

The engineer's personal judgment about what they would keep under their control remains for D5-7.

## Day 2

| Prompt excerpt                                                            | Work retained                                                                                                               | What changed and why                                                                                                 |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| “Store applied filters in the URL.”                                       | Codex implemented URL parsing, pagination links, and browser history tests.                                                 | Search input keeps a local draft until it settles. The URL remains the source for applied filters.                   |
| “Ensure old-query results never appear as results for the current query.” | Codex added a debounced search, query cancellation, and a test that releases the old response after the new results appear. | The results area hides the previous grid during editing and uses a distinct query key after applying the new search. |
| “Check keyboard interaction and mobile, tablet, and desktop layouts.”     | Codex ran Chrome against the catalog and production preview.                                                                | The smoke check covered the skip link, opening a detail page, and browser reload and history.                        |

**Caught during verification:** Type-aware lint flagged an unsafe read of the Vite currency setting. Codex treated the setting as unknown and checked its type and code format before using it.

## Day 3

| Prompt excerpt                                                          | Work retained                                                                                           | What changed and why                                                                                                            |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| “Derive the header cart count and total through selectors.”             | Codex added the Redux cart, validated persistence and selectors.                                        | TanStack Query kept ownership of stock and catalog data. Cart quantities remain visible when stock falls.                       |
| “Reuse the same idempotency key for retries of the same logical order.” | Codex saved a frozen request and added tests for duplicate submits, replay and reload.                  | The lost-response test creates an order before dropping the response. It recreates both app and mock state for the reload case. |
| “Verify the full flow in the browser with mocks enabled.”               | Codex ran Chrome through purchase, sign-out, cart persistence, and a competing order that caused a 409. | The browser check also measured horizontal overflow at three viewport widths.                                                   |

**Caught during verification:** The first sign-out handler and the protected-route guard both tried to redirect. The test exposed the navigation conflict. Codex removed the extra redirect and verified that the existing guard takes the signed-out user to login.
