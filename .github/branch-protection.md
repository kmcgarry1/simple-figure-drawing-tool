# Branch protection baseline

Use this baseline for `main` so pull requests cannot merge without quality and security gates.

## Recommended settings

1. Require a pull request before merging.
2. Require approvals: `1` minimum.
3. Dismiss stale approvals when new commits are pushed.
4. Require status checks to pass before merging.
5. Require branches to be up to date before merging.
6. Include administrators.
7. Restrict force pushes.
8. Restrict deletion.

## Required status checks

- `checks`
- `e2e`
- `Analyze (javascript-typescript)`

## GitHub UI path

1. Repo `Settings`
2. `Branches`
3. Add or edit protection rule for `main`
4. Enable the settings above and select required checks
