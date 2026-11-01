const knownUnits = [
  'g',
  'kg',
  'ml',
  'l',
  'tsp',
  'tbsp',
  'oz',
  'lb',
  'lbs',
  'pinch',
  'pinches',
  'cup',
  'cups',
  'clove',
  'cloves',
  'bulb',
  'bulbs',
  'pack',
  'packs',
  'tin',
  'tins',
  'can',
  'cans',
  'handful',
  'handfuls',
  'stalk',
  'stalks',
  'sprig',
  'sprigs',
  'piece',
  'pieces',
  'bunch',
  'bunches',
  'packet',
  'packets',
  'slice',
  'slices',
  'teaspoon',
  'teaspoons',
  'tablespoon',
  'tablespoons',
  'ounce',
  'ounces',
  'pound',
  'pounds',
  'gram',
  'grams',
  'kilogram',
  'kilograms',
  'millilitre',
  'millilitres',
  'milliliter',
  'milliliters',
  'litre',
  'litres',
  'liter',
  'liters',
]

const unitAliases = {
  teaspoon: 'tsp', teaspoons: 'tsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  ounce: 'oz', ounces: 'oz', pound: 'lb', pounds: 'lbs',
  gram: 'g', grams: 'g', kilogram: 'kg', kilograms: 'kg',
  millilitre: 'ml', millilitres: 'ml', milliliter: 'ml', milliliters: 'ml',
  litre: 'l', litres: 'l', liter: 'l', liters: 'l',
}

function canonicalUnit(unit) {
  return unitAliases[unit.toLowerCase()] || unit.toLowerCase()
}

const numberWords = {
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
}

const unicodeFractions = {
  '\u00bc': '1/4',
  '\u00bd': '1/2',
  '\u00be': '3/4',
  '\u2153': '1/3',
  '\u2154': '2/3',
  '\u215b': '1/8',
  '\u215c': '3/8',
  '\u215d': '5/8',
  '\u215e': '7/8',
  '\u00c2\u00bc': '1/4',
  '\u00c2\u00bd': '1/2',
  '\u00c2\u00be': '3/4',
}

const metricUnits = ['g', 'kg', 'ml', 'l']
const measureModifiers = ['level', 'heaped', 'rounded', 'small', 'medium', 'large']
const preparationWords =
  'chopped|diced|sliced|minced|grated|peeled|crushed|bashed|drained|rinsed|deseeded|trimmed|sifted|cubed|softened|beaten|shredded|pressed|melted'
const preparationAdverbs = 'finely|roughly|thinly|freshly'
const preparationNotePattern = new RegExp(
  `,\\s*(?:(?:${preparationAdverbs})\\s+)?(?:${preparationWords}|cut|torn)\\b.*$`,
  'i',
)
const nameCleanups = [
  /^\s*(?:small|large)?\s*handful\s+(?:of\s+)?/i,
  /\b(?:finely|roughly|thinly|freshly)\b/gi,
  /\b(?:chopped|diced|sliced|minced|grated)\b/gi,
  /\b(?:peeled|crushed|bashed|drained|rinsed|deseeded|trimmed|sifted)\b/gi,
  /\b(?:cubed|softened|beaten|shredded|pressed|melted)\b/gi,
  /\b(?:boneless|skinless|skin removed|room temperature)\b/gi,
  /\b(?:at room temperature|juice only|zest and juice|split)\b/gi,
  /\b(?:optional|to taste)\b/gi,
  /\b(?:cooked according to pack instructions)\b/gi,
]

