# Plan & Plate — Current Handoff

Updated 2026-11-01. Repository: `mattpilkyApps/plan-and-plate`.

- Main verified at `b979d9767c5706248ea54eb0c7d1fb883b82c800`; production is unchanged.
- Active branch: `improve/recipe-parser-hardening`; do not merge main or deploy production.
- Latest branch checkpoint is the commit containing this file (`git rev-parse HEAD`). Previous pushed corpus/normalisation checkpoint: `fac8323943d530226e2b197d00ad0b6a12f707cb`.
- Completed: corpus infrastructure; first research batch; contextual METHOD → AFTER_RECIPE extraction and explainable block signals; second research batch; ingredient normalisation torture tests. Owner's exact retail tail is excluded while both original curry imports and preparation joins pass.
- Corpus: 40 cases from 20 inspected public pages across 17 domains plus adversarial synthetic layouts; 53 ingredient torture rows. No scraped full pages added. Original parser: 15/40 complete cases, 42 noise occurrences; current: 40/40, zero specified noise/unexpected ingredients/contaminated steps.
- Validation: 121 focused tests, 135 full tests, ESLint, production build, generated-SW syntax/all 33 cached assets and whitespace checks pass. No skips/TODO.
- Relevant files: `src/utils/recipeImport.js`, `recipeSignals.js`, `recipeMethod.js`, `ingredientParser.js`; tiny count-plural update in `shoppingList.js`; `tests/recipe-*.test.js`, `ingredient-torture.test.js`, `tests/fixtures/recipe-corpus/`; evaluator in `scripts/evaluate-recipe-corpus.js`.
- Diagnostics are opt-in: `parsePastedRecipe(text, { includeDiagnostics: true })`; field evidence, method stop/discard reasons and ingredient section indices. Default result remains compatible. No migration/dependency/AI.
- Known limits: ambiguous plain-text navigation/title and unmarked food-related promos; distant method resumption after an ad can be truncated safely; quantity ranges remain unscaled in shopping with original notes retained. Total time is extracted but not yet a separate form field. Uncertain original paste is retained in the sheet, draft and optional sourcePaste recipe field.
- URL/JSON-LD remains research only; see `RECIPE_PARSER_RESEARCH.md`. No URL backend added.
- Exact next task: verify the final branch Vercel PREVIEW and browser import/save/reopen/plan/shopping behaviour; record URL/results here and in the developer log; push the final documentation checkpoint.
- Vercel project/team verified: `plan-and-plate` / `team_rAS0gWuBiS9ffwL3XKEnGEPF`. Final preview URL/status pending.
- Physical Android testing is outstanding: original curry + retail tail, several fresh site copies, paste keyboard/scrolling, save/reopen, plan and inspect scaled shopping ingredients. Do not claim device validation.
