# V2 local data compatibility

No accounts, database or cloud migration were introduced. Existing storage keys are retained.

## Plans

A legacy record such as `{ day: 'WED', ... }` in bucket `2026-10-26` resolves to `dateKey: '2026-10-28'`. This is derived from the original bucket boundary, independently of the current week-start preference. Reads do not rewrite the source data. The UI groups records by their actual dates.

Saving a visible week removes/replaces only the records inside that week's seven dates, even when its dates overlap old buckets. Other dates, record IDs, recipe relationships and planned servings are retained. All plan buckets are written together in a single localStorage operation. The first write first saves a backup under `plan-and-plate-plans-before-v2`; if the backup cannot be saved, the plan change is rejected. The backup is the pre-V2 snapshot, not a rolling version history.

The legacy single-week key is not deleted. Before navigation/preferences change its reference week, its records are anchored in the week-bucket store. The original selected week is used when available; otherwise the current week is the only available historical anchor. That limitation already existed in the old fallback format.

Changing week start changes grouping. The current week stays around today; a past/future week is regrouped around its midpoint. Meals retain their dates. Copying a week creates fresh instance IDs and shifts dates seven days. An occupied target requires an explicit Replace/Cancel decision.

Simple meals have `recipeId: null`. Their labels and servings persist normally; they contribute no automatic ingredients. They never get implicitly matched to a similarly named recipe. Linking a recipe is an explicit action.

## Recipes, queue and shopping

Recipe IDs, base servings, parsed ingredients/raw text, compressed photo data URLs, favourites/usage metadata, removed recipe IDs, and the original add-recipe draft key remain supported. Recipe edits update planned/queued labels without changing instance dates or planned servings. Deletion removes linked instances as before.

Manual shopping items keep their existing shape. New category names are additive; legacy Pantry/Dairy mappings remain. Checks use an additional `plan-and-plate-checked-shopping-items` key. Generated rows remain derived from recipes and planned servings. Merged rows retain every contributing ingredient ID so clearing/removing one row removes all its contributions. No unverified volume-to-weight conversion was introduced.

Storage write failures show a visible error. Array/object reads validate the expected top-level shape; invalid stored bytes are not replaced merely by opening a screen.

## Preview and rollback

The preview uses a different origin, so it cannot access the stable app's browser storage. Opening it does not migrate the installed app. The GitHub main branch is unchanged.

Compatibility tests cover multiple week starts and boundaries, overlapping saves, old single-week data, quota failures, recipe edit/delete relationships, checks, serving scaling, ingredient merging and parser fixtures. Real household backup/restore and multi-tab conflict resolution remain future work. Do not rely on the pre-V2 snapshot as a complete data export.
