import { readFileSync } from 'node:fs'

export const sproutsPaste = readFileSync(new URL('../sprouts-rice-two-tab-phone.txt', import.meta.url), 'utf8').trimEnd()
const methodStart = sproutsPaste.indexOf('\n\nIn a bowl,')
export const sproutsIngredientsPaste = sproutsPaste.slice(0, methodStart)
export const sproutsMethodPaste = sproutsPaste.slice(methodStart).trimStart()
export const sproutsIngredients = sproutsIngredientsPaste.split('\nIngredients\n').at(-1).split('\n')
export const sproutsMethodFirstPaste = sproutsMethodPaste + '\n\n' + sproutsIngredientsPaste

export const twoTabLayoutCases = [
  {
    id: 'owner-sprouts-method-first-phone', layout: 'owner clipboard fragments in reverse order',
    reason: 'Method copied first, then the ingredients page: neither the list nor its header may be lost.',
    raw: sproutsMethodFirstPaste,
    expected: { name: 'Sprouts fried rice with pigs in blankets', servings: '2', prepTime: '15 mins', cookTime: '10 mins', totalTime: '25 mins', ingredients: sproutsIngredients, methodCount: 3, methodEndsWith: 'Serve immediately.', notes: sproutsMethodPaste.split('Cook’s tip\n\n')[1] },
    excluded: ['0 out of 5 stars', 'CourseMain meal', 'Please note,', 'Cook’s tip'],
  },
  {
    id: 'method-before-ingredients-explicit', layout: 'synthetic reversed recipe sections',
    reason: 'An explicit Method section can precede Ingredients without being mistaken for another recipe.',
    raw: 'Bean pot\nServes 2\nMethod\n1. Heat the beans in a pan.\n2. Serve.\nIngredients\n1 tin beans\n1 onion\nfinely chopped',
    expected: { name: 'Bean pot', servings: '2', ingredients: ['1 tin beans', '1 onion, finely chopped'], method: ['Heat the beans in a pan.', 'Serve.'] },
  },
  {
    id: 'repeated-page-header-method-first', layout: 'synthetic two full website tabs',
    reason: 'Duplicated titles, metadata and navigation belong to the page header rather than the cooking method.',
    raw: '# Bean pot\nServes2\nPrepare5 mins\nCook10 mins\nIngredients\nMethod\nNutrition\nHeat the beans in a pan.\n\nServe.\nCook’s tip\nReheat in a pan until piping hot.\n\n# Bean pot\nServes2\nPrepare5 mins\nCook10 mins\nIngredients\nMethod\nNutrition\nIngredients\n1 tin beans\n1 onion\nfinely chopped',
    expected: { name: 'Bean pot', servings: '2', prepTime: '5 mins', cookTime: '10 mins', ingredients: ['1 tin beans', '1 onion, finely chopped'], method: ['Heat the beans in a pan.', 'Serve.'], notes: 'Reheat in a pan until piping hot.' },
  },
  {
    id: 'method-first-markdown-ingredients-header', layout: 'synthetic second-tab Markdown title',
    reason: 'A heading in the second paste must not discard an earlier unlabelled method.',
    raw: 'Heat a pan and fry the onion.\n\nStir in the beans and simmer for 5 minutes.\n\n# Bean pot\nServes 2\nIngredients\n1 onion\n1 tin beans',
    expected: { name: 'Bean pot', servings: '2', ingredients: ['1 onion', '1 tin beans'], method: ['Heat a pan and fry the onion.', 'Stir in the beans and simmer for 5 minutes.'] },
  },
  {
    id: 'method-first-related-ingredients-rejected', layout: 'synthetic post-method related card',
    reason: 'Order independence must not rescue ingredients from a related recipe after a strong footer.',
    raw: 'Bean pot\nMethod\nHeat the beans in a pan.\nRelated recipes\nIngredients\n5 unrelated products',
    expected: { name: 'Bean pot', ingredients: [], method: ['Heat the beans in a pan.'] },
    excluded: ['unrelated products'],
  },
  {
    id: 'unlabelled-method-only-clipboard', layout: 'synthetic method fragment without ingredients',
    reason: 'The first clipboard fragment should retain cooking steps while requesting missing ingredients.',
    raw: 'Heat a pan and fry the onion.\n\nStir in the beans and simmer for 5 minutes.',
    expected: { name: '', ingredients: [], method: ['Heat a pan and fry the onion.', 'Stir in the beans and simmer for 5 minutes.'] },
  },
  {
    id: 'owner-sprouts-two-tab-phone', layout: 'owner ingredients tab followed by separately copied method tab',
    reason: 'Navigation headings precede real Ingredients; the second paste has no Method heading and labels have no separating spaces.',
    raw: sproutsPaste,
    expected: { name: 'Sprouts fried rice with pigs in blankets', servings: '2', prepTime: '15 mins', cookTime: '10 mins', totalTime: '25 mins', ingredients: sproutsIngredients, methodCount: 3, methodEndsWith: 'Serve immediately.', notes: sproutsMethodPaste.split('Cook’s tip\n\n')[1] },
    excluded: ['0 out of 5 stars', 'CourseMain meal', 'Please note,', 'Cook’s tip'],
  },
  {
    id: 'tabs-before-ingredients-implicit-paragraphs', layout: 'synthetic three-tab navigation and unlabelled method',
    reason: 'A navigation Method link is not the beginning of actual instructions.',
    raw: 'Carrot rice\nServes2\nPrepare5 mins\nCook10 mins\nIngredients\nMethod\nNutrition\nIngredients\n100g carrots\n200g cooked rice\n\nHeat a pan and add the carrots.\n\nStir in the rice and cook for 5 minutes.\nCook\'s tip\nReheat in a pan until piping hot.',
    expected: { name: 'Carrot rice', servings: '2', prepTime: '5 mins', cookTime: '10 mins', ingredients: ['100g carrots', '200g cooked rice'], method: ['Heat a pan and add the carrots.', 'Stir in the rice and cook for 5 minutes.'], notes: 'Reheat in a pan until piping hot.' },
  },
  {
    id: 'unmeasured-prepared-foods-before-inferred-method', layout: 'synthetic preservation contrast',
    reason: 'Prepared foods do not become implicit method steps just because they contain a cooking word.',
    raw: 'Leftover supper\nIngredients\nroast potatoes\nchopped tomatoes\ncooked rice\n\nHeat a pan and fry the potatoes.\nServe.',
    expected: { name: 'Leftover supper', ingredients: ['roast potatoes', 'chopped tomatoes', 'cooked rice'], method: ['Heat a pan and fry the potatoes.', 'Serve.'] },
  },
  {
    id: 'ingredients-tab-with-method-link-only', layout: 'synthetic first paste only',
    reason: 'The first tab alone should import ingredients while leaving Method empty for review.',
    raw: 'Bean rice\nIngredients\nMethod\nNutrition\nIngredients\n1 tin beans\n200g rice',
    expected: { name: 'Bean rice', ingredients: ['1 tin beans', '200g rice'], method: [] },
  },
  {
    id: 'combined-compact-metadata-and-explicit-method', layout: 'synthetic compact labels',
    reason: 'Combined touching labels work without weakening quantity or unit boundaries.',
    raw: 'Fast rice\nServes2\nPrepare5 mins Cook10 mins Total time15 mins\nIngredients\n200g rice\nMethod\nBoil the rice.',
    expected: { name: 'Fast rice', servings: '2', prepTime: '5 mins', cookTime: '10 mins', totalTime: '15 mins', ingredients: ['200g rice'], method: ['Boil the rice.'] },
  },
]
