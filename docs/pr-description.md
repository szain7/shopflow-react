# Local PR description draft

## Title

Build the Shopflow storefront and document the assignment

## Summary

- Add a searchable, paginated 5,000-product catalog, product pages and responsive layouts.
- Add a persisted cart, mock sign-in, protected checkout and order confirmation with tab-scoped replay protection.
- Refresh stock through the development WebSocket feed. Display conflicts while preserving requested quantities.
- Include a render recovery screen, local performance and accessibility evidence, and an application-check workflow.

## How to review

Follow the [README](../README.md), then browse, add a product, change its quantity, sign in, check out and open confirmation. Try the named stock-conflict scenario and inspect the [API contract](api-contract.md). Compare the implemented checkout to the [proposed production order system](orders.md).

## Validation and remaining items

Local evidence is in [progress](progress.md), [accessibility](accessibility.md) and [performance](performance.md). Before submitting, attach the hosted **Application checks** result, confirm enforcement on the intended base branch, record standalone screen-reader results, and link genuine peer feedback. Review the [acceptance checklist](acceptance-checklist.md) and fill the personal AI-use and reflection fields.
