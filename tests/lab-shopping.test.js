import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createRecipeCard,
  approveRecipeCard,
  reviseRecipeCard,
  toLegacyRecipe,
  allIngredients,
} from '../src/domain/recipe/card.js'
import { generateCanonicalShopping } from '../src/domain/shopping/adapter.js'
import { shoppingScenarios } from '../src/domain/lab/scenarios.js'
import { evidenceText } from '../src/domain/recipe/source.js'
import { generateShoppingGroups } from '../src/utils/shoppingList.js'
import { recipeCorpus } from './fixtures/recipe-corpus/cases.js'

const recipe = (id) =>
  approveRecipeCard(
    createRecipeCard([recipeCorpus.find((entry) => entry.id === id).raw]),
  )
const rows = (result) => result.allGroups.flatMap((group) => group.items)

for (const id of [
  'owner-curry-plain',
  'owner-paneer-phone',
  'owner-sprouts-two-tab-phone',
]) {
  test(
    'Canonical Shopping matches production at scaled servings: ' + id,
    () => {
      const card = recipe(id)
      const servings = card.servings.value * 1.5
      const actual = generateCanonicalShopping([
        { card, plannedServings: servings, id: 'meal' },
      ])
      const expected = generateShoppingGroups(
        [{ id: 'meal', recipeId: card.id, plannedServings: servings }],
        [toLegacyRecipe(card)],
        [],
      )
      assert.deepEqual(
        actual.allGroups.map((group) => ({
          ...group,
          items: group.items.map(({ trace, atHome, ...item }) => {
            assert.equal(atHome, false)
            assert.ok(trace.length)
            return item
          }),
        })),
        expected,
      )
      assert.equal(
        rows(actual).reduce((sum, item) => sum + item.trace.length, 0),
        allIngredients(card).length,
      )
    },
  )
}

test('Canonical Shopping merges two recipe garlic contributions and retains both original notes', () => {
  const paneer = recipe('owner-paneer-phone')
  const sprouts = recipe('owner-sprouts-two-tab-phone')
  const result = generateCanonicalShopping(
    [
      { card: paneer, plannedServings: 6 },
      { card: sprouts, plannedServings: 2 },
    ],
    {
      manualItems: [
        { id: 'manual', name: 'Toilet rolls', quantity: '2', unit: 'packs' },
      ],
    },
  )
  const garlic = rows(result).find((item) => item.name === 'garlic')
  assert.equal(garlic.quantity, '7 cloves')
  assert.equal(garlic.trace.length, 2)
  assert.equal(
    result.allGroups.find((group) => group.name === 'Toiletries').items[0]
      .isManual,
    true,
  )
  assert.ok(rows(result).some((item) => /rice and coriander/.test(item.name)))
})

test('Canonical Shopping incompatible units retain separate stated quantities and evidence', () => {
  const card = approveRecipeCard(
    createRecipeCard([
      'Flour mix\nServes 2\nIngredients\n100g flour\n2 tbsp flour\nMethod\nMix in a bowl.',
    ]),
  )
  const flour = rows(generateCanonicalShopping([{ card }])).find(
    (item) => item.name === 'flour',
  )
  assert.equal(flour.quantity, '100 g + 2 tbsp')
  assert.equal(flour.trace.length, 2)
})

test('Ingredient preference prose keeps its source and does not become a product or substitution', () => {
  const { raw } = shoppingScenarios.find(
    (entry) => entry.id === 'shopping-ingredient-preferences',
  )
  const card = createRecipeCard([raw])
  const byName = Object.fromEntries(
    allIngredients(card).map((ingredient) => [ingredient.productName, ingredient]),
  )
  assert.equal(card.sourceFragments[0].rawText, raw)
  assert.deepEqual(card.notes, [
    'I prefer to simmer this slowly.',
    'Use whichever you prefer.',
  ])
  assert.deepEqual(
    card.steps.map((step) => step.instruction),
    ['Simmer the coconut milk and peppers for 10 minutes.'],
  )
  assert.deepEqual(byName['coconut milk'].alternatives, [])
  assert.ok(byName['coconut milk'].preparation.includes('I prefer full-fat or light'))
  assert.deepEqual(byName['olive oil'].alternatives, ['or vegetable oil'])
  assert.ok(byName['olive oil'].preparation.includes('I prefer extra virgin'))
  assert.ok(byName.peppers.preparation.includes('deseeded if you prefer less heat'))
  const milk = rows(generateCanonicalShopping([{ card: approveRecipeCard(card) }]))
    .find((item) => item.name === 'coconut milk')
  assert.equal(milk.trace.length, 1)
  assert.match(
    evidenceText(milk.trace[0].sourceRefs[0], card.sourceFragments),
    /400ml coconut milk\nI prefer full-fat or light/,
  )
})

test('Canonical Shopping already-got simulation is recoverable, optional exclusion remains explicit', () => {
  const card = approveRecipeCard(
    createRecipeCard([
      'Salad\nServes 2\nIngredients\n2 tomatoes\n1 lime (optional)\nMethod\nMix in a bowl.',
    ]),
  )
  const first = generateCanonicalShopping([{ card }])
  const tomato = rows(first).find((item) => item.name === 'tomatoes')
  const next = generateCanonicalShopping([{ card }], {
    atHomeSourceIds: tomato.sourceIds,
    includeOptional: false,
  })
  assert.equal(next.atHome[0].items[0].name, 'tomatoes')
  assert.equal(next.groups.length, 0)
  assert.equal(next.excluded.length, 1)
  assert.equal(rows(first).length, 2)
})

test('Canonical Shopping respects corrected unknown amounts without reparsing original text', () => {
  const original = recipe('owner-curry-plain')
  const first = allIngredients(original)[0]
  const corrected = approveRecipeCard(
    reviseRecipeCard(
      original,
      {
        ingredientGroups: original.ingredientGroups.map((group) => ({
          ...group,
          items: group.items.map((item) =>
            item.ingredientId === first.ingredientId
              ? {
                  ...item,
                  productName: 'olive oil',
                  quantity: { value: null, raw: '', unit: null },
                  parseStatus: 'user',
                }
              : item,
          ),
        })),
      },
      'Tester chose unknown olive-oil amount',
    ),
  )
  const item = rows(generateCanonicalShopping([{ card: corrected }])).find(
    (row) => row.name === 'olive oil',
  )
  assert.equal(item.quantity, '')
  assert.equal(item.trace[0].originalRawLine, first.rawLine)
})

test('Canonical Shopping rejects invalid serving quantities and unapproved cards', () => {
  const card = recipe('owner-curry-plain')
  assert.throws(
    () => generateCanonicalShopping([{ card, plannedServings: -2 }]),
    /positive/,
  )
  assert.throws(
    () =>
      generateCanonicalShopping([
        { card: { ...card, recipeCardStatus: 'DRAFT' } },
      ]),
    /Approve/,
  )
})
