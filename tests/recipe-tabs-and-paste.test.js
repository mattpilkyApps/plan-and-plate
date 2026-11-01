import test from 'node:test'
import assert from 'node:assert/strict'
import { parsePastedRecipe } from '../src/utils/recipeImport.js'
import { parseIngredients } from '../src/utils/ingredientParser.js'
import { getRecipePasteSeparator } from '../src/utils/recipePaste.js'
import { sproutsPaste, sproutsIngredientsPaste, sproutsMethodPaste, sproutsMethodFirstPaste, sproutsIngredients } from './fixtures/recipe-corpus/two-tab-layouts.js'

test('the owner clipboard fragments produce the same complete recipe in either paste order', () => {
  const expected = parsePastedRecipe(sproutsPaste)
  for (const [first, second] of [
    [sproutsIngredientsPaste, sproutsMethodPaste],
    [sproutsMethodPaste, sproutsIngredientsPaste],
    ['Method\n' + sproutsMethodPaste, sproutsIngredientsPaste],
  ]) {
    const separator = getRecipePasteSeparator(first, second, first.length, first.length)
    assert.equal(separator, '\n\n')
    const result = parsePastedRecipe(first + separator + second)
    assert.deepEqual(result, expected)
    assert.deepEqual(parseIngredients(result.ingredients).map((item) => item.rawText), sproutsIngredients)
  }
  assert.deepEqual(parsePastedRecipe(sproutsMethodFirstPaste), expected)
})

test('method-first clipboard pastes retain supplied newlines and respect selected replacements', () => {
  for (const [first, second] of [
    [sproutsMethodPaste + '\n', sproutsIngredientsPaste],
    [sproutsMethodPaste, '\n' + sproutsIngredientsPaste],
  ]) {
    assert.equal(getRecipePasteSeparator(first, second, first.length, first.length), '')
    assert.deepEqual(parsePastedRecipe(first + second), parsePastedRecipe(sproutsPaste))
  }
  for (const [start, end] of [[0, sproutsMethodPaste.length], [10, 10], [10, sproutsMethodPaste.length]]) {
    assert.equal(getRecipePasteSeparator(sproutsMethodPaste, sproutsIngredientsPaste, start, end), '')
  }
})

test('a standalone method fragment retains its three steps and tip without inventing ingredients or metadata', () => {
  const result = parsePastedRecipe(sproutsMethodPaste, { includeDiagnostics: true })
  assert.equal(result.name, '')
  assert.equal(result.ingredients, '')
  assert.equal(result.servings, '')
  assert.equal(result.prepTime, '')
  assert.equal(result.cookTime, '')
  assert.equal(result.method.split('\n\n').length, 3)
  assert.equal(result.notes, parsePastedRecipe(sproutsPaste).notes)
  assert.equal(result.diagnostics.fields.ingredients, 'missing')
})

test('a cooking-word recipe title is retained rather than reordered as a method', () => {
  const title = 'Roast chicken with onions and potatoes for Sunday dinner'
  const result = parsePastedRecipe(title + '\nServes 4\nIngredients\n1 chicken\n2 onions\nMethod\nRoast in the oven until cooked.')
  assert.equal(result.name, title)
  assert.equal(result.ingredients, '1 chicken\n2 onions')
  assert.equal(result.method, 'Roast in the oven until cooked.')
})

test('reverse section detection does not cross a retail grid into another ingredient list', () => {
  const result = parsePastedRecipe('Bean pot\nMethod\nHeat the beans in a pan.\nDesk lamp £45\nIngredients\n5 unrelated products')
  assert.equal(result.ingredients, '')
  assert.equal(result.method, 'Heat the beans in a pan.')
  assert.doesNotMatch(result.method, /lamp|unrelated/)
})

