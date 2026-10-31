import test from 'node:test'
import assert from 'node:assert/strict'
import {
  generateShoppingGroups,
  getIngredientCategory,
} from '../src/utils/shoppingList.js'
import { parseIngredientLine } from '../src/utils/ingredientParser.js'
import {
  getCheckedShoppingItemIds,
  saveCheckedShoppingItemIds,
} from '../src/utils/localStorage.js'
const recipe = {
  id: 'r1',
  name: 'Dinner',
  servings: 4,
  ingredients: '500g beef mince\n2 onions\n2 garlic cloves',
}
const meals = [
  { id: 'm1', recipeId: 'r1', plannedServings: 2 },
  { id: 'm2', recipeId: 'r1', plannedServings: 4 },
]
const rows = (groups) => groups.flatMap((group) => group.items)
test('recipe → plan → shopping scales, merges and retains traceability', () => {
  const result = rows(generateShoppingGroups(meals, [recipe], [], []))
  const beef = result.find((item) => item.name === 'beef mince')
  assert.equal(beef.quantity, '750 g')
  assert.equal(beef.sourceIds.length, 2)
  assert.deepEqual(beef.sources, ['Dinner'])
  assert.equal(
    rows(generateShoppingGroups(meals, [recipe], beef.sourceIds, [])).some(
      (item) => item.name === 'beef mince',
    ),
    false,
  )
  assert.equal(
    rows(
      generateShoppingGroups(
        [{ ...meals[0], recipeId: null }],
        [recipe],
        [],
        [],
      ),
    ).length,
    0,
  )
  assert.equal(recipe.servings, 4)
})
test('unknown and incompatible units preserve all requirements without invented conversions', () => {
  const recipes = [
    {
      id: 'r',
      name: 'Mixed measures',
      servings: 1,
      ingredients:
        'salt\n1 tsp salt\n2 tbsp olive oil\n3 tsp olive oil\n1 tbsp olive oil',
    },
  ]
  const result = rows(
    generateShoppingGroups(
      [{ id: 'm', recipeId: 'r', plannedServings: 1 }],
      recipes,
      [],
      [],
    ),
  )
  assert.equal(result.filter((item) => item.name === 'salt').length, 2)
  const oil = result.find((item) => item.name === 'olive oil')
  assert.equal(oil.quantity, '2 tbsp + 3 tsp + 1 tbsp')
  assert.equal(oil.sourceIds.length, 3)
})
test('manual household items retain quantities, categories and notes', () => {
  const manual = [
    {
      id: 'toilet',
      name: 'Toilet roll',
      quantity: '2',
      unit: 'packs',
      category: 'Toiletries',
      note: 'Our usual',
    },
    {
      id: 'powder',
      name: 'Washing powder',
      quantity: '1',
      category: 'Household Cleaning',
    },
  ]
  const groups = generateShoppingGroups([], [], [], manual)
  assert.equal(
    groups.find((group) => group.name === 'Toiletries').items[0].quantity,
    '2 packs',
  )
  assert.equal(
    groups.find((group) => group.name === 'Household Cleaning').items[0]
      .isManual,
    true,
  )
  for (const [name, category] of [
    ['Washing powder', 'Household Cleaning'],
    ['Toilet rolls', 'Toiletries'],
    ['Baby wipes', 'Baby & Family'],
    ['Dog food', 'Pet Supplies'],
  ])
    assert.equal(getIngredientCategory(name), category)
})
test('shopping checks persist after a new page read', () => {
  const data = new Map()
  globalThis.window = {
    localStorage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
    },
  }
  saveCheckedShoppingItemIds(['toilet', 'm1-ingredient'])
  assert.deepEqual(getCheckedShoppingItemIds(), ['toilet', 'm1-ingredient'])
})
test('documented ingredient parser regression cases retain their expected quantities and names', () => {
  const fixtures = [
    ['2 garlic cloves', '2', 'cloves', 'garlic'],
    ['12 lasagne sheets', '12', '', 'lasagne sheets'],
    ['2 level tbsp plain flour', '2', 'tbsp', 'plain flour'],
    ['2 x 400g tins chopped tomatoes', '800', 'g', 'tomatoes'],
    ['750ml/1¼ pints milk', '750', 'ml', 'milk'],
    ['½ tsp salt', '0.5', 'tsp', 'salt'],
    ['1 1/2 tbsp olive oil', '1.5', 'tbsp', 'olive oil'],
  ]
  for (const [raw, quantity, unit, name] of fixtures) {
    const parsed = parseIngredientLine(raw)
    assert.deepEqual(
      [parsed.quantity, parsed.unit, parsed.name],
      [quantity, unit, name],
      raw,
    )
  }
})

test('fresh peppers and ground pepper use the appropriate aisles', () => {
  assert.equal(getIngredientCategory('peppers'), 'Fresh Produce')
  assert.equal(getIngredientCategory('red pepper'), 'Fresh Produce')
  assert.equal(getIngredientCategory('pepper', 'tsp'), 'Herbs & Spices')
  assert.equal(
    getIngredientCategory('ground black pepper', 'tsp'),
    'Herbs & Spices',
  )
})

test('shopping keeps tinned chopped tomatoes in cupboard essentials', () => {
  const recipe = {
    id: 'tins',
    name: 'Sauce',
    servings: 4,
    parsedIngredients: [
      {
        rawText: '400g chopped tomatoes',
        quantity: '400',
        unit: 'g',
        name: 'chopped tomatoes',
      },
    ],
  }
  const groups = generateShoppingGroups(
    [{ id: 'm', recipeId: 'tins', plannedServings: 4 }],
    [recipe],
    [],
    [],
  )
  assert.equal(groups[0].name, 'Pantry / Tins / Dry Goods')
})
