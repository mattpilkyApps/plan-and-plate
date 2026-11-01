import { evaluateCorpus } from '../tests/helpers/recipe-corpus.js'
import { writeFileSync } from 'node:fs'
import { loadRecipeParserAtRef } from './recipe-parser-baseline.js'

const args = process.argv.slice(2)
const baselineRef = args[args.indexOf('--baseline-ref') + 1]
let report
if (args.includes('--baseline-ref')) {
  if (!baselineRef || baselineRef.startsWith('-')) throw new Error('--baseline-ref needs a Git commit/ref')
  const { commit, parsePastedRecipe } = await loadRecipeParserAtRef(baselineRef)
  report = { baselineCommit: commit, ...evaluateCorpus(parsePastedRecipe) }
} else report = evaluateCorpus()
if (args.includes('--summary')) report.failures = report.failures.map(({ id, checks, leaked }) => ({ id, failedFields: Object.keys(checks).filter((key) => !checks[key]), leaked }))
const json = JSON.stringify(report, null, 2) + '\n'
if (args.includes('--output')) {
  const path = args[args.indexOf('--output') + 1]
  if (!path || path.startsWith('-')) throw new Error('--output needs a path')
  writeFileSync(path, json)
}
console.log(json)
if (process.argv.includes('--check') && report.passed !== report.total) process.exitCode = 1
