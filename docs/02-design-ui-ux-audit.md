# Design, UI, and UX Audit

## Overall Assessment

- Visual direction is distinctive and intentional; not generic template UI.
- Core workflow is understandable: upload -> configure -> run.
- Wizard/dialog patterns show strong effort on keyboard focus and modal behavior.
- Main UX risk is not style quality, but interaction friction in advanced and remote flows.

## What Is Strong

1. Cohesive visual language with custom theme variables and deliberate surface hierarchy in [tailwind.css](../src/tailwind.css).
2. Good primary CTA clarity on landing via [SetupOverviewCard.vue](../src/components/setupPanel/SetupOverviewCard.vue).
3. Progressive disclosure in live controls (`Advanced Controls` collapsed by default) in [LiveControlsPanel.vue](../src/components/LiveControlsPanel.vue).
4. Modal focus traps and escape handling in both setup and class dialogs.

## UX Friction Points

### High-priority UX issues

1. Persistence trust break.
   - Users can set quick mode/duration, reload, and see defaults again (validated by smoke failure).
   - This undermines confidence in all saved preferences.

2. Remote pairing is too manual.
   - Long offer/answer token copy/paste steps are error-prone on mobile.
   - No QR flow, no concise recovery guidance for failed pairings.

3. Wizard flow can feel jumpy.
   - `openWizard()` routes users directly to step 3 when setup is considered complete, which can hide context for edits.

### Medium-priority UX issues

1. Photo tag management is functional but heavy for large sets.
   - Manual per-photo text entry and up/down controls become slow past dozens of photos.
2. Session history is visible but not actionable.
   - No filters, search, trend insight, or replay from history.
3. Status messages are informative but dense in some class fallback cases.

## UI Recommendations

### Quick wins (low effort)

1. Add explicit "Saved" indicator for settings/prefs with last-saved timestamp.
2. Add step completion badges in wizard tabs (done/current/blocked states).
3. Improve empty states:
   - show example next action ("Upload a folder" / "Try quick mode first").
4. Add sticky action footer in class dialog for Start/Regenerate on long plans.

### Medium effort

1. Replace up/down reorder with drag-and-drop list (keyboard-accessible).
2. Add batch tag actions:
   - multi-select photos
   - apply/remove tag in one operation
3. Add "Preview first 3 slides" before start to reduce surprise.
4. Introduce "Break blocks" in class plan editor (already hinted by runtime counter logic).

## Accessibility Feedback

1. Add clearer aria-state semantics:
   - `aria-current` or selected-state attributes on wizard step buttons.
2. Add color-contrast spot checks for subtle text on layered backgrounds.
3. Add visible live-region confirmation for critical events:
   - imported settings
   - remote connected/disconnected
4. Run automated accessibility checks in CI (axe on smoke flows).

## Design-System Suggestions

1. Keep current expressive aesthetic, but reduce broad use of wildcard utility overrides (`[class*="..."]`) in global CSS; they increase unpredictability as UI grows.
2. Convert repeated card/panel patterns into a small design token/component contract (`surface`, `subtle`, `hero` variants with explicit semantics).
3. Add semantic spacing scale usage rules to reduce one-off padding classes.

## UX Metrics to Add

1. Setup completion rate and drop-off by wizard step.
2. Time-to-first-session from app open.
3. Remote pairing success rate and average pairing time.
4. Percentage of class sessions using tags/templates.
