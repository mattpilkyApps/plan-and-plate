# Public recipe-layout research — 1 November 2026

Twenty publicly accessible pages inspected via normal web reads. These are layout observations, not a bulk crawl. New fixtures contain invented recipe prose and representative controls/noise. Only Matt's two existing owner-supplied pumpkin curry copies retain publisher text. No complete page HTML/text was added.

| Public source | Observed structure / resulting regression |
| --- | --- |
| [Good Food pumpkin curry](https://www.bbcgoodfood.com/recipes/pumpkin-curry-chickpeas) | Ingredients/Nutrition tabs, MetricUS control, split preparation/alternatives, numbered method; owner retail tail. |
| [Tesco smoky bean chilli](https://www.tesco.com/recipes/en-GB/recipe/smoky-bean-chilli) | Supermarket mega-menu, metric package ingredients, compact serving/cooking metadata. Initial read succeeded after redirect; later 403 was respected. |
| [Jamie Oliver pumpkin curry](https://www.jamieoliver.com/recipes/vegetables/pumpkin-chickpea-coconut-curry/) | Ingredients menu before H1, unmeasured ingredients, inline numbered method with a continuation, Tags and recipe cards afterward. |
| [RecipeTin Eats lentil soup](https://www.recipetineats.com/lentil-soup/) | Long article before repeated recipe card, total/prep/cook fields, scale/cook controls, cup/metric alternatives, To Serve subsection. |
| [Allrecipes banana bread](https://www.allrecipes.com/recipe/20144/banana-banana-bread/) | Split time labels, servings/yield, scale controls, fractions, numbered Directions, interleaved photos/credits. |
| [Serious Eats bolognese](https://www.seriouseats.com/the-best-slow-cooked-bolognese-sauce-recipe) | Long explanatory article, dual measures, To Serve subsection, numbered Directions and equipment afterward. |
| [Budget Bytes veggie pasta](https://www.budgetbytes.com/one-pot-veggie-pasta/) | Per-recipe/per-serving costs and individual ingredient prices; those must not be mistaken for retail cards. |
| [Skinnytaste taco soup](https://www.skinnytaste.com/turkey-chili-taco-soup/) | Explanatory method summary before full card; total time, single detailed instruction, nutrition afterward. |
| [Love and Lemons lentil soup](https://www.loveandlemons.com/lentil-soup/) | Newsletter before repeated card, serving range, affiliate equipment before Ingredients, total time, Instructions. |
| [Spend With Pennies lasagna](https://www.spendwithpennies.com/easy-homemade-lasagna/) | Grouped ingredients including Cheese Mixture, mixed fractions, bullet Instructions. |
| [Gimme Some Oven hummus-crusted chicken](https://www.gimmesomeoven.com/hummus-crusted-chicken/) | Fractional scale controls, dotted units, checkbox paragraphs, Additional Info and author block. |
| [Two Peas quinoa bake](https://www.twopeasandtheirpod.com/black-bean-and-quinoa-enchilada-bake/) | Article method plus recipe card; equipment affiliate links within actual instructions, reader feedback afterward. |
| [Sally's banana bread](https://sallysbakingaddiction.com/best-banana-bread-recipe/) | Semicolon in measurement parentheses, written mixed fractions, optional ingredient prefix, numbered/wrapped steps. |
| [Good Food pancakes](https://www.bbcgoodfood.com/recipes/easy-pancakes) | Makes yield, compact MetricUS toggle, plus-extra and to-serve continuations, real nutrition block before Method. |
| [Allrecipes chicken pie](https://www.allrecipes.com/recipe/26317/chicken-pot-pie-ix/) | Additional Time distinct from total and cook times, split serving/yield fields. |
| [King Arthur pancakes](https://www.kingarthurbaking.com/recipes/simply-perfect-pancakes-recipe) | Featured Products before Instructions, bake-mode controls, technique/blog card between numbered steps, tips/resources afterward. |
| [Cookie and Kate lentil soup](https://cookieandkate.com/best-lentil-soup-recipe/) | Written quantity ranges, US spoon units, optional garnishes and alternatives. |
| [Inspired Taste hummus](https://www.inspiredtaste.net/15938/easy-and-smooth-hummus-recipe/) | You Will Need heading, parenthesised can size, bare numbered directions, FAQs. |
| [Minimalist Baker oat pancakes](https://minimalistbaker.com/1-bowl-vegan-banana-oat-pancakes/) | Optional toppings/subsection, alternative amounts, cup fractions and unnumbered instructions. |
| [Good Food vegetable soup](https://www.bbcgoodfood.com/recipes/versatile-veg-soup) | Such-as examples, cubed preparation, and-to-serve continuation on separate lines. |

BBC Food, Waitrose, Pinch of Nom, Food Network, Simply Recipes and Once Upon a Chef sample URLs were unavailable through the web tool. No access-control bypass, login, alternative mirror or automated retry was used. Source diversity is supplemented with adversarial synthetic cases rather than claims of support for those unavailable pages. Plain clipboard text can differ from rendered web-tool text; synthetic fixtures model relevant phone line breaks without including tool-generated input widgets.

## Future URL import — research only

Primary references: [Schema.org Recipe](https://schema.org/Recipe) and [Google's recipe structured-data documentation](https://developers.google.com/search/docs/appearance/structured-data/recipe).

Recipe JSON-LD can supply ingredient text, nested HowToStep/HowToSection instructions, yield, images and ISO 8601 durations. A future adapter should find Recipe nodes in single objects, arrays and @graph, validate fields, flatten step sections without losing order, then feed the same ingredient normaliser. Explicit structured fields should take precedence; pasted visible text remains the fallback. Preserve source/yield text and distinguish people from items such as one loaf.

This local-first Vite application has no URL-fetch backend. Direct arbitrary-page fetching will often need a small server-side endpoint because cross-origin browser access is controlled by the source site. A future design must constrain URL/redirect fetching, response size/time and private-network access, respect blocked sites, and handle multiple recipes or missing/malformed JSON-LD. No endpoint, parser dependency, key or AI fallback was added in this task. Finding a markup standard does not establish that every researched page currently exposes usable JSON-LD; raw structured-data auditing is deferred.