const rejectedIngredientPatterns = [
  /^ingredients?$/i,
  /^to serve$/i,
  /^for serving$/i,
  /^optional$/i,
  /^method$/i,
  /^instructions?$/i,
  /^directions?$/i,
  /^jump to recipe$/i,
  /^print$/i,
  /^share$/i,
  /^nutrition$/i,
  /^advertisement$/i,
  /^cook(?:'|\u2019)?s notes?$/i,
  /^for\s+(?:the\s+)?/i,
]

const instructionPatterns = [
  /^preheat\b/i,
  /^bake for\b/i,
  /^cook until\b/i,
  /^stir in\b/i,
  /^mix together\b/i,
  /^set aside\b/i,
  /^serve with\b/i,
  /\bcooked according to pack instructions\b/i,
]

const instructionOnlyPattern =
  /^(?:preheat|bake for|cook until|stir in|mix together|set aside|serve with)\b/i

const trailingPrepPhrases = [
  'finely chopped',
  'roughly chopped',
  'thinly sliced',
  'chopped',
  'sliced',
  'diced',
  'crushed',
  'minced',
  'peeled',
  'grated',
  'sifted',
  'room temperature',
  'at room temperature',
  'skin removed',
  'boneless',
  'skinless',
  'juice only',
  'zest and juice',
  'split',
  'cooked',
]

const prepTailPattern = new RegExp(
  `\\s*,?\\s*(?:${trailingPrepPhrases.join('|')})\\b.*$`,
  'i',
)
const unicodeFractionPattern =
  /(?:\u00c2)?[\u00bc\u00bd\u00be\u2153\u2154\u215b\u215c\u215d\u215e]/g

export function cleanIngredientText(text) {
  return cleanIngredientRawText(text)
    .replace(
      new RegExp(`(\\d)(${unicodeFractionPattern.source})`, 'g'),
      '$1 $2',
    )
    .replace(unicodeFractionPattern, (fraction) => {
      return unicodeFractions[fraction] || fraction
    })
    .replace(/\s*\/\s*/g, '/')
    .replace(/(\d)\s*[–—]\s*(\d)/g, '$1-$2')
    .replace(/(\d)\s+and\s+(\d+\/\d+)/gi, '$1 $2')
    .replace(/\b(tsp|tbsp|oz|lb|lbs)\.(?=\s|$)/gi, '$1')
    .trim()
}

function cleanIngredientRawText(text) {
  return text
    .trim()
    .replace(/^[\s\-*\u2022?]+/, '')
    .replace(/\s+/g, ' ')
    .replace(/[,.]+$/, '')
    .trim()
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getNumberWordPattern() {
  return Object.keys(numberWords).join('|')
}

function getQuantityValuePattern() {
  const numberWordPattern = getNumberWordPattern()
  const mixedFractionPattern = '\\d+\\s+\\d+/\\d+'
  const numberPattern = '\\d+(?:\\.\\d+)?(?:/\\d+(?:\\.\\d+)?)?'
  const scalar = `(?:${mixedFractionPattern}|${numberPattern}|${numberWordPattern})`
  return `${scalar}(?:\\s*(?:-|to)\\s*${scalar})?`
}

function getUnitPattern() {
  return [...knownUnits]
    .sort((firstUnit, secondUnit) => secondUnit.length - firstUnit.length)
    .map(escapeRegExp)
    .join('|')
}

function getUnitCapturePattern() {
  return `(${getUnitPattern()})\\b`
}

function getMeasureModifierPattern() {
  return `(?:${measureModifiers.join('|')})`
}

function splitPastedIngredients(text) {
  // The creator and extractor supply one ingredient per line. Numbers inside
  // alternatives, pack sizes and preparation notes are not new ingredients.
  const lines = []
  let current = ''
  let depth = 0
  for (const character of text) {
    if (character === '(') depth += 1
    if (character === ')') depth = Math.max(0, depth - 1)
    if (/[\r\n]/.test(character) || (depth === 0 && /[\u2022;]/.test(character))) {
      if (current.trim()) lines.push(cleanIngredientRawText(current))
      current = ''
    } else current += character
  }
  if (current.trim()) lines.push(cleanIngredientRawText(current))
  return lines.filter(Boolean)
}

function splitAmountAndName(line) {
  const quantityValuePattern = getQuantityValuePattern()
  const unitPattern = getUnitCapturePattern()
  const match = line.match(
    new RegExp(
      `^(${quantityValuePattern})(?![\\d./])\\s*(?:${getMeasureModifierPattern()}\\s+)?(?:${unitPattern})?\\s*(.+)$`,
      'i',
    ),
  )

  if (!match) {
    return null
  }

  const amount = normalizeQuantity(match[1])

  return {
    amount,
    possibleUnit: match[2] || '',
    restOfLine: match[3],
  }
}

function splitNameAndAmount(line) {
  const quantityValuePattern = getQuantityValuePattern()
  const unitPattern = getUnitCapturePattern()
  const match = line.match(
    new RegExp(
      `^(.+?)\\s+(${quantityValuePattern})(?:\\s*x)?\\s*(?:${getMeasureModifierPattern()}\\s+)?(?:${unitPattern})?$`,
      'i',
    ),
  )

  if (!match) {
    return null
  }

  const amount = normalizeQuantity(match[2])

  return {
    amount,
    possibleUnit: match[3] || '',
    restOfLine: match[1],
  }
}

function buildIngredientFromParts(rawText, parsedLine) {
  const unit = canonicalUnit(parsedLine.possibleUnit)
  const preferredMetric = getPreferredMetricParts(parsedLine)

  if (preferredMetric) {
    return {
      rawText,
      quantity: preferredMetric.amount,
      unit: preferredMetric.unit,
      name: cleanIngredientName(preferredMetric.name),
    }
  }

  if (unit && knownUnits.includes(unit)) {
    return {
      rawText,
      quantity: parsedLine.amount,
      unit,
      name: cleanIngredientName(parsedLine.restOfLine),
    }
  }

  if (!unit) {
    const words = cleanIngredientName(parsedLine.restOfLine).split(' ')
    const lastWord = words[words.length - 1].toLowerCase()

    if (words.length > 1 && knownUnits.includes(lastWord)) {
      return {
        rawText,
        quantity: parsedLine.amount,
        unit: canonicalUnit(words[words.length - 1]),
        name: cleanIngredientName(words.slice(0, -1).join(' ')),
      }
    }

    return {
      rawText,
      quantity: parsedLine.amount,
      unit: '',
      name: cleanIngredientName(parsedLine.restOfLine),
    }
  }

  const fullIngredientName =
    `${parsedLine.possibleUnit} ${parsedLine.restOfLine}`.trim()
  const words = fullIngredientName.split(' ')
  const lastWord = words[words.length - 1].toLowerCase()

  if (words.length > 1 && knownUnits.includes(lastWord)) {
    return {
      rawText,
      quantity: parsedLine.amount,
      unit: canonicalUnit(words[words.length - 1]),
      name: cleanIngredientName(words.slice(0, -1).join(' ')),
    }
  }

  if (fullIngredientName) {
    return {
      rawText,
      quantity: parsedLine.amount,
      unit: '',
      name: cleanIngredientName(fullIngredientName),
    }
  }

  return null
}

function parsePackageMultiplierLine(rawText, line) {
  const quantityValuePattern = getQuantityValuePattern()
  const unitPattern = getUnitCapturePattern()
  const match = line.match(
    new RegExp(
      `^(\\d+)\\s*[x\u00d7]\\s*(${quantityValuePattern})\\s*${unitPattern}\\s+(.+)$`,
      'i',
    ),
  )

  if (!match) {
    return null
  }

  const multiplier = Number(match[1])
  const packageQuantity = Number(normalizeQuantity(match[2]))

  if (!multiplier || Number.isNaN(packageQuantity)) {
    return null
  }

  return {
    rawText,
    quantity: String(multiplier * packageQuantity),
    unit: canonicalUnit(match[3]),
    name: cleanIngredientName(match[4]),
  }
}

function parseCountedPackageLine(rawText, line) {
  const match = line.match(/^(\d+)\s*\((\d+(?:\.\d+)?)\s*(kg|g|ml|l)\)\s*(?:cans?|tins?|packs?|packets?)\s+(?:of\s+)?(.+)$/i)
  if (!match) return null
  return {
    rawText, quantity: String(Number(match[1]) * Number(match[2])),
    unit: match[3].toLowerCase(), name: cleanIngredientName(match[4]),
  }
}

function normalizeQuantity(quantity) {
  const cleanQuantity = quantity.trim().toLowerCase()
  const range = cleanQuantity.split(/\s*(?:-|\bto\b)\s*/)
  if (range.length === 2) return range.map(normalizeQuantity).join('-')
  const numberWord = numberWords[cleanQuantity]

  if (numberWord) {
    return numberWord
  }

  if (cleanQuantity.includes(' ')) {
    const [wholeNumber, fraction] = cleanQuantity.split(/\s+/)
    const fractionValue = getFractionValue(fraction)

    if (fractionValue === null) {
      return cleanQuantity
    }

    return String(Number(wholeNumber) + fractionValue)
  }

  const fractionValue = getFractionValue(cleanQuantity)

  if (fractionValue !== null) {
    return String(fractionValue)
  }

  return cleanQuantity
}

function getFractionValue(quantity) {
  const match = quantity.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/)

  if (!match) {
    return null
  }

  const numerator = Number(match[1])
  const denominator = Number(match[2])

  if (!denominator) {
    return null
  }

  return numerator / denominator
}

function getPreferredMetricParts(parsedLine) {
  const unit = canonicalUnit(parsedLine.possibleUnit)

  if (!metricUnits.includes(unit)) {
    // Use only an explicit equivalent amount immediately after the primary
    // measure; never convert cups/ounces to weight using guessed densities.
    const parenthetical = parsedLine.restOfLine.match(/^\(([^)]+)\)\s*(.+)$/)
    const metric = parenthetical?.[1].match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/i)
    const convertibleMeasure = ['cup', 'cups', 'oz', 'lb', 'lbs', 'tsp', 'tbsp'].includes(unit)
    if (metric && convertibleMeasure) {
      return { amount: metric[1], unit: metric[2].toLowerCase(), name: parenthetical[2] }
    }
    const slash = parsedLine.restOfLine.match(/^\/\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\s+(.+)$/i)
    if (slash && convertibleMeasure) return { amount: slash[1], unit: slash[2].toLowerCase(), name: slash[3] }
    return null
  }


  const dualMeasureMatch = parsedLine.restOfLine.match(
    /^\/\d+(?:\.\d+)?(?:\s+\d+\/\d+|\/\d+(?:\.\d+)?)?\s*(?:fl\s*)?(?:oz|lb|lbs|pint|pints|pt)\s+(.+)$/i,
  )

  if (!dualMeasureMatch) {
    return null
  }

  return {
    amount: parsedLine.amount,
    unit,
    name: dualMeasureMatch[1],
  }
}

