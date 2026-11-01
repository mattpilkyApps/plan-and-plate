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

## 2026-06-01 - Recipe Library UX Milestone 2 Sort Recipes Sheet

### Why

The Recipes page had a Filter button that still opened a placeholder message. The app needed a useful, simple sorting flow without adding more visible clutter or unfinished cuisine UI.

### What changed

- Converted the existing Filter button into a Sort Recipes bottom sheet.
- Added sort options:
  - Recently Used
  - Recently Added
  - A-Z
  - Z-A
  - Favourites First
- Persisted the selected sort option in localStorage.
- Moved recipe chip filtering, search filtering, cuisine-ready filtering, and sorting into helper functions.
- Kept the existing visible chip row:
  - All Recipes
  - Favourites
  - Breakfast
  - Lunch
  - Dinner
  - Snacks
- Sorting now works after chip filtering and search.
- New saved recipes now get `createdAt` so Recently Added can work for future recipes.
- Existing recipes without `createdAt` still display safely.
- Prepared helper support for optional future `cuisine` filtering.
- Cuisine UI was intentionally not exposed.

### Main files touched

- `src/pages/Recipes.jsx`
- `src/pages/AddRecipe.jsx`
- `src/utils/localStorage.js`
- `src/utils/recipeFilters.js`
- `docs/PLAN_AND_PLATE_DEVELOPER_LOG.md`

### Testing

- `npm run lint`
- `npm run build`
- Manual phone checks should confirm the Filter button opens Sort Recipes, sort options work with chips/search, and no cuisine UI appears.

### Notes or follow-up

- Recently Used is a sort option only. It is not a separate section.
- Recently Added can only use `createdAt` for newly saved recipes or any older recipes that already have date metadata.

## 2026-06-01 - Premium Mobile UX Polish

### Why

The app needed to feel smoother and more premium on mobile, without adding another animation dependency or hiding core content behind floating controls.

### What changed

- Added shared motion utilities for page entry, sheet entry, toasts, card entry, press feedback, drop-zone pulse, and reduced-motion support.
- Added reusable UI primitives:
  - `Pressable`
  - `BottomSheet`
  - `StatusToast`
- Reworked sheets and action buttons across Planner, Recipes, Shopping, Add Recipe, and Recipe Detail to use the shared primitives.
- Moved planner action/settings sheets to the top of the viewport so they appear immediately when opened on mobile.
- Improved planner edit/drop-zone visuals so animated drop zones fill the open day/meal column area.
- Fixed the weekly queue active highlight clipping by adding vertical room in the horizontal scroll lane.
- Removed fixed floating add buttons from Planner, Recipes, and Shopping.
- Moved `Add Recipe` into the Recipes header action area, replacing the decorative recipe book icon.
- Added a top `Add Item` action on Shopping next to `Clear checked`.
- Removed the direct planner floating add-meal flow because weekly queue placement is now the intended route.

### Main files touched

- `src/index.css`
- `src/components/ui/*`
- `src/components/planner/*`
- `src/pages/Planner.jsx`
- `src/pages/Recipes.jsx`
- `src/pages/Shopping.jsx`
- `src/pages/AddRecipe.jsx`
- `src/pages/RecipeDetail.jsx`

### Testing

- `npm.cmd run lint`
- `npm.cmd run build`
- Phone testing should confirm planner sheets open at the top, planner edit text remains readable, queue highlights are not clipped, and recipe/shopping add actions are visible near the top.

### Notes or follow-up

- `FloatingActionButton.jsx` remains in the repo but is not currently used by the main app tabs.
- The implementation intentionally stays dependency-free and uses CSS/Tailwind plus small shared React primitives.

## 2026-06-01 - App Icon and Launch Branding

### Why

The installed phone app needed to use the new Plan & Plate logo, and the app should show the Plan & Plate wordmark during the first loading moment after launch.

### What changed

- Generated new install icons from the provided Plan & Plate logo artwork.
- Replaced the PWA icon files used by Android install, iOS home screen, and browser favicon.
- Added brand assets under `public/brand`.
- Added a lightweight first-paint launch screen in `index.html` that shows the Plan & Plate wordmark before React finishes loading.

### Main files touched

