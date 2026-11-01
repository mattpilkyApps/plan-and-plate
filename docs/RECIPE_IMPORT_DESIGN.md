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
