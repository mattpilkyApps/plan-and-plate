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

test('numbered instructions need no compulsory cooking verb but can be marked for review', () => {
  const result = parsePastedRecipe('Ingredients\n1 onion\nMethod\n1. Patience is the only trick.', { includeDiagnostics: true })
  assert.equal(result.method, 'Patience is the only trick.')
  assert.equal(result.diagnostics.method.reviewNeeded, true)
})

test('a repeated retail grid ends a method even when marketing later borrows a cooking verb', () => {
  const result = parsePastedRecipe('Ingredients\n1 onion\nMethod\nFry the onion.\nAdvertisement\nLamp £30\nDesk £60\nHeat up your style.')
  assert.equal(result.method, 'Fry the onion.')
})

test('explicit servings take priority over loaf yield, without guessing written ranges', () => {
  const result = parsePastedRecipe('Oat loaf\nYield: 1 loaf\nServings: 8\nTotal: 1 hr\nIngredients\n1 cup oats\nMethod\nBake until golden.')
  assert.equal(result.servings, '8')
  assert.equal(result.totalTime, '1 hr')
})

test('ingredient subsection metadata is optional and never stored as a shopping item', () => {
  const result = parsePastedRecipe('Ingredients\nFor the sauce\n1 onion\nTo serve:\n2 slices bread\nMethod\nFry the onion and serve with bread.', { includeDiagnostics: true })
  assert.deepEqual(result.diagnostics.ingredientSections, [{ name: 'For the sauce', startIndex: 0 }, { name: 'To serve', startIndex: 1 }])
  assert.equal(result.ingredients, '1 onion\n2 slices bread')
})
