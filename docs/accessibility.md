# Day 4 accessibility audit

Measured 22 November 2026 with Lighthouse 13.6.0 accessibility snapshots in headless Chrome 157.0.8103.79 on Windows. Vite served the local development app, `VITE_ENABLE_MOCKS=true`, and the browser used a 360 × 800 mobile viewport with device scale factor 1. Snapshots were taken after content loaded. The cart contained two units of one product, and login was reached through protected checkout.

| Route                          |   Score | Weighted failures |
| ------------------------------ | ------: | ----------------- |
| `/` catalog with product cards | 100/100 | 0                 |
| `/cart` populated cart         | 100/100 | 0                 |
| `/login?returnTo=%2Fcheckout`  | 100/100 | 0                 |

Chrome verified that Tab reaches the skip link and Enter moves focus to the main landmark. The cart quantity field accepted keyboard editing. Submitting the empty login form focused the email field, associated the field with its error using `aria-describedby`, and exposed the alert role in Chrome's accessibility tree. Lighthouse checked automated label and contrast rules. The cart, login, checkout, and confirmation fit the mobile viewport. Audible announcements in a standalone screen reader remain to be checked.

The audits used [Lighthouse's snapshot API](https://github.com/GoogleChrome/lighthouse/blob/main/docs/readme.md) so the catalog and populated cart could finish loading before evaluation.
