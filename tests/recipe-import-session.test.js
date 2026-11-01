import test from 'node:test'
import assert from 'node:assert/strict'
import { assembleRecipeFragments, fillRecipeFromImport } from '../src/utils/recipeImportSession.js'
import { createRecipePasteInput, updateRecipePasteInput, getRecipePasteParts } from '../src/utils/recipePaste.js'
import { parseIngredients } from '../src/utils/ingredientParser.js'
import { evaluateCase } from './helpers/recipe-corpus.js'
import { recipeImportWorkflows, fullIngredientsTab, fullMethodTab } from './fixtures/recipe-import-workflows.js'

function insert(input, text, start = input.text.length, end = start, observedPaste = true) {
  const value = input.text.slice(0, start) + text + input.text.slice(end)
  const next = updateRecipePasteInput(input, value, observedPaste ? { start, end, text } : undefined)
  assert.equal(next.text, value, 'Native textarea bytes must not be transformed')
  assert.equal(next.spans.map((span) => next.text.slice(span.start, span.end)).join(''), value)
  return next
}

for (const entry of recipeImportWorkflows) {
  test('import workflow: ' + entry.id, () => {
    for (const mode of ['append', 'prepend', 'middle']) {
      for (const observedPaste of [true, false]) {
        let input = createRecipePasteInput()
        for (const clip of entry.clips) {
          const position = mode === 'append' ? input.text.length : mode === 'prepend' ? 0 : Math.floor(input.text.length / 2)
          input = insert(input, clip, position, position, observedPaste)
        }
        const result = assembleRecipeFragments(getRecipePasteParts(input), { includeDiagnostics: true })
        const evaluated = evaluateCase(entry, () => result)
        assert.equal(evaluated.passed, true, JSON.stringify({ id: entry.id, mode, observedPaste, checks: evaluated.checks, actual: evaluated.actual }))
        if (entry.expected.ingredients) assert.deepEqual(parseIngredients(result.ingredients).map((item) => item.rawText), entry.expected.ingredients)
      }
    }
  })
}

test('manual corrections stay in their source section and survive draft/save round trips', () => {
  let input = insert(createRecipePasteInput(), fullMethodTab)
  input = insert(input, fullIngredientsTab)
  input = updateRecipePasteInput(input, input.text.replace('2 salad onions', '3 salad onions'))
  const restored = createRecipePasteInput(...[input.text, JSON.parse(JSON.stringify(input.spans))])
  const parsed = assembleRecipeFragments(getRecipePasteParts(restored))
  const form = fillRecipeFromImport({ image: 'existing-photo', notes: 'Family note' }, parsed, restored)
  assert.match(form.ingredients, /^3 salad onions,/m)
  assert.equal(form.ingredients.split('\n').length, 11)
  assert.equal(form.method.split('\n\n').length, 3)
  assert.equal(form.image, 'existing-photo')
  assert.equal(form.sourcePaste, input.text)
  assert.ok(form.notes.startsWith('Family note\n\n'))
})

test('selected replacement removes the old recipe rather than resurrecting hidden clipboard history', () => {
  let input = insert(createRecipePasteInput(), fullMethodTab)
  input = insert(input, fullIngredientsTab)
  const replacement = 'New salad\nIngredients\n2 tomatoes\nMethod\nMix in a bowl.'
  input = insert(input, replacement, 0, input.text.length)
  const result = assembleRecipeFragments(getRecipePasteParts(input))
  assert.equal(result.name, 'New salad')
  assert.equal(result.ingredients, '2 tomatoes')
  assert.equal(result.method, 'Mix in a bowl.')
  assert.doesNotMatch(JSON.stringify(result), /sprouts|pigs|leftover rice/i)
})

test('deleting a whole fragment removes it from extraction and clearing the box clears provenance', () => {
  let input = insert(createRecipePasteInput(), fullMethodTab)
  input = insert(input, fullIngredientsTab)
  input = updateRecipePasteInput(input, fullMethodTab)
  const result = assembleRecipeFragments(getRecipePasteParts(input), { includeDiagnostics: true })
  assert.equal(result.ingredients, '')
  assert.equal(result.method.split('\n\n').length, 3)
  assert.equal(result.diagnostics.reviewNeeded, true)
  input = updateRecipePasteInput(input, '')
  assert.deepEqual(getRecipePasteParts(input), [])
})

