# Plan & Plate Developer Log

This document explains how Plan & Plate has been built and how future updates should be recorded.

Future developers should read this file with `docs/PLAN_AND_PLATE_PROJECT_CONTEXT.md`. The project context explains the permanent rules. This developer log explains the build history and what changed over time.

## How To Use This Log

- Add a dated entry after every meaningful change.
- Use plain English first, then list the files touched.
- Keep entries short, practical, and honest.
- Log feature changes, bug fixes, parser changes, shopping-list changes, planner changes, storage changes, UI-flow changes, deployment changes, and important documentation changes.
- Do not log tiny typo-only edits unless they affect behavior or future maintainability.
- Include how the change was tested.
- If a note is reconstructed from the current code rather than known from the original conversation, label it clearly.

## Future Update Template

Copy this template for future entries.

```md
## YYYY-MM-DD - Change title

### Why

Short explanation of why the change was needed.

### What changed

- Plain-English summary of what changed.
- Mention user-visible behavior first.
- Mention technical details only where useful.

### Main files touched

- `path/to/file`
- `path/to/other-file`

### Testing

- `npm run lint`
- `npm run build`
- Manual browser checks, if used.

### Notes or follow-up

- Any known limitation, risk, or next step.
```

## 2026-05-25 - Reconstructed Baseline From Current Repo

### Why

This baseline was created after the app already existed. It is reconstructed from the current codebase and project context, not from the full original chat history.

Its purpose is to give a future developer a clear starting point without needing old conversations.

### What Plan & Plate is

Plan & Plate is a mobile-first meal planning PWA. It helps a user save recipes, plan meals across weeks, and generate a shopping list from the selected week.

The app is currently a frontend MVP for beta testing. It stores data in the browser using `localStorage`. There is no backend, account system, payment system, database, AI feature, or external recipe API.

### Current tech stack

- Vite
- React
- React Router
- TailwindCSS
- Lucide React icons
- Browser `localStorage`
- Vercel deployment through GitHub

### Current user-facing app structure

- Planner: weekly meal planner with multi-week navigation.
- Recipes: searchable recipe library with saved recipes and sample recipes.
- Recipe Detail: full recipe screen with add-to-week, edit, and delete flows.
- Add/Edit Recipe: recipe form with image upload, local draft saving, and pasted recipe import.
- Shopping List: generated list from the selected planner week plus manual shopping items.

### Current data model

The app stores user data locally in the browser. Important keys are:

- `plan-and-plate-recipes`: saved user recipes.
- `plan-and-plate-removed-recipes`: sample or saved recipe IDs hidden/deleted by the user.
- `plan-and-plate-weekly-queue`: recipes queued from the recipe library for planner placement.
- `plan-and-plate-planner-settings`: planner settings, including week start day.
- `plan-and-plate-planned-meals-by-week`: planned meals grouped by week.
- `plan-and-plate-planned-meals`: older fallback key for planned meals.
- `plan-and-plate-removed-planner-meals`: starter planner meals the user removed.
- `plan-and-plate-cleared-shopping-items`: generated shopping items the user checked/cleared.
- `plan-and-plate-manual-shopping-items`: manual shopping items created by the user.
- `plan-and-plate-add-recipe-draft`: unsaved add-recipe draft.

Future developers should avoid changing these keys unless they also write and document a migration plan.

### Current important file areas

- `src/App.jsx`: route definitions.
- `src/pages/Planner.jsx`: planner state and actions.
- `src/components/planner/`: planner UI pieces split out from the main planner page.
- `src/pages/Recipes.jsx`: recipe library and recipe actions.
- `src/pages/RecipeDetail.jsx`: full recipe display.
- `src/pages/AddRecipe.jsx`: recipe form, photo upload, and paste recipe import UI.
- `src/pages/Shopping.jsx`: shopping screen and manual item actions.
- `src/utils/localStorage.js`: browser storage helpers.
- `src/utils/ingredientParser.js`: ingredient parsing and cleanup.
- `src/utils/shoppingList.js`: generated shopping list, serving scaling, merge behavior, and categories.
- `src/utils/plannerWeeks.js`: planner week/date logic.
- `src/utils/recipeKeys.js`: stable recipe lookup and route keys.
- `src/data/sampleData.js`: starter app data.
- `public/manifest.webmanifest` and `public/icons/`: PWA setup.
- `docs/PLAN_AND_PLATE_PROJECT_CONTEXT.md`: permanent project rules.

