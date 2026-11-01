import { parsePastedRecipe } from './recipeImport.js'

const fields = ['name', 'servings', 'prepTime', 'cookTime', 'totalTime', 'ingredients', 'method']
const normalise = (text) => text.trim().toLowerCase().replace(/\s+/g, ' ')

// Each clipboard page retains its own navigation/footer scope. Missing fields
// cannot erase another page's data; disagreements request review, never a guess.
export function assembleRecipeFragments(parts, { includeDiagnostics = false, parsePage = parsePastedRecipe } = {}) {
  const candidates = parts.map((text, index) => ({ index, ...parsePage(text, { includeDiagnostics: true }) }))
    .filter((candidate) => candidate.ingredients || candidate.method)
  const anchor = candidates.find((candidate) => candidate.name)?.name
  const conflicts = []
  const compatible = candidates.filter((candidate) => {
    if (!anchor || !candidate.name || normalise(candidate.name) === normalise(anchor)) return true
    conflicts.push({ field: 'name', sources: [candidates[0].index, candidate.index] })
    return false
  })
  const result = { name: '', servings: '', prepTime: '', cookTime: '', ingredients: '', method: '' }
  const sources = {}
  for (const candidate of compatible) {
    for (const field of fields) {
      const value = candidate[field]
      if (!value) continue
      if (!result[field]) {
        result[field] = value
        sources[field] = candidate.index
      } else if (normalise(result[field]) !== normalise(value)) {
        const separator = field === 'ingredients' ? '\n' : '\n\n'
        const previous = result[field].split(separator).map(normalise)
        const incoming = value.split(separator).map(normalise)
        if (['ingredients', 'method'].includes(field) && previous.every((line) => incoming.includes(line))) {
          result[field] = value
          sources[field] = candidate.index
        } else if (!['ingredients', 'method'].includes(field) || !incoming.every((line) => previous.includes(line))) {
          conflicts.push({ field, sources: [sources[field], candidate.index] })
        }
      }
    }
  }
  const notes = [...new Set(compatible.flatMap((candidate) => candidate.notes ? candidate.notes.split('\n\n') : []))]
  if (notes.length) result.notes = notes.join('\n\n')
  if (includeDiagnostics) {
    const method = compatible.find((candidate) => candidate.index === sources.method)?.diagnostics.method ||
      { state: 'BEFORE_RECIPE', stoppedBy: 'missing-method', discarded: [], reviewNeeded: true }
    result.diagnostics = {
      fragments: parts.length, sources, conflicts,
      reviewNeeded: !result.ingredients || !result.method || method.reviewNeeded || conflicts.length > 0,
      method,
      fields: Object.fromEntries(fields.map((field) => [field, result[field] ?
        compatible.find((candidate) => candidate.index === sources[field])?.diagnostics.fields[field === 'name' ? 'title' : field] || 'detected' : 'missing'])),
    }
  }
  return result
}

export function fillRecipeFromImport(current, parsed, input) {
  const result = { ...current }
  for (const field of fields) if (parsed[field]) result[field] = parsed[field]
  const notes = [current.notes, parsed.notes].filter(Boolean).flatMap((note) => note.split('\n\n'))
  result.notes = [...new Set(notes)].join('\n\n')
  return { ...result, sourcePaste: input.text, sourcePasteSpans: input.spans }
}
