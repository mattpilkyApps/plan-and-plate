# Plan & Plate Project Context

## Product Summary

Plan & Plate is a mobile-first meal planning PWA for weekly meal planning, saved recipes, and generated shopping lists. The current goal is a polished frontend MVP for beta testing.

The app should feel like a clean premium iPhone app: cream/off-white backgrounds, green accent colour, rounded cards, subtle shadows, calm spacing, and simple family-friendly flows.

## Current Rules

- Keep everything local only for now.
- Use static sample data and `localStorage`.
- Do not add backend, Supabase, authentication, APIs, payments, AI, or unnecessary libraries.
- Keep code beginner-friendly and readable.
- Prefer small controlled changes.
- Run `npm run lint` and `npm run build` after meaningful code changes.
- Use mobile-first design. Do not redesign creatively unless asked.

## Tech Stack

- Vite
- React
- React Router
- TailwindCSS
- Lucide React icons
- Vercel deployment through GitHub

## Main Screens

- Planner: weekly meal planner with multi-week navigation.
- Recipes: recipe library, search/category chips, recipe cards.
- Recipe Detail: view recipe details and add to week.
- Add/Edit Recipe: local recipe form with optional photo upload and paste recipe importer.
- Shopping List: generated shopping list plus manual items.

## Key Current Features

- Recipes can be created, edited, deleted, and stored locally.
- Built-in sample recipes can now also be edited/deleted for testing.
- Recipe photos can be uploaded, compressed in-browser, and stored as local data URLs.
- Pasted recipes can fill ingredients and method fields locally.
- Add to Week sends recipes into a weekly queue.
- Planner queue lets users place meals by tapping a queued meal, then tapping a planner slot.
- Planner supports multiple weeks with previous/next arrows.
- Planner week start day is user-selectable.
- Planner meals can be moved, duplicated, removed, and have servings changed.
- Planner edit mode uses an explicit Edit planner / Done toggle.
- Shopping list is generated from the currently selected planner week only.
- Ingredient quantities scale by planned servings.
- Generated shopping ingredients merge when safe.
- Manual shopping items can be added, checked, cleared, and removed.
- App has PWA manifest and home-screen icons.

## Important LocalStorage Keys

- `plan-and-plate-recipes`
- `plan-and-plate-removed-recipe-ids`
- `plan-and-plate-weekly-queue`
- `plan-and-plate-planner-settings`
- `plan-and-plate-planned-meals-by-week`
- `plan-and-plate-planned-meals` old fallback key
- `plan-and-plate-removed-planner-meals`
- `plan-and-plate-cleared-shopping-items`
- `plan-and-plate-manual-shopping-items`
- `plan-and-plate-add-recipe-draft`

## Recent Planner Refactor

Planner UI was split out of `src/pages/Planner.jsx` into smaller components under `src/components/planner`.

Current planner component files:

- `PlannerHeader.jsx`
- `WeekControls.jsx`
- `PlannerDayCard.jsx`
- `WeeklyQueueSection.jsx`
- `PlannerSheets.jsx`
- `plannerUiHelpers.jsx`

`Planner.jsx` should stay focused on planner state, localStorage data flow, and planner actions. Future planner UI changes should usually happen inside the smaller component files.

## Known Next Priority

Improve pasted recipe ingredient cleanup and review before saving.

Desired next work:

- After paste import, show a detected ingredient review step.
- Let users edit/delete detected ingredient lines before continuing.
- Mark suspicious lines with a small Check label.
- Clean ingredient names before shopping generation.
- Prefer metric in dual measurements like `110g/4oz flour`.
- Support fractions like `½ tsp`, `1/2 tsp`, `1 1/2 tbsp`.
- Improve category mapping for common pantry, dairy, meat/fish, produce, and frozen items.
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

```bat
cd /d C:\Users\mattp\OneDrive\Documents\planandplatemvp
"C:\Program Files\nodejs\npm.cmd" run lint
"C:\Program Files\nodejs\npm.cmd" run build
```

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

- Keep future Planner features inside the new planner component structure.
- Consider a future `usePlanner` hook only after more planner logic is added.
- Keep parser/shopping cleanup in utilities, not inside large UI components.
- Avoid adding broad state management until local React state becomes genuinely painful.
