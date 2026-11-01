# Plan & Plate — Current Handoff

Updated 2026-11-01. Repository: `mattpilkyApps/plan-and-plate`.

- Main verified at `b979d9767c5706248ea54eb0c7d1fb883b82c800`; production is unchanged.
- Active branch: `improve/recipe-parser-hardening`; do not merge main or deploy production.
- Latest branch checkpoint is the commit containing this file (`git rev-parse HEAD`). Previous pushed method checkpoint: `7b68fe98dc947c5c3704bd9349dcf7dba7558489`.
- Completed: corpus infrastructure; first research batch; contextual METHOD → AFTER_RECIPE extraction and explainable block signals; second research batch; ingredient normalisation torture tests. Owner's exact retail tail is excluded while both original curry imports and preparation joins pass.
- Corpus: 40 cases from 20 inspected public pages across 17 domains plus adversarial synthetic layouts; 53 ingredient torture rows. No scraped full pages added. Original parser: 15/40 complete cases, 42 noise occurrences; current: 40/40, zero specified noise/unexpected ingredients/contaminated steps.
- Checks so far: 121 focused tests and ESLint pass, no skips/TODO. Full suite/build/service-worker validation are next.
- Relevant files: `src/utils/recipeImport.js`, `recipeSignals.js`, `recipeMethod.js`, `ingredientParser.js`; tiny count-plural update in `shoppingList.js`; `tests/recipe-*.test.js`, `ingredient-torture.test.js`, `tests/fixtures/recipe-corpus/`; evaluator in `scripts/evaluate-recipe-corpus.js`.
- Diagnostics are opt-in: `parsePastedRecipe(text, { includeDiagnostics: true })`; field evidence, method stop/discard reasons and ingredient section indices. Default result remains compatible. No migration/dependency/AI.
- Known limits: ambiguous plain-text navigation/title and unmarked food-related promos; distant method resumption after an ad can be truncated safely; quantity ranges remain unscaled in shopping with original notes retained. Total time is extracted but not yet a separate form field.
- URL/JSON-LD remains research only; see `RECIPE_PARSER_RESEARCH.md`. No URL backend added.
- Exact next task: finish review and fail-safe paste feedback; run full tests/lint/build/generated-SW checks; commit/push; deploy and verify Vercel PREVIEW; update developer log and replace this handoff with final results.
- Vercel project/team verified: `plan-and-plate` / `team_rAS0gWuBiS9ffwL3XKEnGEPF`. Final preview URL/status pending.
- Physical Android testing is outstanding: original curry + retail tail, several fresh site copies, paste keyboard/scrolling, save/reopen, plan and inspect scaled shopping ingredients. Do not claim device validation.
