# Plan & Plate Project Context

This document is the permanent project guide for Plan & Plate. Future developers should read this before making changes.

For a chronological history of the build, read `docs/PLAN_AND_PLATE_DEVELOPER_LOG.md`.

## Product Summary

Plan & Plate is a mobile-first meal planning PWA for weekly meal planning, saved recipes, and generated shopping lists. The current goal is a polished frontend MVP for beta testing.

The app should feel like a clean premium iPhone app: cream/off-white backgrounds, green accent colour, rounded cards, subtle shadows, calm spacing, and simple family-friendly flows.

## Build Rules For Future Developers

These rules apply to all code and documentation work going forward.

- Keep the MVP local-only unless the owner explicitly changes direction.
- Use static sample data and browser `localStorage`.
- Do not add a backend, Supabase, authentication, external APIs, payments, AI features, or new libraries without explicit approval.
- Keep code beginner-friendly, readable, and structured so a future developer can continue the work quickly.
- Prefer small helpers and small components over large files, giant functions, or hidden clever logic.
- Keep UI code in React components.
- Keep recipe parsing, shopping-list grouping, storage helpers, and date/week logic in utility files.
- Do not bury important business rules inside JSX markup.
- Avoid giant regexes when several named helpers would be clearer.
- Make user-facing flows mobile-first and touch-friendly.
- Match the existing visual style unless the owner asks for a redesign.
- Preserve existing user data shapes in `localStorage` unless a migration plan is documented.
- After meaningful code changes, run `npm run lint` and `npm run build`.
- After every meaningful feature, bug fix, parser change, shopping-list change, planner change, storage change, deployment change, or UI-flow change, update `docs/PLAN_AND_PLATE_DEVELOPER_LOG.md`.
- Tiny typo-only edits do not need a developer log entry unless they affect behavior or future maintainability.
- Be honest in docs. If a historical note is reconstructed from the current code rather than remembered from earlier work, label it as reconstructed.

## Tech Stack

- Vite
- React
- React Router
- TailwindCSS
- Lucide React icons
- Browser `localStorage`
- Vercel deployment through GitHub

## Main Screens

- Planner: weekly meal planner with multi-week navigation.
- Recipes: recipe library, search/category chips, recipe cards, and recipe actions.
- Recipe Detail: full recipe view with add-to-week and delete options.
- Add/Edit Recipe: local recipe form with optional photo upload and paste recipe importer.
- Shopping List: supermarket-friendly aisle groups plus manual shopping items.

## Key Current Features

- Recipes can be created, edited, deleted, and stored locally.
- Built-in sample recipes can also be edited or hidden for testing.
- Recipe photos can be uploaded, compressed in-browser, and stored as local data URLs.
- Pasted recipes can auto-fill ingredients and method fields locally.
- Paste import cleans detected ingredients into one measurement format before filling the form.
- Add to Week sends recipes into a weekly queue.
- Planner queue lets users place meals by tapping a queued meal, then tapping a planner slot.
- Planner supports multiple weeks with previous/next arrows.
- Planner week start day is user-selectable.
- Planner meals can be moved, duplicated, removed, and have servings changed.
- Planner edit mode uses an explicit Edit planner / Done toggle.
- Shopping list is generated from the currently selected planner week only.
- Shopping list categories are ordered like supermarket aisles.
- Ingredient quantities scale by planned servings.
- Generated shopping ingredients merge when safe.
- Manual shopping items can be added, checked, cleared, and removed.
- App has PWA manifest and home-screen icons.

## Important LocalStorage Keys

These keys are part of the current data model. Be careful when changing them because users may already have local data saved in their browser.

- `plan-and-plate-recipes`
- `plan-and-plate-removed-recipes`
- `plan-and-plate-weekly-queue`
- `plan-and-plate-planner-settings`
- `plan-and-plate-planned-meals-by-week`
- `plan-and-plate-planned-meals` old fallback key
- `plan-and-plate-removed-planner-meals`
- `plan-and-plate-cleared-shopping-items`
- `plan-and-plate-manual-shopping-items`
- `plan-and-plate-add-recipe-draft`

## Important File Map

