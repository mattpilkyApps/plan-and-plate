import { writeFileSync } from 'node:fs'
import { evaluateCorpus, evaluateCase } from '../tests/helpers/recipe-corpus.js'
import { recipeImportWorkflows } from '../tests/fixtures/recipe-import-workflows.js'
import { loadRecipeParserAtRef } from './recipe-parser-baseline.js'
import { parsePastedRecipe } from '../src/utils/recipeImport.js'
import { assembleRecipeFragments } from '../src/utils/recipeImportSession.js'

const args = process.argv.slice(2)
const ref = args.includes('--baseline-ref') ? args[args.indexOf('--baseline-ref') + 1] : 'e35614b5d92b5ff840c46bf61cd485a3f0d7e111'
const baseline = await loadRecipeParserAtRef(ref)
function evaluateWorkflow(parser, fragments) {
  const cases = recipeImportWorkflows.map((entry) => evaluateCase(entry, fragments ? () => assembleRecipeFragments(entry.clips, { parsePage: parser }) : parser))
  return { total: cases.length, passed: cases.filter((entry) => entry.passed).length,
    noiseLeakageCount: cases.reduce((sum, entry) => sum + entry.leaked.length, 0),
    falseIngredientCount: cases.reduce((sum, entry) => sum + entry.falseIngredients, 0),
    failures: cases.filter((entry) => !entry.passed).map(({ id, checks }) => ({ id, failedFields: Object.keys(checks).filter((key) => !checks[key]) })) }
}
const report = {
  baselineCommit: baseline.commit,
  baselineCorpus: evaluateCorpus(baseline.parsePastedRecipe),
  approaches: [
    { name: 'existing-flat-parser', corpus: evaluateCorpus(baseline.parsePastedRecipe), workflows: evaluateWorkflow(baseline.parsePastedRecipe, false) },
    { name: 'indexed-sections-flat-text', corpus: evaluateCorpus(parsePastedRecipe), workflows: evaluateWorkflow(parsePastedRecipe, false) },
    { name: 'paste-boundaries-existing-parser', corpus: evaluateCorpus(baseline.parsePastedRecipe), workflows: evaluateWorkflow(baseline.parsePastedRecipe, true) },
    { name: 'indexed-sections-and-paste-boundaries', corpus: evaluateCorpus(parsePastedRecipe), workflows: evaluateWorkflow(parsePastedRecipe, true) },
  ],
}
const durations = []
for (let repeat = 0; repeat < 6; repeat += 1) {
  for (const entry of recipeImportWorkflows) {
    const start = performance.now()
    assembleRecipeFragments(entry.clips)
    if (repeat) durations.push(performance.now() - start)
  }
}
durations.sort((a, b) => a - b)
report.selectedTiming = { environment: 'local Node; not a phone benchmark', samples: durations.length,
  medianMs: Number(durations[Math.floor(durations.length / 2)].toFixed(3)),
  p95Ms: Number(durations[Math.floor(durations.length * 0.95)].toFixed(3)) }
if (args.includes('--output')) writeFileSync(args[args.indexOf('--output') + 1], JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
const selected = report.approaches.at(-1)
if (args.includes('--check') && (selected.corpus.passed !== selected.corpus.total || selected.workflows.passed !== selected.workflows.total || selected.workflows.noiseLeakageCount)) process.exitCode = 1
