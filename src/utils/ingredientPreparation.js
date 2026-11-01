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
