import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parsePastedRecipe } from '../src/utils/recipeImport.js'
import { parseIngredients, parseIngredientLine } from '../src/utils/ingredientParser.js'
import { generateShoppingGroups, getIngredientCategory } from '../src/utils/shoppingList.js'
import { sproutsPaste } from './fixtures/recipe-corpus/two-tab-layouts.js'

const paneerPaste = readFileSync(new URL('./fixtures/paneer-curry-phone.txt', import.meta.url), 'utf8')
const rows = (groups) => groups.flatMap((group) => group.items.map((item) => ({ ...item, category: group.name })))
function importedRecipe(text) {
  const imported = parsePastedRecipe(text)
  return { ...imported, id: 'owner-recipe', parsedIngredients: parseIngredients(imported.ingredients) }
}
function plannedRows(recipe, servings = recipe.servings) {
  return rows(generateShoppingGroups([{ id: 'owner-plan', recipeId: recipe.id, plannedServings: servings }], [recipe], [], []))
}

for (const [name, category] of [
  ['paneer', 'Dairy & Eggs'], ['ginger', 'Fresh Produce'], ['red chilli', 'Fresh Produce'],
  ['garam masala', 'Herbs & Spices'], ['mango chutney', 'Condiments & Sauces'],
  ['oyster sauce', 'Condiments & Sauces'], ['groundnut oil', 'Oils & Cooking'],
  ['mushroom seasoning', 'Herbs & Spices'], ['Cooks’ Ingredients Chilli & Garlic Sauce', 'Condiments & Sauces'],
  ['Brussels sprouts', 'Fresh Produce'], ['cooked pigs in blankets', 'Meat & Fish'],
  ['ground coriander', 'Herbs & Spices'], ['coriander seed', 'Herbs & Spices'], ['coriander', 'Fresh Produce'],
  ['garlic powder', 'Herbs & Spices'], ['garlic sauce', 'Condiments & Sauces'],
  ['frozen Brussels sprouts', 'Frozen'], ['coconut milk', 'Pantry / Tins / Dry Goods'],
  ['red peppers', 'Fresh Produce'], ['salted butter', 'Dairy & Eggs'], ['eggplant', 'Fresh Produce'],
  ['essential oil', 'Other'], ['washing powder', 'Household Cleaning'], ['baby wipes', 'Baby & Family'],
]) test('specific Shopping product category: ' + name, () => assert.equal(getIngredientCategory(name), category))

test('paneer import → plan → Shopping retains all 16 rows with specific aisles and correct scaled quantities', () => {
  const recipe = importedRecipe(paneerPaste)
  const original = JSON.stringify(recipe)
  const items = plannedRows(recipe, 6)
  assert.equal(items.length, 16)
  assert.equal(items.some((item) => item.category === 'Other'), false)
  for (const [name, quantity, category] of [
    ['paneer', '300 g', 'Dairy & Eggs'], ['ginger', '15 g', 'Fresh Produce'],
    ['red chilli', '1.5', 'Fresh Produce'], ['garam masala', '1.5 tsp', 'Herbs & Spices'],
    ['mango chutney', '1.5 tbsp', 'Condiments & Sauces'], ['chickpeas', '1200 g', 'Pantry / Tins / Dry Goods'],
    ['garlic', '3 cloves', 'Fresh Produce'], ['vegetable stock', '180 ml', 'Pantry / Tins / Dry Goods'],
  ]) {
    const item = items.find((entry) => entry.name === name)
    assert.ok(item, name)
    assert.deepEqual([item.quantity, item.category], [quantity, category], name)
    assert.deepEqual(item.sources, [recipe.name])
  }
  assert.doesNotMatch(items.map((item) => item.name).join('\n'), /^(?:juiced|cut into|made with|finely chopped)$/m)
  assert.equal(JSON.stringify(recipe), original, 'Shopping must not change the recipe wording or quantities')
})

