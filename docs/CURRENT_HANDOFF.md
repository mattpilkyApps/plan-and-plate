# Plan & Plate — Current Handoff

Updated 2026-11-01. Repository: mattpilkyApps/plan-and-plate.

- **Production/main:** fde4ce3c75b41f5f6c4f53610f1720c48ae507a7 at https://planandplate.co.uk/. The completed paneer/parser release is live; the new two-tab correction is on a separate branch.
- **Current branch:** fix/recipe-tabs-and-unlabelled-method, based on that main commit. Current checkpoint SHA: git rev-parse HEAD. No merge or production deployment of this follow-up.
- **Latest user case:** sprouts fried rice copied in two actions, Ingredients tab first and Method tab second into the same paste box. Full exact owner input is tests/fixtures/sprouts-rice-two-tab-phone.txt; ingredient/method clipboard fragments are derived in the fixture module.
- **Fixed:** navigation Method headings no longer start extraction before real ingredients; unlabelled cooking paragraphs infer a method from context; compact Serves2/Prepare15/Cook10/Total time25 labels work; Cook’s tip goes to Notes. Cooked prepared-food names are retained through save. Clipboard helper adds a boundary between fragments only for an append at the end, respecting selected replacement and mid-line editing.
- **Expected exact sample:** 11 original ingredient entries, servings 2, prep 15 mins, cook 10 mins, total 25 mins, 3 method paragraphs and the genuine rice tip in Notes. No invented quantities or instructions.
- **Validation PASS:** 144 focused tests / 158 full tests; 51/51 corpus cases; ESLint; production build; generated-SW syntax/all 33 cached assets; whitespace. Previous production on same corpus: 46/51. Reports: recipe-parser-tabs-baseline.json and recipe-parser-results.json. No skipped/TODO/failing automated cases.
- **Exact next task:** browser-test two native clipboard pastes into the same sheet without manually adding a newline, then Fill form → save → reopen. Verify all 11 ingredients, three steps and separate Notes; verify Vercel preview SHA/status; update this file/developer log and push final evidence checkpoint.
- **Preview:** pending new branch deployment. Production URL still runs the prior release; do not confuse it with the new preview.
- **Device status:** Android failure reported by Matt; follow-up physical check outstanding. Test the same two-copy workflow in the new preview.
- **Limits:** selected text is replaced according to ordinary clipboard behaviour; the helper does not override intentional replacement. Unlabelled method inference uses strong cooking sentences after ingredients, not arbitrary prose. English/menu/promotional ambiguity remains. Shopping/compound-serving decomposition and URL/JSON-LD remain deferred. No dependency/AI/migration added.
- **Relevant files:** recipeImport.js, recipeSignals.js, recipePaste.js, ingredientParser.js, AddRecipe.jsx; recipe-tabs-and-paste.test.js and two-tab corpus fixture. Read this handoff and only the latest developer-log entry first; commit/push milestones.
