import { isDeepStrictEqual } from 'node:util'
import { parsePastedRecipe } from '../../src/utils/recipeImport.js'
import { recipeCorpus } from '../fixtures/recipe-corpus/cases.js'

export function evaluateCase(entry, parser = parsePastedRecipe) {
  const actual = parser(entry.raw)
  const checks = {}
  const ingredients = actual.ingredients.split('\n').filter(Boolean)
  const method = actual.method.split(/\n\n/).filter(Boolean)
  for (const field of ['name', 'servings', 'prepTime', 'cookTime', 'totalTime', 'notes']) {
    if (Object.hasOwn(entry.expected, field)) checks[field] = actual[field] === entry.expected[field]
  }
  if (entry.expected.ingredients) checks.ingredients = isDeepStrictEqual(ingredients, entry.expected.ingredients)
  if (entry.expected.method) checks.method = isDeepStrictEqual(method, entry.expected.method)
  if (entry.expected.methodCount !== undefined) checks.method = method.length === entry.expected.methodCount
  if (entry.expected.methodEndsWith) checks.method = checks.method !== false && actual.method.endsWith(entry.expected.methodEndsWith)
  const leaked = (entry.excluded || []).filter((noise) => (actual.ingredients + '\n' + actual.method + '\n' + (actual.notes || '')).includes(noise))
  checks.noise = !leaked.length
  return {
    id: entry.id, checks, passed: Object.values(checks).every(Boolean), leaked,
    falseIngredients: entry.expected.ingredients ? ingredients.filter((line) => !entry.expected.ingredients.includes(line)).length : 0,
    falseMethodSteps: method.filter((step) => (entry.excluded || []).some((noise) => step.includes(noise))).length,
    actual,
  }
}

export function evaluateCorpus(parser = parsePastedRecipe) {
  const cases = recipeCorpus.map((entry) => evaluateCase(entry, parser))
  const fields = {}
  for (const result of cases) {
    for (const [field, pass] of Object.entries(result.checks)) {
      fields[field] ||= { passed: 0, total: 0 }
      fields[field].total += 1
      fields[field].passed += Number(pass)
    }
  }
  return {
    total: cases.length, passed: cases.filter((result) => result.passed).length,
    fields,
    noiseLeakageCount: cases.reduce((sum, result) => sum + result.leaked.length, 0),
    falseIngredientCount: cases.reduce((sum, result) => sum + result.falseIngredients, 0),
    falseMethodStepCount: cases.reduce((sum, result) => sum + result.falseMethodSteps, 0),
    failures: cases.filter((result) => !result.passed).map(({ actual, ...result }) => ({ ...result, actual })),
  }
}