### Current feature behavior

- Recipes can be added, edited, deleted, and saved locally.
- Built-in sample recipes can be hidden or edited for MVP testing.
- Recipe photos are compressed in-browser and stored locally as data URLs.
- Pasted recipe text can be imported into a recipe.
- The planner supports multiple weeks.
- Users can choose the planner week start day.
- Recipes can be sent to a weekly queue and then placed into planner slots.
- Planned meals can be moved, duplicated, removed, and given planned servings.
- Shopping lists are generated from the selected planner week.
- Ingredient quantities scale based on planned servings.
- Generated shopping items merge when the parser can safely match quantity, unit, and ingredient name.
- Manual shopping items stay separate from generated recipe items.
- The app is installable as a PWA.

### Current limitations

- All data is local to one browser/device.
- There is no sync, login, cloud backup, or shared family account.
- Recipe parsing is heuristic. It aims to be helpful, not perfect.
- Shopping categories are keyword-based.
- Recipe photos stored as local data URLs can increase browser storage usage.

### Main files touched

- Current baseline reconstructed from the whole repo.

### Testing

- No app behavior changed for this baseline section.

### Notes or follow-up

- Treat this baseline as the current repo truth.
- Do not invent missing historical decisions. If a future developer needs exact old reasoning, they should inspect Git history or ask the owner.

## 2026-05-25 - Paste Recipe Review And Ingredient Cleanup

### Why

Pasted recipe text can include page noise, instructions, headings, mixed measurements, and messy ingredient wording. The app needed a clearer review step before imported ingredients were saved and used for the shopping list.

### What changed

- Added a paste recipe review step in the Add/Edit Recipe flow.
- Users can review detected ingredients before applying them to the recipe.
- Users can edit or remove detected ingredient lines.
- Suspicious ingredient lines can be marked with a small Check label.
- Pasted recipe noise such as `Print`, `Cook's notes`, method headings, and instruction-like lines is filtered more carefully.
- Ingredient parsing now handles common fractions such as `1/2` and `1 1/2`.
- Ingredient parsing now supports `oz`, `lb`, `lbs`, `pinch`, and `pinches`.
- Longer units are matched before shorter units, so `lb` does not become `l` plus `b...`, and `cloves` does not become `clove` plus `s...`.
- Dual metric/imperial ingredients such as `400g/14oz tin chopped tomatoes` prefer the metric amount.
- Ingredient names are cleaned for shopping-list display, for example removing prep words like chopped or diced.
- Shopping-list category keywords were expanded for common pantry, dairy, meat/fish, and frozen items.
- Generated shopping item names are cleaned before display and merge checks.

### Main files touched

- `src/pages/AddRecipe.jsx`
- `src/utils/ingredientParser.js`
- `src/utils/shoppingList.js`

### Testing

- `npm.cmd run lint`
- `npm.cmd run build`
- Manual parser check using a pasted recipe sample.
- Manual browser check of the paste recipe review/import flow.
- Manual generated shopping-list check for parsed ingredients.

### Notes or follow-up

- Recipe parsing is still heuristic and should stay easy to read.
- Add future parser rules in named helpers where possible, not as one giant unreadable expression.
- If future work changes parsing or shopping behavior, add another dated entry to this log.

## 2026-05-25 - Developer Documentation And Build Rules

### Why

The owner needs future developers to understand the app without needing old chat history or coding background. The project also needs a permanent rule that meaningful future changes are logged.

### What changed

