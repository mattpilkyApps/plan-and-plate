# Recipe Quality Lab — implementation and quality report

3 November 2026. Experimental branch `lab/recipe-quality`; production release is not authorised. This is working product infrastructure, with explicit limits below.

Verified protected preview: https://plan-and-plate-7d082suoi-mattpilkyapps-projects.vercel.app/ . READY deployment dpl_AKg2Je5QBSuSAt8Gyp49LKFariAu, source 90e00a62d6268c65c488449e74505f7e40ca6f0c, preview target. Lab HTML, matching JS/CSS and service worker return authenticated HTTP 200; preview SSO is preserved. Main remains b07e4b1. A subsequent docs-only branch checkpoint has identical application source. The Drive technical specification also contains a verified implementation appendix.

## Delivered

The standalone Lab has six functional sections: recipe workspace/card, Chef simulator, Shopping simulator, regression library, diagnostics and issue notebook. Cream/green responsive styling uses readable recipe text, accessible labels and keyboard focus trapping, reduced motion, source/preview/review tabs on phones and large timer controls. A desktop Phone preview exercises actual 320/390/430px iframe viewports; those copies do not write to the main Lab store.

Recipe intake uses the existing production importer/session and ingredient parser. Canonical RecipeCard v1 retains every clipboard fragment, untouched source text, stable ingredient/step IDs, source offsets, original method, ingredient groups, notes, quantities/units, optional/alternative/package evidence and explicit/missing time states. Exact suffix/prefix overlaps are combined; conflicting values and unknown amounts request review. Metadata evidence identifies the labelled field, including equal prep/cook values. Intra-fragment conflicting servings/times remain visible with both candidates.

Numbered methods partition the source, retaining actions, durations, temperatures, order and contextual qualifiers. Short location/seasoning/stirring fragments remain grouped. Editors support all recipe fields, ingredient/group changes, step edits, reorder, merge and split at the cursor. Original evidence remains available. Edits revoke approval; rebuilding requires explicit replacement of edited/approved cards. Earlier drafts remain recoverable when opening another case or starting a new one. Approval represents the tester's review of that revision, never an automatic correctness score.

Chef compiles only approved cards. The reusable compiler, DAG/resource scheduler and timestamp-based session reducer are separate from React. Source recipe order is conservative. Supported ingredient preparation and preheat overlap respond to preferences. There are independent timers, +1/+3 minute adjustments, early/behind controls, per-timer pause/resume, presentation hold, information-card autoplay, dependency explanations and deterministic virtual clocks. Expired timers require physical confirmation. Safety-policy tasks are distinct from recipe source; hygiene and doneness checkpoints require confirmation. Sessions/events are saved with absolute timer targets and can be replayed deterministically. Background alerts, voice and personalised timing are not implemented.

Shopping uses the actual production generation/merge/category utility via an explicit compatibility adapter. It supports several reviewed recipe snapshots, per-meal servings, compatible merging, incompatible stated units, optional inclusion, manual groceries/household items and recoverable Already-got simulation. Raw preparation wording and canonical source IDs remain traceable. Source fragments are pooled rather than copied into every ingredient trace. A backwards-compatible canonicalIngredientId marker prevents reparsing corrected canonical values; all legacy paths retain their original behaviour. No production Pantry or price comparison was added.

Issues capture the recipe/source, engine versions, build commit, cooking plan, timer state, shopping data, diagnostics and failed assertions locally. The tester adds actual/expected behaviour, severity and optional screenshot. Default exports redact recipe-bearing data and device/evidence details; full reproduction requires explicit opt-in and displays the exact JSON. Workflow states and reviewed fixture linkage are provided; Regression Locked requires a linked passing case. JSON fixture imports and issue-source replay are supported. No GitHub issue or other external message is sent automatically; no paid AI service or frontend credential exists.

## Objective checks

| Check | Result |
| --- | --- |
| Existing baseline tests | 217/217 pass |
| Final complete automated tests | 346/346 pass, no skips/TODO/failures |
| New Lab domain/contract/scenario tests | 129 pass |
| Existing parser corpus | 57/57 pass |
| Existing multi-tab workflows | 16/16 retained |
| Browser/CLI Lab suite | 92/92 cases pass, 581 assertions |
| Recipe and paste cases in Lab | 76 |
| Cooking/shopping scenario cases | 16 |
| Explicit numbered-step goldens | 6; three owner copies and three labelled synthetic contracts |
| ESLint; production build; Lab build | Pass |
| Lab service worker syntax | Pass |
| Whitespace check | Pass |

