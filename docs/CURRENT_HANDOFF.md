# Plan & Plate — Current Handoff

Updated 2026-11-01. Repository mattpilkyApps/plan-and-plate.

- Main/production: fde4ce3c75b41f5f6c4f53610f1720c48ae507a7, https://planandplate.co.uk/.
- Branch: fix/recipe-tabs-and-unlabelled-method. Investigation base e35614b5d92b5ff840c46bf61cd485a3f0d7e111; latest infrastructure checkpoint is branch HEAD (git log -1). No production changes.
- Matt says reverse-order preview still fails. Exact newest phone bytes are unavailable. New complete-tab fixtures reproduce the same symptom and related-card leakage: old parser 57/57 text cases, only 5/16 workflow cases. Existing 155 focused tests still pass. No production parser change in this checkpoint.
- Read docs/RECIPE_IMPORT_DESIGN.md for the four approaches/evidence. Fixtures tests/fixtures/recipe-import-workflows.js; compare runner scripts/compare-recipe-import.js; shared Git baseline loader scripts/recipe-parser-baseline.js; baseline report recipe-import-comparison-baseline.json.
- Exact next task: implement independent section indexing and paste-aware assembly as separately measurable candidates; compare old flat, new sections, old+paste boundaries, new+paste boundaries on identical corpus/workflows. Add real input/selection/replace/edit/conflict/recovery tests. Keep only the selected production path, remove physical section reordering and parser-dependent clipboard separator if superseded. Full tests/lint/build/SW, commit/push milestones, new preview and native browser QA before final handoff.
- Keep stateful advert/footer rejection and original ingredient wording; ingredient shopping normalisation stays separate. Never rescue related recipes globally after a footer. Preserve original source/paste boundaries locally to make another phone failure diagnosable.
- Latest preview brl5z7dcd still has the reported failure; it is not a verified fix for this new investigation. Android acceptance outstanding. Shopping and URL/JSON-LD import deferred; no AI parsing/dependency/migration.