test('sprouts import → plan → Shopping has 11 clean product names with fractions and sources retained', () => {
  const recipe = importedRecipe(sproutsPaste)
  const original = JSON.stringify(recipe)
  const items = plannedRows(recipe)
  assert.equal(items.length, 11)
  assert.equal(items.some((item) => item.category === 'Other'), false)
  for (const [name, quantity, category] of [
    ['Brussels sprouts', '150 g', 'Fresh Produce'], ['salad onions', '2', 'Fresh Produce'],
    ['mushroom seasoning', '1.5 tsp', 'Herbs & Spices'], ['groundnut oil', '2.5 tbsp', 'Oils & Cooking'],
    ['cooked pigs in blankets', '4', 'Meat & Fish'], ['oyster sauce', '1 tbsp', 'Condiments & Sauces'],
    ['Cooks’ Ingredients Chilli & Garlic Sauce', '1 tbsp', 'Condiments & Sauces'],
  ]) {
    const item = items.find((entry) => entry.name === name)
    assert.ok(item, name)
    assert.deepEqual([item.quantity, item.category], [quantity, category], name)
    assert.deepEqual(item.sources, [recipe.name])
  }
  assert.equal(JSON.stringify(recipe), original)
  assert.ok(recipe.parsedIngredients.find((item) => item.name === 'salad onions').qualifiers.includes('whites and greens separated, both finely sliced'))
  assert.ok(recipe.parsedIngredients.find((item) => item.name === 'Brussels sprouts').qualifiers.includes('quartered'))
})

test('new preparation clauses keep raw wording and never delete prepared-food names', () => {
  for (const [raw, name] of [
    ['150g Brussels sprouts, quartered', 'Brussels sprouts'],
    ['2 salad onions, whites and greens separated, both finely sliced', 'salad onions'],
    ['4 cooked pigs in blankets, finely sliced', 'cooked pigs in blankets'],
    ['100g quartered artichoke hearts', 'quartered artichoke hearts'],
    ['200g tomatoes, seeds removed', 'tomatoes'],
  ]) {
    const ingredient = parseIngredientLine(raw)
    assert.equal(ingredient.name, name, raw)
    assert.equal(ingredient.rawText, raw)
  }
})

test('legacy saved names are cleaned for aisle selection while item IDs and cleared state stay stable', () => {
  const recipe = { id: 'legacy', name: 'Old sprouts copy', servings: 2, parsedIngredients: [
    { name: 'Brussels sprouts, quartered', quantity: '150', unit: 'g', rawText: '150g Brussels sprouts, quartered' },
    { name: 'salad onions, whites and greens separated, both', quantity: '2', unit: '', rawText: '2 salad onions, whites and greens separated, both finely sliced' },
  ] }
  const plan = [{ id: 'legacy-plan', recipeId: recipe.id, plannedServings: 2 }]
  const items = rows(generateShoppingGroups(plan, [recipe], [], []))
  assert.deepEqual(items.map((item) => [item.name, item.category]), [['Brussels sprouts', 'Fresh Produce'], ['salad onions', 'Fresh Produce']])
  assert.equal(items[0].id, 'legacy-plan-0-150g Brussels sprouts, quartered')
  const remaining = rows(generateShoppingGroups(plan, [recipe], items[0].sourceIds, []))
  assert.deepEqual(remaining.map((item) => item.name), ['salad onions'])
})

test('Shopping retains source evidence for chopped/tinned tomatoes without reclassifying freshly chopped produce', () => {
  for (const [raw, category] of [
    ['400g chopped tomatoes', 'Pantry / Tins / Dry Goods'],
    ['400g can chopped tomatoes', 'Pantry / Tins / Dry Goods'],
    ['400g tinned tomatoes', 'Pantry / Tins / Dry Goods'],
    ['2 fresh tomatoes, chopped', 'Fresh Produce'],
  ]) {
    const recipe = { id: 'tomatoes', name: 'Tomato bowl', servings: 2, parsedIngredients: parseIngredients(raw) }
    const items = plannedRows(recipe)
    assert.equal(items.length, 1)
    assert.equal(items[0].category, category, raw)
    assert.equal(items[0].rawText, raw)
  }
})