`quality-report.json` records every case/assertion, review codes and a SHA-256 fingerprint of relevant domain/utils/test source. The Lab suite contains 52 warning-level review flags across its deliberately varied/ambiguous cases; these are not 52 failed tests. Missing source metadata is not fabricated. Source fidelity and human review remain separate from case assertion passes. Goldens were checked against source during this engineering session; Matt's independent human acceptance is still needed.

| Representative owner input | Ingredients | Numbered steps | Preserved behaviour |
| --- | --- | --- | --- |
| BBC Good Food pumpkin curry | 13 | 7 | Wrapped ingredients, alternatives, source ranges and freezing note |
| BBC Good Food paneer curry | 16 | 9 | To Serve group, raw prep clauses, source notes, ambiguous optional chilli scope |
| Waitrose sprouts rice | 11 | 11 | Both paste orders, fractions, source heat/times and cooking tip |

The 92-case suite includes normal/expired tasks, independent timers, extension/descendant recalculation, done early, running behind, timer pause/resume, instruction hold, presentation versus completion, interrupted replay, prerequisite rejection, equipment conflicts, safety-not-confirmed, cycle rejection, household items, optional exclusions and incompatible units. The same scenario data/engines run in Node and the browser. A saved last-good browser run was rerun: zero new regressions.

## Browser verification

Actual cloud Chrome interactions on the built Lab verified:

- Owner paneer import, 16 ingredients/9 steps and correct labelled cooking-time evidence highlight.
- Explicit approval, full approved pipeline and actual generated Chef plan/timeline.
- Starting a task, adding three minutes, advancing virtual time, dependent ETA movement and expiry remaining awaiting confirmation.
- Shopping at six servings: paneer 300g, chickpeas 1200g, stock 180ml and garlic 3 cloves; original wording/source traced.
- Manual Toilet rolls in Toiletries; Already-got keeps paneer recoverable in Already at home.
- Actual embedded phone layouts at 320/390/430px; no document overflow, all six navigation controls fit. Embedded browser scrollbars reduce the inner content width by 17px.
- Phone method-first then ingredients-second synthetic paste yields exactly four numbered steps and four ingredients.
- Phone title correction survives reprocessing when Keep my current card is selected.
- Phone issue capture, redacted JSON review, full snapshot opt-in and actual JSON file download. Download-event automation timed out, but the synchronised 372,375-byte file was verified as valid JSON with both source fragments, four steps, timer state and shopping output; device/screenshot details remained excluded.
- Full browser suite 92/92, last-good baseline save and repeat with zero new regressions.

Physical Android/iPhone hardware, Safari, real kitchen timings, native notifications, prolonged background suspension and offline cold-start behaviour have not been independently observed. The Lab has its own generated offline shell and absolute timer recovery, but browser support/foreground testing must not be presented as a full physical-device matrix. Chrome extension metadata errors were observed separately from application behaviour.

## Limits and next milestone

The engine is not perfect. Source-method coverage proves the extracted method partition is complete, not that arbitrary webpage classification is universally correct. Sparse or ambiguous copies can still need manual repair. Short source labels, nested alternatives, arbitrary parallel prose and unmeasured compounds remain conservative. Food/allergen recognition is incomplete and never establishes safety by absence of flags.

Chef Smart Timing currently overlaps supported preheat/preparation tasks; it does not fully interpret and optimise arbitrary multi-pan recipes. Some composite readable steps remain a single conservative cooking task. Generic duration estimates are labelled and adjustable, not vetted culinary/personalised timings. Voice, reliable background notifications, ingredient discovery, collaboration/server issue tracking, component-level compound shopping products and purchase-pack/unit conversion remain future work.

Highest-value next milestone: Matt tests the three known cases and at least ten fresh complete/two-tab website copies on his actual Android phone. Review the canonical numbered cards before timing optimisation. Export a full reviewed issue pack for each failure; convert confirmed defects into fixture/assertion coverage. Broaden independent-task compiler interpretation only after those source/card outputs are accepted.

## Recovery and isolation

Read HANDOFF.md first. Use `npm ci`, `npm run dev:lab`, `npm run test:lab`, `npm run lab:report`. Full checks: `npm test`, `npm run parser:report`, `npm run lint`, `npm run build`, `npm run build:lab`. Lab output is dist-lab; default app output remains dist. Lab storage is exclusively plan-and-plate-lab-v1. No Lab route is added to normal production navigation. No main merge, production promotion, real planner-data access, account migration, new backend or runtime dependency was performed.

Vercel deployment must use the exact development commit and per-deployment Lab build/output overrides, retaining preview authentication. Current deployed URL/source/verification are recorded at the top of HANDOFF.md after publication.
