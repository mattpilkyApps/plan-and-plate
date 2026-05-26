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
]

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
const measureModifiers = ['level', 'heaped', 'rounded']
const nameCleanups = [
  /^\s*(?:small|large)?\s*handful\s+(?:of\s+)?/i,
  /\b(?:finely|roughly|thinly)\b/gi,
  /\b(?:chopped|diced|sliced|minced|grated)\b/gi,
  /\b(?:peeled|crushed|drained|rinsed|sifted)\b/gi,
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
    .replace(/^(?:pinch|sprinkle)\s+(?:of\s+)?/i, '')
    .replace(unicodeFractionPattern, (fraction) => {
      return unicodeFractions[fraction] || fraction
    })
    .replace(/\s*\/\s*/g, '/')
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
  const rangePattern = '(?:-\\d+(?:\\.\\d+)?)?'

  return `(?:${mixedFractionPattern}|${numberPattern}${rangePattern}|${numberWordPattern})`
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

function getUnitBoundaryPattern() {
  return `(?:${getUnitPattern()})\\b`
}

function getMeasureModifierPattern() {
  return `(?:${measureModifiers.join('|')})`
}

function buildQuantityPattern() {
  const unitPattern = getUnitBoundaryPattern()
  const quantityValuePattern = getQuantityValuePattern()

  return `${quantityValuePattern}(?:\\s*x)?\\s*(?:${getMeasureModifierPattern()}\\s+)?(?:${unitPattern})?\\s+`
}

function removeMeasuredAlternative(line) {
  const quantityValuePattern = getQuantityValuePattern()

  return line
    .replace(new RegExp(`\\s+or\\s+${quantityValuePattern}\\b.*$`, 'i'), '')
    .trim()
}

function isPackageMultiplierLine(line) {
  const quantityValuePattern = getQuantityValuePattern()
  const unitPattern = getUnitBoundaryPattern()

  return new RegExp(
    `^\\d+\\s*x\\s*${quantityValuePattern}\\s*${unitPattern}\\s+`,
    'i',
  ).test(line)
}

function hasDualMeasurementLine(line) {
  const quantityValuePattern = getQuantityValuePattern()
  const metricUnitPattern = `(?:${metricUnits.map(escapeRegExp).join('|')})\\b`

  return new RegExp(
    `^${quantityValuePattern}\\s*${metricUnitPattern}\\s*/`,
    'i',
  ).test(line)
}

function splitPastedIngredients(text) {
  const normalizedText = text
    .replace(/\r/g, '\n')
    .replace(/\u2022/g, '\n')
    .replace(/;/g, '\n')
    .trim()

  const quantityPattern = buildQuantityPattern()
  const splitBeforeQuantity = new RegExp(`\\s+(?=${quantityPattern})`, 'gi')

  return normalizedText
    .split('\n')
    .flatMap((line) => {
      const displayLine = cleanIngredientRawText(line)
      const cleanedLine = removeMeasuredAlternative(cleanIngredientText(line))
      const quantityMatches = cleanedLine.match(new RegExp(quantityPattern, 'gi'))

      if (isInstructionOnlyLine(cleanedLine)) {
        return displayLine
      }

      if (/^\d+\s+\d+\/\d+\b/.test(cleanedLine)) {
        return displayLine
      }

      if (isPackageMultiplierLine(cleanedLine)) {
        return displayLine
      }

      if (hasDualMeasurementLine(cleanedLine)) {
        return displayLine
      }

      if (
        /[,.]\s+/.test(cleanedLine) &&
        quantityMatches &&
        quantityMatches.length > 1
      ) {
        return cleanedLine.split(/[,.]\s+/)
      }

      const splitIngredients = cleanedLine.split(splitBeforeQuantity)

      return splitIngredients.length > 1 ? splitIngredients : displayLine
    })
    .map(cleanIngredientRawText)
    .filter(Boolean)
}

function splitAmountAndName(line) {
  const quantityValuePattern = getQuantityValuePattern()
  const unitPattern = getUnitCapturePattern()
  const match = line.match(
    new RegExp(
      `^(${quantityValuePattern})(?:\\s*x)?\\s*(?:${getMeasureModifierPattern()}\\s+)?(?:${unitPattern})?\\s*(.+)$`,
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
  const unit = parsedLine.possibleUnit.toLowerCase()
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
      unit: parsedLine.possibleUnit,
      name: cleanIngredientName(parsedLine.restOfLine),
    }
  }

  if (!unit) {
    const words = parsedLine.restOfLine.trim().split(' ')
    const lastWord = words[words.length - 1].toLowerCase()

    if (words.length > 1 && knownUnits.includes(lastWord)) {
      return {
        rawText,
        quantity: parsedLine.amount,
        unit: words[words.length - 1],
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
      unit: words[words.length - 1],
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
      `^(\\d+)\\s*x\\s*(${quantityValuePattern})\\s*${unitPattern}\\s+(.+)$`,
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
    unit: match[3],
    name: cleanIngredientName(match[4]),
  }
}

function normalizeQuantity(quantity) {
  const cleanQuantity = quantity.trim().toLowerCase()
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
  const unit = parsedLine.possibleUnit.toLowerCase()

  if (!metricUnits.includes(unit)) {
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
    unit: parsedLine.possibleUnit,
    name: dualMeasureMatch[1],
  }
}

export function cleanIngredientName(name) {
  const cleanedName = nameCleanups.reduce(
    (currentName, pattern) => currentName.replace(pattern, ''),
    name,
  )

  return cleanedName
    .replace(/\([^)]*\)/g, '')
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
  const cleanLine = cleanIngredientText(line)

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

  const fallbackIngredient = {
    rawText: originalRawText,
    quantity: '',
    unit: '',
    name: cleanIngredientName(rawText),
  }

  const parsedLine = splitAmountAndName(rawText)
  const packageMultiplierIngredient = parsePackageMultiplierLine(
    originalRawText,
    rawText,
  )

  if (packageMultiplierIngredient) {
    return packageMultiplierIngredient
  }

  if (parsedLine) {
    return (
      buildIngredientFromParts(originalRawText, parsedLine) ||
      fallbackIngredient
    )
  }

  const trailingAmountLine = splitNameAndAmount(rawText)

  if (trailingAmountLine) {
    return (
      buildIngredientFromParts(originalRawText, trailingAmountLine) ||
      fallbackIngredient
    )
  }

  return fallbackIngredient
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
