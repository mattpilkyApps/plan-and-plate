# Fix recipes pasted directly from websites

Copying the BBC Good Food pumpkin curry into Paste Recipe previously left the title and ingredients blank and misread split preparation/cooking times. The same plain-text or Markdown copy now fills its title, four servings, both 20-minute times, 13 ingredients and two cooking steps.

The importer handles common page tabs, adverts, links and wrapped preparation notes locally. Partial imports retain existing draft fields and identify missing details; unrecognised text remains available with an accessible error. Original ingredient wording stays available when cooking, with existing serving scaling and shopping quantities retained. No storage migration, backend or dependency changes.

Validation: 25 regression tests, ESLint, production build and generated service-worker syntax pass. Browser-tested sample import/save/reopen, two method steps, six-serving planner/shopping quantities, invalid and partial imports, and 320/390/430px layouts. Physical Android/Safari and other recipe-site formats still need owner testing. See `docs/review/recipe-import-form.jpg`.

Merge only after owner approval. A review preview is separate from the production application.
