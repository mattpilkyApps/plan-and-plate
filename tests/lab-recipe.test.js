import test from 'node:test'
import assert from 'node:assert/strict'
import { recipeCorpus } from './fixtures/recipe-corpus/cases.js'
import { recipeImportWorkflows } from './fixtures/recipe-import-workflows.js'
import { canonicalGoldens, ownerExpectedSteps } from './fixtures/lab-golden.js'
import {
  createRecipeCard,
  allIngredients,
  approveRecipeCard,
  reviseRecipeCard,
  toLegacyRecipe,
  timeInMinutes,
} from '../src/domain/recipe/card.js'
import { evidenceText } from '../src/domain/recipe/source.js'
import { runRegressionCase } from '../src/domain/lab/regression.js'
import { parseIngredients } from '../src/utils/ingredientParser.js'

for (const entry of [
  ...recipeCorpus,
  ...recipeImportWorkflows,
  ...canonicalGoldens,
]) {
  test('Lab source/card contract: ' + entry.id, () => {
    const result = runRegressionCase(
      ownerExpectedSteps[entry.id]
        ? {
            ...entry,
            canonicalExpected: { steps: ownerExpectedSteps[entry.id] },
          }
        : entry,
    )
    assert.equal(
      result.passed,
      true,
      JSON.stringify(
        result.assertions.filter((assertion) => !assertion.passed),
      ),
    )
    assert.deepEqual(
      result.card.sourceFragments.map((source) => source.rawText),
      entry.clips || [entry.raw],
    )
    assert.deepEqual(
      toLegacyRecipe(result.card).parsedIngredients.map(
        ({ canonicalIngredientId, ...item }) => {
          assert.ok(canonicalIngredientId)
          return item
        },
      ),
      parseIngredients(
        allIngredients(result.card)
          .map((item) => item.rawLine)
          .join('\n'),
      ).map((item) => ({ ...item, qualifiers: item.qualifiers || [] })),
    )
  })
}

test('Lab maps wrapped ingredient preparation and every owner method step to original source', () => {
  for (const id of ['owner-curry-plain', 'owner-sprouts-two-tab-phone']) {
    const entry = recipeCorpus.find((candidate) => candidate.id === id)
    const card = createRecipeCard([entry.raw])
    for (const item of [...allIngredients(card), ...card.steps]) {
      assert.ok(item.sourceRefs.length, item.rawLine || item.instruction)
      assert.ok(evidenceText(item.sourceRefs[0], card.sourceFragments))
    }
  }
})

test('Lab conflicts keep candidates and source; approval is explicit and edits revoke it', () => {
  const card = createRecipeCard([
    'Beans\nServes 2\nIngredients\n1 tin beans\nMethod\nHeat the beans.',
    'Beans\nServes 4\nIngredients\n2 tins beans\nMethod\nHeat the beans.',
  ])
  assert.equal(card.recipeCardStatus, 'NEEDS_REVIEW')
  assert.equal(card.diagnostics.candidates[1].servings, '4')
  const approved = approveRecipeCard(card)
  assert.equal(approved.recipeCardStatus, 'VALIDATED')
  const revised = reviseRecipeCard(
    approved,
    { title: 'Family beans' },
    'Corrected title',
  )
  assert.equal(revised.approvals.length, 0)
  assert.deepEqual(revised.sourceFragments, card.sourceFragments)
  assert.notEqual(revised.recipeCardStatus, 'VALIDATED')
})

test('Lab exact overlaps are joined once and contradictory ingredient amounts are flagged', () => {
  const card = createRecipeCard([
    'Bean pot\nServes 2\nIngredients\n1 onion\n1 tin beans',
    'Bean pot\nIngredients\n1 tin beans\n1 carrot\nMethod\nHeat a pan. Serve.',
  ])
  assert.deepEqual(
    allIngredients(card).map((item) => item.rawLine),
    ['1 onion', '1 tin beans', '1 carrot'],
  )
  assert.equal(
    card.unresolvedIssues.some(
      (entry) => entry.code === 'conflict-ingredients',
    ),
    false,
  )
})

test('Lab incomplete recipes cannot be approved, unknown amounts and times stay unknown', () => {
  const card = createRecipeCard([
    'Salad\nIngredients\nsalt and pepper\nMethod\nMix in a bowl.',
  ])
  assert.equal(allIngredients(card)[0].quantity.value, null)
  assert.equal(card.cookTime.value, null)
  assert.throws(() => approveRecipeCard(card), /required recipe/)
  assert.equal(timeInMinutes('1 hr 20 mins'), 80)
  assert.equal(timeInMinutes('2-3 mins'), null)
})

test('Lab source time references point to the correct labelled value, even when prep and cook match', () => {
  const card = createRecipeCard([
    'Pot\nServes 2\nPrep: 10 mins\nCook: 10 mins\nIngredients\n1 carrot\nMethod\nBoil the carrot.',
  ])
  assert.match(
    evidenceText(card.prepTime.sourceRefs[0], card.sourceFragments),
    /^Prep/,
  )
  assert.match(
    evidenceText(card.cookTime.sourceRefs[0], card.sourceFragments),
    /^Cook/,
  )
})

test('Lab optional compound lines stay included when only a component may be optional', () => {
  const entry = recipeCorpus.find(
    (candidate) => candidate.id === 'owner-paneer-phone',
  )
  const card = createRecipeCard([entry.raw])
  const serving = allIngredients(card).at(-1)
  assert.equal(serving.optional, false)
  assert.equal(serving.optionalScope, 'ambiguous')
  assert.ok(
    card.unresolvedIssues.some((item) =>
      item.code.startsWith('optional-scope'),
    ),
  )
})

test('Lab invented source-generated instructions fail validation', () => {
  const card = createRecipeCard([
    'Carrots\nServes 2\nIngredients\n2 carrots\nMethod\nBoil the carrots.',
  ])
  const changed = reviseRecipeCard(
    card,
    {
      steps: card.steps.map((step) => ({
        ...step,
        instruction: 'Bake at 200°C for 20 minutes.',
      })),
    },
    'Simulate a faulty engine output',
  )
  assert.ok(
    changed.unresolvedIssues.some(
      (item) =>
        item.code.startsWith('unsupported-') && item.severity === 'error',
    ),
  )
  assert.throws(() => approveRecipeCard(changed), /required/)
})

test('Lab contradictory metadata within a single clipboard fragment is flagged with both candidates', () => {
  const card = createRecipeCard(['Beans\nServes 2\nServes 4\nIngredients\n1 tin beans\nMethod\nHeat the beans.'])
  const conflict = card.diagnostics.conflicts.find((item) => item.field === 'servings')
  assert.deepEqual(conflict.candidates.map((item) => item.value), ['2', '4'])
  assert.ok(card.unresolvedIssues.some((item) => item.code === 'conflict-servings'))
})
