import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parsePastedRecipe } from '../src/utils/recipeImport.js'
import { parseIngredients } from '../src/utils/ingredientParser.js'
import {
  deleteSavedRecipe,
  getPlannedMealsForWeek,
  getSavedRecipes,
  getWeeklyQueueItems,
  updateSavedRecipe,
} from '../src/utils/localStorage.js'

const plainWebsiteRecipe = readFileSync(
  new URL('./fixtures/pumpkin-curry-plain.txt', import.meta.url),
  'utf8',
)
const markdownWebsiteRecipe = readFileSync(
  new URL('./fixtures/pumpkin-curry-markdown.txt', import.meta.url),
  'utf8',
)
const expectedCurryIngredients = [
  '1 tbsp sunflower oil',
  '3 tbsp Thai yellow curry paste or vegetarian alternative',
  '2 onions, finely chopped',
  '3 large stalks lemongrass, bashed with the back of a knife',
  '6 cardamom pods',
  '1 tbsp mustard seed',
  '1 piece pumpkin or a small squash (about 1kg)',
  '250ml vegetable stock',
  '400ml can reduced-fat coconut milk',
  '400g can chickpea, drained and rinsed',
  '2 limes',
  'large handful mint leaves',
  'naan bread, to serve',
]

for (const [format, text] of [
  ['plain text', plainWebsiteRecipe],
  ['Markdown', markdownWebsiteRecipe],
]) {
  test('website paste imports the complete pumpkin curry from ' + format, () => {
    const result = parsePastedRecipe(text)
    assert.equal(result.name, 'Pumpkin curry with chickpeas')
    assert.equal(result.servings, '4')
    assert.equal(result.prepTime, '20 mins')
    assert.equal(result.cookTime, '20 mins')
    assert.deepEqual(result.ingredients.split('\n'), expectedCurryIngredients)
    assert.equal(result.method.split(/\n+/).filter(Boolean).length, 2)
    assert.match(result.method, /^Heat the oil/)
    assert.match(result.method, /Squeeze the juice of one lime/)
    assert.match(result.method, /warm naan breads\.$/)
    assert.doesNotMatch(
      result.ingredients + result.method,
      /https?:|ADVERTISEMENT|Keep the screen awake|rating|BOOK NOW|Inspired by|step \d/i,
    )

    // The same original lines must still feed servings and shopping quantities.
    const ingredients = parseIngredients(result.ingredients)
    assert.equal(ingredients.length, 13)
    assert.deepEqual(
      ingredients
        .filter((item) => /stock|coconut milk|chickpea/.test(item.name))
        .map(({ quantity, unit, name }) => ({ quantity, unit, name })),
      [
        { quantity: '250', unit: 'ml', name: 'vegetable stock' },
        { quantity: '400', unit: 'ml', name: 'reduced-fat coconut milk' },
        { quantity: '400', unit: 'g', name: 'chickpea' },
      ],
    )
    assert.equal(ingredients[2].rawText, '2 onions, finely chopped')
  })
}

test('paste import keeps ingredients, method and detected serving/time metadata', () => {
  const result = parsePastedRecipe(
    'Print recipe\nServes 4\nPrep time: 15 mins\nCook time: 30 mins\nIngredients\n2 garlic cloves\n2 x 400g tins chopped tomatoes\n12 lasagne sheets\nMethod\n1. Heat the oven.\n2. Layer and bake.\nShare',
  )
  assert.equal(result.servings, '4')
  assert.equal(result.prepTime, '15 mins')
  assert.equal(result.cookTime, '30 mins')
  assert.equal(
    result.ingredients,
    '2 garlic cloves\n2 x 400g tins chopped tomatoes\n12 lasagne sheets',
  )
  assert.match(result.method, /Layer and bake/)
  assert.doesNotMatch(result.ingredients, /Print|Share/)
})

test('split labels and values work with copied non-breaking spaces', () => {
  const result = parsePastedRecipe(
    'Tomato soup\r\nServings:\r\n4\r\nPrep time:\r\n10\u00a0mins\r\nCooking time:\r\n1 hr 15 mins\r\nIngredients\r\n400g tomatoes\r\nMethod\r\n1. Simmer gently.',
  )
  assert.equal(result.name, 'Tomato soup')
  assert.equal(result.servings, '4')
  assert.equal(result.prepTime, '10 mins')
  assert.equal(result.cookTime, '1 hr 15 mins')
  assert.equal(result.ingredients, '400g tomatoes')
})

