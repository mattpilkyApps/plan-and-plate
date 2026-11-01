# Recipe parser hardening — 2026-11-01

Base: main `b979d9767c5706248ea54eb0c7d1fb883b82c800`. Branch: `improve/recipe-parser-hardening`. Preserve extraction separately from ingredient normalisation and retain original wording. No dependencies or AI services planned.

Baseline before changes: 18/18 recipe-import + ingredient tests; 32/32 full project tests. The owner-reported retail tail leaks into the method. Infrastructure starts with six corpus cases (five pass; one explicitly tracked failure), including both owner copies.

Checkpoint plan: corpus infrastructure; first researched fixture batch; contextual method boundaries; additional layouts/ingredient torture cases; evaluation/documentation and Vercel preview. Every checkpoint is saved on the GitHub branch. Production/main must not be changed.

First research batch: public BBC Good Food, Tesco, Jamie Oliver, RecipeTin Eats, Allrecipes, Serious Eats, Budget Bytes, Skinnytaste, Love and Lemons and Spend With Pennies pages inspected. BBC Food was inaccessible; no bypass attempted. Tesco's first page read redirected successfully; a later request returned 403 and was not retried. Added six synthetic cases covering UK supermarket/chef and US editorial/blog cards; corpus now 12 cases. Ingredient costs must be preserved rather than mistaken for retail products.
