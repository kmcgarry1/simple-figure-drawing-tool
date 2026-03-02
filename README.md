# Figure Drawing Slideshow (Vue)

A Vue 3 app for figure drawing practice with uploaded reference images.

## Features

- Landing experience:
  - Setup complexity is moved into a step-based modal wizard to reduce home-screen clutter.
  - Landing panel keeps only setup progress, primary actions, and live status.
  - Non-live layout is single-column; the image stage appears only during live fullscreen session.
- Advanced setup:
  - Visual photo list with thumbnails, manual up/down reordering, and per-photo tags.
  - Reordered list is used for class sessions in sequential photo order mode.
- Quick session mode:
  - Load individual images or an entire folder in one step.
  - Accepts up to 2000 uploaded images per load.
  - Randomly picks up to 10 images.
  - Removes unselected uploads after each random pick.
  - Uses one editable duration for every slide.
- Life drawing class wizard:
  - Built-in 1 hour, 2 hour, and 3 hour class presets.
  - Final pose defaults:
    - 1 hour class: 10 minutes
    - 2 hour class: 30 minutes
    - 3 hour class: 60 minutes
  - Editable pose blocks (name, seconds per pose, pose count).
  - Shuffle or sequential photo order.
  - Optional back-to-back repeat prevention in shuffle mode.
- Live mode:
  - Full-screen stage.
  - Per-pose countdown with progress bar.
  - Pose counter, active pose label, and total session time remaining.
  - Keyboard shortcuts: `Space` pause/resume, `Right Arrow` next, `Esc` end.
- Professional baseline:
  - Persistent session preferences (`localStorage`).
  - Modal focus trap + focus return for keyboard users.
  - Next-image preloading for smoother transitions.
  - Production observability hooks (Vercel Analytics/Speed Insights, optional Sentry).
  - Security headers and CSP via `vercel.json`.

## Technical Notes

- Slideshow/session logic: `src/composables/useFigureSession.js`
- Class preset + block helpers: `src/utils/classPlan.js`
- Upload validation + randomization: `src/utils/photoInput.js`
- Shared constraints: `src/config.js`

## Run

1. Install dependencies:
   `npm install`
2. Start development:
   `npm run dev`

## Build

- Production build:
  `npm run build`
- Preview production build:
  `npm run preview`

## Quality Checks

- Lint:
  `npm run lint`
- Unit tests:
  `npm run test`
- End-to-end smoke tests:
  `npm run e2e`
- Run all local gates (lint + test + build):
  `npm run check`

## CI

- GitHub Actions workflow: `.github/workflows/ci.yml`
- Runs `npm ci`, then lint/test/build checks, plus Playwright smoke tests.
- Dependency updates are automated via `.github/dependabot.yml`.
- CodeQL scanning runs via `.github/workflows/codeql.yml`.
- Dependabot patch/minor updates for `npm` and `github-actions` are auto-merged after required checks pass via `.github/workflows/dependabot-automerge.yml`.
- Automated release PRs/tags are managed by `.github/workflows/release-please.yml`.
- PR file-based labels are applied by `.github/workflows/labeler.yml` using `.github/labeler.yml`, and ownership defaults are defined in `.github/CODEOWNERS`.

## Contribution Workflow

1. Create a feature branch from `main`.
2. Use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`), because release automation depends on commit semantics.
3. Run local gates before pushing:
   `npm run check`
4. Open a PR and self-review in `Files changed`.
5. Wait for required checks to pass:
   - `checks`
   - `e2e`
   - `Analyze (javascript-typescript)`
6. Squash-merge to `main`.

Branch protection details and required settings are documented in `.github/branch-protection.md`.

## Releases

- `Release Please` runs on pushes to `main` and maintains a release PR.
- Merging the release PR updates `CHANGELOG.md`, bumps `package.json` version, creates a Git tag, and publishes a GitHub Release.
- Configure a repo secret named `RELEASE_PLEASE_TOKEN` (PAT with `contents` and `pull_requests` write) so release PR updates trigger required PR checks (`checks`, `e2e`, `Analyze (javascript-typescript)`).
- The workflow falls back to `GITHUB_TOKEN`, but GitHub event recursion protections can prevent release-PR check workflows from running in that mode.
- If a release PR is not created automatically, run `.github/workflows/release-please.yml` manually from the Actions tab.
- Roadmap reference: `docs/03-upgrades-and-feature-roadmap.md`.

## Observability

- Vercel Analytics and Speed Insights are enabled in production builds.
- Sentry is optional and activates only when `VITE_SENTRY_DSN` is set.
- Optional Sentry env vars:
  - `VITE_SENTRY_DSN`
  - `VITE_SENTRY_TRACES_SAMPLE_RATE` (between `0` and `1`)

## App Metadata

- In-app version badge is sourced from `package.json`.
- Public pages:
  - `public/privacy.html`
  - `public/changelog.html`
