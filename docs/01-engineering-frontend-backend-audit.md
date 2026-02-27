# Engineering Audit (Frontend + Platform/Backend-Adjacent)

## Architecture Review

### What is working well

- Root app split between host and remote clients is clean and simple in [App.vue](../src/App.vue).
- Session logic is decomposed into focused modules (`playbackRuntime`, `setPreparation`, `class*Actions`) under `src/composables/figureSession/`.
- Persistent preferences/history/template storage is normalized defensively before write/read.
- Build output is reasonably chunked via custom `manualChunks` in [vite.config.js](../vite.config.js).

### Structural risks

- `useFigureSession` still exposes a very large API surface, making component coupling high over time.
- Session phase is string-based (`"idle"`, `"ready"`, `"running"`, etc.) across many modules without a centralized finite-state contract.
- Some features appear partially wired:
  - Break-slide support is referenced in derived state but no break slides are generated in current slide factory.
  - Audio cue hooks exist in runtime but are never passed from controller composition.

## Reliability Findings

### High

1. Persistence race on fast reload/navigation.
   - Debounced save in [useFigureSessionLifecycle.js](../src/composables/figureSession/useFigureSessionLifecycle.js) can miss writes when users reload quickly.
   - Reproduced by failing Playwright smoke test in [app.smoke.spec.js](../e2e/app.smoke.spec.js) (`mode and duration persist after reload`).
   - Recommendation:
     - Persist immediately for key fields (`sessionMode`, `durationSeconds`) or flush on `visibilitychange`/`pagehide`.
     - Keep debounce for heavy objects (`classBlocks`) only.

2. Documentation/product behavior drift for quick-set source handling.
   - README claims unselected uploads are removed after random pick, but runtime message explicitly says source pool is preserved in [setPreparation.js](../src/composables/figureSession/setPreparation.js).
   - Recommendation:
     - Either implement depletion mode or update docs/product copy to one behavior.

### Medium

1. `createPhotoId` collision risk in large libraries.
   - ID is based on `name|size|lastModified` in [photoInput.js](../src/utils/photoInput.js).
   - Different files can collide in edge cases (same exported names/metadata).
   - Recommendation:
     - Add stable hash of file head bytes when available, or include `webkitRelativePath` when folder upload is used.

2. Runtime catches swallow failure diagnostics silently.
   - Multiple `catch(() => {})` blocks in telemetry/Audio/WebRTC paths.
   - Recommendation:
     - Add lightweight debug logging in non-production and error breadcrumbs in production when Sentry is configured.

## QA and Testing Review

### Current status

- `npm run check`: pass (lint + unit tests + build).
- `npm run e2e`: fail (1/4 tests failing).
- Unit tests strongly cover utility normalization logic.

### Gaps

- Missing integration tests for session runtime transitions:
  - pause/resume/next timing edge cases
  - mode switch while prepared but idle
  - class tag fallback messaging
- No accessibility checks in CI (axe/pa11y or equivalent).
- Smoke suite is narrow and currently unstable due persistence race.

## Security and Deployment Review (Little Backend)

### Current state

- App is mostly static frontend with browser-local storage and peer-to-peer remote control.
- Security headers are defined in [vercel.json](../vercel.json).

### High

1. CSP inconsistency between HTML meta policy and Vercel header policy.
   - Meta CSP in [index.html](../index.html) differs from deployed header CSP.
   - Google Fonts are imported in CSS but CSP does not allow Google font/style domains.
   - Recommendation:
     - Remove meta CSP and enforce only header CSP in deployment.
     - If Google Fonts stay, explicitly allow `fonts.googleapis.com` and `fonts.gstatic.com`, or self-host fonts.

2. Dependency advisories (`npm audit`) need patch upgrades.
   - High advisories present in `rollup` and `minimatch` dependency chain.
   - Recommendation:
     - Update patch versions (`vite` transitive rollup, `eslint`/`minimatch` chain) and re-run full CI.

### Medium

1. Remote control networking is fragile for NAT-restricted users.
   - Single STUN server and no TURN fallback in [usePhoneRemote.js](../src/composables/usePhoneRemote.js).
   - Recommendation:
     - Add optional TURN credentials via env vars.
     - Add pairing diagnostics (connection state, timeout hints).

## Upgrade Recommendations

1. Patch-level dependency refresh:
   - `vue`, `@sentry/vue`, `tailwindcss`, `@tailwindcss/postcss`, `autoprefixer`, `eslint`.
2. CI hardening:
   - Add a job for `npm audit --audit-level=high`.
   - Consider Node LTS matrix (`20` + current active LTS) for early compatibility detection.
3. Test reliability:
   - Fix persistence race, then gate merges on passing e2e smoke.

## Suggested Technical Backlog (Prioritized)

1. P0: Fix persistence race and stabilize e2e persistence test.
2. P0: Unify CSP and resolve font/telemetry policy mismatch.
3. P1: Apply dependency security patches.
4. P1: Wire optional audio cues end-to-end or remove dead code until launched.
5. P2: Refactor phase management toward explicit finite-state transitions.
