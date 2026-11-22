# Shopflow monitoring

| Signal                                                 | Purpose                                                                                                                                                                       |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Render failure count                                   | Spot releases that leave shoppers on the recovery screen. The current boundary emits the fixed event `shopflow.render_failure`.                                               |
| API failure rate by endpoint template and status class | Separate a catalog outage from sign-in or order failures. Record only an endpoint template, status class, and safe error kind.                                                |
| Checkout failure and retry rate by outcome             | Detect order submission trouble and distinguish stock conflicts from ambiguous network failures. Count outcomes without including form fields, order bodies, tokens, or keys. |

The render boundary moves focus to its heading and offers **Try again**, which remounts the page and moves focus to the main landmark. The production root delegates caught render failures to the boundary and emits the same fixed event for an uncaught render failure. Use the deliberate render-failure test to verify fallback, sanitized output, and recovery. API and checkout signals are proposed. The app has no remote telemetry collector.
