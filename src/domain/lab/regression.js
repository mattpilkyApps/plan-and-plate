import { createRecipeCard, allIngredients } from '../recipe/card.js'

const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)
export function runRegressionCase(entry) {
  try {
    const card = createRecipeCard(entry.clips || [entry.raw], { now: '2026-11-03T00:00:00.000Z', id: entry.id })
    const actual = { name: card.title, servings: card.servings.raw, prepTime: card.prepTime.raw, cookTime: card.cookTime.raw, totalTime: card.totalTime.raw, ingredients: allIngredients(card).map((ingredient) => ingredient.rawLine), method: card.originalMethod.split('\n\n').filter(Boolean), notes: card.notes.join('\n\n') }
    const assertions = []
    const add = (field, expected, received) => assertions.push({ field, expected, actual: received, passed: equal(expected, received) })
    for (const [field, value] of Object.entries(entry.expected || {})) {
      if (field === 'methodCount') add(field, value, actual.method.length)
      else if (field === 'methodEndsWith') add(field, true, card.originalMethod.endsWith(value))
      else add(field, value, actual[field])
    }
    if (entry.canonicalExpected?.steps) add('numberedSteps', entry.canonicalExpected.steps, card.steps.map((step) => step.instruction))
    if (entry.canonicalExpected?.groups) add('ingredientGroups', entry.canonicalExpected.groups, card.ingredientGroups.map((group) => group.heading))
    add('methodPartitionCoverage', true, card.validation.methodCoverage.every((paragraph) => paragraph.covered))
    const output = [...actual.ingredients, ...card.steps.map((step) => step.instruction), ...card.notes].join('\n')
    add('excludedNoise', [], (entry.excluded || []).filter((noise) => output.includes(noise)))
    return { id: entry.id, passed: assertions.every((assertion) => assertion.passed), assertions, warnings: card.unresolvedIssues, card }
  } catch (error) { return { id: entry.id, passed: false, assertions: [{ field: 'runtime', expected: 'successful run', actual: error.message, passed: false }], warnings: [] } }
}

export function runRegressions(entries, lastGood = {}) {
  const results = entries.map(runRegressionCase)
  return { total: results.length, passed: results.filter((result) => result.passed).length, failed: results.filter((result) => !result.passed).length, warnings: results.reduce((count, result) => count + result.warnings.length, 0), regressions: results.filter((result) => !result.passed && lastGood[result.id] === true).map((result) => result.id), results }
}