- Strengthened the project context document with explicit build rules for all future code.
- Added this developer log.
- Added a reconstructed baseline explaining the current app from the current repo.
- Added a reusable future update template.
- Made it clear that future meaningful changes must be documented here.

### Main files touched

- `docs/PLAN_AND_PLATE_PROJECT_CONTEXT.md`
- `docs/PLAN_AND_PLATE_DEVELOPER_LOG.md`

### Testing

- Documentation-only change.
- Checked the docs for clear wording, accurate paths, and future developer instructions.

### Notes or follow-up

- Future developers should update this file as part of the normal completion checklist.

## 2026-05-25 - Paste Recipe Auto-Fill And Single-Unit Ingredient Lines

### Why

Phone testing showed the ingredient review step added too much friction. The owner wants the paste tool to parse everything from the pasted text and fill the recipe form automatically.

The owner also wants imported ingredients to use one measurement format instead of keeping mixed metric/imperial text.

### What changed

- Removed the ingredient review step from the paste recipe flow.
- The Paste Recipe sheet now has one main Fill form action.
- When the user taps Fill form, the app parses the pasted text immediately.
- Detected ingredients are written into the Ingredients field as cleaned single-unit lines.
- Dual measurements prefer the metric side when possible.
- Example: `400g/14oz tin chopped tomatoes` becomes `400 g tomatoes`.
- The Method field is still filled from the detected method/instructions section.
- The success message now says the recipe was imported and cleaned.

### Main files touched

- `src/pages/AddRecipe.jsx`
- `src/utils/ingredientParser.js`
- `docs/PLAN_AND_PLATE_PROJECT_CONTEXT.md`
- `docs/PLAN_AND_PLATE_DEVELOPER_LOG.md`

### Testing

- `npm.cmd run lint`
- `npm.cmd run build`
- Manual parser sample confirmed cleaned single-unit output:
  - `400g/14oz tin chopped tomatoes` became `400 g tomatoes`
  - `1 1/2 tbsp olive oil` became `1.5 tbsp olive oil`
  - `2 cloves garlic, finely chopped` became `2 cloves garlic`
- Browser snapshot confirmed the paste sheet now shows Fill form directly and no review step.

### Notes or follow-up

- This assumes "one unit" means one measurement format per ingredient line, not converting all ingredients into a single global measurement system.
- If the owner wants strict metric conversion for everything, that should be a separate documented change because cups, tins, cloves, and pinches need careful conversion rules.

## 2026-05-25 - Mary Berry Lasagne Paste Parser Fixes

### Why

Phone testing with a pasted Mary Berry lasagne recipe showed several parser mistakes in the Ingredients field.

The parser was treating the first letter of some ingredient words as units, for example:

- `2 garlic cloves` became `2 g arlic cloves`
- `2 level tbsp plain flour` became `2 l evel tbsp plain flour`
- `12 lasagne sheets` became `12 l asagne sheets`

It also kept some imperial alternatives and split `2 x 400g tins chopped tomatoes` into bad separate lines.

### What changed

- Unit matching now requires a real unit boundary, so `g`, `l`, and other short units no longer steal the first letter of ingredient names.
- Quantity parsing now understands measure words such as `level`, `heaped`, and `rounded` before a unit.
- Metric/imperial dual measurements with pints are now cleaned to the metric side.
- Package multiplier lines like `2 x 400g tins chopped tomatoes` are kept together and calculated as one line.
- Measured alternatives like `1 tbsp redcurrant jelly or 1 tsp caster sugar` now keep the first option instead of importing both.

### Main files touched

- `src/utils/ingredientParser.js`
- `docs/PLAN_AND_PLATE_DEVELOPER_LOG.md`

### Testing

- `npm.cmd run lint`
- `npm.cmd run build`
- Manual parser sample using the Mary Berry lasagne ingredient list.
- Confirmed important outputs:
  - `2 garlic cloves`
  - `2 tbsp plain flour`
  - `150 ml beef stock`
  - `800 g tomatoes`
  - `750 ml hot milk`
  - `12 lasagne sheets`

