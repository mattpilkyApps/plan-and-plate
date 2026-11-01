# Recipe import reliability investigation

2026-11-01. Baseline: e35614b5d92b5ff840c46bf61cd485a3f0d7e111, fix/recipe-tabs-and-unlabelled-method. Main remains fde4ce3c75b41f5f6c4f53610f1720c48ae507a7.

## Evidence before implementation

The existing 155 focused tests pass; baseline scores 57/57 on its text corpus but only 5/16 on new full-tab workflows. Full method tabs include navigation Ingredients/Method/Nutrition, cooking content, notes and footer; each separately pasted tab may repeat a header and its own footer. Current extraction treats the flattened string as one page. An earlier footer can block later pasted ingredients, and a navigation Ingredients link can claim method prose. These scenarios reproduce the symptom; Matt’s newest on-device bytes/event sequence have not been captured, so this is not proof of the exact phone cause.

The current clipboard helper depends on successful parsing to decide whether to insert a separator, only handles appends, and loses paste provenance. The form keeps existing nonempty fields when a partial import has no replacement, but currently clears apparently successful source text. Current reverse-order support moves lines and synthesises a Method heading before running a forward extractor. More exceptions here would increase ambiguity.

## Approaches to compare on identical inputs

1. Existing flat parser: immutable control, including its reordering heuristic.
2. Section indexing: locate actual ingredient/method blocks independently in original order; reuse existing cleaning, preparation joining and stateful method/noise extraction. No physical reordering or synthetic headings.
3. Paste-aware assembly with the old parser: preserve independent paste boundaries, parse each page independently, select compatible nonempty fields and detect conflicts. Tests whether provenance alone is sufficient.
4. Section indexing plus paste-aware assembly: combine both, then compare corpus/workflow preservation, false positives and timing. Ship only the selected production path.

Clipboard HTML/JSON-LD can supply richer structure in future, but cannot be required for phone plain-text pastes. AI parsing/API dependencies remain out of scope. Do not weaken footer rejection globally to recover later tabs.

## Evaluation and constraints

Run node scripts/compare-recipe-import.js. Initial report: recipe-import-comparison-baseline.json. The 16 workflows reuse owner-provided text with synthetic full-page wrappers; no publisher page has been scraped into the repository. Add tests for append/prepend, missing newlines, duplicate pastes, selected replacement, manual edits/deletion, partial fills, conflicting recipes and source recovery. Keep the 57 existing corpus cases and ingredient normalisation separate and unchanged.

Native paste and real DOM input are different checks. MDN documents default insertion at the selection/cursor and explicit manual insertion after preventDefault; synthetic paste alone does not change textarea contents. React requires synchronous controlled textarea state updates and warns about caret movement when values are transformed. Preserve actual text and selection, use one pure input-state update path, and verify with native browser clipboard actions. Sources: https://developer.mozilla.org/en-US/docs/Web/API/Element/paste_event ; https://react.dev/reference/react-dom/components/textarea ; https://www.w3.org/TR/input-events-2/ . No claim about a specific Android keyboard implementation is made from these documents.

Next: implement and measure the candidates, remove the superseded reorder/helper path if the combined approach wins, then perform full validation and browser QA on a new preview. Physical Android acceptance remains outstanding.

## Selected design and measured comparison

| Approach | Existing text corpus | Complete-tab workflows | Specified workflow noise occurrences | Unexpected ingredient rows |
| --- | --- | --- | --- | --- |
| Previous flat parser | 57/57 | 5/16 | 8 | 4 |
| Independent section indexing, flat text | 57/57 | 8/16 | 0 | 0 |
| Paste boundaries with previous parser | 57/57 | 10/16 | 10 | 4 |
| Section indexing plus paste boundaries | 57/57 | 16/16 | 0 | 0 |

Selected the combined design. These are curated structural comparisons, not measured accuracy across the internet. The old parser is loaded from immutable e35614b for every comparison, not reimplemented as a weaker control. Reproduce with npm run parser:compare; output is docs/recipe-import-comparison.json. Local Node timing over 80 warmed samples was median 1.524 ms / p95 10.247 ms; phone performance has not been measured.

Production responsibilities now have explicit boundaries:

