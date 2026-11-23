# Shopflow pull-request checks

The [workflow](../.github/workflows/application-checks.yml) runs `npm ci`, `npm run lint:app`, `npm run typecheck`, `npm run test:run`, and `npm run build` on GitHub pull requests. The **Application checks** job lints application, test, and tooling code. Repository-wide `npm run lint` now excludes the preserved `src/practice/practice.js` exercise. Its four earlier findings remain recorded in the [progress tracker](progress.md).

A repository administrator still needs to run the workflow on a pull request, then enable **Require status checks to pass before merging** for the intended base branch in GitHub branch protection or a ruleset. Select **Application checks**, from the **Shopflow CI** workflow, as reported on that PR and restrict the source to GitHub Actions when available. To require results based on the current base branch, enable **Require branches to be up to date before merging**. Apply the rule to the intended contributors and configure bypass permissions according to repository policy. Verify with a failing check on a test PR before relying on merge blocking.

The workflow runs from the repository root and uses Node 26.13.0 from `.nvmrc` and the root `package-lock.json`. Its commands passed locally after a clean install. The GitHub-hosted run and branch-protection settings remain unverified.