- `index.html`
- `public/icons/*`
- `public/brand/plan-plate-app-icon.png`
- `public/brand/plan-plate-wordmark.png`
- `docs/PLAN_AND_PLATE_DEVELOPER_LOG.md`

### Testing

- `npm.cmd run lint`
- `npm.cmd run build`

### Notes or follow-up

- Existing installs may need to remove and re-add the app to the phone home screen before the new icon appears.

## 2026-10-31 — V2 foundations and planner

Replaced the frontend interaction layer while retaining the React/Vite stack and storage keys. Added forest-green/cream tokens, botanical vector branding, responsive shell/navigation, native modal sheets with focus containment/Escape/restoration, storage error feedback and lazy routes. Planner now always renders seven days, with persistent Dinners/All Meals views, immediate text entry, optional recipe linking, Save & next, contextual move/swap/duplicate, servings, removal undo, queue placement and guarded week copying. No automatic fictional starter meals.

Legacy weekday plans resolve to absolute calendar dates using their original week bucket. Saving updates overlapping date ranges atomically, retaining other dates and a pre-V2 backup. The old single-week key is retained and anchored before preference/navigation changes. Added Node regression tests for dates, week-start changes, moves/swaps/copies and quota failures. Lint, build and the initial six tests pass. Phone-width browser checks are underway; physical-device checks remain for the owner.

## 2026-10-31 — Recipe library and cooking experience

Added photo-led responsive recipe cards, compact category filters and sort/search controls, resilient missing-image placeholders, favourite hearts and Add to Week feedback. Rebuilt detail pages around photography, ingredients/method tabs, a cooking checklist, adjustable ingredient servings, edit/delete and direct Add to Planner with real dates and week navigation. Existing recipe IDs, favourites/usage metadata, local edits, parser and image compression remain. Paste import now also fills detected servings/prep/cook fields. Added optional example recipes, with no automatic insertion into saved plans. Local photos are bundled; image sources are documented with the assets.

## 2026-10-31 — Shopping for the whole household

Rebuilt shopping around compact aisle groups, a sticky progress bar, one-line quick entry and a detailed quantity/category/note sheet. Added household cleaning, toiletries, drinks, baby/family and pet categories without changing existing manual-item records. Checked rows persist across route changes and reloads. Generated rows expose recipe provenance; removing or clearing a merged row clears all contributing source IDs. Unknown quantities stay visible separately, and incompatible units remain readable instead of inventing conversions. Existing serving scaling, parser and legacy categories remain supported. Added integration, category, persistence and documented parser regression tests; all 11 tests pass with lint/build.

## 2026-10-31 — Final V2 frontend polish and verification

Completed botanical SVG/PNG PWA branding, lazy secondary routes, native-dialog keyboard/focus behaviour, visible draft restoration, importer extraction into a testable utility, readable muted text and narrow-screen overflow fixes. Removed unreferenced earlier planner/starter components. Added build-time offline-shell generation, preserving a simple dependency-free runtime. Corrected pepper/tinned-tomato aisle presentation and retained original ingredient text for traceability.

Browser-tested the planning/recipe/shopping workflows and 320/390/430/768px layouts, including typed seven-dinner entry, optional linking/servings, move/swap, queue, safe copying, import/drafts/editing, household items and persistent checks. Seventeen domain/integration regressions, lint, build and generated service-worker syntax pass. Physical Android keyboard/camera/install/offline and new-user timing remain unverified. GitHub write remains blocked by integration 403 and missing HTTPS push credential. A separate private preview and downloadable source are being prepared; main remains untouched. Full details are in V2_DELIVERY_REPORT.md.

## 2026-10-31 — Open meal picker without the keyboard

Following Matt’s phone review, removed automatic focus from the meal-name / recipe-search field. The meal sheet keeps its native modal focus on the Close control, so opening or advancing the picker does not request the on-screen keyboard. Tapping a typing field still focuses it normally. Quick add, recipe selection and Save & next remain available. This supersedes the earlier automatic keyboard-opening behaviour. No storage or data changes.

## 2026-10-31 — Import recipes copied directly from websites

Fixed the paste importer using both of Matt’s actual BBC Good Food pumpkin curry copies as regression fixtures. Previously, the plain copy returned no title or ingredients and captured `:` as the prep/cook times; Markdown also confused section detection. The parser now cleans Markdown links/headings, reads split metadata labels, distinguishes an Ingredients/Nutrition tab bar from a real nutrition section, joins ingredient preparation/alternative lines, and filters common page adverts and unrelated sections. Both copies produce the title, four servings, 20-minute prep/cook times, 13 ingredients and two cooking steps.