- recipePaste.js tracks source character ranges through native textarea changes, without intercepting or transforming the paste. An observed clipboard event supplies exact selection coordinates; intact append/prepend and text-diff fallback also cover bulk input without that event. Text split by a middle insertion rejoins by source identifier. Replacement/deletion removes source bytes; no hidden clipboard history resurrects deleted data.
- recipeText.js retains existing cleaning/control/header-metadata helpers. Primary heading grammar lives once in recipeSignals.js.
- recipeSections.js indexes actual ingredient and method source ranges independently. Nutrition/retail gaps close ingredient collection, while safe primary instructions can follow; related/review/newsletter boundaries close a page. It never reorders lines or manufactures a Method heading.
- recipeIngredients.js retains preparation/subsection/measure joins. recipeMethod.js remains the existing stateful method/noise extractor. ingredientParser.js and shopping identity normalisation are unchanged.
- recipeImportSession.js selects compatible nonempty fields from separately captured pages, deduplicates repeated/subset sections and flags disagreements. It does not add incompatible quantities, mix differently named recipes or invent instructions. fillRecipeFromImport preserves unrelated form fields and notes.
- AddRecipe.jsx binds these pure helpers, preserves source text/ranges in the existing local draft/save flow and displays ingredient/step counts before filling. Missing sections and conflicts remain visible for review. No extra configuration screen.

Removed the previous physical section-reordering path and parser-dependent newline insertion. The textarea now keeps native text/caret/selection behaviour. Source snapshots are retained even after a successful fill, allowing additional copies and later diagnosis. Old records without source ranges still load as one visible text fragment; no data migration. No runtime dependency, external AI service or network call added.

Coverage beyond the 57 text cases: 16 workflows, each exercised at append/prepend/middle with and without an observed paste event (96 combinations); four whitespace/heading transformations across all workflows (64 more); explicit replace/delete/edit/reload/subset/conflict/partial-fill/short-paste tests. These synthetic wrappers are necessary because pure text fixtures cannot test the loss of paste provenance.

Limitations: an already flattened copy with multiple page footers and no recorded boundaries remains ambiguous; deliberately do not cross every footer. A keyboard edit without a clipboard event can require diff inference where identical text is ambiguous. Different recipe names and conflicting quantities request review instead of automatic mixing. Empty/poorly structured copies cannot supply information they do not contain. The newest phone failure’s exact bytes remain unverified until device testing. HTML clipboard support and Recipe JSON-LD/URL import remain future source adapters; pasted-text fallback remains required.

Validation before preview: 188 full tests (174 focused), 57/57 corpus and 16/16 workflows; lint/build/generated-SW syntax/all 33 cached assets and whitespace pass. Native browser clipboard/save/reopen/reload verification is the next checkpoint; Android acceptance is still Matt’s check.

## Verified preview and recovery evidence

Implementation checkpoint 1e7e431ac82f3e83a787407b19300aab942f0e89 is pushed. Vercel PREVIEW dpl_8YuCjpxAX2mU9cY8GPPu6sLwkgPe is READY, target preview, source SHA verified: https://plan-and-plate-e7z64i8jt-mattpilkyapps-projects.vercel.app. No production release.

Native browser clipboard QA used complete Method and Ingredients tab copies with independent synthetic nutrition/review/related/footer content. Method-first showed 0 ingredients / 3 steps and an explicit missing-ingredients message; adding Ingredients changed this to 11 / 3. No manual newline was inserted; visible textarea bytes matched native concatenation exactly and the caret stayed at the insertion end. Reload before Fill form recovered both copies and their ranges/counts from the draft. Fill form → save → reopen retained all 11 original ingredient entries, three method paragraphs, servings/times and separate Cook’s tip, with no specified noise. Edit → Paste Recipe recovered saved source and counts. Select-all replacement with Ingredients removed the old Method from the paste-session result (11 / 0); appending Method in the other order restored 11 / 3. Update Recipe returned to the detail page with 11 ingredients/three steps. Screenshot: docs/review/recipe-import-source-status-qa.jpg.

Final automated checks: 174 focused / 188 full tests, 57 text corpus cases, all 16 complete-tab workflows, lint, production build, generated service-worker syntax/all 33 asset references, whitespace. The Git baseline loader was also checked against the new modular commit. The final docs/evidence checkpoint has identical application source. Physical Android verification is still required; do not convert this browser result into a device-wide reliability claim.

Exact next task: Matt tests this new preview on Android with the real complete website-tab copies in both orders. Before Fill form, expect 11 ingredients / 3 steps for the supplied sprouts recipe. Check keyboard, selection, scrolling, save/reopen and the earlier paneer/pumpkin preparation joins. If it fails, keep the retained paste/draft, record its actual source text and copy order, and add that case rather than guessing from a screenshot. Only after device acceptance prepare a separately authorised production release.
