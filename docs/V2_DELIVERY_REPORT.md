# Plan & Plate V2 — frontend delivery

31 October 2026. Frontend implementation and browser QA are complete. Publishing the requested branch to GitHub is blocked by the connected integration. No merge or change to the stable `main` deployment was made.

## What changed

| Area | Implemented |
| --- | --- |
| Planner | Seven actionable days, compact Dinners / detailed All Meals, persistent view, real dates, week navigation and arbitrary week starts |
| Fast entry | Immediate typing, optional recipe linking, valid simple meals, servings and Save & next |
| Rearranging | Contextual move, explicit swap target, duplicate, replace, additional meals in a slot, removal and undo |
| Reuse | Queue placement, direct recipe planning, copy week and confirmation before replacing a populated destination |
| Recipes | Image-led responsive cards, missing-image placeholders, search, categories, favourites, sorting and local edit/delete |
| Cooking | Photo hero, ingredients/method tabs, cooking checklist, serving scaling, notes and both planning actions |
| Recipe capture | Existing paste importer, parser, photo compression and add-recipe drafts retained; detected times/servings fill the form and restored drafts are labelled |
| Shopping | Recipe ingredients plus all household items, quick entry, quantity/category/note editing, aisles, persistent checks, progress, clearing and source traceability |
| Shared UI | Botanical SVG wordmark/icon and PNG PWA sizes; cream/forest/sage tokens; responsive navigation, native modal sheets, focus restoration, Escape, reduced motion and visible save failures |
| Performance | Lazy secondary routes, fixed image areas, lazy photography, memoised shopping generation and no new runtime framework |
| PWA | Manifest/safe areas refreshed; production build generates a versioned offline shell with route chunks and bundled images |

The original repository and stack were evolved. Existing storage keys, recipe identities, favourite/usage metadata, manual items, draft and photo format remain compatible. Legacy plans retain their calendar dates across different week starts. The first plan write saves a pre-V2 snapshot. [Compatibility details](V2_DATA_COMPATIBILITY.md).

The meal queue now sits below the calendar. Three primary navigation destinations remain. Two planner views and contextual destination controls provide a simpler phone workflow; drag-and-drop was deliberately left out of this bounded redesign.

## Verification

- `npm test`: **17 passing tests**, covering legacy/date compatibility, week-start regrouping, overlapping saves, moves/swaps/copies, storage failure, recipe edit/delete relationships, import metadata, shopping scaling/merging/clearing/checks, household aisles and documented parser fixtures.
- `npm run lint`: pass.
- `npm run build`: pass.
- Generated `dist/sw.js` syntax check and `git diff --check`: pass.
- Browser workflows verified: seven consecutive simple dinners; Wednesday replacement/linking; per-meal servings; swap; future-week direct planning; moving; week-start change; queue placement; recipe search/favourite/sort; paste import; draft restoration; save/edit; household quick-add; checks surviving navigation; removal/undo; populated-copy cancellation; Escape and focus restoration.
- Planner, Recipes and Shopping checked at **320, 390, 430 and 768px**: no document-level horizontal overflow. Desktop layout also inspected.
- Initial entry JS reduced from **335.26 kB / 104.04 kB gzip** to approximately **279 kB / 89 kB gzip**, by loading secondary screens on demand. This is a bundle measurement, not a claim about real-device load time.

Review images: [planner](review/planner-mobile.jpg), [recipes](review/recipes-mobile.jpg), [shopping](review/shopping-mobile.jpg).

## Branch, commits and publishing

Requested local branch: `design/v2-ui-refresh`, based on `9e3e28b`.

Incremental commits:

- `fcde280` — repository, data and delivery-access audit.
- `4083c72` — planner and accessible design-system foundations.
- `70257f4` — recipe library, cooking view and direct planning.
- `a4ef0b3` — household shopping and generated-source handling.
- Final polish/QA commit: see the branch log in the supplied Git bundle.

GitHub branch creation returned **HTTP 403: Resource not accessible by integration**. An ordinary HTTPS push also failed: **could not read Username for 'https://github.com'**. Repository metadata says the account can push, but that does not supply a write credential to this session. The connected installation is [163195279](https://github.com/settings/installations/163195279). A GitHub connection that can write repository Contents and open pull requests is needed. No upstream branch, pushed commit or PR is being claimed.

A separate owner-private review build is prepared at:

https://plan-and-plate-v2-review.mattpilky1234.chatgpt.site

Publication status is verified separately in the delivery message. This preview uses its own browser storage. It does not contain or change the stable app's saved phone data. Use the optional example-week action to see a populated plan.

Source ZIP and Git bundle are supplied with the delivery. To publish from the bundle using an authenticated local Git installation:

```sh
git clone -b design/v2-ui-refresh Plan-and-Plate-V2.bundle plan-and-plate-v2
cd plan-and-plate-v2
git remote set-url origin https://github.com/mattpilkyApps/plan-and-plate.git
git push -u origin design/v2-ui-refresh
```

Open a PR against `main` for review; do not merge until Matt approves. `V2_PULL_REQUEST.md` contains the prepared description.

## Remaining checks and next improvements

1. Physical Android review, including on-screen keyboard, upload/camera chooser, install/update and offline behaviour. Browser viewport tests do not substitute for this.
2. Validate the seven-dinners-in-90-seconds target with a new user. The automated browser sequence proves the flow works, not that benchmark.
3. Fix GitHub write access, publish this branch and open its review PR. The original Vercel preview connection can then be checked.
4. After frontend review, prioritise photo storage/export and deeper shopping/parser validation. Photos still use compressed localStorage data URLs; multi-tab conflict handling and cloud sharing are future work.
5. Private hosting authentication may affect an offline cold launch. The offline shell is generated, but no physical offline/install claim is made.

Supermarket comparison, accounts, billing and cloud storage were outside this phase and were not introduced.
