import { evaluateCorpus } from '../tests/helpers/recipe-corpus.js'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const args = process.argv.slice(2)
const baselineRef = args[args.indexOf('--baseline-ref') + 1]
let report
if (args.includes('--baseline-ref')) {
  if (!baselineRef || baselineRef.startsWith('-')) throw new Error('--baseline-ref needs a Git commit/ref')
  const commit = execFileSync('git', ['rev-parse', '--verify', baselineRef + '^{commit}'], { encoding: 'utf8' }).trim()
  const directory = mkdtempSync(join(tmpdir(), 'recipe-parser-baseline-'))
  try {
    writeFileSync(join(directory, 'package.json'), '{"type":"module"}')
    for (const file of ['recipeImport.js', 'ingredientParser.js']) {
      writeFileSync(join(directory, file), execFileSync('git', ['show', commit + ':src/utils/' + file]))
    }
    const { parsePastedRecipe } = await import(pathToFileURL(join(directory, 'recipeImport.js')))
    report = { baselineCommit: commit, ...evaluateCorpus(parsePastedRecipe) }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
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
