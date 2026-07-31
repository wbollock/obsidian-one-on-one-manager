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
- [x] Typed the data model: replaced `any`/`any[]` params with the real
      OneOnOneMeeting/PersonProfile/AgendaItem/PersonStats interfaces from
      types.ts (added GoalStats), typed frontmatter cache access via local
      interfaces, replaced `as any` TFile casts with `instanceof TFile`
- [x] Sentence case for all 76 flagged UI strings (buttons, headings,
      dropdown options, command names, Notice messages)
- [x] Removed all 13 unused-vars warnings (dangling imports, dead DOM refs)

**`npm run lint` and `npm run build` are both fully clean — 0 problems.**

## Remaining

1. **Non-lint submission requirements** (stop and confirm before this step)
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
