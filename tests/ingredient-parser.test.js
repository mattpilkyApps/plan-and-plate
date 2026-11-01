import test from 'node:test'
import assert from 'node:assert/strict'
import { parseIngredientLine, parseIngredients } from '../src/utils/ingredientParser.js'
import { generateShoppingGroups } from '../src/utils/shoppingList.js'

test('quantities, whole unit tokens and metric preference survive the full ingredient-list path', () => {
  const cases = [
    ['2 garlic cloves', '2', 'cloves', 'garlic'],
    ['12 lasagne sheets', '12', '', 'lasagne sheets'],
    ['2 level tbsp plain flour', '2', 'tbsp', 'plain flour'],
    ['2 x 400g tins chopped tomatoes', '800', 'g', 'tomatoes'],
    ['2 × 400g tins chopped tomatoes', '800', 'g', 'tomatoes'],
    ['750ml/1¼ pints hot milk', '750', 'ml', 'hot milk'],
    ['1/2 tsp cumin', '0.5', 'tsp', 'cumin'],
    ['1 1/2 tbsp oil', '1.5', 'tbsp', 'oil'],
    ['¼ tsp salt', '0.25', 'tsp', 'salt'],
    ['½ tsp salt', '0.5', 'tsp', 'salt'],
    ['¾ tsp salt', '0.75', 'tsp', 'salt'],
    ['1½ tbsp oil', '1.5', 'tbsp', 'oil'],
    ['2 oz butter', '2', 'oz', 'butter'],
    ['1 lb beef', '1', 'lb', 'beef'],
    ['2 lbs potatoes', '2', 'lbs', 'potatoes'],
    ['250ml stock', '250', 'ml', 'stock'],
    ['1 l water', '1', 'l', 'water'],
    ['250g rice', '250', 'g', 'rice'],
    ['1 kg flour', '1', 'kg', 'flour'],
    ['1 pinch of salt', '1', 'pinch', 'salt'],
    ['2 pinches salt', '2', 'pinches', 'salt'],
    ['pinch of salt', '1', 'pinch', 'salt'],
    ['large handful mint leaves', '1', 'handful', 'mint leaves'],
  ]
  assert.equal(parseIngredients(cases.map(([raw]) => raw).join('\n')).length, cases.length)
  for (const [raw, quantity, unit, name] of cases) {
    for (const ingredient of [parseIngredientLine(raw), ...parseIngredients(raw)]) {
      assert.deepEqual([ingredient.quantity, ingredient.unit, ingredient.name], [quantity, unit, name], raw)
      assert.equal(ingredient.rawText, raw)
    }
  }
})

test('preparation notes and count units leave a stable shopping identity with original wording retained', () => {
  const cases = [
    ['2 garlic cloves, crushed', '2', 'cloves', 'garlic', 'crushed'],
    ['2 onions, finely chopped', '2', '', 'onions', 'finely chopped'],
    ['2 tbsp roughly chopped parsley', '2', 'tbsp', 'parsley', 'roughly chopped'],
    ['100g grated cheddar', '100', 'g', 'cheddar', 'grated'],
    ['3 large stalks lemongrass, bashed with the back of a knife', '3', 'stalks', 'lemongrass', 'bashed with the back of a knife'],
    ['400g chickpeas, drained and rinsed', '400', 'g', 'chickpeas', 'drained and rinsed'],
  ]
  for (const [raw, quantity, unit, name, qualifier] of cases) {
    const ingredient = parseIngredientLine(raw)
    assert.deepEqual([ingredient.quantity, ingredient.unit, ingredient.name], [quantity, unit, name], raw)
    assert.equal(ingredient.rawText, raw)
    assert.ok(ingredient.qualifiers.includes(qualifier), raw)
  }
})

test('alternatives, parenthetical amounts and extra quantities never create phantom shopping ingredients', () => {
  const cases = [
    ['1 piece pumpkin or a small squash (about 1kg)', '1', 'piece', 'pumpkin'],
    ['1 onion or 2 shallots', '1', '', 'onion'],
    ['3 tbsp Thai yellow curry paste or vegetarian alternative', '3', 'tbsp', 'Thai yellow curry paste'],
    ['2 x 400g tins chopped tomatoes or 800g fresh tomatoes', '800', 'g', 'tomatoes'],
    ['½ tsp salt, plus 1 tsp to taste', '0.5', 'tsp', 'salt'],
    ['200g carrots, cut into 2 cm pieces', '200', 'g', 'carrots'],
    ['200g flour (plus 2 tbsp for dusting)', '200', 'g', 'flour'],
  ]
  for (const [raw, quantity, unit, name] of cases) {
    const ingredients = parseIngredients(raw)
    assert.equal(ingredients.length, 1, raw)
    assert.deepEqual([ingredients[0].quantity, ingredients[0].unit, ingredients[0].name], [quantity, unit, name], raw)
    assert.equal(ingredients[0].rawText, raw)
    assert.ok(ingredients[0].qualifiers.length, raw)
  }
})

test('shopping scales and merges prepared garlic and pinch variants while retaining each source', () => {
  const recipes = [
    { id: 'r1', name: 'Sauce', servings: 2, ingredients: '2 garlic cloves, crushed\n1 pinch salt' },
    { id: 'r2', name: 'Stew', servings: 2, ingredients: '2 garlic cloves\n2 pinches salt' },
  ]
  const meals = recipes.map((recipe, i) => ({ id: 'meal' + i, recipeId: recipe.id, plannedServings: 4 }))
  const items = generateShoppingGroups(meals, recipes, [], []).flatMap((group) => group.items)
  assert.equal(items.length, 2)
  assert.equal(items.find((item) => item.name === 'garlic').quantity, '8 cloves')
  assert.equal(items.find((item) => item.name === 'salt').quantity, '6 pinches')
  assert.ok(items.every((item) => item.sourceIds.length === 2))
})

test('count measures scale as counts without inventing a weight', () => {
  const recipe = {
    id: 'counts', name: 'Herby vegetables', servings: 2,
    ingredients: '1 piece pumpkin\n1 stalk lemongrass\n1 sprig rosemary\nlarge handful mint leaves',
  }
  const items = generateShoppingGroups(
    [{ id: 'meal', recipeId: recipe.id, plannedServings: 4 }], [recipe], [], [],
  ).flatMap((group) => group.items)
  assert.equal(items.length, 4)
  assert.deepEqual(items.map((item) => item.quantity).sort(), ['2 handfuls', '2 pieces', '2 sprigs', '2 stalks'])
})
