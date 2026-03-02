# Upgrades and Feature Roadmap

Last updated: 2026-03-02

## Planning Frame

- Horizon: next 3 releases (approx. 6-10 weeks).
- Strategy: keep the new automation baseline stable, then focus on high-impact UX and remote reliability work.
- Operating model: solo maintainer with PR-based workflow and automated release gates.

## Current Baseline (Completed)

1. CI coverage is enforced for lint, unit tests, build, smoke e2e, accessibility e2e, and `npm audit --audit-level=high`.
2. Security automation is active with CodeQL and branch protection required checks.
3. Dependency hygiene is active with Dependabot and guarded auto-merge for patch/minor updates.
4. Release automation is active with Release Please, changelog/version bumping, and tag/release creation.
5. PR hygiene is active with file-based labels (`labeler`) and explicit ownership (`CODEOWNERS`).
6. Major product roadmap items from earlier plans are shipped:
   - break blocks in class sessions
   - audio cues with mute/volume
   - session insights
   - shareable session configuration links
   - setup deep links
   - class template management improvements

## Remaining Gaps (Verified)

1. Phone remote reliability is limited by STUN-only WebRTC config and manual token exchange.
2. Photo ordering still relies on manual up/down controls, not drag-and-drop.
3. Tagging workflow lacks bulk multi-select actions.
4. Session history is useful but still missing filters/export/actionable rerun flows.
5. No signaling/sync backend exists yet for low-friction multi-device pairing and cross-device persistence.

## Release 1: Remote Reliability and Hardening

### Platform/Infra

1. Add optional TURN fallback support in remote pairing (`TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL` env path).
2. Add remote pairing diagnostics in UI (connection states, timeout messaging, retry hints).
3. Keep workflow permissions least-privilege and review quarterly (CI, release, Dependabot workflows).

### QA

1. Add focused tests for remote pairing failure/success paths.
2. Add regression coverage for settings autosave messaging and persistence lifecycle events.

## Release 2: Workflow Efficiency

### UX/UI + Frontend

1. Implement drag-and-drop photo ordering with keyboard-accessible reordering fallback.
2. Add batch tag actions (multi-select photos -> apply/remove tags).
3. Add session history filters (mode/date/result) plus JSON export.
4. Add "rerun from history" action to restore prior session configuration quickly.

### QA

1. Add e2e coverage for drag-and-drop, batch tags, and history rerun flows.

## Release 3: Growth and Multi-Device

### Platform/Product

1. Add minimal signaling service to remove manual offer/answer copy-paste.
2. Add optional backend persistence for share links and cross-device template sync.
3. Add short-link support for session sharing with expiration controls.

### Analytics

1. Add lightweight product metrics around setup completion, pairing success rate, and session completion rate.

## Rolling Upgrade Checklist

1. Keep dependencies current (`vue`, `@sentry/vue`, `tailwindcss`, `eslint`, `vite`, Playwright/Vitest toolchain).
2. Ensure transitive security overrides (`rollup`, `minimatch`) remain in patched ranges.
3. Keep branch protection required checks aligned with active workflow names:
   - `checks`
   - `e2e`
   - `Analyze (javascript-typescript)`
4. Keep release process healthy:
   - Release Please run green on `main`
   - release PR merges cleanly
   - new tag/changelog entry is produced