export function cleanIngredientName(name) {
  const primaryName = name
    .replace(/\s+or\s+.+$/i, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s*,?\s+(?:plus|extra|for serving|to serve|to taste)\b.*$/i, '')
    .replace(preparationNotePattern, '')
  const cleanedName = nameCleanups.reduce(
    (currentName, pattern) => currentName.replace(pattern, ''),
    primaryName,
  )

  return cleanedName
    .replace(/\([^)]*\)/g, '')
    .replace(/^of\s+/i, '')
    .replace(/^(?:tin|can)s?\s+(?:of\s+)?/i, '')
    .replace(/\s+mixed with\s+.+$/i, '')
    .replace(/\s+or\s+.+$/i, '')
    .replace(prepTailPattern, '')
    .replace(/\s*,?\s*(?:plus extra|extra|for serving|to serve).*$/i, '')
    .replace(/\s*,?\s*and\s*$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/^[, ]+|[, ]+$/g, '')
    .trim()
}

export function isRejectedIngredientLine(line) {
  const cleanLine = cleanIngredientText(line).replace(/:$/, '')

  return rejectedIngredientPatterns.some((pattern) => pattern.test(cleanLine))
}

export function isInstructionLikeIngredientLine(line) {
  const cleanLine = cleanIngredientText(line)

  return instructionPatterns.some((pattern) => pattern.test(cleanLine))
}

