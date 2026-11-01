import { readFileSync } from 'node:fs'
import { methodBoundaryCases } from './method-boundaries.js'
import { researchedLayoutCases } from './researched-layouts.js'
import { phoneFollowupCases } from './phone-followup.js'

const fixture = (name) => readFileSync(new URL('../' + name, import.meta.url), 'utf8')
const curry = fixture('pumpkin-curry-plain.txt')
const curryIngredients = [
  '1 tbsp sunflower oil',
  '3 tbsp Thai yellow curry paste or vegetarian alternative',
  '2 onions, finely chopped',
  '3 large stalks lemongrass, bashed with the back of a knife',
  '6 cardamom pods', '1 tbsp mustard seed',
  '1 piece pumpkin or a small squash (about 1kg)',
  '250ml vegetable stock', '400ml can reduced-fat coconut milk',
  '400g can chickpea, drained and rinsed', '2 limes',
  'large handful mint leaves', 'naan bread, to serve',
]
const curryExpectation = {
  name: 'Pumpkin curry with chickpeas', servings: '4', prepTime: '20 mins', cookTime: '20 mins',
  ingredients: curryIngredients,
  methodCount: 2, methodEndsWith: 'warm naan breads.',
}

// Only the two pre-existing copies supplied by Matt contain publisher prose.
// All new recipe prose below is invented; source URLs document layout research.
export const recipeCorpus = [
  ...phoneFollowupCases,
  ...methodBoundaryCases,
  ...researchedLayoutCases,
  {
    id: 'owner-curry-plain', layout: 'owner mobile copy',
    source: 'https://www.bbcgoodfood.com/recipes/pumpkin-curry-chickpeas',
    reason: 'Protect split metadata, preparation and alternative lines.',
    raw: curry, expected: curryExpectation,
  },
  {
    id: 'owner-curry-markdown', layout: 'owner Markdown copy',
    source: 'https://www.bbcgoodfood.com/recipes/pumpkin-curry-chickpeas',
    reason: 'Protect links, headings and numbered cooking steps.',
    raw: fixture('pumpkin-curry-markdown.txt'), expected: curryExpectation,
  },
  {
    id: 'phone-retail-tail', layout: 'owner copy with reported retail tail',
    source: 'https://www.bbcgoodfood.com/recipes/pumpkin-curry-chickpeas',
    reason: 'Exact reported Android failure; retail copy must never be saved as steps.',
    raw: curry + '\n\nElevated by design Your autumn wardrobe has arrived.\nOvert Heeled Ankle Boots £159\nDepend Leather Shoulder Bag £129\nDependent Suede Shoulder bag £129\nCarbon-Neutral Ad',
    expected: curryExpectation,
    excluded: ['Elevated by design', 'Overt Heeled', 'Depend Leather', 'Dependent Suede', 'Carbon-Neutral'],
  },
  {
    id: 'simple-numbered', layout: 'synthetic recipe card',
    reason: 'Small golden example with all fields and inline numbering.',
    raw: 'Green bean rice\nServes 2\nPrep: 5 mins | Cook: 12 mins\nIngredients\n100g rice\n200g green beans\nMethod\n1. Boil the rice.\n2. Stir in the beans and cook until tender.',
    expected: { name: 'Green bean rice', servings: '2', prepTime: '5 mins', cookTime: '12 mins', ingredients: ['100g rice', '200g green beans'], method: ['Boil the rice.', 'Stir in the beans and cook until tender.'] },
  },
  {
    id: 'unmeasured-and-continuations', layout: 'synthetic mobile line wrapping',
    reason: 'Do not fold unmeasured ingredients into a preceding preparation note.',
    raw: 'Garden salad\nIngredients\n2 onions\nfinely chopped\nchopped tomatoes\nsalt and pepper\nMethod\nStep 1\nMix everything in a bowl.\nChill until ready.\nStep 2\nServe.',
    expected: { name: 'Garden salad', ingredients: ['2 onions, finely chopped', 'chopped tomatoes', 'salt and pepper'], method: ['Mix everything in a bowl. Chill until ready.', 'Serve.'] },
  },
  {
    id: 'tabs-checkboxes-footer', layout: 'synthetic unit toggle card',
    reason: 'Nutrition tab and controls precede ingredients; related cards must not restart extraction.',
    raw: 'Pan beans\nIngredients\nNutrition\nUnits: US Customary | Metric\nScale: 1x 2x 3x\n▢ 2 garlic cloves\ncrushed\n▢ 2 × 400g tins chopped tomatoes\nMethod\nSimmer in a pan.\nRelated recipes\nIngredients\n1 unrelated advert',
    expected: { name: 'Pan beans', ingredients: ['2 garlic cloves, crushed', '2 × 400g tins chopped tomatoes'], method: ['Simmer in a pan.'] },
    excluded: ['Related recipes', 'unrelated advert', 'Units:', 'Scale:'],
  },
  {
    id: 'tesco-metric-card', layout: 'researched supermarket card, synthetic prose',
    source: 'https://www.tesco.com/recipes/en-GB/recipe/smoky-bean-chilli',
    reason: 'Compact metric ingredients, package multipliers and supermarket serving metadata.',
    raw: '# Smoky garden beans\nServes 3\nIngredients\n1 onion, sliced\n2 x 400g tins beans, drained and rinsed\n150ml stock\nMethod\n1. Fry the onion in a pan until soft.\n2. Add the beans and stock. Simmer for 12 minutes.\nReviews\nReally good.',
    expected: { name: 'Smoky garden beans', servings: '3', ingredients: ['1 onion, sliced', '2 x 400g tins beans, drained and rinsed', '150ml stock'], method: ['Fry the onion in a pan until soft.', 'Add the beans and stock. Simmer for 12 minutes.'] },
    excluded: ['Really good.'],
  },
  {
    id: 'jamie-numbered-wrap', layout: 'researched chef site, synthetic prose',
    source: 'https://www.jamieoliver.com/recipes/vegetables/pumpkin-chickpea-coconut-curry/',
    reason: 'Continuation after an inline numbered instruction must stay in that step.',
    raw: '# Roasted squash pot\nServes 4\nIngredients\n1 squash\n1 bunch coriander\nMethod\n1. Roast the squash in a tray.\nCheck occasionally and add water if needed.\n2. Scatter with coriander and serve.\nMore recipes\nAnother supper',
    expected: { name: 'Roasted squash pot', servings: '4', ingredients: ['1 squash', '1 bunch coriander'], method: ['Roast the squash in a tray. Check occasionally and add water if needed.', 'Scatter with coriander and serve.'] },
    excluded: ['Another supper'],
  },
  {
    id: 'recipetin-scale-controls', layout: 'researched WordPress recipe card, synthetic prose',
    source: 'https://www.recipetineats.com/lentil-soup/',
    reason: 'Print/cook controls and US fractions with unnumbered bullet instructions.',
    raw: '# Lemon lentil bowl\nAuthor: Alex\nPrep: 8 mins\nCook: 35 mins\nServings 4\nPrint\nIngredients\n- 1 1/2 cups lentils\n- 2 garlic cloves, minced\n- 1 lemon\nCook Mode Prevent screen from sleeping\nInstructions\n- Heat a large pot and add the lentils.\n- Simmer until tender.\n- Squeeze in the lemon juice.\nRecipe tips\nAuthor biography',
    expected: { name: 'Lemon lentil bowl', servings: '4', prepTime: '8 mins', cookTime: '35 mins', ingredients: ['1 1/2 cups lentils', '2 garlic cloves, minced', '1 lemon'], method: ['Heat a large pot and add the lentils.', 'Simmer until tender.', 'Squeeze in the lemon juice.'] },
    excluded: ['Author biography', 'Cook Mode'],
  },
  {
    id: 'allrecipes-split-labels', layout: 'researched US editorial recipe, synthetic prose',
    source: 'https://www.allrecipes.com/recipe/20144/banana-banana-bread/',
    reason: 'Separate timing labels and Directions heading with unicode fractions.',
    raw: '# Pear loaf\nPrep Time:\n15 mins\nCook Time:\n1 hr\nServings:\n8\nIngredients\n2 cups flour\n¾ cup sugar\n½ cup butter\n2 eggs, beaten\nDirections\n1. Preheat the oven to 175°C.\n2. Beat the butter and sugar in a bowl.\n3. Fold in the flour and bake for 1 hour.\nNutrition\n240 kcal',
    expected: { name: 'Pear loaf', servings: '8', prepTime: '15 mins', cookTime: '1 hr', ingredients: ['2 cups flour', '¾ cup sugar', '½ cup butter', '2 eggs, beaten'], method: ['Preheat the oven to 175°C.', 'Beat the butter and sugar in a bowl.', 'Fold in the flour and bake for 1 hour.'] },
    excluded: ['240 kcal'],
  },
  {
    id: 'budget-card-cost-not-product', layout: 'researched budget blog, synthetic prose',
    source: 'https://www.budgetbytes.com/one-pot-veggie-pasta/',
    reason: 'An ingredient price note is not a product-card boundary.',
    raw: '# Fridge pasta\nPrep 5 mins\nCook 20 mins\nServings 2 servings\n$4.00 recipe / $2.00 serving\nIngredients\n1 onion ($0.40)\n200g pasta ($0.60)\nInstructions\nDice the onion and fry in a pot.\nAdd pasta and water; simmer until tender.\nComments\nPerfect!',
    expected: { name: 'Fridge pasta', servings: '2', ingredients: ['1 onion ($0.40)', '200g pasta ($0.60)'], method: ['Dice the onion and fry in a pot.', 'Add pasta and water; simmer until tender.'] },
    excluded: ['Perfect!', '$4.00 recipe'],
  },
  {
    id: 'serious-eats-dual-measures', layout: 'researched US long-form editorial, synthetic prose',
    source: 'https://www.seriouseats.com/the-best-slow-cooked-bolognese-sauce-recipe',
    reason: 'Parenthetical metric alternatives remain a single ingredient.',
    raw: '# Sunday sauce\nYield: 6 servings\nIngredients\n2 cups (475 ml) stock\n3 ounces (85 g) Parmesan, finely grated\nDirections\n1. Heat the stock in a saucepan.\n2. Stir in the Parmesan.\nReviews\nOur favourite.',
    expected: { name: 'Sunday sauce', servings: '6', ingredients: ['2 cups (475 ml) stock', '3 ounces (85 g) Parmesan, finely grated'], method: ['Heat the stock in a saucepan.', 'Stir in the Parmesan.'] },
    excluded: ['Our favourite.'],
  },
]
