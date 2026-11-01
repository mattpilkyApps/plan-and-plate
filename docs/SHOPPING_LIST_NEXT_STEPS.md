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
