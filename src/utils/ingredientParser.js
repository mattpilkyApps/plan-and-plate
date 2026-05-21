const knownUnits = [
  'g',
  'kg',
  'ml',
  'l',
  'tsp',
  'tbsp',
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

function cleanIngredientText(text) {
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

function buildQuantityPattern() {
  const unitPattern = knownUnits.map(escapeRegExp).join('|')
  const numberWordPattern = getNumberWordPattern()

  return `(?:\\d+(?:\\.\\d+)?|${numberWordPattern})(?:\\s*x)?\\s*(?:${unitPattern})?\\s+`
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
      const cleanedLine = cleanIngredientText(line)
      const quantityMatches = cleanedLine.match(new RegExp(quantityPattern, 'gi'))

      if (
        /[,.]\s+/.test(cleanedLine) &&
        quantityMatches &&
        quantityMatches.length > 1
      ) {
        return cleanedLine.split(/[,.]\s+/)
      }

      return cleanedLine.split(splitBeforeQuantity)
    })
    .map(cleanIngredientText)
    .filter(Boolean)
}

function splitAmountAndName(line) {
  const numberWordPattern = getNumberWordPattern()
  const match = line.match(
    new RegExp(
      `^(\\d+(?:\\.\\d+)?|${numberWordPattern})(?:\\s*x)?(?:\\s*)?([a-zA-Z]+)?\\s+(.+)$`,
      'i',
    ),
  )

  if (!match) {
    return null
  }

  const amount = numberWords[match[1].toLowerCase()] || match[1]

  return {
    amount,
    possibleUnit: match[2] || '',
    restOfLine: match[3],
  }
}

function splitNameAndAmount(line) {
  const numberWordPattern = getNumberWordPattern()
  const match = line.match(
    new RegExp(
      `^(.+?)\\s+(\\d+(?:\\.\\d+)?|${numberWordPattern})(?:\\s*x)?(?:\\s*)?([a-zA-Z]+)?$`,
      'i',
    ),
  )

  if (!match) {
    return null
  }

  const amount = numberWords[match[2].toLowerCase()] || match[2]

  return {
    amount,
    possibleUnit: match[3] || '',
    restOfLine: match[1],
  }
}

function buildIngredientFromParts(rawText, parsedLine) {
  const unit = parsedLine.possibleUnit.toLowerCase()

  if (unit && knownUnits.includes(unit)) {
    return {
      rawText,
      quantity: parsedLine.amount,
      unit: parsedLine.possibleUnit,
      name: parsedLine.restOfLine.trim(),
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
        name: words.slice(0, -1).join(' '),
      }
    }

    return {
      rawText,
      quantity: parsedLine.amount,
      unit: '',
      name: parsedLine.restOfLine.trim(),
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
      name: words.slice(0, -1).join(' '),
    }
  }

  if (fullIngredientName) {
    return {
      rawText,
      quantity: parsedLine.amount,
      unit: '',
      name: fullIngredientName,
    }
  }

  return null
}

export function parseIngredientLine(line) {
  const rawText = cleanIngredientText(line)

  if (!rawText) {
    return null
  }

  const fallbackIngredient = {
    rawText,
    quantity: '',
    unit: '',
    name: rawText,
  }

  const parsedLine = splitAmountAndName(rawText)

  if (parsedLine) {
    return buildIngredientFromParts(rawText, parsedLine) || fallbackIngredient
  }

  const trailingAmountLine = splitNameAndAmount(rawText)

  if (trailingAmountLine) {
    return (
      buildIngredientFromParts(rawText, trailingAmountLine) ||
      fallbackIngredient
    )
  }

  return fallbackIngredient
}

export function parseIngredients(ingredientsText) {
  return splitPastedIngredients(ingredientsText)
    .map(parseIngredientLine)
    .filter(Boolean)
}
