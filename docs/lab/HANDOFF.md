# Recipe Quality Lab — recovery handoff

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

Coverage is of extracted method text; it is not proof that arbitrary website source was classified perfectly. Unmapped evidence and uncertain boundaries request review. Conservative deterministic segmentation cannot understand every conditional recipe. No recipe is labelled perfect. No AI cost or API key introduced. Browser and physical-device validation pending.

## Recovery

Clone repository, checkout this branch, `git log -3 --oneline`, read this file and latest developer-log entry. `npm ci`, then run targeted checks. Avoid re-reading the whole repository. Use `git rev-parse HEAD` for exact current source; this handoff intentionally does not predict its own commit SHA.
