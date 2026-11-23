# Shopflow AI-use notes

## 1. AI uses

| Prompt excerpt                                                          | What was kept                                                                                                                                                               | What changed and why                                                                                                                                                   |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| “Store applied filters in the URL.”                                     | React Router owns applied filters and pagination.                                                                                                                           | Search drafts stay local until applied. The Day 2 review added cleanup for unsubmitted text so Back and Forward restore the applied URL state.                         |
| “Reuse the same idempotency key for retries of the same logical order.” | Checkout saves the order body and key before submitting and reuses both on retry.                                                                                           | The lost-response test recreates the app and mock ledger after reload. It verifies that retry returns the original order after the mock has already reserved stock.    |
| “Measure catalog performance before making optimizations.”              | Before-and-after measurements used the same workload. The measurements cover local mock-handler processing only. Browser rendering speed was outside the measurement scope. | The mock reuses stable sort orders and prepares stock rows only for the requested page because sorting and stock-row preparation were the two slowest measured stages. |

[Performance measurements](performance.md)

## 2. AI mistake and how it was caught

The AI-generated sign-out handler and the protected-route guard both attempted to redirect. The login/logout test exposed the conflict. The extra redirect was removed so the route guard owned navigation. The test was rerun and verified that signing out from the protected account page clears private data and returns the shopper to sign-in. [Login/logout test](../src/test/buy.test.tsx) · [Authentication implementation](../src/features/auth/AuthPages.tsx)

## 3. One responsibility I would keep under my control

- **Responsibility:** Reviewing and approving the final code before merging.
- **Why:** I need to understand the code, check that it meets the requirements, and verify important flows such as login and checkout. AI can assist, but I remain responsible for what I submit.

[Day 1–4 AI development log](ai-development-log.md)
