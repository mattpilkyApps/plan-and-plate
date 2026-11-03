import test from 'node:test'
import assert from 'node:assert/strict'
import { createIssue, exportIssue, createRegressionFixture } from '../src/domain/lab/issues.js'
import { createRecipeCard, approveRecipeCard } from '../src/domain/recipe/card.js'
import { readLabState, writeLabState, LAB_STORAGE_KEY } from '../src/lab/storage.js'

const card = createRecipeCard(['Private family beans\nServes 2\nIngredients\n1 tin beans\nMethod\nHeat the beans.'])
test('Lab issue defaults omit recipe-bearing text, device and attachments', () => {
  const issue = createIssue({ card, commit: 'abc123', failedAssertions: [{ field: 'ingredients', expected: 'Private family beans' }] }, { happened: 'Wrong amount', device: 'private-device', attachments: [{ dataUrl: 'private-screenshot' }] })
  const output = JSON.stringify(exportIssue(issue))
  assert.doesNotMatch(output, /Private family|private-device|private-screenshot/)
  assert.match(output, /Wrong amount/)
  const full = exportIssue(issue, { includeRecipe: true, includeDevice: true, includeEvidence: true })
  assert.equal(full.snapshot.card.title, card.title)
  assert.equal(full.details.device, 'private-device')
  assert.equal(full.details.attachments[0].dataUrl, 'private-screenshot')
  assert.equal(issue.snapshot.card.title, card.title)
})

test('Lab reviewed fixtures lock actual expected fields; unreviewed drafts cannot be goldens', () => {
  assert.throws(() => createRegressionFixture(card, 'local-test'), /Approve/)
  const fixture = createRegressionFixture(approveRecipeCard(card), 'local-test')
  assert.equal(fixture.expected.name, card.title)
  assert.deepEqual(fixture.canonicalExpected.steps, ['Heat the beans.'])
})

test('Lab storage writes one isolated versioned key and reports unavailable storage', () => {
  const map = new Map([['plan-and-plate-recipes', 'real-user-data']])
  const storage = { getItem: (key) => map.get(key), setItem: (key, value) => map.set(key, value) }
  assert.equal(writeLabState({ card }, storage), true)
  assert.equal(readLabState(storage).card.title, card.title)
  assert.equal(map.get('plan-and-plate-recipes'), 'real-user-data')
  assert.equal(map.size, 2)
  map.set(LAB_STORAGE_KEY, '{invalid')
  assert.equal(readLabState(storage), null)
  assert.equal(writeLabState({}, { setItem() { throw new Error('quota') } }), false)
})