function isInstructionOnlyLine(line) {
  return instructionOnlyPattern.test(cleanIngredientText(line))
}

export function ingredientHasAlternative(line) {
  return /\bor\b/i.test(cleanIngredientText(line))
}

function getIngredientQualifiers(text) {
  const alternative = text.match(/\bor\s+.+$/i)?.[0]
  const primary = text.replace(/\s+or\s+.+$/i, '')
  const note = primary.match(preparationNotePattern)?.[0].replace(/^,\s*/, '')
  const preparation = primary
    .replace(preparationNotePattern, '')
    .match(new RegExp(
      `\\b(?:(?:${preparationAdverbs})\\s+)?(?:${preparationWords})\\b`,
      'gi',
    )) || []
  const modifier = primary.match(
    new RegExp(
      `^(?:${getQuantityValuePattern()}\\s*)?(${getMeasureModifierPattern()})\\s+`,
      'i',
    ),
  )?.[1]
  const extra = primary.match(
    /\b(?:plus|extra|to taste|for serving|to serve)\b.*$/i,
  )?.[0]
  const parentheticalNotes = [...primary.matchAll(/\(([^)]+)\)/g)].map(
    (match) => match[1],
  )
  const qualifiers = [
    modifier, ...preparation, note, ...parentheticalNotes, extra, alternative,
    text.match(/^(?:about|approximately|approx\.?)\b/i)?.[0],
    /\boptional\b/i.test(text) ? 'optional' : '',
  ]
  return [...new Set(qualifiers.filter(Boolean))]
}

