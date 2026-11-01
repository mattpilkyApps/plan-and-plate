// Explainable evidence, shared by the stateful extractor. A cooking word is
// evidence, not permission to import an otherwise obvious product or footer.
const actions = /\b(?:add|bake|beat|blend|boil|brush|chop|combine|cook|drain|fold|fry|grill|heat|reheat|defrost|knead|mix|peel|pour|roast|season|simmer|slice|stir|whisk|preheat|saute|sauté|soften|chill|cool|freeze|refrigerate|serve|scatter|squeeze|sprinkle|melt|toast|steam|strain|marinate|rest|roll|cover|remove|transfer|leave|set aside)\b/i
const specificActions = /\b(?:bake|beat|blend|boil|chop|combine|drain|fry|grill|heat|reheat|defrost|knead|mix|peel|roast|season|simmer|slice|stir|whisk|preheat|saute|sauté|soften|chill|refrigerate|squeeze|melt|toast|steam|strain|marinate)\b/i
const equipment = /\b(?:pan|pot|oven|bowl|tray|saucepan|skillet|wok|hob|griddle|blender|mixer|dish|rack|tin|sieve|colander|air fryer|slow cooker|pressure cooker)\b/i
const cookingStates = /\b(?:golden|tender|softened|browned|bubbling|fragrant|thickened|translucent|crisp|crispy|dough|batter|sauce|ingredients|mixture|cooked|uncooked|wobble)\b/i
const duration = /\b\d+(?:[–-]\d+)?\s*(?:seconds?|secs?|minutes?|mins?|hours?|hrs?)\b/i
const temperature = /\b\d+\s*(?:°\s*[cf]|degrees?\s*[cf]|[cf]\b)|\bgas\s*(?:mark\s*)?\d/i
const price = /[£$€]\s*\d+(?:[.,]\d{2})?|\b\d+(?:[.,]\d{2})?\s*(?:GBP|USD|EUR)\b/i

export function sectionHeading(text) {
  return text.replace(/:$/, '').trim().toLowerCase()
}

export function primaryRecipeHeading(text) {
  const heading = sectionHeading(text)
  if (/^(?:ingredients?(?:\s*\([^)]*\))?|you will need|what you(?:'|’)ll need)$/.test(heading)) return 'INGREDIENT_HEADING'
  if (/^(?:method|instructions|directions|preparation|steps|cooking instructions)$/.test(heading)) return 'METHOD_HEADING'
  return null
}

export function isMethodStepLabel(text) {
  return /^(?:(?:step|stage)\s*\d+(?:\s*(?:of|\/)\s*\d+)?|\d+[.)])[.:]?$/i.test(text)
}

export function splitMethodNumber(text) {
  const explicit = text.match(/^(?:\d+[.)]\s+|(?:step|stage)\s*\d+[.:]?\s+)(.+)$/i)
  if (explicit) return { text: explicit[1], numbered: true }
  const bare = text.match(/^\d{1,2}\s+(.+)$/)
  if (bare && /^\p{Lu}/u.test(bare[1]) && !/^(?:seconds?|secs?|minutes?|mins?|hours?|hrs?)\b/i.test(bare[1])) {
    return { text: bare[1], numbered: true }
  }
  return { text, numbered: false }
}

