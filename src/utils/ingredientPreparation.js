// Shared preparation grammar for extraction and canonical-name cleanup.
// A prepared food name ("grated cheese") is different from a preparation
// clause ("grated or 1 tsp paste"). Keep that distinction in one place.
export const preparationWords = 'chopped|diced|sliced|minced|grated|peeled|crushed|bashed|drained|rinsed|deseeded|trimmed|sifted|cubed|softened|beaten|shredded|pressed|melted|juiced|torn|quartered|halved'
export const preparationAdverbs = 'finely|roughly|thinly|freshly'
const preparationLead = `(?:(?:${preparationAdverbs})\\s+)?(?:${preparationWords})`
const ingredientParts = 'whites?|greens?|leaves|stems?|stalks?|seeds?|skins?'
const partPreparation = `(?:${ingredientParts})(?:\\s+and\\s+(?:${ingredientParts}))?\\s+(?:separated|removed|reserved|discarded)`
const preparationContinuation = new RegExp(
  `^(?:${preparationLead})(?:$|[,\\s]+(?:and|or|if|with|into|until|then|to)\\b)|^(?:cut\\s+(?:into|in|lengthways|crossways)|made\\s+with|prepared\\s+with|${partPreparation})\\b`,
  'i',
)

export const preparationNotePattern = new RegExp(
  `,\\s*(?:${preparationLead}|cut|torn|made with|prepared with|${partPreparation})\\b.*$`,
  'i',
)

export function isPreparationContinuation(text) {
  return preparationContinuation.test(text)
}

const authorPreference = String.raw`(?:i|we)\s+(?:personally\s+)?prefer\b`
const choicePreference = String.raw`use\s+(?:whichever|whatever|what)\s+you\s+prefer\b`
const conditionalPreference = String.raw`if\s+(?:you\s+prefer|preferred)\b`
const preference = `(?:${authorPreference}|${choicePreference}|${conditionalPreference})`
const standalonePreference = new RegExp(
  `^(?:\\(\\s*|[-–—]\\s+)?(?:${authorPreference}|${choicePreference}|${conditionalPreference}[.)!?]*$)`,
  'i',
)
const parentheticalPreference = new RegExp(`\\(\\s*(${preference}[^()]*)\\)`, 'gi')
const trailingPreference = new RegExp(
  `(?:\\s*[.,;:–—]\\s*|\\s+-\\s+)(${preference}.*)$|\\s+(${authorPreference}.*)$`,
  'i',
)

export function isIngredientPreferenceNote(text) {
  return standalonePreference.test(text)
}

// Remove only explicit commentary from the text used to identify a product.
// Parenthetical notes can appear before a real "or" substitution.
export function splitIngredientPreferences(text) {
  const notes = []
  const withoutParentheses = text.replace(parentheticalPreference, (_, note) => {
    notes.push(note.trim())
    return ' '
  })
  const tail = withoutParentheses.match(trailingPreference)
  if (tail) notes.push(tail[1] || tail[2])
  const ingredientText = tail
    ? withoutParentheses.slice(0, tail.index)
    : withoutParentheses
  return { ingredientText: ingredientText.trim(), notes }
}
