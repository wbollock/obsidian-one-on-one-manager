# Community plugin submission checklist

Working checklist for getting this plugin ready to submit to the Obsidian
community plugin catalog. Generated from `eslint-plugin-obsidianmd` findings
plus the non-lint release/submission requirements.

## Done

- [x] Fix `detach-leaves` bug in `onunload` (was resetting user's pane layout
      on every reload)
- [x] Replace `window.confirm`/`alert` with `ConfirmModal`/`Notice`
- [x] `Vault.delete()` → `FileManager.trashFile()` for person profile deletes
- [x] Manual `<h2>`/`<h3>` + `innerHTML` in settings tab → `Setting().setHeading()` / `createEl`
- [x] Inline `element.style.*` assignments → CSS classes
- [x] Promise handling (`no-misused-promises` / `no-floating-promises`, 28
      instances) — wrapped DOM event handlers in named methods or
      void-marked IIFEs, awaited API calls already inside async context,
      widened `PersonProfileModal.onSave` / `AgendaItemModal.onSubmit` to
      `void | Promise<void>`
- [x] Settings heading repeating "settings"/plugin name, `console.log` →
      `console.debug` (2x), deprecated `.substr()` → `.slice()`

## Remaining (209 problems left: 196 errors, 13 warnings, 13 auto-fixable)

1. **Type the data model** (~120 instances: `no-unsafe-member-access` 49,
   `no-unsafe-assignment` 28, `no-unsafe-argument` 16, `no-explicit-any` 13,
   `no-unsafe-call` 9, `no-unsafe-return` 5)
   Biggest chunk. Meetings/stats/goals objects are passed around as `any`
   instead of the real interfaces already defined in `types.ts`. Touches
   analyzer.ts, timeline-view.ts, goals-manager.ts, people-manager.ts,
   create-meeting-modal.ts, dashboard-view.ts.

2. **Sentence case** (76 instances)
   Button/label/heading text across nearly every file must be sentence
   case, not Title Case. Mechanical.

3. **Final sweep**
   `no-unused-vars` (13 warnings), `eslint --fix` for remaining
   auto-fixable issues, then confirm `npm run lint` and `npm run build`
   are both fully clean.

4. **Non-lint submission requirements** (stop and confirm before this step)
   - Cut a GitHub release tagged `1.0.0` (no `v` prefix) with `main.js`,
     `manifest.json`, `styles.css` attached as individual assets.
   - Confirm plugin id `one-on-one-manager` isn't already taken in
     `obsidianmd/obsidian-releases/community-plugins.json`.
   - File the community-plugins.json PR.
   - Note: this repo had a GitHub Actions workflow *deliberately removed*
     in an earlier commit (`cb7adc2`, "remove GitHub workflows"). Don't
     re-add CI without checking first — that removal may have been
     intentional.

## Lint snapshot (original, before any fixes)

244 problems (231 errors, 13 warnings), 14 auto-fixable. Per file:

| File | Problems |
|---|---|
| dashboard-view.ts | 76 |
| timeline-view.ts | 34 |
| goals-view.ts | 26 |
| goal-modal.ts | 23 |
| settings.ts | 17 |
| main.ts | 15 |
| create-meeting-modal.ts | 12 |
| analyzer.ts | 10 |
| people-manager.ts | 9 |
| goals-manager.ts | 9 |
| reflection-prompt-modal.ts | 7 |
| agenda-item-modal.ts | 6 |
| person-profile-modal.ts | 2 |
