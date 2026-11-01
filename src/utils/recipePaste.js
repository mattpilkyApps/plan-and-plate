import { parsePastedRecipe } from './recipeImport.js'
import { isStrongMethodStart } from './recipeSignals.js'

export function getRecipePasteSeparator(current, incoming, selectionStart, selectionEnd) {
  // Respect normal replacement and mid-line editing. Only append boundaries
  // between complementary recipe sections pasted in either order.
  if (!current.trim() || selectionStart !== current.length || selectionEnd !== selectionStart ||
    /\n\s*$/.test(current) || /^\s*\n/.test(incoming)) return ''
  const recipe = parsePastedRecipe(current)
  if (recipe.method && !recipe.ingredients) {
    const appended = parsePastedRecipe(incoming, { includeDiagnostics: true })
    return appended.diagnostics.fields.ingredients === 'section' ? '\n\n' : ''
  }
  if (!recipe.ingredients || recipe.method) return ''
  const firstLine = incoming.trimStart().split(/\r?\n/)[0]
  if (!/^(?:method|instructions|directions)\s*:?$/i.test(firstLine) && !isStrongMethodStart(firstLine)) return ''
  return '\n\n'
}
