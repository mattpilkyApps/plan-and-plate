# V2 frontend audit — 31 October 2026

Baseline: `9e3e28b` on `main`. Work branch: `design/v2-ui-refresh`.

Reviewed the repository context/developer log, the Drive master plan “Plan and Plate v2” and “Plan & Plate v2 — Repository Audit & Rebuild Specification”, and the supplied visual reference. The latest assignment takes precedence over the broader roadmap: frontend first; no accounts, cloud migration or price comparison.

## Existing application

React 19, Vite 8, React Router 7, Tailwind 3 and Lucide. Five screens: planner, recipes, recipe detail, add/edit recipe and shopping. Shared Pressable, BottomSheet, StatusToast and page-specific components. No backend or automated tests. Vercel's SPA rewrite serves deep routes. The manifest provides installation metadata; there is no offline service worker.

Baseline `npm run lint` and `npm run build`: pass. Production JS: 335.26 kB / 104.04 kB gzip. Dependencies installed from the existing lockfile.

## Data and risks

- Keep the existing localStorage keys, recipe IDs, draft, metadata, queue and manual items. Photos remain compressed local data URLs in this bounded frontend phase; IndexedDB is a future storage task.
- Plans currently use week-key buckets and weekday names. Changing week start can hide or reinterpret them. Add dates compatibly while retaining the original buckets and a pre-change backup.
- The current week renders fictional starter meals on every fresh visit. The new planner will show real saved meals and seven actionable days. Sample recipes remain available in the library.
- Current move flow depends on an Edit mode. Replace it with contextual move/swap/duplicate actions and explicit destinations, supporting touch and keyboard without gesture conflicts.
- Sheets need modal semantics, focus containment/restoration, Escape and background scroll locking. Use the browser's native dialog rather than adding a UI framework.
- Shopping checks currently disappear on navigation. Persist them and retain generated/manual separation. Merged generated rows need all source IDs for consistent removal.
- Recipe detail lacks direct Add to Planner. Add this flow using actual selected-week dates.
- Copying a week appends duplicates. Require confirmation before replacing a populated destination.
- Storage quota failures need visible feedback. Never report a save as successful if it failed.

## Delivery access

GitHub read access is verified. Creating `design/v2-ui-refresh` via the connected integration returned HTTP 403, `Resource not accessible by integration`. Ordinary HTTPS Git push fails because no GitHub credential is configured. Repository metadata reports the account can push, but that does not grant the integration Contents write permission. Local branch/commits and a separate hosted preview remain possible; do not claim an upstream push or PR until verified.
