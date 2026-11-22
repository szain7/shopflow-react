# React review checklist

Use this with the [plan](../plans/shopflow-codex.plan.md), [repository guidance](../../AGENTS.md) and [UI standards](../../UI.md).

- [ ] Architecture keeps transport, features and shared UI in their intended layers.
- [ ] Hook dependencies reflect the values effects read. Requests, timers, listeners and sockets stop when obsolete, including under StrictMode.
- [ ] URL, Query, Redux and local UI state each own the appropriate data. Selectors derive values that can be computed from existing state.
- [ ] List keys are stable, stale responses cannot flash, and render costs are measured before optimizing.
- [ ] Strict TypeScript covers props and boundary values. External data is validated before use.
- [ ] Names are clear and components and hooks have understandable responsibilities.
- [ ] Keyboard access, visible focus, labels, announcements and error recovery work.
- [ ] Loading, empty, error and success states are safe and testable.
- [ ] Tailwind classes follow the theme and work across mobile, tablet and desktop layouts.
- [ ] Secrets and auth stay out of persistent storage, logs and devtools. Untrusted content renders as text and checkout idempotency is enforced by the mock or server.

For each finding, report the file and line, the problem, its impact and a concrete fix. Recheck fixes with the relevant test or reproduction steps and record the result.
