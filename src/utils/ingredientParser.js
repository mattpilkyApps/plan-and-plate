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

function splitAmountAndName(line) {
  const match = line.match(/^(\d+(?:\.\d+)?)(?:\s*)?([a-zA-Z]+)?\s+(.+)$/)

  if (!match) {
    return null
  }

  return {
    amount: match[1],
    possibleUnit: match[2] || '',
    restOfLine: match[3],
  }
}

export function parseIngredientLine(line) {
  const rawText = line.trim()

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

  if (!parsedLine) {
    return fallbackIngredient
  }

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

  const fullIngredientName = `${parsedLine.possibleUnit} ${parsedLine.restOfLine}`.trim()
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

  return fallbackIngredient
}

export function parseIngredients(ingredientsText) {
  return ingredientsText
    .split('\n')
    .map(parseIngredientLine)
    .filter(Boolean)
}
