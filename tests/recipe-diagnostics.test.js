import test from 'node:test'
import assert from 'node:assert/strict'
import { parsePastedRecipe } from '../src/utils/recipeImport.js'

test('optional diagnostics explain uncertain method tails without changing the normal result', () => {
  const text = 'Onion bowl\nIngredients\n2 onions\nMethod\nFry the onions.\n\nA world of possibilities.'
  const normal = parsePastedRecipe(text)
  const { diagnostics, ...diagnosed } = parsePastedRecipe(text, { includeDiagnostics: true })
  assert.deepEqual(diagnosed, normal)
  assert.equal(diagnostics.fields.ingredients, 'section')
  assert.equal(diagnostics.fields.servings, 'missing-or-ambiguous')
  assert.equal(diagnostics.fields.method, 'review')
  assert.equal(diagnostics.method.stoppedBy, 'uncertain-tail')
  assert.equal(diagnostics.method.discarded[0].text, 'A world of possibilities.')
})

test('domain shift produces an AFTER_RECIPE transition instead of importing retail text', () => {
  const result = parsePastedRecipe('Ingredients\n2 onions\nMethod\nFry the onions.\nNew collection\nDesk £90\nClock £20', { includeDiagnostics: true })
  assert.equal(result.method, 'Fry the onions.')
  assert.equal(result.diagnostics.method.state, 'AFTER_RECIPE')
  assert.equal(result.diagnostics.method.stoppedBy, 'domain-shift')
  assert.ok(result.diagnostics.method.discarded.some((block) => block.reason === 'product'))
})
