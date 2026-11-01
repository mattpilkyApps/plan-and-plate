# Shopping list — next work

2026-11-01. Read-only baseline after parser release PR #4 (main application commit c52e13c6ea6e3d6631ad4a8af4f40aa0bb555fc2). Matt reports the latest recipe preview works well and has requested Shopping next. This document scopes the next work; no Shopping code has changed in the release.

## Reproduced with current clean imports

Run each owner fixture through parsePastedRecipe → parseIngredients → generateShoppingGroups, at its original servings. The paneer recipe retains 16 recipe ingredients and sprouts retains 11. Earlier standalone preparation rows such as cut into cubes / made with stock / juiced are absent after a fresh correct import. Previously malformed saved imports do not rebuild automatically.

Remaining concrete Shopping issues:

| Input/current canonical shopping name | Current aisle | Required direction |
| --- | --- | --- |
| paneer | Other | Dairy & Eggs |
| ginger; red chilli | Other | Fresh Produce |
| garam masala | Other | Herbs & Spices |
| mango chutney; oyster sauce | Other | Condiments & Sauces |
| groundnut oil | Other | Oils & Cooking |
| mushroom seasoning | Fresh Produce | Herbs & Spices |
| Cooks’ Ingredients Chilli & Garlic Sauce | Fresh Produce | Condiments & Sauces |
| Brussels sprouts, quartered | Other | Clean preparation suffix from shopping identity; Fresh Produce |
| salad onions, whites and greens separated, both | Fresh Produce | Clean preparation clause from identity, retain original wording |
| cooked pigs in blankets | Other | Meat & Fish; retain this valid prepared-food name |
| steamed basmati rice and coriander | Pantry / Tins / Dry Goods | Compound serving line needs explicit component/quantity handling; never invent an amount |

Correct baseline examples to protect: 2 garlic cloves → garlic / 2 cloves; 2 × 400g chickpea cans → chickpeas / 800 g; coconut milk stays in Pantry; frozen spinach stays Frozen. Sprouts' 2½ tbsp oil and 1½ tsp seasoning retain fractional quantities. Recipe-display wording must remain intact.

## Recommended first implementation milestone

Create improve/shopping-list-quality from current main. Add focused golden recipe → planned servings → Shopping cases using the existing owner fixtures, with aisle/name/quantity/source expectations; also retain manual household items and checked/cleared behaviour.

Separate concerns: ingredient normalisation supplies a canonical product identity plus original wording/qualifiers; a small readable product/alias catalogue supplies specific aisle matches before broad words. Avoid extending substring lists indefinitely: sauce containing garlic is a sauce, seasoning containing mushroom is seasoning, and groundnut oil is cooking oil. Put rules/data in utilities, not JSX.

Protect safe quantity scaling/merging, units, optional/alternative notes and provenance. Do not combine incompatible units into an invented total. Decide compound serving-line representation before implementing splitting at every and/or; salt and pepper and product names are not equivalent to arbitrary clauses. Keep original recipe lines and saved-data compatibility.

After a verified data-quality milestone, check the mobile Shopping flow: checking items, manual grocery/household entries, editing, categories, week switching, sources and clear checked. The product remains a whole household weekly basket including non-food items; price comparison and cheapest-complete-supermarket basket remain later work. No live supermarket integration in this first fix.

## Relevant files/checks

src/utils/ingredientParser.js; src/utils/shoppingList.js; src/pages/Shopping.jsx; tests/shopping.test.js; existing ingredient tests and owner phone fixtures. Start with these and current handoff; no repository-wide audit. Baseline full suite 188 passes. Run meaningful tests, lint/build/SW, checkpoint/push milestones and deploy a separate preview. Production deployment of Shopping changes requires a later release instruction.

## First quality milestone implemented on a separate branch

Branch improve/shopping-list-quality starts at main 162e6b47771a93333499da9b26f5d78716adadfd, after the parser production release. Added a small shoppingProductCatalog.js with explicit product-family/alias decisions before broad words; keyword matching now respects whole words/plurals. Sauce/seasoning names no longer inherit garlic/mushroom aisles. Unknown household oils do not automatically become cooking oils.

Shared preparation grammar now recognises halved/quartered and component clauses such as whites and greens separated / seeds removed. Canonical shopping identity loses those notes while rawText and qualifiers preserve original wording. Prepared foods such as cooked pigs in blankets and quartered artichoke hearts remain named products. Category selection uses the cleaned display identity plus retained source evidence for chopped/tinned tomatoes, preserving the existing canned-tomato rule and contrasting freshly chopped produce. Legacy saved ingredient names improve without altering their item IDs, checked/cleared state or stored recipe.

Added 29 functional checks including both full owner recipe → planned servings → Shopping paths, 24 aisle/preservation examples, canonical raw/qualifier preservation, legacy clear-state stability and tomato source-context contrasts. Full 217 tests, lint/build/generated-SW syntax/all 33 assets pass; recipe corpus remains 57/57 and full-tab workflows 16/16 with zero specified leakage. Preview/browser Shopping QA is next. No Shopping production deployment. Compound serving line remains unsplit for a deliberate component model; incompatible-unit conversion/purchase-pack rounding and wider UX are later work.

## Verified preview

Implementation 4071f39baf9858dc44d48a957f4ebf008a8ed5a5 is on PREVIEW https://plan-and-plate-k1aomwsw8-mattpilkyapps-projects.vercel.app, READY, dpl_G9jBRfXyWt3FnjC1PH3EK64PZtpx. Production main remains 162e6b4 and the domain retains the accepted parser release.

Native browser QA imported/saved the owner paneer text (16 ingredients/two steps), planned six servings and verified 16 Shopping rows: paneer 300g, chickpeas 1200g, garlic 3 cloves, stock 180ml and the expected aisles. Checked paneer persisted across reload; unchecking worked. A manually added Toilet rolls item appeared in Toiletries. Imported/saved sprouts next: original quartered/whites-and-greens preparation remained visible in the recipe at its original servings. Planned two servings on another day. Combined Shopping has 26 generated rows plus one manual household row; garlic merges to 7 cloves with both recipe sources visible, and all target products use specific aisles with clean names. No Other group for these two samples. Evidence: docs/review/shopping-quality-aisles-qa.jpg.

Final validation remains 217 full tests, 57/57 recipe corpus and 16/16 full-tab workflows, lint/build/generated-SW syntax/all 33 assets and whitespace passing. Final checkpoint is documentation/evidence only. Android Shopping acceptance and a separately authorised Shopping production release remain outstanding. Exact next engineering task: design backward-compatible component metadata for combined To serve entries such as rice and coriander, preserving one original recipe line and unmeasured/optional evidence; do not invent quantities or split arbitrary product names at and/or.
