import test from 'node:test'
import assert from 'node:assert/strict'
import { parsePastedRecipe } from '../src/utils/recipeImport.js'
import { parseIngredients } from '../src/utils/ingredientParser.js'
import { phoneFollowupCases, paneerIngredients } from './fixtures/recipe-corpus/phone-followup.js'

test('the exact phone paste keeps preparation wording through the saved ingredient path', () => {
  const recipe = parsePastedRecipe(phoneFollowupCases[0].raw, { includeDiagnostics: true })
  const parsed = parseIngredients(recipe.ingredients)
  assert.equal(parsed.length, 16)
  assert.deepEqual(parsed.map((item) => item.rawText), paneerIngredients)
  for (const [name, quantity, unit, qualifier] of [
    ['ginger', '10', 'g', 'or 1 tsp ginger paste'],
    ['red chilli', '1', '', 'deseeded if you prefer less heat, finely chopped'],
    ['paneer', '200', 'g', 'cut into 1cm cubes'],
    ['vegetable stock', '120', 'ml', 'made with 1 stock cube'],
    ['lemon', '0.5', '', 'juiced'],
  ]) {
    const item = parsed.find((ingredient) => ingredient.name === name)
    assert.ok(item, name)
    assert.equal(item.quantity, quantity)
    assert.equal(item.unit, unit)
    assert.ok(item.qualifiers.includes(qualifier), JSON.stringify(item))
  }
  assert.deepEqual(recipe.diagnostics.ingredientSections, [{ name: 'To serve', startIndex: 15 }])
})

test('a recipe tip cannot rescue a promoted article with cooking language after its attribution', () => {
  const result = parsePastedRecipe('Ingredients\n1 onion\nMethod\nFry the onion.\nRecipe tip\nReheat the onion in a pan.\nRecipe from A Test Kitchen\nHeat up your shopping experience.')
  assert.equal(result.method, 'Fry the onion.')
  assert.equal(result.notes, 'Reheat the onion in a pan.')
})

test('unrecognised recipe-note prose requests source review instead of silently importing it', () => {
  const result = parsePastedRecipe('Ingredients\n1 onion\nMethod\nFry the onion.\nRecipe tip\nAn unexpected sentence.', { includeDiagnostics: true })
  assert.equal(result.method, 'Fry the onion.')
  assert.equal(result.notes, undefined)
  assert.equal(result.diagnostics.method.reviewNeeded, true)
})
