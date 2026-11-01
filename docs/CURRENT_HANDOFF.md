# Plan & Plate — Current Handoff

Last updated: 2026-11-01

## Current production state

- Repository: `mattpilkyApps/plan-and-plate`
- Default branch: `main`
- Latest merged recipe-import work: PR #2
- Main merge commit: `55898b272efea2dd523e129e58d30b3f08d8a959`
- Recipe import branch retained: `fix/recipe-paste-import`
- Vercel production is connected to the Plan & Plate repository.

## What was just completed

Recipe paste/import was improved and merged into main.

Relevant recovered commits:

- `2b42f636d14f05030f712e52faaec711207c6972` — import recipes copied directly from websites
- `c5076bd02aa77239ab7520b5ae49215a2f9cc43a` — normalise imported recipe ingredients without phantom items
- `55898b272efea2dd523e129e58d30b3f08d8a959` — merge PR #2 into main

The recovered parser work was validated with 32 Node tests, ESLint and the production build before merge.

## Latest physical-phone test

Matt tested the BBC Good Food-style pumpkin curry copy on Android after deployment.

### Working well

- Recipe title and metadata are being detected.
- Ingredients are largely correct.
- Split preparation lines are being rejoined correctly, for example:
  - `2 onions` + `finely chopped`
  - lemongrass + its preparation note
- Ingredient alternatives and preparation wording are mostly preserved sensibly.
- The real recipe method is detected.

### Current bug

Method extraction does not stop reliably when unrelated webpage content begins.

The legitimate method ends around:

`...warm naan breads.`

The importer then continues into unrelated advertising/product content, including examples such as:

- `Elevated by design Your autumn wardrobe has arrived.`
- `Overt Heeled Ankle Boots £159`
- `Depend Leather Shoulder Bag £129`
- `Dependent Suede Shoulder bag £129`
- `Carbon-Neutral Ad`

These unrelated lines are currently being numbered as additional recipe method steps.

## Exact next task

Improve method-section termination and general webpage-noise classification without regressing the ingredient extraction that now works.

Do NOT solve this by hardcoding those product names or BBC Good Food specifically.

The next parser change should:

1. Add the exact failing phone sample as a regression fixture.
2. Introduce general method-boundary / unrelated-content detection.
3. Keep extraction and ingredient normalisation as separate stages.
4. Preserve the existing successful ingredient behaviour.
5. Add tests covering real recipe-site layouts from multiple sources.
6. Run parser tests, full test suite, lint and production build.
7. Update this handoff and `PLAN_AND_PLATE_DEVELOPER_LOG.md` before finishing.
8. Commit and push the work before stopping.

## Relevant files first

Inspect only these areas initially unless the implementation genuinely requires more:

- `src/utils/recipeImport.js` or the current recipe extraction utility
- `src/utils/ingredientParser.js`
- recipe-import/parser test files and fixtures
- `src/pages/AddRecipe.jsx`
- `docs/PLAN_AND_PLATE_DEVELOPER_LOG.md`

Do not broadly re-read the repository for this task.

## Recovery rule for every future Work session

At the beginning of a Plan & Plate coding task:

1. Read this file.
2. Read only the latest relevant section of `docs/PLAN_AND_PLATE_DEVELOPER_LOG.md`.
3. Check Git branch/status/recent commits.
4. Work only on the requested area.

At the end of every meaningful task:

1. Run relevant tests plus lint/build.
2. Update the developer log.
3. Replace this file with the latest current state.
4. Commit.
5. Push the branch/commit to GitHub.
6. Deploy if requested.
7. Record any physical-phone testing still required.