### Notes or follow-up

- This fix is based on the exact pasted recipe text and screenshots from phone testing.
- Future recipe-site failures should be added as small parser regression samples before changing parser rules.

## 2026-05-26 - Shopping List V2 Supermarket-Friendly Aisles

### Why

The shopping list needed to feel useful during a real supermarket shop, not just display parsed ingredients. Users should be able to walk through the shop section by section using clear aisle-style categories.

### What changed

- Replaced the old 5 shopping categories with supermarket-friendly aisle sections:
  1. Fresh Produce
  2. Meat & Fish
  3. Dairy & Eggs
  4. Bakery
  5. Pantry / Tins / Dry Goods
  6. Herbs & Spices
  7. Condiments & Sauces
  8. Oils & Cooking
  9. Frozen
  10. Other
- Improved ingredient categorisation with readable keyword groups.
- Kept important distinctions clear:
  - garlic cloves = Fresh Produce
  - garlic powder/granules = Herbs & Spices
  - fresh herbs = Fresh Produce
  - dried/ground herbs and spices = Herbs & Spices
  - fresh tomatoes = Fresh Produce
  - tinned/chopped tomatoes/passata = Pantry / Tins / Dry Goods
  - tomato puree = Condiments & Sauces
  - olive oil = Oils & Cooking
- Category cards remain collapsible with item counts.
- Empty categories stay hidden.
- Items sort alphabetically inside each category.
- Manual items, clear checked, generated item merging, serving scaling, and week-specific shopping generation still work.
- Item display now favours clean item name, quantity/unit, useful notes only, checkbox, and manual remove option.
- Existing old manual categories such as Dairy and Pantry are mapped into the new aisle categories.

### Main files touched

- `src/utils/shoppingList.js`
- `src/components/ShoppingCategory.jsx`
- `docs/PLAN_AND_PLATE_DEVELOPER_LOG.md`

### Testing

- `npm.cmd run lint`
- `npm.cmd run build`
- Manual category and merge checks for:
  - garlic cloves vs garlic powder
  - fresh coriander vs ground coriander
  - fresh tomatoes vs chopped tomatoes
  - milk vs coconut milk
  - onion, chicken breast, cumin, olive oil merging
  - legacy manual category mapping

### Notes or follow-up

- Categorisation is still simple keyword matching by design.
- The optional Recently added marker was skipped to keep the change focused and low-risk.

## 2026-05-26 - Shopping List V2 Small Categorisation And Duplicate Fixes

### Why

Phone testing found two small Shopping List V2 issues:

- Thyme was falling into Other instead of the herb/spice aisle.
- Plain flour appeared twice when the same recipe needed different amounts in different units.

### What changed

- Added thyme to Herbs & Spices category matching.
- Same-name generated ingredients with different units now display as one shopping line with combined readable quantities instead of separate duplicate-looking rows.
- Example: `2 tbsp plain flour` and `50 g plain flour` now show as `plain flour` with `2 tbsp + 50 g`.
- Exact same-name and same-unit generated ingredients still merge numerically as before.

### Main files touched

- `src/utils/shoppingList.js`
- `docs/PLAN_AND_PLATE_DEVELOPER_LOG.md`

### Testing

- `npm.cmd run lint`
- `npm.cmd run build`
- Manual shopping-list sample confirmed:
  - `thyme` goes to Herbs & Spices
  - two plain flour lines with different units display as one `2 tbsp + 50 g` item

### Notes or follow-up

- Same-name different-unit combining is display-only. It does not try to convert tablespoons into grams.

## 2026-05-31 - Recipe Library Favourites And Usage Tracking

### Why

The recipe library needs better retention foundations before adding future recipe sorting or recently used views. Users should be able to mark recipes as favourites now, and the app should quietly track recipe usage for future milestones.

### What changed

