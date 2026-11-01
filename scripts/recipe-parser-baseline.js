import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export async function loadRecipeParserAtRef(ref) {
  const commit = execFileSync('git', ['rev-parse', '--verify', ref + '^{commit}'], { encoding: 'utf8' }).trim()
  const directory = mkdtempSync(join(tmpdir(), 'recipe-parser-baseline-'))
  try {
    writeFileSync(join(directory, 'package.json'), '{"type":"module"}')
    for (const file of ['recipeImport.js', 'ingredientParser.js', 'recipeMethod.js', 'recipeSignals.js', 'ingredientPreparation.js', 'recipeText.js', 'recipeSections.js']) {
      const source = spawnSync('git', ['show', commit + ':src/utils/' + file], { stdio: 'pipe' })
      if (source.status === 0) writeFileSync(join(directory, file), source.stdout)
      else if (['recipeImport.js', 'ingredientParser.js'].includes(file)) throw new Error('Missing baseline module: ' + file)
    }
    return { commit, ...(await import(pathToFileURL(join(directory, 'recipeImport.js')))) }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}
