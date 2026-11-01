import { readFileSync } from 'node:fs'

export const paneerIngredients = [
  '2 tbsp vegetable oil', '1 onion, finely chopped',
  '10g ginger, grated or 1 tsp ginger paste', '2 garlic cloves, crushed',
  '1 tbsp medium curry powder', '1 tsp garam masala', '1 tsp ground turmeric',
  '1 red chilli, deseeded if you prefer less heat, finely chopped',
  '200g paneer, cut into 1cm cubes', '2 x 400g cans of chickpeas, drained',
  '400g can of coconut milk', '400g frozen spinach',
  '120ml vegetable stock, made with 1 stock cube',
  '1 tbsp mango chutney', '½ lemon, juiced',
  'steamed basmati rice and chopped coriander or whole leaves, sliced chilli (optional)',
]

export const phoneFollowupCases = [
  {
    id: 'owner-paneer-phone', layout: 'exact Android paste supplied by Matt',
    reason: 'Preparation clauses and an unmeasured serving subsection were split into phantom ingredients.',
    raw: readFileSync(new URL('../paneer-curry-phone.txt', import.meta.url), 'utf8'),
    expected: {
      name: 'Paneer, chickpea & spinach curry', servings: '4', prepTime: '10 mins', cookTime: '20 mins',
      ingredients: paneerIngredients, methodCount: 2,
      methodEndsWith: 'some sliced chilli, if you like.',
      notes: 'Defrost if frozen, then put in a saucepan over low-medium heat until piping hot.',
    },
    excluded: ['To serve', 'ADVERTISING', 'Recipe tip', 'Recipe from', 'More from around the web', 'Australian doctor', 'News - Health'],
  },
  {
    id: 'preparation-clauses-not-food-names', layout: 'synthetic preparation and unmeasured ingredient contrast',
    reason: 'Preparation grammar is shared, without joining separate prepared foods.',
    raw: 'Fruit bowl\nIngredients\n2 limes\njuiced\n1 mango\ncut into thick slices\n1 pepper\ndeseeded if preferred\ngrated cheese\ncrushed nuts\nsliced bread\nMethod\nMix everything in a bowl.',
    expected: { name: 'Fruit bowl', ingredients: ['2 limes, juiced', '1 mango, cut into thick slices', '1 pepper, deseeded if preferred', 'grated cheese', 'crushed nuts', 'sliced bread'], method: ['Mix everything in a bowl.'] },
  },
  {
    id: 'serving-header-with-unmeasured-food', layout: 'synthetic bare serving heading',
    reason: 'A new serving group differs from a trailing to-serve preparation note.',
    raw: 'Bean pot\nIngredients\n1 lemon\njuiced\nTo serve\nsteamed rice\nand chopped herbs\nMethod\nSimmer the beans and serve.',
    expected: { name: 'Bean pot', ingredients: ['1 lemon, juiced', 'steamed rice and chopped herbs'], method: ['Simmer the beans and serve.'] },
    excluded: ['To serve'],
  },
  {
    id: 'serving-note-at-end-still-joins', layout: 'synthetic trailing serving description',
    reason: 'Keep the original naan/to serve continuation working.',
    raw: 'Warm bread\nIngredients\nnaan bread\nto serve\nMethod\nHeat the bread in a pan.',
    expected: { name: 'Warm bread', ingredients: ['naan bread, to serve'], method: ['Heat the bread in a pan.'] },
  },
  {
    id: 'tip-to-notes-before-syndication', layout: 'synthetic legitimate tip followed by promoted articles',
    reason: 'A real recipe tip belongs in Notes; cooking-themed promotion afterward is excluded.',
    raw: 'Vegetable pot\nIngredients\n100g carrots\nMethod\n1. Simmer the carrots until tender.\n2. Serve.\nAd\nADVERTISING\nRecipe tips\nReheat in a pan until piping hot.\nRecipe from Kitchen magazine, April 2026\nMore from around the web\nHeat up your health routine.',
    expected: { name: 'Vegetable pot', ingredients: ['100g carrots'], method: ['Simmer the carrots until tender.', 'Serve.'], notes: 'Reheat in a pan until piping hot.' },
    excluded: ['ADVERTISING', 'Recipe from', 'More from around the web', 'health routine'],
  },
  {
    id: 'recipe-tip-before-next-numbered-step', layout: 'synthetic inline tip inside numbered instructions',
    reason: 'An inline tip before a later numbered step is still part of the method.',
    raw: 'Onion pot\nIngredients\n1 onion\nMethod\n1. Fry the onion.\nRecipe tip\nAdd water if the pan looks dry.\n2. Simmer until tender.',
    expected: { name: 'Onion pot', ingredients: ['1 onion'], method: ['Fry the onion. Add water if the pan looks dry.', 'Simmer until tender.'] },
  },
]
