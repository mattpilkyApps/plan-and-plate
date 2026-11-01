import test from 'node:test'
import assert from 'node:assert/strict'
import { parseIngredientLine, parseIngredients } from '../src/utils/ingredientParser.js'
import { generateShoppingGroups } from '../src/utils/shoppingList.js'

const cases = [
  ['1 onion', '1', '', 'onion'],
  ['1.5 cups flour', '1.5', 'cups', 'flour'],
  ['about 500g potatoes', '500', 'g', 'potatoes'],
  ['approximately 250 ml stock', '250', 'ml', 'stock'],
  ['500–600g potatoes', '500-600', 'g', 'potatoes'],
  ['500 — 600 g potatoes', '500-600', 'g', 'potatoes'],
  ['1 to 2 tablespoons lemon juice', '1-2', 'tbsp', 'lemon juice'],
  ['½–¾ cup milk', '0.5-0.75', 'cup', 'milk'],
  ['2 x 400 g tins tomatoes', '800', 'g', 'tomatoes'],
  ['2 × 400 g cans chickpeas, drained and rinsed', '800', 'g', 'chickpeas'],
  ['2 x 1.5 litre bottles water', '3', 'l', 'bottles water'],
  ['2 (400g) cans tomatoes', '800', 'g', 'tomatoes'],
  ['1 (400g) can beans, drained', '400', 'g', 'beans'],
  ['2 cans (400g each) tomatoes', '2', 'cans', 'tomatoes'],
  ['2 cups / 400g lentils', '400', 'g', 'lentils'],
  ['8 oz/225g butter', '225', 'g', 'butter'],
  ['1/2 cup (8 Tbsp; 113g) butter, softened', '113', 'g', 'butter'],
  ['1 and 1/2 cups (190g) flour', '190', 'g', 'flour'],
  ['optional: 1/4 cup nuts or 1/3 cup chocolate chips', '0.25', 'cup', 'nuts'],
  ['1 Tbsp. olive oil', '1', 'tbsp', 'olive oil'],
  ['1 teaspoon salt', '1', 'tsp', 'salt'],
  ['2 tablespoons sugar', '2', 'tbsp', 'sugar'],
  ['3 ounces cheese', '3', 'oz', 'cheese'],
  ['2 pounds potatoes', '2', 'lbs', 'potatoes'],
  ['1 bunch coriander', '1', 'bunch', 'coriander'],
  ['2 bunches parsley', '2', 'bunches', 'parsley'],
  ['1 packet pastry', '1', 'packet', 'pastry'],
  ['2 packets noodles', '2', 'packets', 'noodles'],
  ['2 slices bread', '2', 'slices', 'bread'],
  ['1 slice cheese', '1', 'slice', 'cheese'],
  ['2 handfuls spinach', '2', 'handfuls', 'spinach'],
  ['2 stalks celery', '2', 'stalks', 'celery'],
  ['3 sprigs thyme', '3', 'sprigs', 'thyme'],
  ['2 pieces ginger', '2', 'pieces', 'ginger'],
  ['1 tin beans', '1', 'tin', 'beans'],
  ['2 cans beans', '2', 'cans', 'beans'],
  ['2 garlic cloves, crushed', '2', 'cloves', 'garlic'],
  ['12 lasagne sheets', '12', '', 'lasagne sheets'],
  ['200g potatoes, peeled and cubed', '200', 'g', 'potatoes'],
  ['2 eggs, beaten', '2', '', 'eggs'],
  ['200g cheese, grated, plus extra to serve', '200', 'g', 'cheese'],
  ['1 onion or 2 shallots (optional)', '1', '', 'onion'],
  ['¼ tsp cumin', '0.25', 'tsp', 'cumin'],
  ['½ tsp cumin', '0.5', 'tsp', 'cumin'],
  ['¾ tsp cumin', '0.75', 'tsp', 'cumin'],
  ['⅓ cup milk', String(1 / 3), 'cup', 'milk'],
  ['1½ cups oats', '1.5', 'cups', 'oats'],
  ['1 1/2 tsp pepper', '1.5', 'tsp', 'pepper'],
  ['1/2 tsp pepper', '0.5', 'tsp', 'pepper'],
  ['2 pinches salt', '2', 'pinches', 'salt'],
  ['1 kg flour', '1', 'kg', 'flour'],
  ['250ml milk', '250', 'ml', 'milk'],
  ['1 l water', '1', 'l', 'water'],
]

for (const [raw, quantity, unit, name] of cases) {
  test('ingredient torture: ' + raw, () => {
    const parsed = parseIngredients(raw)
    assert.equal(parsed.length, 1, 'must not create phantom ingredients')
    assert.deepEqual(parsed[0], parseIngredientLine(raw))
    assert.deepEqual([parsed[0].quantity, parsed[0].unit, parsed[0].name], [quantity, unit, name])
    assert.equal(parsed[0].rawText, raw)
  })
}

test('only top-level semicolons split ingredient items', () => {
  const result = parseIngredients('1/2 cup (8 Tbsp; 113g) butter; 200g flour\n1 egg')
  assert.equal(result.length, 3)
  assert.equal(result[0].name, 'butter')
  assert.equal(result[0].quantity, '113')
})

test('section labels and incomplete amounts never become shopping ingredients', () => {
  for (const raw of ['For the sauce', 'For the filling:', 'For the pastry', 'For the marinade', 'To serve:', '1', '200g', '2 tbsp']) {
    assert.equal(parseIngredientLine(raw), null, raw)
  }
})

test('approximate amounts, optional flags and explicit metric equivalents keep readable qualifiers', () => {
  for (const [raw, qualifier] of [
    ['about 500g potatoes', 'about'],
    ['optional: ¼ cup nuts', 'optional'],
    ['½ cup (113g) butter, softened', '113g'],
    ['200g carrots, peeled and cubed', 'peeled and cubed'],
  ]) {
    assert.ok(parseIngredientLine(raw).qualifiers.includes(qualifier), raw)
  }
})

test('new count units scale in shopping while ranges keep their original evidence', () => {
  const recipe = { id: 'r', name: 'Test', servings: 2, ingredients: '1 bunch parsley\n1 packet noodles\n1 slice bread\n500–600g potatoes' }
  const items = generateShoppingGroups([{ id: 'm', recipeId: 'r', plannedServings: 4 }], [recipe], [], []).flatMap((group) => group.items)
  assert.equal(items.length, 4)
  assert.deepEqual(items.filter((item) => item.name !== 'potatoes').map((item) => item.quantity).sort(), ['2 bunches', '2 packets', '2 slices'])
  const potatoes = items.find((item) => item.name === 'potatoes')
  assert.equal(potatoes.quantity, '')
  assert.ok(JSON.stringify(potatoes).includes('500–600g potatoes'))
})
