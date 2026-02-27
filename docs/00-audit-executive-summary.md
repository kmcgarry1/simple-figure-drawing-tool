# Figure Drawing App Multi-Team Lead Audit

Audit date: 2026-02-27  
Repository: `figure-drawing`  
Scope: Full app review across product, UX/UI, frontend architecture, deployment/security posture, and QA quality gates.

## Method Used

- Full source review of `src/`, `e2e/`, config, CI, and deployment files.
- Validation runs:
  - `npm run check` (pass)
  - `npm run e2e` (1 failing test)
  - `npm outdated --json` (minor patch updates available)
  - `npm audit --json` (2 high severity advisories in dev/build toolchain)

## Health Snapshot

- Product direction: **Strong foundation**, clear core workflow (quick session + class builder).
- UX/UI: **Good visual character**, but some flow friction and accessibility gaps.
- Frontend engineering: **Modular and readable**, with a few correctness/reliability issues.
- Backend/platform: **Intentionally thin** (mostly static app + browser APIs), needs small platform upgrades.
- QA/testing: **Solid baseline**, but one smoke test currently failing and coverage still focused on utility logic.

## Top Findings (Highest Priority)

1. Preference persistence is timing-sensitive and currently fails a smoke scenario.
   - Evidence: debounced persistence in [useFigureSessionLifecycle.js](../src/composables/figureSession/useFigureSessionLifecycle.js) and failing test in [app.smoke.spec.js](../e2e/app.smoke.spec.js).
   - Impact: user mode/duration can revert on fast reload/navigation.

2. Content Security Policy setup is internally inconsistent and likely blocks intended external resources.
   - Evidence: meta CSP in [index.html](../index.html), header CSP in [vercel.json](../vercel.json), Google Fonts import in [tailwind.css](../src/tailwind.css).
   - Impact: analytics/Sentry/font behavior may be unreliable across environments.

3. Security advisories in dev/build dependencies need patch upgrades.
   - Evidence: `npm audit --json` and dependency tree (`rollup@4.57.1`, `minimatch@10.2.2`).
   - Impact: CI/build toolchain risk, compliance concerns.

4. Remote control flow is functional but fragile for real-world networks and non-technical users.
   - Evidence: manual offer/answer token flow and single STUN server in [usePhoneRemote.js](../src/composables/usePhoneRemote.js).
   - Impact: pairing failures, high user friction, support burden.

## Immediate Actions (1-2 sprints)

1. Fix persistence race and make the failing e2e scenario pass reliably.
2. Unify CSP strategy (single authoritative policy), then explicitly allow/disallow fonts/telemetry by decision.
3. Patch dependency versions and re-run full gates.
4. Introduce QR-based remote pairing and graceful fallback messaging.
5. Add targeted tests for session runtime state transitions and persistence timing behavior.

## Doc Map

- [01-engineering-frontend-backend-audit.md](./01-engineering-frontend-backend-audit.md)
- [02-design-ui-ux-audit.md](./02-design-ui-ux-audit.md)
- [03-upgrades-and-feature-roadmap.md](./03-upgrades-and-feature-roadmap.md)
