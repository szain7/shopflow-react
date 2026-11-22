# Shopflow authentication

Use the fake credentials `learner@example.test` and `shopflow-demo` with development mocks enabled. Start with [local setup](../README.md).

The login form sends credentials through the typed API client. A successful response puts the bearer token and user ID in Redux memory. The account page fetches the profile with TanStack Query. Passwords are never stored by the application, and neither credentials nor tokens go into browser storage, URLs, logs, or Redux DevTools. Redux DevTools integration is disabled because it could otherwise expose session state or login actions.

A reload creates a new store and requires another sign-in. The mock token is valid for 30 minutes in the running page. Sign-out clears the local session. A 401 clears the session that was active when the request started. A late response cannot sign out a newer session. The client attaches the token only to protected requests. Session changes remove the private account and order queries and cancel their in-flight reads. Each sign-in also gets a fresh, non-secret cache scope so a previous session's data has a different query key. Public catalog cache stays available.

Account, checkout, and order confirmation require a session. After sign-in, the router accepts only known internal routes as return destinations. Signing out from a protected page leads to sign-in. The mock still enforces bearer-token checks and order ownership independently of client routing.

The cart survives reload via validated local storage. A pending checkout stores the order body, owner ID, and idempotency key in tab session storage. These fields identify which operation to repeat after signing in again. They carry no credentials or tokens.

This is a training demo. Memory-only storage limits token persistence at the cost of another sign-in after refresh. Production session design would need a server-managed lifecycle and revocation.
