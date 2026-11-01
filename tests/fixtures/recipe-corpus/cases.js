import { readFileSync } from 'node:fs'

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
    knownFailure: true,
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
]
