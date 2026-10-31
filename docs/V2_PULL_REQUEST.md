# Redesign Plan & Plate V2 for fast household planning

The planner now always shows seven actionable days and accepts simple typed meals directly. A compact dinner view, persistent all-meals view, contextual move/swap controls and Save & next make weekly planning quicker. Legacy plans keep their actual dates when the week-start preference changes, and copying over an occupied week requires confirmation.

The recipe library, cooking screen, household shopping list, navigation and shared sheets use a consistent cream/forest-green design. Existing recipe capture, photos, favourites, servings and local storage remain compatible. Shopping checks persist and merged ingredients retain all contributing source IDs.

Validation: 17 regression tests, ESLint and production build pass. Browser checks cover the main recipe → plan → shop flow and 320/390/430/768px layouts. Physical Android install, keyboard, camera and offline checks remain; the 90-second planning target is not yet validated with a new user. No accounts, cloud backend or supermarket pricing were added.

See `docs/V2_DELIVERY_REPORT.md` for the audit, compatibility details, screenshots and remaining checks. Review before merging to `main`.
