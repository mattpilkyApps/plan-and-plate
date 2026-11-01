import { parsePastedRecipe } from './recipeImport.js'
import { isStrongMethodStart } from './recipeSignals.js'

export function getRecipePasteSeparator(current, incoming, selectionStart, selectionEnd) {
  // Respect normal replacement and mid-line editing. Only append boundaries
  // when a second method fragment is pasted at the end of an ingredient copy.
  if (!current.trim() || selectionStart !== current.length || selectionEnd !== selectionStart ||
    /\n\s*$/.test(current) || /^\s*\n/.test(incoming)) return ''
  const recipe = parsePastedRecipe(current)
  if (!recipe.ingredients || recipe.method) return ''
  const firstLine = incoming.trimStart().split(/\r?\n/)[0]
  if (!/^(?:method|instructions|directions)\s*:?$/i.test(firstLine) && !isStrongMethodStart(firstLine)) return ''
  return '\n\n'
}
