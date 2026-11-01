import { writeFileSync } from 'node:fs'
import { evaluateCorpus, evaluateCase } from '../tests/helpers/recipe-corpus.js'
import { recipeImportWorkflows } from '../tests/fixtures/recipe-import-workflows.js'
import { loadRecipeParserAtRef } from './recipe-parser-baseline.js'

const args = process.argv.slice(2)
const ref = args.includes('--baseline-ref') ? args[args.indexOf('--baseline-ref') + 1] : 'e35614b5d92b5ff840c46bf61cd485a3f0d7e111'
const baseline = await loadRecipeParserAtRef(ref)
const cases = recipeImportWorkflows.map((entry) => evaluateCase(entry, baseline.parsePastedRecipe))
const report = {
  baselineCommit: baseline.commit,
  baselineCorpus: evaluateCorpus(baseline.parsePastedRecipe),
  baselineWorkflow: { total: cases.length, passed: cases.filter((entry) => entry.passed).length, failures: cases.filter((entry) => !entry.passed).map(({ id, checks }) => ({ id, failedFields: Object.keys(checks).filter((key) => !checks[key]) })) },
}
if (args.includes('--output')) writeFileSync(args[args.indexOf('--output') + 1], JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