test('small preparation edits and ordinary supplied newlines remain part of the same section', () => {
  let input = insert(createRecipePasteInput(), 'Onion pot\nIngredients\n1 onion')
  input = insert(input, '\nfinely chopped')
  input = insert(input, '\n\nMethod\nFry the onion in a pan.\nServe.')
  const result = assembleRecipeFragments(getRecipePasteParts(input))
  assert.equal(result.ingredients, '1 onion, finely chopped')
  assert.equal(result.method, 'Fry the onion in a pan.\n\nServe.')
})

test('short labelled sections and a single cooking sentence can be separate pastes', () => {
  for (const method of ['Method\nFry the onion.', 'Fry the onion.']) {
    let input = insert(createRecipePasteInput(), 'Ingredients\n1 onion')
    input = insert(input, method)
    const result = assembleRecipeFragments(getRecipePasteParts(input))
    assert.equal(result.ingredients, '1 onion')
    assert.equal(result.method, 'Fry the onion.')
  }
})

test('conflicting recipes are flagged without mixing their ingredients or inventing instructions', () => {
  const result = assembleRecipeFragments([
    'Bean pot\nIngredients\n1 tin beans',
    'Carrot pie\nIngredients\n2 carrots\nMethod\nBake in the oven.',
  ], { includeDiagnostics: true })
  assert.equal(result.name, 'Bean pot')
  assert.equal(result.ingredients, '1 tin beans')
  assert.equal(result.method, '')
  assert.equal(result.diagnostics.reviewNeeded, true)
  assert.ok(result.diagnostics.conflicts.some((entry) => entry.field === 'name'))
})

test('conflicting quantities and times are retained as reviewable alternatives rather than summed or guessed', () => {
  const result = assembleRecipeFragments([
    'Bean pot\nCook: 10 mins\nIngredients\n1 tin beans',
    'Bean pot\nCook: 20 mins\nIngredients\n2 tins beans',
  ], { includeDiagnostics: true })
  assert.equal(result.ingredients, '1 tin beans')
  assert.equal(result.cookTime, '10 mins')
  assert.deepEqual(result.diagnostics.conflicts.map((entry) => entry.field).sort(), ['cookTime', 'ingredients'])
  assert.equal(result.diagnostics.reviewNeeded, true)
})

test('separate Fill form actions cannot erase existing fields or duplicate notes', () => {
  const ingredients = assembleRecipeFragments([fullIngredientsTab])
  const method = assembleRecipeFragments([fullMethodTab])
  const input = createRecipePasteInput(fullIngredientsTab)
  let form = fillRecipeFromImport({ name: 'Draft', notes: 'Family note', image: 'photo' }, ingredients, input)
  form = fillRecipeFromImport(form, method, createRecipePasteInput(fullMethodTab))
  form = fillRecipeFromImport(form, method, createRecipePasteInput(fullMethodTab))
  assert.equal(form.ingredients.split('\n').length, 11)
  assert.equal(form.method.split('\n\n').length, 3)
  assert.equal(form.image, 'photo')
  assert.equal(form.notes.split('If you don’t have leftover rice').length, 2)
})

test('older saved recipes and invalid provenance fall back to the original visible text', () => {
  const text = 'Soup\nIngredients\n1 onion\nMethod\nBoil in a pot.'
  for (const spans of [undefined, [], [null], [{ start: 2, end: 5, part: 0 }], [{ start: 0, end: 100000, part: 0 }]]) {
    const input = createRecipePasteInput(text, spans)
    assert.deepEqual(getRecipePasteParts(input), [text])
    assert.equal(assembleRecipeFragments(getRecipePasteParts(input)).ingredients, '1 onion')
  }
})

test('clipboard layout perturbations preserve results across every full-tab workflow', () => {
  const transforms = [
    (text) => text.replace(/\n/g, '\r\n'),
    (text) => text.replace(/ /g, '\u00a0'),
    (text) => text.replace(/^(Ingredients|Method|Nutrition|Reviews)$/gm, (heading) => heading.toUpperCase()),
    (text) => text.replace(/\n/g, '\n\n'),
  ]
  for (const entry of recipeImportWorkflows) {
    for (const transform of transforms) {
      let input = createRecipePasteInput()
      for (const clip of entry.clips) input = insert(input, transform(clip))
      const result = assembleRecipeFragments(getRecipePasteParts(input))
      const evaluated = evaluateCase(entry, () => result)
      assert.equal(evaluated.passed, true, JSON.stringify({ id: entry.id, checks: evaluated.checks }))
    }
  }
})