test('real nutrition and review sections never turn into shopping ingredients or cooking steps', () => {
  const result = parsePastedRecipe(
    'Chickpea stew\nServes 2\nIngredients\n400g chickpeas\n1 onion\nNutrition\n240 kcal\n12g protein\nMethod\n1. Simmer gently.\nReviews\n5. Amazing!\nMore recipes\nIngredients\n3 adverts',
  )
  assert.equal(result.ingredients, '400g chickpeas\n1 onion')
  assert.equal(result.method, 'Simmer gently.')

  const nutritionOnly = parsePastedRecipe(
    'Ingredients\nNutrition\n240 kcal\n12g protein\nMethod\nSimmer gently.',
  )
  assert.equal(nutritionOnly.ingredients, '')
})

test('ingredient lists without headings keep compact metric amounts and fractions', () => {
  const result = parsePastedRecipe(
    '250ml vegetable stock\n400g chickpeas\n1/2 tsp cumin\n½ tsp salt',
  )
  assert.equal(result.name, '')
  assert.equal(result.ingredients.split('\n').length, 4)
  assert.equal(parseIngredients(result.ingredients)[0].quantity, '250')
})

test('unmeasured ingredients stay separate while preparation notes stay attached', () => {
  const result = parsePastedRecipe(
    'Ingredients\n2 onions\nfinely chopped\nchopped tomatoes\nsliced peppers\nsalt and pepper\ncooking oil\nMethod\nStep 1\nMix the ingredients.\nChill until ready.\nStep 2\nServe.',
  )
  assert.deepEqual(result.ingredients.split('\n'), [
    '2 onions, finely chopped',
    'chopped tomatoes',
    'sliced peppers',
    'salt and pepper',
    'cooking oil',
  ])
  assert.equal(
    result.method,
    'Mix the ingredients. Chill until ready.\n\nServe.',
  )
})

test('empty, link-only and unrelated text do not invent a recipe', () => {
  for (const text of [
    '',
    'https://www.bbcgoodfood.com/recipes/pumpkin-curry-chickpeas',
    'Subscribe to our newsletter\nTry our app\nAdvertisement',
  ]) {
    assert.deepEqual(parsePastedRecipe(text), {
      name: '',
      servings: '',
      prepTime: '',
      cookTime: '',
      ingredients: '',
      method: '',
    })
  }
})

test('partial copies keep ingredients and method without guessing a serving range or missing time', () => {
  const result = parsePastedRecipe(
    'Serves 4–6\nPrep:\nIngredients\n2 onions\nMethod\nSoften the onions.',
  )
  assert.equal(result.name, '')
  assert.equal(result.servings, '')
  assert.equal(result.prepTime, '')
  assert.equal(result.ingredients, '2 onions')
  assert.equal(result.method, 'Soften the onions.')
})

test('editing and deleting a local recipe keep dated plans and queue relationships consistent', () => {
  const data = new Map(
    Object.entries({
      'plan-and-plate-recipes': [{ id: 'r1', name: 'Before', servings: 4 }],
      'plan-and-plate-planned-meals-by-week': {
        '2026-10-26': [
          {
            id: 'm1',
            day: 'WED',
            dateKey: '2026-10-28',
            recipeId: 'r1',
            recipeName: 'Before',
            mealSlot: 'dinner',
            plannedServings: 6,
          },
        ],
      },
      'plan-and-plate-weekly-queue': [
        { id: 'q1', recipeId: 'r1', recipeName: 'Before' },
      ],
    }).map(([key, value]) => [key, JSON.stringify(value)]),
  )
  globalThis.window = {
    localStorage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
    },
  }
  updateSavedRecipe({ id: 'r1', name: 'After', servings: 4 })
  const meal = getPlannedMealsForWeek('2026-10-26')[0]
  assert.equal(meal.recipeName, 'After')
  assert.equal(meal.dateKey, '2026-10-28')
  assert.equal(meal.plannedServings, 6)
  assert.equal(getWeeklyQueueItems()[0].recipeName, 'After')
  deleteSavedRecipe('r1')
  assert.equal(getSavedRecipes().length, 0)
  assert.equal(getPlannedMealsForWeek('2026-10-26').length, 0)
  assert.equal(getWeeklyQueueItems().length, 0)
})

test('incomplete stored values are handled without silently replacing their original bytes', () => {
  const data = new Map([
    ['plan-and-plate-recipes', 'null'],
    ['plan-and-plate-planned-meals-by-week', '[]'],
  ])
  globalThis.window = {
    localStorage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
    },
  }
  assert.deepEqual(getSavedRecipes(), [])
  assert.deepEqual(getPlannedMealsForWeek('2026-10-26'), [])
  assert.equal(data.get('plan-and-plate-recipes'), 'null')
  assert.equal(data.get('plan-and-plate-planned-meals-by-week'), '[]')
})
