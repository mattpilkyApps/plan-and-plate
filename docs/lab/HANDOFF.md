# Recipe Quality Lab — recovery handoff

## Cooking and Shopping integration checkpoint

Standalone UI now has six working areas. Reusable cooking compiler, DAG/resource scheduler, timestamp-based session reducer, virtual/real clocks, presentation autoplay, confirmation-only completion, independent timer adjustment, pause/resume, early/behind controls, preference persistence, safety-policy checkpoints, event replay and timeline inspection are implemented. Smart reordering is deliberately limited to supported preheat overlap and ingredient preparation preferences. Composite/unknown method instructions retain source order. Generic prep estimates are labelled, not claimed vetted/personalised. FSA policy sources reviewed 3 November 2026.

Shopping consumes canonical cards through the production quantity/merge/category engine, supports multiple recipe snapshots, serving changes, optional items, manual groceries/household items and recoverable Already-got simulation. Every row has canonical ingredient/source provenance. No production Pantry implementation. An ambiguous optional component in a compound serving line keeps the whole line included and requests review.

Quality hardening: exact source-label metadata refs, intra-fragment metadata conflicts, source-generated instruction integrity checks, optional-scope regression, and reviewed numbered-step expectations for all three owner recipe copies. Pumpkin has 7 practical steps, paneer 9, Waitrose sprouts 11; short context fragments and stirring reminders are grouped into usable kitchen instructions.

Checks: 329 full tests pass, lint, production build and standalone Lab build pass; existing 57 cases and 16 workflows retained. The browser library's 76 recipe cases pass. Current next task: browser-verify the complete Chef/Shopping/issue flow at mobile widths, add browser-accessible deterministic engine scenarios, then final preview/recovery report. Code is formatted with Prettier (no added runtime dependency).

First protected Lab deployment (MVP source a4dd70416188aeefc8fe38a916eabb15c006a92f): https://plan-and-plate-aqwgzmzf9-mattpilkyapps-projects.vercel.app/ ; dpl_ACnf6LfQ1WaL5T9kbx6bzyJtSA5E READY, target null/preview, authenticated fetch HTTP 200 returns Recipe Quality Lab HTML. This is an intermediate preview. Final integration deployment still needed. Use Vercel create_deployment with gitSource exact SHA, per-deployment buildCommand npm run build:lab and outputDirectory dist-lab. Omit target (API default preview); do not specify production or change project defaults. Preview authentication remains enabled.

Updated 2026-11-03. Branch `lab/recipe-quality`, based on main `b07e4b1`. Never merge or promote this experimental branch without separate owner authorisation.

## Specification and baseline

Read APPROVED_SPECIFICATION.md (complete snapshot of the approved Drive technical design). Both Drive specifications were read during the initial assessment. The original master remains at https://docs.google.com/document/d/1bJ8Ox_wJ5RRgzkHdKd5XhoVjV5t_u1J8ejUTomtBwRk/edit .

Baseline: 217/217 existing tests; 57/57 parser cases; 16/16 multi-tab workflows; lint and production build pass. Original production asset hashes index-RWtUcaRU.js / index-DUtRaiPz.css. Live Vercel project has authentication on previews; preserve it.

## Engine foundation checkpoint

`src/domain/recipe` adapts the existing production parser/session assembler and ingredient parser into RecipeCard v1. All clipboard fragments remain intact. Method segmentation partitions extracted source text with character coverage checks and source offsets; it never calls AI. Groups, alternatives, optional amounts, package evidence and explicit/unknown time provenance are retained. Exact partial overlaps can be combined; contradictory candidates remain flagged. Approval is human, revision-specific and revoked by edits.

`toLegacyRecipe` is the explicit shopping compatibility boundary. Existing shopping accepts canonicalIngredientId as a signal that an ingredient is already normalised, preserving corrected unknown amounts/names. Legacy records follow their original code path. No production storage, page, route, schema migration or navigation changed.

Standalone `lab/` entry and `vite.lab.config.js` build to dist-lab. Production `npm run build` remains unchanged. Fixture generator reuses the existing 57 cases and 16 workflows plus labelled synthetic canonical goldens, without fabricating publisher source.

Validation at engine checkpoint: 80 new Lab tests (57 corpus + 16 workflows + 3 canonical goldens + 4 invariant tests); full test/lint/build results recorded in developer log once complete. Run `npm run test:lab`, `npm test`, `npm run lint`, `npm run build`. UI implementation is next.

## Known limits

## Recipe Lab MVP checkpoint

The standalone cream/green Lab UI now includes fragment intake, source comparison/highlights, complete recipe preview, title/servings/time/notes/group/ingredient editing, step edits/reorder/split/merge, explicit revision approval, sticky corrections during reprocessing, locally reviewed fixtures, 76-case regression runner and expected/actual comparisons, local issue notebook, opt-in full diagnostic exports and issue-source replay. Lab storage uses only plan-and-plate-lab-v1. No production route or storage is used.

MVP verification: 300/300 full tests, lint, standalone Lab build pass. Browser loaded the actual owner paneer case with all 16 ingredients and 11 numbered steps. Private source remains intact. Phone viewport QA and cooking/shopping integration follow. The daemon's dev-server route could not resolve the nested package cwd; regular static preview works with an actual copy (not symlink) of dist-lab in scratch/lab-preview/dist. Start it with sites-preview start <scratch>/lab-preview. Never commit the local preview wrapper.

Run npm run build:lab, or npm run dev:lab. Fixtures are generated from existing source files and ignored, so build/dev always runs scripts/build-lab-fixtures.js first.

Coverage is of extracted method text; it is not proof that arbitrary website source was classified perfectly. Unmapped evidence and uncertain boundaries request review. Conservative deterministic segmentation cannot understand every conditional recipe. No recipe is labelled perfect. No AI cost or API key introduced. Browser and physical-device validation pending.

## Recovery

Clone repository, checkout this branch, `git log -3 --oneline`, read this file and latest developer-log entry. `npm ci`, then run targeted checks. Avoid re-reading the whole repository. Use `git rev-parse HEAD` for exact current source; this handoff intentionally does not predict its own commit SHA.
