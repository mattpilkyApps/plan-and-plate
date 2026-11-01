import { readRecipePageLines, isIngredientsHeading, isMethodHeading, isNoiseLine, readMetadata, findRecipeName } from './recipeText.js'
import { classifyRecipeBlock, isStrongMethodStart } from './recipeSignals.js'
import { indexRecipeSections, recipeHeaderRanges } from './recipeSections.js'
import { extractRecipeIngredients } from './recipeIngredients.js'
import { extractRecipeMethod } from './recipeMethod.js'

export function parsePastedRecipe(text, { includeDiagnostics = false } = {}) {
  const pageLines = readRecipePageLines(text)
  const titleStart = pageLines.findIndex((line) => line.headingLevel === 1 &&
    !isIngredientsHeading(line.text) && !isMethodHeading(line.text) && !isNoiseLine(line.text))
  const hasEarlierMethod = titleStart > 0 && pageLines.slice(0, titleStart).some((line) =>
    isMethodHeading(line.text) || isStrongMethodStart(line.text, { requireOpening: true }))
  const lines = titleStart >= 0 && !hasEarlierMethod ? pageLines.slice(titleStart) : pageLines
  const sections = indexRecipeSections(lines)
  const extractedIngredients = sections.ingredientStart >= 0
    ? extractRecipeIngredients(lines.slice(sections.ingredientStart, sections.ingredientEnd))
    : { ingredients: [], sections: [] }
  const extractedMethod = sections.methodStart >= 0
    ? extractRecipeMethod(lines.slice(sections.methodStart, sections.methodEnd), extractedIngredients.ingredients)
    : { steps: [], notes: [], diagnostics: { state: 'BEFORE_RECIPE', stoppedBy: 'missing-method', discarded: [], reviewNeeded: true } }
  const headers = recipeHeaderRanges(lines, sections).map((header) => {
    const metadata = readMetadata(header)
    return { name: findRecipeName(header, metadata.consumed), ...metadata.values }
  })
  const values = { name: '', servings: '', prepTime: '', cookTime: '' }
  for (const header of headers) {
    for (const [field, value] of Object.entries(header)) if (value && !values[field]) values[field] = value
  }
  const result = {
    ...values,
    ingredients: extractedIngredients.ingredients.join('\n'),
    method: extractedMethod.steps.join('\n\n'),
    ...(extractedMethod.notes.length ? { notes: extractedMethod.notes.join('\n\n') } : {}),
  }
  if (includeDiagnostics) {
    result.diagnostics = {
      fields: {
        title: result.name ? 'detected' : 'missing',
        servings: result.servings ? 'explicit' : 'missing-or-ambiguous',
        prepTime: result.prepTime ? 'explicit' : 'missing',
        cookTime: result.cookTime ? 'explicit' : 'missing',
        totalTime: result.totalTime ? 'explicit' : 'missing',
        ingredients: result.ingredients ? (sections.ingredientHeading >= 0 ? 'section' : 'inferred') : 'missing',
        method: result.method ? (extractedMethod.diagnostics.reviewNeeded ? 'review' : sections.methodEvidence === 'inferred' ? 'inferred' : 'supported') : 'missing',
      },
      method: { ...extractedMethod.diagnostics, ...(sections.methodStart >= 0 ? { start: sections.methodEvidence } : {}) },
      ingredientSections: extractedIngredients.sections,
      ranges: sections,
      // Ranges refer to cleaned source lines; no source line is physically reordered.
      pageBoundary: sections.end < lines.length ? classifyRecipeBlock(lines[sections.end]).type : 'end-of-input',
    }
  }
  return result
}
