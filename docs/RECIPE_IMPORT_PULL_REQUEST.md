# Fix recipes pasted directly from websites

Copying the BBC Good Food pumpkin curry into Paste Recipe previously left the title and ingredients blank and misread split preparation/cooking times. The same plain-text or Markdown copy now fills its title, four servings, both 20-minute times, 13 ingredients and two cooking steps.

The importer handles common page tabs, adverts, links and wrapped preparation notes locally. Partial imports retain existing draft fields and identify missing details; unrecognised text remains available with an accessible error. Original ingredient wording stays available when cooking, with existing serving scaling and shopping quantities retained. No storage migration, backend or dependency changes.

Recovery follow-up: retained the original importer commit and fixtures. Added general navigation/control filtering, combined metadata labels, checkbox ingredients, inline step labels and a terminal boundary before recommended recipes. Normalisation now preserves qualifiers separately, recognises count measures and × pack multipliers, merges prepared garlic and pinch variants, and uses explicit ingredient separators so alternatives, parenthetical amounts and extra quantities cannot become phantom items. No new dependencies or backend changes; optional qualifiers are backward compatible with saved records.

Validation: 32 regression tests, ESLint, production build and generated service-worker syntax pass. The recovered implementation was browser-tested again for the original sample import/save/reopen, two method steps, six-serving planner/shopping quantities, link-only error feedback, and partial imports preserving a draft name. The previous session recorded 320/390/430px layout checks. Physical Android/Safari and further recipe-site formats still need owner testing. See `docs/review/recipe-import-form.jpg` for the earlier session's review screenshot.

Merge only after owner approval. A review preview is separate from the production application.