test('the two-tab owner copy retains all 11 ingredient lines through saving and infers three method paragraphs', () => {
  const result = parsePastedRecipe(sproutsPaste, { includeDiagnostics: true })
  assert.equal(result.diagnostics.method.start, 'inferred')
  assert.equal(result.diagnostics.fields.method, 'inferred')
  assert.equal(result.method.split('\n\n').length, 3)
  const saved = parseIngredients(result.ingredients)
  assert.equal(saved.length, 11)
  assert.deepEqual(saved.map((item) => item.rawText), sproutsIngredients)
  assert.equal(saved[1].quantity, '2.5')
  assert.ok(result.notes.startsWith('If you don’t have leftover rice'))
  assert.doesNotMatch(result.method, /Cook’s tip|If you don’t have leftover rice/)
})

test('a second clipboard paste gets a boundary when neither fragment supplies a newline', () => {
  const end = sproutsIngredientsPaste.length
  const separator = getRecipePasteSeparator(sproutsIngredientsPaste, sproutsMethodPaste, end, end)
  assert.equal(separator, '\n\n')
  assert.equal(sproutsIngredientsPaste + separator + sproutsMethodPaste, sproutsPaste)
  assert.deepEqual(parsePastedRecipe(sproutsIngredientsPaste + separator + sproutsMethodPaste), parsePastedRecipe(sproutsPaste))
})

test('normal clipboard line breaks are retained without adding more', () => {
  for (const [before, incoming] of [
    [sproutsIngredientsPaste + '\n', sproutsMethodPaste],
    [sproutsIngredientsPaste, '\n' + sproutsMethodPaste],
  ]) {
    assert.equal(getRecipePasteSeparator(before, incoming, before.length, before.length), '')
    const result = parsePastedRecipe(before + incoming)
    assert.equal(result.ingredients.split('\n').length, 11)
    assert.equal(result.method.split('\n\n').length, 3)
  }
})

test('clipboard assembly respects selected replacement and mid-text editing', () => {
  const size = sproutsIngredientsPaste.length
  for (const [start, end] of [[0, size], [10, 10], [10, size]]) {
    assert.equal(getRecipePasteSeparator(sproutsIngredientsPaste, sproutsMethodPaste, start, end), '')
  }
})

test('pasting another ingredient or preparation phrase keeps ordinary inline editing', () => {
  const size = sproutsIngredientsPaste.length
  for (const incoming of ['1 tsp salt', 'finely chopped', 'roast potatoes']) {
    assert.equal(getRecipePasteSeparator(sproutsIngredientsPaste, incoming, size, size), '')
  }
})

test('the first tab alone preserves ingredients and requests review of the missing method', () => {
  const result = parsePastedRecipe(sproutsIngredientsPaste, { includeDiagnostics: true })
  assert.deepEqual(result.ingredients.split('\n'), sproutsIngredients)
  assert.equal(result.method, '')
  assert.equal(result.diagnostics.method.reviewNeeded, true)
})

test('the second clipboard fragment may also start with an explicit Method heading', () => {
  const incoming = 'Method\n' + sproutsMethodPaste
  const size = sproutsIngredientsPaste.length
  const separator = getRecipePasteSeparator(sproutsIngredientsPaste, incoming, size, size)
  assert.equal(separator, '\n\n')
  assert.equal(parsePastedRecipe(sproutsIngredientsPaste + separator + incoming).method.split('\n\n').length, 3)
})

test('an inferred wrapped paragraph stays together and stops before retail content', () => {
  const result = parsePastedRecipe('Rice bowl\nIngredients\n200g rice\nHeat a pan and\nadd the rice.\n\nServe.\nAdvertisement\nLamp £50')
  assert.equal(result.ingredients, '200g rice')
  assert.equal(result.method, 'Heat a pan and add the rice.\n\nServe.')
})

test('prepared food names beginning cooked remain valid saved ingredients', () => {
  for (const [raw, quantity, unit, name] of [
    ['4 cooked pigs in blankets, finely sliced', '4', '', 'cooked pigs in blankets'],
    ['200g cooked rice', '200', 'g', 'cooked rice'],
    ['200g rice, cooked', '200', 'g', 'rice'],
  ]) {
    const result = parseIngredients(raw)
    assert.equal(result.length, 1, raw)
    assert.deepEqual([result[0].quantity, result[0].unit, result[0].name], [quantity, unit, name])
    assert.equal(result[0].rawText, raw)
  }
})