- `src/App.jsx`: app routes.
- `src/pages/Planner.jsx`: planner state, localStorage data flow, and planner actions.
- `src/components/planner/`: smaller planner UI components.
- `src/pages/Recipes.jsx`: recipe library and recipe actions.
- `src/pages/RecipeDetail.jsx`: full recipe view.
- `src/pages/AddRecipe.jsx`: add/edit recipe form, photo handling, and paste recipe flow.
- `src/pages/Shopping.jsx`: shopping page state and manual item actions.
- `src/utils/localStorage.js`: all localStorage reads and writes.
- `src/utils/ingredientParser.js`: ingredient parsing and ingredient cleanup.
- `src/utils/shoppingList.js`: generated shopping-list grouping, category mapping, serving scaling, and merge behavior.
- `src/utils/plannerWeeks.js`: planner week/date helpers.
- `src/utils/recipeKeys.js`: stable recipe IDs and route keys.
- `src/data/sampleData.js`: starter recipes and sample planner data.
- `public/manifest.webmanifest`: PWA manifest.
- `public/icons/`: app icons.
- `docs/PLAN_AND_PLATE_DEVELOPER_LOG.md`: chronological build log.

## Planner Structure

Planner UI was split out of `src/pages/Planner.jsx` into smaller components under `src/components/planner`.

Current planner component files:

- `PlannerHeader.jsx`
- `WeekControls.jsx`
- `PlannerDayCard.jsx`
- `WeeklyQueueSection.jsx`
- `PlannerSheets.jsx`
- `plannerUiHelpers.jsx`

`Planner.jsx` should stay focused on planner state, localStorage data flow, and planner actions. Future planner UI changes should usually happen inside the smaller component files.

## Recipe Parsing And Shopping List Guidance

- Keep parser and shopping-list cleanup in utilities, not inside large UI components.
- `AddRecipe.jsx` may decide when to run parsing or review, but detailed parsing rules should live in `src/utils/ingredientParser.js`.
- Shopping-list category and merge behavior should live in `src/utils/shoppingList.js`.
- Shopping-list category order should stay supermarket-friendly: Fresh Produce, Meat & Fish, Dairy & Eggs, Bakery, Pantry / Tins / Dry Goods, Herbs & Spices, Condiments & Sauces, Oils & Cooking, Frozen, Other.
- Preserve raw ingredient text where useful so users can see the original wording if parsing is imperfect.
- Prefer metric in dual measurements like `110g/4oz flour`.
- Support common fractions like `1/2 tsp`, `1 1/2 tbsp`, and unicode fractions.
- Keep manual shopping items separate from generated items.

## Local Development

Run locally:

```bat
cd /d C:\Users\mattp\OneDrive\Documents\planandplatemvp
"C:\Program Files\nodejs\npm.cmd" run dev
```

Run for phone testing on the same Wi-Fi:

```bat
cd /d C:\Users\mattp\OneDrive\Documents\planandplatemvp
"C:\Program Files\nodejs\npm.cmd" run dev -- --host 0.0.0.0
```

Then open the Vite Network URL on the phone, for example:

```text
http://192.168.1.xx:5173/
```

## Build Checks

Run after meaningful code changes:

```bat
cd /d C:\Users\mattp\OneDrive\Documents\planandplatemvp
"C:\Program Files\nodejs\npm.cmd" run lint
"C:\Program Files\nodejs\npm.cmd" run build
```

On Windows, `npm.cmd` avoids PowerShell script-policy problems.

## Git And Deploy

Git executable path:

```bat
"C:\Program Files\Git\cmd\git.exe"
```

Typical push flow:

```bat
cd /d C:\Users\mattp\OneDrive\Documents\planandplatemvp
"C:\Program Files\Git\cmd\git.exe" status --short
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "Describe change"
"C:\Program Files\Git\cmd\git.exe" push
```

Vercel deploys automatically after GitHub push.

## PWA Notes

- App has `public/manifest.webmanifest`.
- App icons live in `public/icons`.
- iPhone users should install from Safari using Share -> Add to Home Screen.
- Android users should ideally install from Chrome.
- The Android old-version warning is Android/WebAPK/browser controlled, not directly set by the React app.

## Future Cleanup Guidance

- Keep future Planner features inside the planner component structure.
- Consider a future `usePlanner` hook only after more planner logic is added.
- Avoid broad state management until local React state becomes genuinely painful.
- If files become hard to scan, split by responsibility rather than by guesswork.
- Document every meaningful change in the developer log before calling the task finished.
