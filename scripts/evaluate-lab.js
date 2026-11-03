import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { recipeCorpus } from '../tests/fixtures/recipe-corpus/cases.js'
import { recipeImportWorkflows } from '../tests/fixtures/recipe-import-workflows.js'
import {
  canonicalGoldens,
  ownerExpectedSteps,
} from '../tests/fixtures/lab-golden.js'
import { engineScenarios } from '../src/domain/lab/scenarios.js'
import { runRegressions } from '../src/domain/lab/regression.js'
import { ENGINE_VERSIONS } from '../src/domain/recipe/card.js'

const entries = [
  ...recipeCorpus,
  ...recipeImportWorkflows.map((entry) => ({
    ...entry,
    id: 'workflow-' + entry.id,
  })),
  ...canonicalGoldens,
].map((entry) => ({
  ...entry,
  ...(ownerExpectedSteps[entry.id]
    ? { canonicalExpected: { steps: ownerExpectedSteps[entry.id] } }
    : {}),
}))
const result = runRegressions([...entries, ...engineScenarios])
const paths = [
  ...new Set(
    execFileSync(
      'git',
      [
        'ls-files',
        '-co',
        '--exclude-standard',
        'src/domain',
        'src/utils',
        'tests',
      ],
      { encoding: 'utf8' },
    )
      .trim()
      .split('\n'),
  ),
].sort()
const hash = createHash('sha256')
paths.forEach((path) => hash.update(path).update(readFileSync(path)))
const report = {
  generatedAt: new Date().toISOString(),
  engineVersions: ENGINE_VERSIONS,
  sourceFingerprint: hash.digest('hex'),
  baseline: { existingTests: 217, recipeCorpus: 57, fragmentWorkflows: 16 },
  totalCases: result.total,
  passed: result.passed,
  failed: result.failed,
  warnings: result.warnings,
  exactNumberedStepGoldens: entries
    .filter((entry) => entry.canonicalExpected?.steps)
    .map((entry) => entry.id),
  assertionCount: result.results.reduce(
    (sum, entry) => sum + entry.assertions.length,
    0,
  ),
  failures: result.results.filter((entry) => !entry.passed),
  cases: result.results.map((entry) => ({
    id: entry.id,
    passed: entry.passed,
    assertions: entry.assertions.map((assertion) => ({
      field: assertion.field,
      passed: assertion.passed,
    })),
    reviewCodes: entry.warnings.map((warning) => warning.code),
  })),
  limitations: [
    'Fixture assertion passes are not a calibrated probability of recipe correctness.',
    'Method character coverage measures extracted method, not all webpage classification.',
    'Six numbered-step goldens checked against source during engineering; independent human/owner review remains outstanding.',
    'Smart scheduling currently enables safe preheat overlap; arbitrary parallel prose is retained conservatively.',
    'Physical Android/iOS and background notification reliability remain unverified.',
  ],
}
writeFileSync(
  new URL('../docs/lab/quality-report.json', import.meta.url),
  JSON.stringify(report, null, 2) + '\n',
)
console.log(
  JSON.stringify({
    cases: report.totalCases,
    passed: report.passed,
    failed: report.failed,
    warnings: report.warnings,
    assertions: report.assertionCount,
    sourceFingerprint: report.sourceFingerprint,
  }),
)
if (report.failed) process.exitCode = 1
