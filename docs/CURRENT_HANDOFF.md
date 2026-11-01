# Plan & Plate — Current Handoff

Updated 2026-11-01. Repository: mattpilkyApps/plan-and-plate.

- Branch: `improve/recipe-parser-hardening`; previous pushed head `d0043476c8957fa6a8d39af88d68b73d6bca6ed2`. Current checkpoint is this branch's HEAD (`git rev-parse HEAD`). No main merge/production deployment.
- Main last verified at `b979d9767c5706248ea54eb0c7d1fb883b82c800`.
- Latest owner feedback: actual paneer-curry Android paste split preparation lines and attached To serve to juiced. Source text is now a regression fixture. Shopping redesign is deferred; recipe correctness first.
- Fixed: shared preparation/qualifier grammar for grated-or, deseeded-if, cut-into, made-with and juiced; bare serving headings before unmeasured foods; serving conjunction wrapping. Exact sample yields 16 readable entries and two method steps; reheating tip goes to Notes, attribution/promoted articles excluded. Existing user notes are retained.
- Corpus: 46 cases (6 added), plus 53 torture rows and new integration/diagnostic checks. Previous preview on these cases: 41/46; current: 46/46, zero specified noise/unexpected ingredient entries/contaminated steps. Reports: recipe-parser-phone-baseline.json and recipe-parser-results.json. Original 40-case/main baseline remains historical in recipe-parser-baseline.json.
- Validation so far: 130 focused tests and ESLint pass. Full tests/build/generated service-worker and new preview browser QA are next.
- Exact next task: finish validation, push checkpoint, verify a new branch Vercel PREVIEW; browser-check this exact paneer sample through import/save/reopen/Notes; update this handoff and developer log; push final documentation.
- Previous preview remains the earlier immutable build: https://plan-and-plate-ngtdv5jrm-mattpilkyapps-projects.vercel.app. New preview URL pending; do not send the old preview for this fix.
- Physical Android verification of the follow-up remains outstanding. Re-paste into the new preview; previously saved malformed imports are not automatically rebuilt.
- Known limits: combined rice/herb/chilli serving wording is preserved as one original recipe entry; later Shopping decomposition is deferred. No amounts or density conversions are invented. No AI or URL importer/dependencies/migration added; URL/JSON-LD research remains deferred in RECIPE_PARSER_RESEARCH.md.
- First files: this handoff, latest developer-log entry, recipeImport.js, ingredientPreparation.js, ingredientParser.js, recipeMethod.js, recipeSignals.js, related tests. Commit/push meaningful milestones.
