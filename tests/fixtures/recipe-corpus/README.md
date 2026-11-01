# Recipe paste regression corpus

Run `node scripts/evaluate-recipe-corpus.js --check` for exact-field scores, noise occurrences, false ingredients and contaminated method steps. Run `npm test` for regression assertions.

Cases describe layout, source reference, reason, representative raw paste, focused expectations and excluded noise. New recipe prose is synthetic. The two original pumpkin curry copies and the paneer and two-tab sprouts phone samples were supplied by Matt; the Android retail tail uses his exact reported failure. Never add complete scraped publisher pages.

Scores measure this curated engineering corpus, not accuracy over the web. A contaminated merged step counts once as a false method step; noise leakage counts each specified unwanted phrase. Ingredient false positives compare exact expected lines, so wording/join failures also count. Add adversarial preservation cases alongside each rejection rule.

The initial infrastructure checkpoint tracked the reported phone regression as TODO. The method-boundary checkpoint fixes it; every corpus case is now an active assertion with no TODO or skip.
