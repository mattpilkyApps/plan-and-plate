# Plan & Plate

A UK household meal planner, personal recipe book and complete shopping list. React, Vite, React Router, Tailwind and Lucide; browser-local data and no backend.

## Run and check

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
npm run preview
```

Node 22.12 or newer is recommended for the existing Vite 8 toolchain. Tests use Node's built-in test runner; no additional test or UI framework is required.

## V2 frontend

- Compact seven-day Dinners view and a persistent All Meals view.
- Tap a slot and type a simple meal, or link a recipe. Save & next supports consecutive dinner entry.
- Context menus for editing, servings, moves, swaps, duplication and removal with undo.
- Multi-week navigation, configurable start day and confirmation before copying over a populated week.
- Recipe photography/placeholders, search, categories, favourites, sorting, local add/edit/delete, draft recovery and paste import.
- Direct Add to Planner and a queue for choosing recipes before choosing days.
- Automatically scaled ingredients alongside manual groceries and household items, aisle grouping, persistent checks and item provenance.
- Accessible native modal sheets, keyboard controls, reduced motion, safe-area layouts and vector branding.

The production build generates a versioned service worker containing the shell, lazy routes and bundled images. It starts caching after the first successful online visit. Development is deliberately uncached. Offline installation/update behaviour still needs physical phone testing, particularly with the preview's private hosting gate.

## Data compatibility

Existing localStorage keys, recipe identities, manual items, favourites and add-recipe drafts are retained. Legacy plans acquire their actual dates when read from their original week buckets. The first plan write keeps a `plan-and-plate-plans-before-v2` backup. See [migration notes](docs/V2_DATA_COMPATIBILITY.md).

Different website origins have different browser storage. The separate preview starts with its own data; it does not transfer, clear or update the stable phone installation.

## Deployment and review

Stable deployment remains the existing GitHub/Vercel setup, with SPA deep-route rewrites in `vercel.json`. Work belongs on `design/v2-ui-refresh`; do not merge to `main` before review. The separate Sites preview is a review build, not the stable deployment.

See [frontend audit](docs/V2_FRONTEND_AUDIT.md), [delivery and QA report](docs/V2_DELIVERY_REPORT.md), and [developer log](docs/PLAN_AND_PLATE_DEVELOPER_LOG.md).
