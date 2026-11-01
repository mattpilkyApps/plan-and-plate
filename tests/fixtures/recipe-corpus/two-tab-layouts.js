import { readFileSync } from 'node:fs'

export const sproutsPaste = readFileSync(new URL('../sprouts-rice-two-tab-phone.txt', import.meta.url), 'utf8').trimEnd()
const methodStart = sproutsPaste.indexOf('\n\nIn a bowl,')
export const sproutsIngredientsPaste = sproutsPaste.slice(0, methodStart)
export const sproutsMethodPaste = sproutsPaste.slice(methodStart).trimStart()
export const sproutsIngredients = sproutsIngredientsPaste.split('\nIngredients\n').at(-1).split('\n')

export const twoTabLayoutCases = [
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