The add/edit form fills the detected title, retains existing draft fields when a copy is partial, and keeps the paste sheet/text open with an accessible error when no ingredients or steps are recognised. Ingredient wording is preserved through import/save, and the cooking view shows the original wording at the original servings. Existing structured ingredient parsing, metric preference, serving scaling and shopping generation remain in place. No dependencies, storage keys, record shapes or backend changes.

Validation: all 25 Node regression tests pass, as do ESLint, the Vite production build and generated service-worker syntax. Browser checks cover importing/saving/reopening the exact sample; two method steps; planning six servings and generating 13 shopping items (stock 375ml, coconut milk 600ml, chickpeas 600g); link-only error feedback; partial import preserving a draft name; and paste/form layouts at 320, 390 and 430px. The paste sheet focuses Close rather than requesting the keyboard. Review screenshot: `docs/review/recipe-import-form.jpg`. Physical Android/Safari checks and arbitrary recipe-site formats remain for owner testing.

Delivery: prepared on `fix/recipe-paste-import`, based on the V2 merge `cf9253b`. GitHub branch creation is still blocked by integration HTTP 403 (`Resource not accessible by integration`), so a verified Git bundle will be supplied for the owner’s authenticated push. A separate Vercel review deployment is being prepared; this commit does not change the production deployment or merge into main.

## 2026-10-31 — Recover recipe import and complete normalisation coverage

Recovered the clean existing checkout on `fix/recipe-paste-import` at `cf8588d`, based on V2 merge `cf9253b`. The original code, both real website fixtures, browser-review screenshot, verified Git bundle and an 82-file source deployment payload survived. GitHub had no recipe branch, and Vercel had no recipe-import deployment; production still pointed at the V2 merge. Continued that commit rather than rebuilding the feature.

Kept website extraction and ingredient normalisation separate. Added general navigation/rating/control filtering, combined time labels, checkbox prefixes, inline step labels and a boundary before recommended recipes. Ingredient normalisation retains whole-token units, fractions, metric dual measurements and pack totals, and now handles × multipliers, handful/stalk/sprig/piece measures, prepared trailing count units and pinch variants. Removed implicit splitting at numbers inside an ingredient, which could turn extra amounts and preparation notes into phantom shopping items. Explicit line/bullet/semicolon boundaries remain supported. Original wording stays in `rawText`; an optional `qualifiers` array preserves preparation, modifiers and alternatives alongside the canonical shopping identity. Older records remain valid without migration.

Validation: all 32 Node tests, ESLint, production build, generated service-worker syntax and whitespace checks pass. Browser QA repeated the original curry import, save/reopen, two method steps, six-serving planning and 13 generated shopping rows (375ml stock, 600ml coconut milk, 600g chickpeas). Link-only paste retains the text with an error; partial copy preserves a draft name; opening the paste sheet focuses Close. Physical phone clipboard/keyboard/scrolling and additional website formats still require owner checks. Vercel preview publication is the next delivery step; main must remain unmerged.


## 2026-11-01 — Recipe parser hardening and measured regression corpus

Why: the merged importer correctly read Matt’s Android pumpkin curry copy but continued into retail slogans/product prices after warm naan breads. Main was verified at `b979d9767c5706248ea54eb0c7d1fb883b82c800`. Work is isolated on `improve/recipe-parser-hardening`; main/production must remain unchanged.

Architecture: retained cleaning/segmentation and metadata/ingredient extraction in `recipeImport.js`, with explainable block evidence in `recipeSignals.js` and a dedicated stateful method extractor in `recipeMethod.js`. METHOD → AFTER_RECIPE transitions use section headings, product/advert/navigation signals, deferred neutral blocks and bounded neighbouring cooking evidence. Interstitial ads can be skipped without ending nearby numbered steps. Repeated retail products stop extraction; no publisher/product-name blacklist. Unknown labelled instructions can survive without mandatory cooking vocabulary. Optional diagnostics explain field evidence, stop/discard reasons, review status and ingredient subsection indices.

