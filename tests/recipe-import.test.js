import test from 'node:test'
import assert from 'node:assert/strict'
import { parsePastedRecipe } from '../src/utils/recipeImport.js'
import {
  deleteSavedRecipe,
  getPlannedMealsForWeek,
  getSavedRecipes,
  getWeeklyQueueItems,
  updateSavedRecipe,
} from '../src/utils/localStorage.js'

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