export function parseIngredientLine(line) {
  const rawText = cleanIngredientText(line)
  const originalRawText = cleanIngredientRawText(line)

  if (
    !rawText ||
    isRejectedIngredientLine(rawText) ||
    isInstructionOnlyLine(rawText)
  ) {
    return null
  }

  const parseableText = rawText.replace(/^(?:(?:optional\s*:|about\b|approximately\b|approx\.?\s)\s*)+/i, '')
  if (/^(?:\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?)(?:\s*(?:g|kg|ml|l|tsp|tbsp|cups?))?$/i.test(parseableText)) return null

  const fallbackIngredient = {
    rawText: originalRawText,
    quantity: '',
    unit: '',
    name: cleanIngredientName(parseableText),
  }

  const implicitMeasure = rawText.match(
    /^(?:a\s+)?(?:(?:small|large)\s+)?(pinch|handful)\s+(?:of\s+)?(.+)$/i,
  )
  const parsedLine = splitAmountAndName(parseableText) || splitNameAndAmount(parseableText)
  const packageMultiplierIngredient = parsePackageMultiplierLine(
    originalRawText,
    parseableText,
  )

  let ingredient = packageMultiplierIngredient || parseCountedPackageLine(originalRawText, parseableText)
  if (!ingredient && implicitMeasure) {
    ingredient = {
      rawText: originalRawText,
      quantity: '1',
      unit: implicitMeasure[1].toLowerCase(),
      name: cleanIngredientName(implicitMeasure[2]),
    }
  }
  if (!ingredient && parsedLine) {
    ingredient = buildIngredientFromParts(originalRawText, parsedLine)
  }
  ingredient ||= fallbackIngredient
  if (!ingredient.name) return null
  const qualifiers = getIngredientQualifiers(rawText)
  return qualifiers.length ? { ...ingredient, qualifiers } : ingredient
}

export function formatIngredientForSingleUnit(ingredient) {
  const ingredientName = cleanIngredientName(
    ingredient.name || ingredient.rawText,
  )

  if (!ingredient.quantity) {
    return ingredientName || ingredient.rawText
  }

  return [ingredient.quantity, ingredient.unit, ingredientName]
    .filter(Boolean)
    .join(' ')
}

export function parseIngredients(ingredientsText) {
  return splitPastedIngredients(ingredientsText)
    .map(parseIngredientLine)
    .filter(Boolean)
}
