import { mkdirSync, writeFileSync } from 'node:fs'
import { recipeCorpus } from '../tests/fixtures/recipe-corpus/cases.js'
import { recipeImportWorkflows } from '../tests/fixtures/recipe-import-workflows.js'
import { canonicalGoldens, ownerPaneerSteps } from '../tests/fixtures/lab-golden.js'

const entries = [...recipeCorpus, ...recipeImportWorkflows.map((entry) => ({ ...entry, id: 'workflow-' + entry.id })), ...canonicalGoldens].map((entry) => ({ ...entry, ...(entry.id === 'owner-paneer-phone' ? { canonicalExpected: { steps: ownerPaneerSteps } } : {}) }))
const directory = new URL('../src/lab/generated/', import.meta.url)
mkdirSync(directory, { recursive: true })
writeFileSync(new URL('fixtures.json', directory), JSON.stringify(entries))
console.log(`Prepared ${entries.length} existing/synthetic fixtures for the private Lab.`)
