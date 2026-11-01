import test from 'node:test'
import assert from 'node:assert/strict'
import { recipeCorpus } from './fixtures/recipe-corpus/cases.js'
import { evaluateCase } from './helpers/recipe-corpus.js'

for (const entry of recipeCorpus) {
  test('recipe corpus: ' + entry.id, { todo: entry.knownFailure ? entry.reason : false }, () => {
    const result = evaluateCase(entry)
    assert.ok(result.passed, JSON.stringify(result, null, 2))
  })
}
