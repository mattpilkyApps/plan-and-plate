# Recipe Quality Lab — recovery handoff

## Android feedback follow-up — 5 November 2026

Matt reviewed one coconut curry import. The Lab found ingredients and method, but he moved or removed misclassified material. Shopping also used preference prose such as “I prefer …” in item names. His exact phone session is local to the original preview and browser. No report or raw paste was available for this change.

The synthetic `shopping-ingredient-preferences` fixture reproduced polluted product names and separate comment rows before the fix. The shared importer now attaches adjacent preference prose to its ingredient, keeps unanchored comments in Recipe notes, and builds Shopping from clean product names. Original wording stays in the paste and ingredient evidence. Explicit substitutions, preparation, counts, and compound names are retained. The recipe engine is 1.2.0. Existing reviewed cards and Shopping snapshots are historical revisions. Rebuild from source, review, approve and add the fresh card to Shopping to exercise this change.

Validation passed with 348 full tests, 93 Lab cases and 589 assertions, 57 parser cases, 16 paste workflows, lint, both builds, and both service worker syntax checks. Browser QA pasted the synthetic recipe, verified one numbered instruction, six ingredients, two Recipe notes, clean Shopping labels and scaled 800 ml coconut milk for four servings. Its Shopping trace still displayed the original preference comment.

Next, reopen the original preview on the same device. Export a reviewed full issue pack from **Issues → Review & export**, enabling **Include recipe text, outputs, timings and shopping traces**. A saved fixture from **Test library → My reviewed cases** also carries the raw paste and approved card. Compare the exact coconut curry source against the corrected card, add a private or safely reduced regression fixture for each verified section error, and rerun the full pipeline. Keep the older preview available for its local data.

## Verified final preview and source — 3 November 2026

- **Usable protected Lab:** https://plan-and-plate-7d082suoi-mattpilkyapps-projects.vercel.app/ . Existing Vercel authentication is retained; Matt may need to sign in on his phone.
- **Deployment:** dpl_AKg2Je5QBSuSAt8Gyp49LKFariAu, READY, target null (preview), project prj_BTGHRRCvar0bXD6Cd8rkW0jGPLsb, team team_rAS0gWuBiS9ffwL3XKEnGEPF.
- **Exact validated application commit:** 90e00a62d6268c65c488449e74505f7e40ca6f0c on lab/recipe-quality. A following documentation-only checkpoint records this deployment; resolve its SHA with git log -1. It contains identical application source.
- **Published verification:** authenticated HTTP 200 for Lab HTML, main JavaScript, stylesheet and service worker. index-C6AK4xGr.js contains the exact application commit; index-DKUZKU6c.css and cache plan-and-plate-lab-407c2511875c match the local build. Project preview SSO remains enabled for all_except_custom_domains. No production promotion.
- **Main protection:** remote main rechecked at b07e4b1eb08c9dfc8753d41066bc4c9155144461, unchanged from task start.
- **Drive technical specification:** implementation appendix added and read back at https://docs.google.com/document/d/1v4_lRMPGCYa8WMm7IRQF0Eq84G0PQifo_F5myl8cZpY . Approved target design remains unchanged; appendix states real scope, checks, limits, preview and next task.

Production and the main branch are not a Lab release. Continue only on lab/recipe-quality. No additional deployment is needed for this documentation checkpoint.

## Current completed state — supersedes milestone notes below

3 November 2026. Working isolated Lab with all six sections, source-faithful/editable cards, conservative Chef compiler and real/virtual sessions, actual production Shopping calculations, local issue capture/review/export, case import/source replay and a shared browser/Node regression library. Production/main remain protected and unchanged. Read DELIVERY_REPORT.md for scope, observed browser evidence and honest limits; quality-report.json contains the reproducible machine report.

Final checks: **346/346 full tests**, **92/92 Lab cases / 581 assertions**, **57/57 original recipe corpus**, **16 existing multi-tab workflows**, lint, production build, Lab build and service-worker syntax pass. The 92 cases are 76 recipe/paste cases plus 16 cooking/shopping scenarios. 52 warning-level fixture review flags remain explicit; there are no failed case assertions. Browser baseline rerun: zero new regressions. No claim of universal or perfect parsing. Six exact numbered-step goldens are source-checked engineering expectations, awaiting Matt's independent human review.

Browser QA passed source highlights; paneer 16 ingredients/9 steps; explicit approval/full pipeline; +3 minutes/ETA/expiry awaiting confirmation; six-serving Shopping quantities, manual Toilet rolls, original-source trace and recoverable Already-got. At 320/390/430px actual embedded viewports, all six navigation buttons fit and the document has no horizontal overflow. Method-first/ingredients-second phone paste yielded four ingredients/four ordered steps; edited title survived rebuilding. Full reviewed issue JSON was actually downloaded and parsed with source, timers and Shopping attached; no device/screenshot included without opting in. Evidence: ../review/recipe-quality-lab-phone.jpg. Physical Android/iOS/Safari, real-kitchen use and prolonged offline/background behaviour remain unverified.

Start a new case with New test; old cards remain under Resume an earlier draft. User edits revoke approval. Lab storage key is plan-and-plate-lab-v1; phone-preview iframes are disposable copies and do not write it. Default app storage is never read. Timers/presentation states are separate; independent timers are not restarted by rescheduling.

### Exact recovery sequence

1. Fetch and checkout `lab/recipe-quality`; `git status --short --branch` and `git log -4 --oneline`. Do not start from main or recreate this implementation.
2. Read this top section, DELIVERY_REPORT.md, then only relevant domain/UI files. Approved full design is APPROVED_SPECIFICATION.md. Do not re-ingest all project history.
3. `npm ci`; `npm run test:lab`; `npm run lab:report`. Full release checks: `npm test`, `npm run parser:report`, `npm run lint`, `npm run build`, `npm run build:lab`.
4. `npm run dev:lab` for standalone development. Build output dist-lab; normal app build remains dist. The Lab has its own generated service worker/cache namespace.
5. For managed local browser QA, create a scratch wrapper with an actual copy of dist-lab in dist and .openai/hosting.json declaring static.directory=dist; use sites-preview start <wrapper>. Nested-package dev preview had a daemon cwd limitation; do not change production scripts to compensate. Exclude wrapper from Git.
6. Use the connected GitHub tree/commit/ref tools if direct Git push has no credentials. The last pushed integration checkpoint before final QA was 1ebe7aaac7f40cab9ec3953263f7bd27d16ae658. `git rev-parse HEAD` resolves the final documentation checkpoint. Never force unrelated branch history.
7. Preview only: use exact source SHA with Vercel per-deployment buildCommand npm run build:lab, outputDirectory dist-lab and existing project/team IDs documented below. Omit target (preview default); never promote to production or change main. Verify READY/source SHA and authenticated HTTP 200. Preserve preview protection.

Highest-value next task: Matt's physical Android review of the three known owner cases and ten fresh website copies. Keep recipe/card correctness ahead of richer scheduling. Each confirmed defect needs an issue snapshot and new regression assertion. Source replay restores inputs; full reports retain reported graph/timers for Work debugging. Arbitrary multi-pan interpretation, culinary/personalised estimates, native notifications/voice, full issue-session UI replay, server collaboration and compound ingredient components remain future work.

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
