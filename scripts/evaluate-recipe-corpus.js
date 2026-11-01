import { evaluateCorpus } from '../tests/helpers/recipe-corpus.js'

const report = evaluateCorpus()
console.log(JSON.stringify(report, null, 2))
if (process.argv.includes('--check') && report.passed !== report.total) process.exitCode = 1
