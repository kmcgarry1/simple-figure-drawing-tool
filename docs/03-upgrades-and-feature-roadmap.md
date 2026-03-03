# Product Roadmap (Post v1.2.0)

Last updated: 2026-03-03

## Planning Frame

- Horizon: next 4 releases (roughly 8-12 weeks).
- Operating model: solo maintainer, PR-only changes, required CI checks, automated releases.
- Goal: improve real session workflow speed, remote reliability, and release predictability.

## Current Baseline (Shipped)

1. Quality and automation baseline is enforced:
   - CI checks (`checks`, `e2e`, `Analyze (javascript-typescript)`)
   - Dependabot with guarded auto-merge
   - CodeQL scanning
   - Release Please (changelog, version bump, tag, GitHub Release)
2. Core drawing session capabilities are in place:
   - quick session mode and class wizard mode
   - break blocks and class presets/templates
   - session preview and class launch review grid with drag-and-drop slot reassignment
   - phone remote controls (token/link/QR pairing)
3. UX foundation is in place:
   - setup wizard with stepper and collapsible advanced sections
   - warm studio visual system
   - full dark mode rebuild
4. Test coverage is active for unit, smoke e2e, and accessibility e2e paths.

## Priority Gaps (Now)

1. Source photo workflow still uses button-based up/down ordering instead of drag-and-drop.
2. Tagging workflow does not support multi-select or batch actions.
3. Session history lacks filters, export, and direct rerun behavior.
4. Phone remote pairing still depends on manual offer/answer transfer and STUN-only reliability.
5. No optional backend exists for sync/sharing beyond client-local state.

## Release 1.3.0 (Workflow Speed)

### Product

1. Add drag-and-drop ordering to source photo list in setup flow.
2. Keep keyboard-first reorder fallback for accessibility parity.
3. Add bulk tag actions:
   - multi-select photos
   - apply/remove selected tags in one action
4. Add history filters (mode, date range, outcome) and history export JSON.

### QA

1. Add e2e coverage for source list drag-and-drop and keyboard fallback.
2. Add e2e coverage for multi-select tagging and filtered history views.

## Release 1.4.0 (Remote Reliability)

Status on working branch (2026-03-03): platform items 1-3 are implemented; QA items 1-2 are covered with unit + smoke e2e regression tests.

### Platform

1. Add optional TURN fallback support (`TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`).
2. Add remote connection diagnostics UI:
   - current connection state
   - timeout and retry hints
   - clearer error categories
3. Add reconnect flow for transient disconnects without full re-pairing.

### QA

1. Add targeted tests for remote success/failure/reconnect paths.
2. Add regression tests for live controls under remote reconnect events.

## Release 1.5.0 (Session Repeatability)

Status on working branch (2026-03-03): Product items 1-2 are implemented with smoke e2e coverage for rerun and snapshot restore paths.

### Product

1. Add "Rerun From History" to restore prior setup quickly.
2. Add named run snapshots (quick/class presets captured from a completed run).
3. Add richer session summaries:
   - elapsed vs planned timing
   - break usage summary
   - template/preset attribution

### QA

1. Add e2e coverage for rerun and snapshot restore paths.

## Release 1.6.0 (Optional Multi-Device Foundation)

### Platform

1. Add minimal signaling service option to remove manual offer/answer copy flow.
2. Add optional persisted share links with expiry controls.
3. Add optional cross-device class template sync.

### Guardrails

1. Keep local-only mode as first-class path.
2. Make backend-dependent features explicitly opt-in.

## Ongoing Engineering Checklist

1. Keep dependencies current (`vue`, `vite`, `tailwindcss`, `eslint`, `vitest`, `playwright`, `@sentry/vue`).
2. Keep security overrides (`rollup`, `minimatch`) in patched ranges.
3. Keep required checks aligned with repository rulesets:
   - `checks`
   - `e2e`
   - `Analyze (javascript-typescript)`
4. Keep release flow healthy:
   - Release Please run passes on `main`
   - release PR checks pass and merge cleanly
   - tag and GitHub Release are generated