Ingredient extraction now preserves split measures and preparation/alternative/plus-extra descriptions, ignores subsection/control/product headings, recognises compact/fractional unit controls, handles You Will Need and bare numbered directions, and distinguishes written serving ranges/total time. Ingredient normalisation remains separate: original `rawText`/qualifiers are retained alongside canonical names, approximate/range quantities, full/dotted units, explicit dual metric amounts and package totals. Parenthetical semicolons cannot create phantom ingredients. Shopping gained only bunch/packet/slice plural support. Add Recipe keeps uncertain original paste in the existing sheet, draft and optional `sourcePaste` field; older recipes require no migration. No new dependency, external AI call, key or URL importer.

Corpus/research: inspected 20 accessible public pages across 17 domains. Added 40 curated cases (owner copies + synthetic researched layouts + boundary/preservation adversaries), 53 individual ingredient torture rows and integration/diagnostic checks. Full copyrighted pages were not added. Source observations and blocked/unavailable sample URLs are documented in `RECIPE_PARSER_RESEARCH.md`. `npm run parser:report` is the strict evaluator; `--baseline-ref` reproduces original extraction using Git. Baseline and final JSON reports are retained. On identical 40 cases, original main: 15 complete passes, 42 specified noise occurrences, 27 unexpected ingredient lines, 23 contaminated method steps. Current: 40/40, zero in those three counts. These are curated corpus scores, not an internet-wide accuracy claim.

Files: `src/utils/recipeImport.js`, `recipeSignals.js`, `recipeMethod.js`, `ingredientParser.js`, `shoppingList.js`; `src/pages/AddRecipe.jsx`; recipe corpus/helper/diagnostic/torture tests and fixtures; `scripts/evaluate-recipe-corpus.js`; package scripts; research/evaluation documents and current handoff.

Validation: 121 focused recipe/ingredient tests and 135 full project tests pass, with no skips/TODO; ESLint, Vite production build, generated `dist/sw.js` syntax, all 33 cached asset paths and whitespace checks pass. Host-only 800-import extraction+normalisation sample: median 0.216ms, p95 1.155ms, max 5.772ms; this is not Android timing. Existing curry, garlic/lasagne unit boundaries, save/plan/shopping domain tests all remain green. Browser preview QA is next; physical Android testing remains outstanding.

Limits/deferred: unmarked food-themed promotions or ambiguous plain-text menus can still be difficult. Bounded resumption may safely truncate instructions after a large advert grid; uncertain source text is retained for review. Quantity ranges are not silently scaled, and their original notes remain in Shopping. Total time is extracted but has no separate form field. JSON-LD priority adapter/server URL fetching is research only, with nested steps, explicit source fields, cross-origin constraints and safe fetching considerations documented.

Recovery checkpoints were pushed through the GitHub connector after corpus infrastructure, first fixtures, method boundaries and additional fixtures/normalisation. Vercel’s Git integration creates preview-only deployments from this branch. Final validated preview URL and browser results will be recorded below once verified; no production promotion or main merge is authorised.


Final preview/browser verification: Vercel Git preview `https://plan-and-plate-ngtdv5jrm-mattpilkyapps-projects.vercel.app` is READY on validated source commit `473926bfa96a2877849d9643248f9edebcdfed16`, deployment `dpl_FeoKRmvwXiQkkk5v3gbtpooZuXH5`, project `prj_BTGHRRCvar0bXD6Cd8rkW0jGPLsb`, team `team_rAS0gWuBiS9ffwL3XKEnGEPF`. Target is preview (API target null), source branch verified. The Git integration supplied the deployment; no duplicate deployment, promotion or production change was needed. The final documentation checkpoint has identical application code to that preview.

Browser QA passed on this preview: owner’s full plain curry copy plus the exact retail tail fills correct metadata/13 ingredients/two method steps; saving and reopening still ends at warm naan breads with no retail content. Planning six servings produces 13 shopping rows, including 375ml stock, 600ml coconut milk and 600g chickpeas. Opening Paste Recipe focuses Close. Link-only text remains in the sheet with an error. An uncertain neutral tail is omitted with review feedback; the complete original paste survives draft reload and save → reopen → edit → Paste Recipe. Screenshot: `docs/review/parser-hardening-method-qa.jpg`.

