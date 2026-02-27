# Upgrades and Feature Roadmap

## Planning Frame

- Horizon: next 3 releases (approx. 6-10 weeks).
- Goal: improve reliability first, then unlock higher-value UX/product features.
- Team lanes: Product, UX/UI, Frontend, Platform/Infra, QA.

## Release 1 (Stability + Trust)

### Frontend

1. Fix preference persistence race and make reload behavior deterministic.
2. Add explicit "settings saved" feedback in UI.
3. Add integration tests for session runtime transitions and mode switching.

### Platform/Infra

1. Patch vulnerable/outdated dependencies (`rollup`, `minimatch`, plus patch updates from `npm outdated`).
2. Consolidate CSP strategy (remove policy drift between meta and deployment headers).
3. Decide and implement font strategy:
   - self-host fonts, or
   - update CSP allowlist for external font providers.

### QA

1. Fix and re-baseline failing e2e persistence scenario.
2. Add CI step for `npm audit --audit-level=high`.

## Release 2 (Workflow Efficiency)

### UX/UI + Product

1. Drag-and-drop photo ordering with keyboard support.
2. Batch photo tag operations (select many -> assign one tag).
3. Session history filters and richer summaries (mode, duration, completion ratio).
4. Add a "session preview" panel before run start.

### Frontend

1. Implement optional break blocks in class planning flow.
2. Wire audio cues to runtime controls with mute/volume settings.
3. Add URL-state deep links for setup mode and selected wizard step.

## Release 3 (Growth Features)

### Product

1. Class template library improvements:
   - rename/duplicate
   - sort/group templates
   - import/export templates only
2. Guided "class builder assistant":
   - based on target duration, preferred gesture/long-pose mix, and available tags.
3. Session insights dashboard:
   - weekly totals
   - average completed slides
   - most-used templates/tags

### Platform/Backend (Minimal but impactful)

1. Add optional lightweight backend for sync/share:
   - shareable session config links
   - cross-device template sync
2. Add signaling service for remote pairing:
   - remove manual offer/answer copy-paste
   - enable one-tap mobile pairing via QR and short code.

## Upgrade Checklist

1. Dependency updates:
   - `vue`, `@sentry/vue`, `tailwindcss`, `@tailwindcss/postcss`, `autoprefixer`, `eslint`.
2. Toolchain security:
   - ensure transitive `rollup` and `minimatch` resolve to patched ranges.
3. CI coverage:
   - keep lint/test/build/e2e
   - add accessibility checks
   - add audit/security checks.

## Suggested Owners

1. Product lead: roadmap prioritization and release acceptance criteria.
2. Design lead: interaction model updates for wizard, tags, history, and remote pairing.
3. Frontend lead: persistence fix, runtime tests, break/audio feature delivery.
4. Platform lead: CSP, dependency security, and optional signaling/sync architecture.
5. QA lead: e2e reliability, accessibility regression tests, release gates.