export function isRecipeEndHeading(text) {
  const heading = sectionHeading(text)
  return heading.length < 120 && (
    /^(?:nutrition(?:al information)?)(?:\s*[:(]|\s+per\b|$)/.test(heading) ||
    /^(?:reviews?|comments?)(?:\s*(?:\(\d+\)|\d+))?$/.test(heading) ||
    /^(?:related recipes|recommended recipes|more recipes|recipes you may like|you (?:may|might) also like|about (?:the )?author|faqs?|frequently asked questions|newsletter|shop|shop ingredients|tags|featured products|additional info)$/.test(heading) ||
    /^did you make this(?: recipe)?\??$/.test(heading) ||
    /^(?:recipe (?:from|source)\b|more from around the web$|from around the web$)/.test(heading) ||
    /^(?:leave a (?:review|comment)|subscribe\b|sign up\b|join our newsletter\b|privacy policy\b|all rights reserved\b)/.test(heading)
  )
}

export function classifyRecipeBlock(line, ingredientWords = new Set()) {
  const numbered = splitMethodNumber(line.text)
  const text = numbered.text
  const heading = sectionHeading(text)
  if (isRecipeEndHeading(text)) return { type: 'FOOTER', text, numbered: numbered.numbered, cooking: 0 }
  const primaryHeading = primaryRecipeHeading(text)
  if (primaryHeading) return { type: primaryHeading, text, cooking: 0 }
  if (isMethodStepLabel(line.text)) return { type: 'STEP_LABEL', text, cooking: 0 }
  if (/^(?:recipe|cook['’]?s) tips?$/.test(heading)) return { type: 'RECIPE_NOTE_HEADING', text, cooking: 0 }
  if (/^(?:notes|tips|tips (?:from|by) .+|cook['’]?s notes|equipment|storage|make ahead|freezing|substitutions|variations|video)$/.test(heading)) return { type: 'AUXILIARY_HEADING', text, cooking: 0 }
  if (/^(?:perfect your technique|recipe inspiration|from our blog)$/.test(heading)) return { type: 'PROMOTION', text, cooking: 0 }

  const evidence = {
    action: actions.test(text), specificAction: specificActions.test(text),
    equipment: equipment.test(text), state: cookingStates.test(text),
    duration: duration.test(text), temperature: temperature.test(text),
    ingredient: text.toLowerCase().split(/[^\p{L}]+/u).some((word) => ingredientWords.has(word)),
    price: price.test(text),
  }
  // "A new season..." uses a cooking verb as a noun. Article-led slogans
  // need some actual recipe-domain evidence before earning that extra score.
  if (/^(?:a|an|your|our|new)\b/i.test(text) &&
    !evidence.equipment && !evidence.state && !evidence.duration && !evidence.temperature && !evidence.ingredient) {
    evidence.specificAction = false
  }
  let cooking = Number(evidence.action) + 2 * Number(evidence.specificAction) +
    Number(evidence.equipment) + Number(evidence.state) +
    Number(evidence.duration) + Number(evidence.temperature) + Number(evidence.ingredient)
  if (/^(?:serve|enjoy|cover|leave|rest|set aside)[.!]?$/.test(heading)) cooking += 2

  let type = 'UNKNOWN'
  if (text.length < 160 && /(?:^(?:ad|advertisement|advertising|sponsored)(?:\s+(?:content|message))?$|\s+(?:ad|advertisement)$)/i.test(text)) {
    type = 'ADVERTISEMENT'
  } else if (evidence.price && text.length < 180 &&
    (!evidence.action || (!evidence.duration && !evidence.temperature && !evidence.state && !evidence.ingredient))) {
    type = 'PRODUCT'
  } else if (/^(?:share(?:\s+this recipe)?|facebook|pinterest|instagram|print(?: recipe)?|save(?: recipe)?|back to top|home|menu|sign in|log in|jump to recipe|(?:cook|bake) mode\b.*|off on|keep (?:the )?screen\b.*)$/i.test(text) ||
    /^(?:\d+(?:\.\d+)?\s*(?:ratings?|votes?|reviews?)\b|a star rating\b|photo credit\b|photography by\b)/i.test(text)) {
    type = 'NAVIGATION'
  } else if (cooking >= 2) {
    type = 'METHOD_STEP'
  }
  return { type, text, numbered: numbered.numbered, cooking, evidence }
}

// A short prepared-food name such as "roast potatoes" is insufficient evidence.
// Before any ingredients, require an instruction opening as well as cooking
// evidence so descriptive recipe introductions do not start a method.
export function isStrongMethodStart(text, { requireOpening = false } = {}) {
  const block = classifyRecipeBlock({ text })
  if (requireOpening && !block.numbered && actions.exec(block.text)?.index !== 0 &&
    !/^(?:in|using|with|first|next|then|meanwhile|once|when|to begin|start by)\b/i.test(block.text)) return false
  const sentence = /[.!?](?:\s|$)/.test(block.text) || (!requireOpening && block.text.split(/\s+/).length >= 8)
  return block.type === 'METHOD_STEP' && block.cooking >= 3 && block.evidence.action &&
    (block.numbered || sentence) && (!/^\d/.test(text) || block.numbered)
}