Final status: 135/135 full tests (121 focused), lint, build, service-worker syntax/33 asset references, corpus evaluator and whitespace checks pass. No known failing automated cases. Physical Android clipboard/keyboard/scrolling/PWA behaviour remains unverified. Exact next task: Matt tests the preview with the original curry + retail tail and at least three fresh site copies, saves/reopens, plans and checks Shopping. If any failures appear, add short owner-supplied or synthetic fixtures, fix and checkpoint on this branch; otherwise prepare review for a separately authorised main merge. JSON-LD/URL import remains deferred.


## 2026-11-01 — Android paneer-curry follow-up: preparation clauses and serving sections

Matt supplied a complete paneer/chickpea/spinach curry paste and Android screenshots. The previous preview split grated-or alternatives, deseeded-if clauses, cut-into instructions, made-with stock notes and juiced into separate ingredient rows. A bare To serve label before unmeasured rice also attached to the previous row. These extraction errors fed phantom Shopping rows; this follow-up prioritises correct recipe import and does not redesign Shopping.

Added the exact owner-supplied text plus five short synthetic preservation/boundary cases. Six new corpus cases bring the corpus to 46. Added three integration/diagnostic tests. The previous preview on these same 46 cases passes 41/46; the follow-up passes 46/46. Shared preparation grammar now lives in ingredientPreparation.js so extraction and canonical-name qualifier cleanup agree while prepared-food names such as grated cheese remain separate. Serving headings use the following ingredient context, including unmeasured foods. Conjunction lines within the serving section retain their original wording as one serving entry; no missing quantity or food is invented.

The sample now has 16 readable ingredient entries and exactly two method steps. Its genuine reheating tip is imported into Notes, preserving existing user notes, while attribution and around-the-web advertising are excluded. A recipe tip followed by another numbered cooking step remains inline. Unsupported notes request review and retain the original paste. Parser baseline tooling now copies the optional pipeline modules needed by newer Git refs.

Files: recipeImport.js, ingredientPreparation.js, ingredientParser.js, recipeSignals.js, recipeMethod.js, AddRecipe.jsx; exact phone fixture, corpus cases/evaluator, recipe-phone-followup.test.js; baseline/results JSON and documentation. Validation so far: 130 focused tests and ESLint pass. Full tests/build/generated-SW and preview browser checks are next. No main merge or production deployment.


Follow-up final validation: 144/144 full tests (130 focused), all 46 corpus cases, ESLint, Vite production build, generated service-worker syntax/all 33 cached assets and whitespace checks pass. Vercel PREVIEW READY for source `3ce4cc92dca127c83fead3a54ed6e09791bda96b`: https://plan-and-plate-ekmxqulkd-mattpilkyapps-projects.vercel.app (deployment dpl_CWVDYUTRqxCukJR7wRKetHwGYeLP). Browser QA imported Matt's exact fixture, saved/reopened it and verified all 16 ingredient entries retain preparation text; two method steps; the reheating note remains separate; no advertising or syndicated health story is imported. Screenshot: docs/review/paneer-parser-followup-qa.jpg. Main re-verified unchanged at b979d9767c5706248ea54eb0c7d1fb883b82c800. Final checkpoint is documentation/evidence only; preview application code is identical.

Physical Android validation of this correction remains for Matt: use the new preview and import the sample afresh, since earlier immutable preview URLs and previously saved malformed recipe records do not rebuild automatically. Recipe correctness remains the immediate priority; compound serving-entry Shopping decomposition and broader Shopping UX are deferred. No production release or merge was performed.


## 2026-11-01 — Parser hardening released to production

Matt authorised pushing and deploying the completed work in this session, superseding the earlier preview-only restriction. Created and merged PR #3: https://github.com/mattpilkyApps/plan-and-plate/pull/3. Merge commit: 9787bd3b6e73d6755d408a29e73a0fd63c2b6f42; source branch head dd39d14682607142d5e5a0867245bc34058e0d8f. The merge tree matches the completed branch, and application source matches validated commit 3ce4cc92dca127c83fead3a54ed6e09791bda96b. Existing 144-test, 46-case corpus, lint/build/SW and browser validation therefore apply; no new implementation changes were introduced during release.