- Added a separate recipe metadata store in localStorage for favourites and usage stats.
- Recipes can now be favourited or unfavourited from recipe cards.
- Recipe detail pages now have a favourite star beside the recipe title.
- The Recipes page now shows a Favourite Recipes strip when favourites exist.
- Added a lightweight All Recipes / Favourites toggle.
- Search and meal category chips still work with the favourites view.
- Added a friendly empty state when the favourites view has no matching recipes.
- Usage tracking now records `timesUsed` and `lastUsed` when a recipe is added to Meals This Week, added directly to the planner, or duplicated as a planned meal.
- Queued recipes are marked as already tracked so placing them into the planner does not double count usage.

### Main files touched

- `src/utils/localStorage.js`
- `src/pages/Recipes.jsx`
- `src/pages/RecipeDetail.jsx`
- `src/pages/Planner.jsx`
- `src/components/RecipeCard.jsx`

### Testing

- `npm run lint`
- `npm run build`
- Manual browser or phone checks should confirm favourites, filters, Add to Week, planner placement, and usage tracking.

### Notes or follow-up

- Recently Used, Most Used, favourites-first sorting, recipe collections, accounts, backend sync, and AI were intentionally not added.
- Usage stats are local to the browser and device because the MVP is still localStorage-only.

## 2026-05-31 - Recipe Library Premium Favourites Navigation

### Why

Phone testing showed the Recipes page had two competing recipe navigation controls: the original category row and a separate All Recipes / Favourites toggle. This made the page feel less polished.

### What changed

- Removed the separate All Recipes / Favourites segmented toggle.
- Moved Favourites into the main horizontal recipe chip row.
- Made Favourites the default tab when opening Recipes.
- Kept All, Breakfast, Lunch, Dinner, and Snacks in the same row.
- Removed the separate Favourite Recipes card strip to avoid duplicate recipe display.
- Kept search working across Favourites, All, and meal tabs.
- Kept favourite star behaviour on recipe cards.
- Improved chip styling so the active recipe tab feels more deliberate and premium.

### Main files touched

- `src/pages/Recipes.jsx`
- `docs/PLAN_AND_PLATE_DEVELOPER_LOG.md`

### Testing

- `npm run lint`
- `npm run build`
- Manual phone checks should confirm the Recipes page opens on Favourites, All works, meal tabs work, and no duplicate recipe navigation remains.

### Notes or follow-up

- Favourites intentionally remains the default even when there are no favourites yet.

## 2026-05-31 - Recipe Tab Default And Order Adjustment

### Why

Phone review showed the Recipes tab should open on the full library, with All Recipes as the first visible chip and Favourites next to it.

### What changed

- Made All Recipes the default selected Recipes tab.
- Moved All Recipes to the first chip position.
- Moved Favourites to the second chip position.

### Main files touched

- `src/pages/Recipes.jsx`
- `docs/PLAN_AND_PLATE_DEVELOPER_LOG.md`

### Testing

- `npm run lint`
- `npm run build`

## 2026-05-31 - Planner Meal Card Photo Thumbnails

### Why

Meals added from recipe cards should feel connected to the recipe library. The planner grid was still showing generic icons, even when the recipe had a photo.

### What changed

- Planner meal cards now show a compact recipe photo thumbnail when `item.image` exists.
- Meals without photos still use the existing icon fallback.
- Recipe names stay separate from the image so they remain readable.
- The three-dot meal action button stays fixed on the right.
- Direct planner add now stores the selected recipe image so those planned meals can show thumbnails too.
- Weekly Queue thumbnails were left unchanged because they already used recipe images.

### Main files touched

- `src/components/planner/PlannerDayCard.jsx`
- `src/pages/Planner.jsx`
- `docs/PLAN_AND_PLATE_DEVELOPER_LOG.md`

### Testing

- `npm run lint`
- `npm run build`

### Notes or follow-up

- This uses compact thumbnails only. Full-card background photos were intentionally avoided to keep planner names and actions readable.
