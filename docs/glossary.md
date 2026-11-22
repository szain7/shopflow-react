# Shopflow glossary draft

Review these examples and rewrite any wording you would explain differently during the walkthrough.

| Term                 | In plain language                                                     | Shopflow example                                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Latency              | How long you wait for an action to respond.                           | A slow mock search makes the wait between applying a filter and seeing results easy to notice.                                                                                        |
| Idempotency          | Repeating the same operation has the same effect as doing it once.    | If an order reply is lost, repeating the same body and key returns the original order within the mock tab session.                                                                    |
| Horizontal scaling   | Add more copies of a service so they can share the work.              | In a production version, several order workers could pull jobs from one queue. They would share durable order state so two workers cannot charge the same order.                      |
| CDN                  | A network that serves copies of files from locations closer to users. | A deployed storefront could put built JavaScript, CSS and product images on a CDN to shorten downloads.                                                                               |
| Cache invalidation   | Mark saved data stale so the app can fetch a newer copy.              | After an order or stock message, Shopflow invalidates product queries so the next result reflects stock changes.                                                                      |
| Eventual consistency | Different views can disagree briefly and converge as updates arrive.  | After inventory falls, the cart can briefly show its cached availability. The feed triggers a refresh, and the cart then shows the shortage without changing your requested quantity. |