Vercel's main-branch Git integration deployed production successfully: dpl_HkWA4g6D5PLefif96xf5XBbR12Et, READY, target production, main SHA 9787bd3b6e73d6755d408a29e73a0fd63c2b6f42. Verified that planandplate.co.uk and www.planandplate.co.uk are assigned to this deployment. Live https://planandplate.co.uk/ returns HTTP 200, title Plan & Plate, and application entry /assets/index-D2k8JxQE.js matching the validated build. The subsequent release-record commit changes documentation only.

Next: Matt refreshes the live app and pastes the original paneer recipe afresh, checking preparation joins, two cooking steps, separate reheating Notes and save/reopen on Android. Existing malformed saved imports do not regenerate automatically. Recipe correctness remains the priority before separate Shopping refinement; combined serving-entry decomposition and URL/JSON-LD import remain deferred.


## 2026-11-01 — Separate-tab recipe copies and two clipboard pastes

Matt supplied an exact sprouts fried-rice paste and Android import-error screenshot, then clarified he copied Ingredients from one website tab and Method separately into the same paste box. The Ingredients/Method/Nutrition navigation row was mistaken for real sections, so extraction stopped before the actual list. The method copy had no repeated Method heading; compact Serves2/Prepare15 mins/Cook10 mins labels also missed metadata boundaries.

Created fix/recipe-tabs-and-unlabelled-method from main fde4ce3c75b41f5f6c4f53610f1720c48ae507a7. Method headings now require body content before another primary section. Strong cooking paragraphs after ingredients can start an inferred method; prepared-food names remain ingredients, and wrapped opening paragraphs are supported. Metadata accepts label-to-digit boundaries and Prepare; Cook's/Cook’s tip goes to Notes. A separate clipboard helper adds a paragraph separator when a method fragment is pasted at the end of an ingredient copy without its own newline, while respecting normal selected replacement, mid-line editing and ingredient edits. The existing sheet explains the two-tab flow. Also fixed canonical normalisation dropping names beginning cooked, such as cooked pigs in blankets.

Added the exact owner fixture, four synthetic corpus cases and nine clipboard/save/preservation tests. Corpus: 51 cases, previous production 46/51 → follow-up 51/51; all 11 original ingredient entries survive the save path, three method paragraphs and the genuine tip remain. Reports: recipe-parser-tabs-baseline.json and recipe-parser-results.json. Full 158 tests (144 focused), ESLint, production build, generated service-worker syntax/all 33 assets, strict corpus and whitespace checks pass. Browser verification of the two sequential clipboard pastes and new Vercel preview are next. Main/production have not been modified for this follow-up; Shopping remains outside scope.


Separate-tab follow-up final verification: implementation checkpoint e551707025d5d264e909dcd4be029ec5ee4fe11e is pushed to fix/recipe-tabs-and-unlabelled-method. Vercel Git integration deployed PREVIEW dpl_FMXtwsSVMKz6GLm5udRHNmcvVs3A, READY, target preview (API target null), source SHA verified: https://plan-and-plate-l3i2wu17s-mattpilkyapps-projects.vercel.app. No main merge or production deployment of this follow-up.

Browser QA used two native clipboard pastes into the same sheet: Ingredients first, Method second, neither providing a boundary newline. The resulting text matched the complete owner fixture exactly, with a separator added automatically. Fill form, save and reopen retained all 11 original ingredient entries, servings 2, prep 15 mins, cook 10 mins, three method paragraphs and the genuine Cook’s tip separately in Notes. Evidence: docs/review/two-tab-recipe-paste-qa.jpg. Full validation remains 158/158 tests (144 focused), 51/51 corpus, lint/build/generated-SW syntax/all 33 cached assets and whitespace checks passing. The final documentation/evidence checkpoint has identical application code to the validated preview.

Exact next task: Matt repeats the two-copy workflow on the new preview using Android, placing the cursor at the end before the second paste and tapping Fill form after both. Check metadata, 11 ingredients, three steps, separate Notes, keyboard/scrolling and save/reopen. Physical-device validation remains outstanding. Ordinary selected replacement is respected; unlabelled-method inference still requires strong cooking context. Previously malformed saved recipes require fresh imports. Recipe correctness remains the priority; Shopping decomposition and URL/JSON-LD remain deferred. Production is still fde4ce3c75b41f5f6c4f53610f1720c48ae507a7.
